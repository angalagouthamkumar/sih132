import User from '../models/User.js';
import Crop from '../models/Crop.js';
import Offer from '../models/Offer.js';
import Order from '../models/Order.js';
import Requirement from '../models/Requirement.js'; // Will create this later

// --- Profiles ---
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, location, businessName, latitude, longitude } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (businessName !== undefined && user.role === 'buyer') user.businessName = businessName;
    
    if (latitude !== undefined) user.latitude = Number(latitude);
    if (longitude !== undefined) user.longitude = Number(longitude);

    await user.save();

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- Dashboards ---
export const getFarmerDashboard = async (req, res) => {
  try {
    const farmerId = req.user.id;

    const totalCrops = await Crop.countDocuments({ farmer: farmerId });
    const availableCrops = await Crop.countDocuments({ farmer: farmerId, status: 'available' });
    
    const offersReceived = await Offer.countDocuments({ farmer: farmerId });
    const pendingOffers = await Offer.countDocuments({ farmer: farmerId, status: 'pending' });
    
    const activeOrders = await Order.countDocuments({ 
      farmer: farmerId, 
      orderStatus: { $in: ['confirmed', 'in_transit'] } 
    });
    
    const completedOrders = await Order.countDocuments({ 
      farmer: farmerId, 
      orderStatus: { $in: ['delivered', 'completed'] } 
    });

    const earningsResult = await Order.aggregate([
      { $match: { farmer: farmerId, orderStatus: { $in: ['delivered', 'completed'] }, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$netAmount' } } }
    ]);
    const realizedEarnings = earningsResult.length > 0 ? earningsResult[0].total : 0;

    const recentCrops = await Crop.find({ farmer: farmerId }).sort({ createdAt: -1 }).limit(3);
    const recentOffers = await Offer.find({ farmer: farmerId }).populate('crop', 'name').populate('buyer', 'name').sort({ createdAt: -1 }).limit(3);
    const recentOrders = await Order.find({ farmer: farmerId }).populate('crop', 'name').populate('buyer', 'name').sort({ createdAt: -1 }).limit(3);

    // Matching active requirements (Phase 10: active requirements for farmer's crops)
    // Find farmer's available crop names
    const availableCropRecords = await Crop.find({ farmer: farmerId, status: 'available' }).distinct('name');
    const matchingRequirementsCount = await Requirement.countDocuments({
      status: 'active',
      cropName: { $in: availableCropRecords }
    });

    res.status(200).json({
      success: true,
      data: {
        totalCrops,
        availableCrops,
        offersReceived,
        pendingOffers,
        activeOrders,
        completedOrders,
        realizedEarnings,
        recentCrops,
        recentOffers,
        recentOrders,
        matchingRequirementsCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBuyerDashboard = async (req, res) => {
  try {
    const buyerId = req.user.id;

    // Available crops across the platform
    const availableCrops = await Crop.countDocuments({ status: 'available' });
    
    const activeRequirements = await Requirement.countDocuments({ buyer: buyerId, status: 'active' });
    
    const offersSubmitted = await Offer.countDocuments({ buyer: buyerId });
    const acceptedOffers = await Offer.countDocuments({ buyer: buyerId, status: 'accepted' });
    
    const activeOrders = await Order.countDocuments({ 
      buyer: buyerId, 
      orderStatus: { $in: ['confirmed', 'in_transit'] } 
    });
    
    const completedOrders = await Order.countDocuments({ 
      buyer: buyerId, 
      orderStatus: { $in: ['delivered', 'completed'] } 
    });

    const procurementResult = await Order.aggregate([
      { $match: { buyer: buyerId, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$netAmount' } } }
    ]);
    const procurementTotal = procurementResult.length > 0 ? procurementResult[0].total : 0;

    // Recent items
    const recentOffers = await Offer.find({ buyer: buyerId }).populate('crop', 'name').populate('farmer', 'name').sort({ createdAt: -1 }).limit(3);
    const recentOrders = await Order.find({ buyer: buyerId }).populate('crop', 'name').populate('farmer', 'name').sort({ createdAt: -1 }).limit(3);

    // Matching crops for buyer's active requirements
    const buyerReqCropNames = await Requirement.find({ buyer: buyerId, status: 'active' }).distinct('cropName');
    const matchingCropsCount = await Crop.countDocuments({
      status: 'available',
      name: { $in: buyerReqCropNames }
    });

    res.status(200).json({
      success: true,
      data: {
        availableCrops,
        activeRequirements,
        offersSubmitted,
        acceptedOffers,
        activeOrders,
        completedOrders,
        procurementTotal,
        recentOffers,
        recentOrders,
        matchingCropsCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
