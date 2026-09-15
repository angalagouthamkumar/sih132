import mongoose from 'mongoose';
import Offer from '../models/Offer.js';
import Crop from '../models/Crop.js';
import Order from '../models/Order.js';

/**
 * Unit conversion helper to convert quantities to kilograms
 */
const getMultiplierToKg = (unit) => {
  switch (unit?.toLowerCase()) {
    case 'tonne':
      return 1000;
    case 'quintal':
      return 100;
    case 'kg':
    default:
      return 1;
  }
};

// @desc    Submit a new buyer offer for an available crop
// @route   POST /api/offers
// @access  Private (Buyer only)
export const createOffer = async (req, res) => {
  try {
    const {
      cropId,
      quantity,
      offeredPricePerKg,
      transportCost = 0,
      otherCharges = 0,
      message,
    } = req.body;

    // Validate crop ID
    if (!cropId || !mongoose.Types.ObjectId.isValid(cropId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid crop reference ID is required.',
      });
    }

    // Validate crop existence & availability
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Crop listing not found.',
      });
    }

    if (crop.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: `This crop is currently marked as ${crop.status} and cannot receive new offers.`,
      });
    }

    // Buyer cannot offer on their own listing
    if (crop.farmer.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot place an offer on your own crop listing.',
      });
    }

    // Validate numeric values
    const parsedQuantity = Number(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number greater than 0.',
      });
    }

    if (parsedQuantity > crop.quantity) {
      return res.status(400).json({
        success: false,
        message: `Offered quantity (${parsedQuantity} ${crop.unit}) cannot exceed listed crop quantity (${crop.quantity} ${crop.unit}).`,
      });
    }

    const parsedPrice = Number(offeredPricePerKg);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Offered price per kg must be a positive number greater than 0.',
      });
    }

    const parsedTransport = Number(transportCost);
    if (isNaN(parsedTransport) || parsedTransport < 0) {
      return res.status(400).json({
        success: false,
        message: 'Transport cost cannot be negative.',
      });
    }

    const parsedOtherCharges = Number(otherCharges);
    if (isNaN(parsedOtherCharges) || parsedOtherCharges < 0) {
      return res.status(400).json({
        success: false,
        message: 'Other charges cannot be negative.',
      });
    }

    if (message && message.length > 300) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 300 characters.',
      });
    }

    // Check for duplicate pending offer by the same buyer for this crop
    const existingPendingOffer = await Offer.findOne({
      crop: crop._id,
      buyer: req.user._id,
      status: 'pending',
    });

    if (existingPendingOffer) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active pending offer for this crop. Please await the farmer\u2019s response.',
      });
    }

    // Fetch user for coordinates (Buyer)
    const buyer = await mongoose.model('User').findById(req.user._id);
    
    // Fetch transport config
    const TransportConfig = (await import('../models/TransportConfig.js')).default;
    const config = await TransportConfig.findOne();

    // Authoritative server financial calculations
    const multiplier = getMultiplierToKg(crop.unit);
    const quantityKg = parsedQuantity * multiplier;
    const grossAmount = Math.round(parsedPrice * quantityKg * 100) / 100;
    
    // Calculate distance
    const { calculateDistance } = await import('../utils/distance.js');
    
    // We need farmer's coordinates. Crop doesn't have coordinates, but Farmer (User) does.
    const farmer = await mongoose.model('User').findById(crop.farmer);
    
    let serverTransportCost = 0;
    let transportAvailable = false;
    if (config && buyer?.latitude != null && buyer?.longitude != null && farmer?.latitude != null && farmer?.longitude != null) {
      const distanceKm = calculateDistance(farmer.latitude, farmer.longitude, buyer.latitude, buyer.longitude);
      serverTransportCost = config.baseCharge + (distanceKm * config.ratePerKm);
      transportAvailable = true;
    } else {
      // Dynamic transport estimate unavailable: do not invent cost, do not accept client-cost as authoritative
      serverTransportCost = 0;
      transportAvailable = false;
    }

    const finalTransportCost = Math.round(serverTransportCost * 100) / 100;
    const netRealization = Math.max(0, Math.round((grossAmount - finalTransportCost - parsedOtherCharges) * 100) / 100);

    // Create offer
    const offer = await Offer.create({
      crop: crop._id,
      farmer: crop.farmer,
      buyer: req.user._id,
      quantity: parsedQuantity,
      unit: crop.unit, // inherits unit from crop
      offeredPricePerKg: parsedPrice,
      transportCost: finalTransportCost,
      otherCharges: parsedOtherCharges,
      grossAmount,
      netRealization,
      message: message ? message.trim() : '',
      status: 'pending',
    });

    const populatedOffer = await Offer.findById(offer._id)
      .populate('crop', 'name variety quantity unit expectedPricePerKg location imageUrl status')
      .populate('farmer', 'name location');

    return res.status(201).json({
      success: true,
      message: 'Procurement offer submitted successfully.',
      data: { offer: populatedOffer },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active pending offer for this crop. Please await the farmer’s response.',
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while creating offer.',
    });
  }
};

