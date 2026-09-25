import mongoose from 'mongoose';
import RequirementOffer from '../models/RequirementOffer.js';
import Requirement from '../models/Requirement.js';
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

// @desc    Farmer submits a supply offer / proposal against an active buyer requirement
// @route   POST /api/requirement-offers
// @access  Private (Farmer only)
export const createRequirementOffer = async (req, res) => {
  try {
    const {
      requirementId,
      cropId,
      quantity,
      offeredPricePerKg,
      transportCost = 0,
      otherCharges = 0,
      message,
    } = req.body;

    // Validate requirement ID
    if (!requirementId || !mongoose.Types.ObjectId.isValid(requirementId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid buyer requirement ID is required.',
      });
    }

    // Validate crop ID
    if (!cropId || !mongoose.Types.ObjectId.isValid(cropId)) {
      return res.status(400).json({
        success: false,
        message: 'A valid crop reference ID is required.',
      });
    }

    // Fetch requirement
    const requirement = await Requirement.findById(requirementId);
    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Buyer requirement not found.',
      });
    }

    if (requirement.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: `This requirement is currently marked as ${requirement.status} and cannot receive new supply proposals.`,
      });
    }

    // Fetch crop
    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({
        success: false,
        message: 'Selected crop listing not found.',
      });
    }

    // Crop ownership validation - farmer must own the crop
    if (crop.farmer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit supply offers using crops you own.',
      });
    }

    if (crop.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: `This crop is currently marked as ${crop.status} and cannot be offered for procurement.`,
      });
    }

    // Prevent farmer from offering on their own requirement (if roles overlap)
    if (requirement.buyer.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit an offer to your own procurement requirement.',
      });
    }

    // Validate quantity
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
        message: `Offered quantity (${parsedQuantity} ${crop.unit}) exceeds your available crop quantity (${crop.quantity} ${crop.unit}).`,
      });
    }

    // Validate offered price
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

    // Check duplicate active pending proposal by this farmer for this requirement & crop
    const existingPending = await RequirementOffer.findOne({
      requirement: requirement._id,
      crop: crop._id,
      farmer: req.user._id,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active pending supply proposal for this requirement and crop.',
      });
    }

    // Authoritative financial calculations on the server
    const multiplier = getMultiplierToKg(crop.unit);
    const quantityKg = parsedQuantity * multiplier;
    const grossAmount = Math.round(parsedPrice * quantityKg * 100) / 100;
    const finalTransportCost = Math.round(parsedTransport * 100) / 100;
    const finalOtherCharges = Math.round(parsedOtherCharges * 100) / 100;
    const netRealization = Math.max(0, Math.round((grossAmount - finalTransportCost - finalOtherCharges) * 100) / 100);

    // Create proposal — strictly derive buyer from requirement.buyer and farmer from req.user._id
    const proposal = await RequirementOffer.create({
      requirement: requirement._id,
      crop: crop._id,
      farmer: req.user._id,
      buyer: requirement.buyer,
      quantity: parsedQuantity,
      unit: crop.unit,
      offeredPricePerKg: parsedPrice,
      transportCost: finalTransportCost,
      otherCharges: finalOtherCharges,
      grossAmount,
      netRealization,
      message: message ? message.trim() : '',
      status: 'pending',
    });

    const populatedProposal = await RequirementOffer.findById(proposal._id)
      .populate('requirement', 'cropName variety quantity unit targetPricePerKg deliveryLocation requiredDate status')
      .populate('crop', 'name variety quantity unit expectedPricePerKg location imageUrl status')
      .populate('buyer', 'name businessName location verificationStatus');

    return res.status(201).json({
      success: true,
      message: 'Supply proposal submitted successfully to buyer.',
      data: { proposal: populatedProposal },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active pending supply proposal for this requirement and crop.',
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Error occurred while creating supply proposal.',
    });
  }
};

