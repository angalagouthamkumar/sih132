import mongoose from 'mongoose';
import User from '../models/User.js';
import Crop from '../models/Crop.js';
import Offer from '../models/Offer.js';
import Order from '../models/Order.js';
import MarketPrice from '../models/MarketPrice.js';
import Requirement from '../models/Requirement.js';
import TransportConfig from '../models/TransportConfig.js';
import { escapeRegex } from '../utils/regex.js';

// --- Dashboard & Stats ---
export const getDashboardStats = async (req, res) => {
  try {
    const totalFarmers = await User.countDocuments({ role: 'farmer' });
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const activeUsers = await User.countDocuments({ isActive: true, role: { $ne: 'admin' } });
    const blockedUsers = await User.countDocuments({ isActive: false, role: { $ne: 'admin' } });
    const pendingVerifications = await User.countDocuments({ verificationStatus: 'pending', role: { $ne: 'admin' } });

    const availableCrops = await Crop.countDocuments({ status: 'available' });
    const pendingOffers = await Offer.countDocuments({ status: 'pending' });
    const activeOrders = await Order.countDocuments({ orderStatus: { $in: ['confirmed', 'in_transit'] } });
    const completedOrders = await Order.countDocuments({ orderStatus: { $in: ['delivered', 'completed'] } });

    const activeRequirements = await Requirement.countDocuments({ status: 'active' });
    const marketRecords = await MarketPrice.countDocuments();

    const paidOrders = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalValue: { $sum: '$netAmount' } } },
    ]);
    const transactionValue = paidOrders.length > 0 ? paidOrders[0].totalValue : 0;

    res.status(200).json({
      success: true,
      data: {
        totalFarmers,
        totalBuyers,
        activeUsers,
        blockedUsers,
        pendingVerifications,
        availableCrops,
        activeRequirements,
        pendingOffers,
        activeOrders,
        completedOrders,
        transactionValue,
        marketRecords,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- User Management ---
export const getUsers = async (req, res) => {
  try {
    const { role, search, isActive, verificationStatus } = req.query;
    let query = { role: { $ne: 'admin' } }; // Exclude admins from user management

    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (verificationStatus) query.verificationStatus = verificationStatus;

    if (search && typeof search === 'string' && search.trim()) {
      const sanitized = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitized, 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserAccess = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot modify admin account' });

    user.isActive = isActive;
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUserVerification = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
    }

    const { verificationStatus } = req.body;

    if (!['pending', 'verified', 'rejected'].includes(verificationStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot modify admin account' });

    user.verificationStatus = verificationStatus;
    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Crop Moderation ---
export const getCrops = async (req, res) => {
  try {
    const crops = await Crop.find().populate('farmer', 'name email phone').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: crops.length, data: crops });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCropStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid crop ID format.' });
    }

    const { status } = req.body;

    if (!['available', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Can only toggle between available and inactive' });
    }

    const crop = await Crop.findById(id);
    if (!crop) return res.status(404).json({ success: false, message: 'Crop not found' });

    if (crop.status === 'sold') {
      return res.status(400).json({ success: false, message: 'Cannot modify a sold crop' });
    }

    crop.status = status;
    await crop.save();
    res.status(200).json({ success: true, data: crop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Offers & Orders (Read-Only) ---
export const getOffers = async (req, res) => {
  try {
    const offers = await Offer.find()
      .populate('farmer', 'name')
      .populate('buyer', 'name')
      .populate('crop', 'name variety')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: offers.length, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('farmer', 'name')
      .populate('buyer', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Market Data Management ---
export const getMarketData = async (req, res) => {
  try {
    const marketData = await MarketPrice.find().sort({ priceDate: -1, crop: 1 });
    res.status(200).json({ success: true, count: marketData.length, data: marketData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createMarketData = async (req, res) => {
  try {
    const {
      crop,
      variety,
      marketName,
      district,
      minPricePerKg,
      maxPricePerKg,
      modalPricePerKg,
      distanceKm,
      transportCost,
      marketFee,
      latitude,
      longitude,
      priceDate,
    } = req.body;

    if (!crop || !variety || !marketName || !district || !priceDate) {
      return res.status(400).json({
        success: false,
        message: 'Crop, variety, market name, district, and price date are required.',
      });
    }

    const minP = Number(minPricePerKg);
    const maxP = Number(maxPricePerKg);
    const modalP = Number(modalPricePerKg);
    const dist = Number(distanceKm);
    const transport = Number(transportCost);
    const fee = Number(marketFee);

    if ([minP, maxP, modalP, dist, transport, fee].some((v) => isNaN(v) || v < 0)) {
      return res.status(400).json({
        success: false,
        message: 'All price, distance, and fee parameters must be non-negative numbers.',
      });
    }

    if (minP > modalP || modalP > maxP) {
      return res.status(400).json({
        success: false,
        message: 'Prices must follow: minPricePerKg <= modalPricePerKg <= maxPricePerKg.',
      });
    }

    const recordData = {
      crop: crop.trim(),
      variety: variety.trim(),
      marketName: marketName.trim(),
      district: district.trim(),
      minPricePerKg: minP,
      maxPricePerKg: maxP,
      modalPricePerKg: modalP,
      distanceKm: dist,
      transportCost: transport,
      marketFee: fee,
      priceDate: new Date(priceDate),
    };

    if (latitude !== undefined && !isNaN(Number(latitude))) recordData.latitude = Number(latitude);
    if (longitude !== undefined && !isNaN(Number(longitude))) recordData.longitude = Number(longitude);

    const marketData = await MarketPrice.create(recordData);
    res.status(201).json({ success: true, data: marketData });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A market benchmark record for this crop, market, and date already exists.',
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateMarketData = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid market data ID format.' });
    }

    const marketData = await MarketPrice.findById(id);
    if (!marketData) return res.status(404).json({ success: false, message: 'Market data not found' });

    const updates = {};
    const allowed = [
      'crop',
      'variety',
      'marketName',
      'district',
      'minPricePerKg',
      'maxPricePerKg',
      'modalPricePerKg',
      'distanceKm',
      'transportCost',
      'marketFee',
      'latitude',
      'longitude',
      'priceDate',
    ];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (['minPricePerKg', 'maxPricePerKg', 'modalPricePerKg', 'distanceKm', 'transportCost', 'marketFee', 'latitude', 'longitude'].includes(key)) {
          const val = Number(req.body[key]);
          if (isNaN(val) || (key !== 'latitude' && key !== 'longitude' && val < 0)) {
            return res.status(400).json({ success: false, message: `Field ${key} must be a valid non-negative number.` });
          }
          updates[key] = val;
        } else if (key === 'priceDate') {
          const d = new Date(req.body[key]);
          if (isNaN(d.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid priceDate.' });
          }
          updates[key] = d;
        } else {
          updates[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
        }
      }
    }

    const updatedData = await MarketPrice.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: updatedData });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A market benchmark record for this crop, market, and date already exists.',
      });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteMarketData = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid market data ID format.' });
    }

    const marketData = await MarketPrice.findByIdAndDelete(id);
    if (!marketData) return res.status(404).json({ success: false, message: 'Market data not found' });

    res.status(200).json({ success: true, message: 'Market data deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Dynamic Transport Configuration ---
export const getTransportConfig = async (req, res) => {
  try {
    const config = await TransportConfig.findOne().populate('updatedBy', 'name email');
    res.status(200).json({
      success: true,
      data: config || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTransportConfig = async (req, res) => {
  try {
    const { baseCharge, ratePerKm } = req.body;
    const numBase = Number(baseCharge);
    const numRate = Number(ratePerKm);

    if (isNaN(numBase) || numBase < 0 || isNaN(numRate) || numRate < 0) {
      return res.status(400).json({
        success: false,
        message: 'Base charge and rate per kilometer must be valid non-negative numbers.',
      });
    }

    let config = await TransportConfig.findOne();
    if (config) {
      config.baseCharge = numBase;
      config.ratePerKm = numRate;
      config.updatedBy = req.user._id || req.user.id;
      await config.save();
    } else {
      config = await TransportConfig.create({
        baseCharge: numBase,
        ratePerKm: numRate,
        updatedBy: req.user._id || req.user.id,
      });
    }

    const populated = await TransportConfig.findById(config._id).populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      data: populated,
      message: 'Transport configuration saved successfully.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