// @desc    Get all offers sent by the authenticated buyer
// @route   GET /api/offers/sent
// @access  Private (Buyer only)
export const getSentOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ buyer: req.user._id })
      .populate('crop', 'name variety quantity unit expectedPricePerKg location imageUrl status')
      .populate('farmer', 'name location')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Sent offers retrieved successfully.',
      data: {
        offers,
        count: offers.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving sent offers.',
    });
  }
};

// @desc    Get all offers received for crops owned by the authenticated farmer
// @route   GET /api/offers/received
// @access  Private (Farmer only)
export const getReceivedOffers = async (req, res) => {
  try {
    const offers = await Offer.find({ farmer: req.user._id })
      .populate('crop', 'name variety quantity unit expectedPricePerKg location imageUrl status')
      .populate('buyer', 'name businessName location')
      .sort({ createdAt: -1 });

    // Sort pending offers first, then newest
    offers.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.status(200).json({
      success: true,
      message: 'Received offers retrieved successfully.',
      data: {
        offers,
        count: offers.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving received offers.',
    });
  }
};

// @desc    Update offer status (accept or reject) by the crop-owning farmer
//          Accepting automatically creates a MongoDB Order and updates crop quantity/status
// @route   PATCH /api/offers/:id/status
// @access  Private (Farmer only)
export const updateOfferStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Offer not found. Invalid offer reference ID.',
    });
  }

  if (!status || !['accepted', 'rejected'].includes(status.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: "Invalid status. Allowed values are 'accepted' or 'rejected'.",
    });
  }

  const normalizedStatus = status.toLowerCase();

  // --- Rejection path: no transaction needed, no order created ---
  if (normalizedStatus === 'rejected') {
    try {
      const offer = await Offer.findById(id);
      if (!offer) {
        return res.status(404).json({ success: false, message: 'Offer not found.' });
      }
      if (offer.farmer.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only respond to offers for crops that you own.',
        });
      }
      if (offer.status !== 'pending') {
        return res.status(409).json({
          success: false,
          message: `This offer has already been ${offer.status}. Repeated status change is not allowed.`,
        });
      }
      offer.status = 'rejected';
      await offer.save();

      const updatedOffer = await Offer.findById(offer._id)
        .populate('crop', 'name variety quantity unit expectedPricePerKg location imageUrl status')
        .populate('buyer', 'name businessName location');

      return res.status(200).json({
        success: true,
        message: 'Offer rejected successfully.',
        data: { offer: updatedOffer },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error occurred while rejecting offer.',
      });
    }
  }

  // --- Acceptance path ---
  // Use guarded single-document updates so this works with both standalone
  // MongoDB (common in local development) and Atlas replica sets.
  let reservedCrop = null;
  let acceptedOffer = null;
  let createdOrder = null;
  try {
    const offer = await Offer.findById(id);
    if (!offer) {
      const err = new Error('Offer not found.');
      err.statusCode = 404;
      throw err;
    }
    if (offer.farmer.toString() !== req.user._id.toString()) {
      const err = new Error('Access denied. You can only respond to offers for crops that you own.');
      err.statusCode = 403;
      throw err;
    }
    if (offer.status !== 'pending') {
      const err = new Error(`This offer has already been ${offer.status}. Repeated status change is not allowed.`);
      err.statusCode = 409;
      throw err;
    }

    const existingOrder = await Order.findOne({ offer: offer._id });
    if (existingOrder) {
      const err = new Error('An order has already been created for this offer. Duplicate orders are not permitted.');
      err.statusCode = 409;
      throw err;
    }

    // Reserve inventory only if the crop is still available and sufficient.
    reservedCrop = await Crop.findOneAndUpdate(
      {
        _id: offer.crop,
        status: 'available',
        quantity: { $gte: offer.quantity },
      },
      { $inc: { quantity: -offer.quantity } },
      { new: true, runValidators: true }
    );

    if (!reservedCrop) {
      const currentCrop = await Crop.findById(offer.crop);
      const err = new Error(
        !currentCrop
          ? 'The referenced crop listing no longer exists.'
          : currentCrop.status !== 'available'
          ? `This crop is currently marked as ${currentCrop.status} and cannot have offers accepted.`
          : `Insufficient crop quantity. Offer requests ${offer.quantity} ${offer.unit} but only ${currentCrop.quantity} ${currentCrop.unit} remain.`
      );
      err.statusCode = currentCrop ? 409 : 404;
      throw err;
    }

    // Only one concurrent request can move this offer out of pending.
    acceptedOffer = await Offer.findOneAndUpdate(
      { _id: offer._id, farmer: req.user._id, status: 'pending' },
      { $set: { status: 'accepted' } },
      { new: true, runValidators: true }
    );

    if (!acceptedOffer) {
      await Crop.findByIdAndUpdate(reservedCrop._id, {
        $inc: { quantity: offer.quantity },
        $set: { status: 'available' },
      });
      reservedCrop = null;
      const err = new Error('This offer was already processed. Duplicate acceptance is not allowed.');
      err.statusCode = 409;
      throw err;
    }

    const orderData = {
      offer: offer._id,
      crop: reservedCrop._id,
      farmer: offer.farmer,
      buyer: offer.buyer,
      cropName: reservedCrop.name,
      variety: reservedCrop.variety,
      quantity: offer.quantity,
      unit: offer.unit,
      offeredPricePerKg: offer.offeredPricePerKg,
      grossAmount: offer.grossAmount,
      transportCost: offer.transportCost,
      otherCharges: offer.otherCharges,
      netAmount: offer.netRealization,
      orderStatus: 'confirmed',
      paymentStatus: 'pending',
      statusHistory: [{ status: 'confirmed', changedBy: req.user._id, changedAt: new Date() }],
    };

    createdOrder = await Order.create(orderData);

    const remainingQty = Math.max(0, Math.round(Number(reservedCrop.quantity) * 1000) / 1000);
    const soldOut = remainingQty <= 0;
    if (soldOut) {
      await Crop.findByIdAndUpdate(reservedCrop._id, { $set: { quantity: 0, status: 'sold' } });
    }

    await Offer.updateMany(
      {
        crop: offer.crop,
        _id: { $ne: offer._id },
        status: 'pending',
        ...(soldOut ? {} : { quantity: { $gt: remainingQty } }),
      },
      { $set: { status: 'rejected' } }
    );

    // Fetch populated versions after transaction commits
    const populatedOffer = await Offer.findById(acceptedOffer._id)
      .populate('crop', 'name variety quantity unit expectedPricePerKg location imageUrl status')
      .populate('buyer', 'name businessName location');

    const populatedOrder = await Order.findById(createdOrder._id)
      .populate('buyer', 'name businessName location')
      .populate('farmer', 'name location')
      .populate('crop', 'name variety status');

    return res.status(200).json({
      success: true,
      message: 'Offer accepted and order created.',
      data: {
        offer: populatedOffer,
        order: populatedOrder,
      },
    });
  } catch (error) {
    // Compensate if order creation failed after inventory was reserved.
    if (!createdOrder && acceptedOffer && reservedCrop) {
      await Promise.allSettled([
        Offer.updateOne({ _id: acceptedOffer._id, status: 'accepted' }, { $set: { status: 'pending' } }),
        Crop.updateOne(
          { _id: reservedCrop._id },
          { $inc: { quantity: acceptedOffer.quantity }, $set: { status: 'available' } }
        ),
      ]);
    }
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error occurred while accepting offer.',
    });
  }
};