// @desc    Get all supply proposals submitted by the authenticated farmer
// @route   GET /api/requirement-offers/mine
// @access  Private (Farmer only)
export const getFarmerProposals = async (req, res) => {
  try {
    const proposals = await RequirementOffer.find({ farmer: req.user._id })
      .populate('requirement', 'cropName variety quantity unit targetPricePerKg deliveryLocation requiredDate status')
      .populate('crop', 'name variety quantity unit expectedPricePerKg location imageUrl status')
      .populate('buyer', 'name businessName location verificationStatus')
      .sort({ createdAt: -1 });

    // Pending first, then newest
    proposals.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.status(200).json({
      success: true,
      message: 'Farmer supply proposals retrieved successfully.',
      data: {
        proposals,
        count: proposals.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving supply proposals.',
    });
  }
};

// @desc    Get all proposals submitted for a specific buyer requirement
// @route   GET /api/requirements/:id/offers
// @access  Private (Buyer only - must own the requirement)
export const getRequirementProposals = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found. Invalid ID format.',
      });
    }

    const requirement = await Requirement.findById(id);
    if (!requirement) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found.',
      });
    }

    const isOwner = requirement.buyer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view proposals for your own requirements.',
      });
    }

    const proposals = await RequirementOffer.find({ requirement: id })
      .populate('farmer', 'name location verificationStatus phone email')
      .populate('crop', 'name variety quantity unit expectedPricePerKg status location imageUrl')
      .sort({ createdAt: -1 });

    proposals.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.status(200).json({
      success: true,
      message: 'Requirement proposals retrieved successfully.',
      data: {
        proposals,
        count: proposals.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving requirement proposals.',
    });
  }
};

// @desc    Update proposal status (accept or reject) by the requirement-owning buyer
//          Accepting automatically creates a MongoDB Order, reserves crop inventory,
//          and prevents duplicate orders
// @route   PATCH /api/requirement-offers/:id/status
// @access  Private (Buyer only)
export const updateProposalStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({
      success: false,
      message: 'Proposal not found. Invalid reference ID.',
    });
  }

  if (!status || !['accepted', 'rejected'].includes(status.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: "Invalid status. Allowed values are 'accepted' or 'rejected'.",
    });
  }

  const normalizedStatus = status.toLowerCase();

  // --- Rejection path ---
  if (normalizedStatus === 'rejected') {
    try {
      const proposal = await RequirementOffer.findById(id);
      if (!proposal) {
        return res.status(404).json({ success: false, message: 'Proposal not found.' });
      }

      if (proposal.buyer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only respond to proposals for requirements you own.',
        });
      }

      if (proposal.status !== 'pending') {
        return res.status(409).json({
          success: false,
          message: `This proposal has already been ${proposal.status}. Repeated status change is not allowed.`,
        });
      }

      proposal.status = 'rejected';
      await proposal.save();

      const updated = await RequirementOffer.findById(proposal._id)
        .populate('farmer', 'name location verificationStatus')
        .populate('crop', 'name variety quantity unit expectedPricePerKg status location imageUrl')
        .populate('requirement', 'cropName variety quantity unit targetPricePerKg deliveryLocation');

      return res.status(200).json({
        success: true,
        message: 'Proposal rejected successfully.',
        data: { proposal: updated },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error occurred while rejecting proposal.',
      });
    }
  }

  // --- Acceptance path ---
  let reservedCrop = null;
  let acceptedProposal = null;
  let createdOrder = null;

  try {
    const proposal = await RequirementOffer.findById(id);
    if (!proposal) {
      const err = new Error('Proposal not found.');
      err.statusCode = 404;
      throw err;
    }

    if (proposal.buyer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      const err = new Error('Access denied. You can only respond to proposals for requirements you own.');
      err.statusCode = 403;
      throw err;
    }

    if (proposal.status !== 'pending') {
      const err = new Error(`This proposal has already been ${proposal.status}. Repeated status change is not allowed.`);
      err.statusCode = 409;
      throw err;
    }

    // Concurrency / idempotency check: Ensure an order has not already been created
    const existingOrder = await Order.findOne({ requirementOffer: proposal._id });
    if (existingOrder) {
      const err = new Error('An order has already been created for this proposal. Duplicate orders are not permitted.');
      err.statusCode = 409;
      throw err;
    }

    // Verify requirement is still active
    const requirement = await Requirement.findById(proposal.requirement);
    if (!requirement || requirement.status !== 'active') {
      const err = new Error('The linked buyer requirement is no longer active.');
      err.statusCode = 409;
      throw err;
    }

    // Guarded atomic single-document update on Crop (compatible with standalone and replica-set MongoDB)
    reservedCrop = await Crop.findOneAndUpdate(
      {
        _id: proposal.crop,
        status: 'available',
        quantity: { $gte: proposal.quantity },
      },
      { $inc: { quantity: -proposal.quantity } },
      { new: true, runValidators: true }
    );

    if (!reservedCrop) {
      const currentCrop = await Crop.findById(proposal.crop);
      const err = new Error(
        !currentCrop
          ? 'The referenced crop listing no longer exists.'
          : currentCrop.status !== 'available'
          ? `This crop is currently marked as ${currentCrop.status} and cannot be purchased.`
          : `Insufficient crop quantity. Proposal offers ${proposal.quantity} ${proposal.unit} but only ${currentCrop.quantity} ${currentCrop.unit} remain.`
      );
      err.statusCode = currentCrop ? 409 : 404;
      throw err;
    }

    // Atomically transition proposal from pending to accepted
    acceptedProposal = await RequirementOffer.findOneAndUpdate(
      { _id: proposal._id, buyer: req.user._id, status: 'pending' },
      { $set: { status: 'accepted' } },
      { new: true, runValidators: true }
    );

    if (!acceptedProposal) {
      // Rollback crop reservation if proposal was concurrently modified
      await Crop.findByIdAndUpdate(reservedCrop._id, {
        $inc: { quantity: proposal.quantity },
        $set: { status: 'available' },
      });
      reservedCrop = null;
      const err = new Error('This proposal was already processed. Duplicate acceptance is not allowed.');
      err.statusCode = 409;
      throw err;
    }

    // Create the authoritative Order document
    const orderData = {
      requirementOffer: proposal._id,
      requirement: proposal.requirement,
      crop: reservedCrop._id,
      farmer: proposal.farmer,
      buyer: proposal.buyer,
      cropName: reservedCrop.name,
      variety: reservedCrop.variety,
      quantity: proposal.quantity,
      unit: proposal.unit,
      offeredPricePerKg: proposal.offeredPricePerKg,
      grossAmount: proposal.grossAmount,
      transportCost: proposal.transportCost,
      otherCharges: proposal.otherCharges,
      netAmount: proposal.netRealization,
      orderStatus: 'confirmed',
      paymentStatus: 'pending',
      statusHistory: [{ status: 'confirmed', changedBy: req.user._id, changedAt: new Date() }],
    };

    createdOrder = await Order.create(orderData);

    // Update crop status if fully sold out
    const remainingQty = Math.max(0, Math.round(Number(reservedCrop.quantity) * 1000) / 1000);
    const soldOut = remainingQty <= 0;
    if (soldOut) {
      await Crop.findByIdAndUpdate(reservedCrop._id, { $set: { quantity: 0, status: 'sold' } });
    }

    // Auto-reject competing proposals on this crop if insufficient remaining quantity
    await RequirementOffer.updateMany(
      {
        crop: proposal.crop,
        _id: { $ne: proposal._id },
        status: 'pending',
        ...(soldOut ? {} : { quantity: { $gt: remainingQty } }),
      },
      { $set: { status: 'rejected' } }
    );

    // If sold out, also auto-reject any competing regular pending offers on this crop
    if (soldOut) {
      const Offer = (await import('../models/Offer.js')).default;
      await Offer.updateMany(
        { crop: proposal.crop, status: 'pending' },
        { $set: { status: 'rejected' } }
      );
    }

    // Check if the Requirement is fully satisfied
    const acceptedProposals = await RequirementOffer.find({
      requirement: proposal.requirement,
      status: 'accepted',
    });
    const totalAcceptedQty = acceptedProposals.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
    if (requirement.quantity && totalAcceptedQty >= requirement.quantity) {
      await Requirement.findByIdAndUpdate(proposal.requirement, { $set: { status: 'fulfilled' } });
    }

    // Populate and return response
    const populatedProposal = await RequirementOffer.findById(acceptedProposal._id)
      .populate('farmer', 'name location verificationStatus')
      .populate('crop', 'name variety quantity unit expectedPricePerKg status location imageUrl')
      .populate('requirement', 'cropName variety quantity unit targetPricePerKg deliveryLocation');

    const populatedOrder = await Order.findById(createdOrder._id)
      .populate('buyer', 'name businessName location')
      .populate('farmer', 'name location')
      .populate('crop', 'name variety status');

    return res.status(200).json({
      success: true,
      message: 'Supply proposal accepted and order created successfully.',
      data: {
        proposal: populatedProposal,
        order: populatedOrder,
      },
    });
  } catch (error) {
    // Compensate if order creation failed after inventory was reserved
    if (!createdOrder && acceptedProposal && reservedCrop) {
      await Promise.allSettled([
        RequirementOffer.updateOne({ _id: acceptedProposal._id, status: 'accepted' }, { $set: { status: 'pending' } }),
        Crop.updateOne(
          { _id: reservedCrop._id },
          { $inc: { quantity: acceptedProposal.quantity }, $set: { status: 'available' } }
        ),
      ]);
    }
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error occurred while accepting proposal.',
    });
  }
};
