import mongoose from 'mongoose';
import Order from '../models/Order.js';

// Safe fields to populate for farmer (don't expose buyer password, etc.)
const BUYER_SAFE_FIELDS = 'name businessName location email phone';
const FARMER_SAFE_FIELDS = 'name location email phone';
const CROP_SAFE_FIELDS = 'name variety status location imageUrl';

// @desc    Get all orders belonging to the authenticated farmer
// @route   GET /api/orders/farmer
// @access  Private (Farmer only)
export const getFarmerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ farmer: req.user._id })
      .populate('buyer', BUYER_SAFE_FIELDS)
      .populate('crop', CROP_SAFE_FIELDS)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Farmer orders retrieved successfully.',
      data: { orders, count: orders.length },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving farmer orders.',
    });
  }
};

// @desc    Get all orders belonging to the authenticated buyer
// @route   GET /api/orders/buyer
// @access  Private (Buyer only)
export const getBuyerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user._id })
      .populate('farmer', FARMER_SAFE_FIELDS)
      .populate('crop', CROP_SAFE_FIELDS)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: 'Buyer orders retrieved successfully.',
      data: { orders, count: orders.length },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving buyer orders.',
    });
  }
};

// @desc    Get a single order by ID — participating farmer, buyer, or admin only
// @route   GET /api/orders/:id
// @access  Private (Farmer or Buyer or Admin)
export const getOrderById = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ success: false, message: 'Order not found. Invalid order ID.' });
  }

  try {
    const order = await Order.findById(id)
      .populate('farmer', FARMER_SAFE_FIELDS)
      .populate('buyer', BUYER_SAFE_FIELDS)
      .populate('crop', CROP_SAFE_FIELDS)
      .populate('statusHistory.changedBy', 'name role');

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const userId = req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isFarmer = order.farmer._id.toString() === userId;
    const isBuyer = order.buyer._id.toString() === userId;

    if (!isAdmin && !isFarmer && !isBuyer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a party to this order.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Order retrieved successfully.',
      data: { order },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving order.',
    });
  }
};

// @desc    Update order delivery status
//          Buyer:  confirmed → in_transit, in_transit → delivered
//          Farmer: delivered → completed
// @route   PATCH /api/orders/:id/status
// @access  Private (Farmer or Buyer)
export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { orderStatus } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ success: false, message: 'Order not found. Invalid order ID.' });
  }

  const ALLOWED_STATUSES = ['in_transit', 'delivered', 'completed'];
  if (!orderStatus || !ALLOWED_STATUSES.includes(orderStatus)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Allowed transitions: in_transit, delivered, completed.`,
    });
  }

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const userId = req.user._id.toString();
    const isFarmer = order.farmer.toString() === userId;
    const isBuyer = order.buyer.toString() === userId;

    if (!isFarmer && !isBuyer) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a party to this order.',
      });
    }

    // Completed orders cannot change
    if (order.orderStatus === 'completed') {
      return res.status(409).json({
        success: false,
        message: 'This order is already completed and cannot be modified.',
      });
    }

    // Define allowed transitions per role
    const VALID_TRANSITIONS = {
      confirmed: { to: 'in_transit', allowedRole: 'buyer' },
      in_transit: { to: 'delivered', allowedRole: 'buyer' },
      delivered: { to: 'completed', allowedRole: 'farmer' },
    };

    const currentTransition = VALID_TRANSITIONS[order.orderStatus];

    if (!currentTransition) {
      return res.status(400).json({
        success: false,
        message: `No valid transition available from current status '${order.orderStatus}'.`,
      });
    }

    if (currentTransition.to !== orderStatus) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition. From '${order.orderStatus}', only '${currentTransition.to}' is allowed.`,
      });
    }

    // Role check
    if (currentTransition.allowedRole === 'buyer' && !isBuyer) {
      return res.status(403).json({
        success: false,
        message: `Only the buyer can move the order to '${orderStatus}'.`,
      });
    }

    if (currentTransition.allowedRole === 'farmer' && !isFarmer) {
      return res.status(403).json({
        success: false,
        message: `Only the farmer can move the order to '${orderStatus}'.`,
      });
    }

    // Apply transition
    order.orderStatus = orderStatus;
    order.statusHistory.push({
      status: orderStatus,
      changedBy: req.user._id,
      changedAt: new Date(),
    });

    await order.save();

    const updated = await Order.findById(order._id)
      .populate('farmer', FARMER_SAFE_FIELDS)
      .populate('buyer', BUYER_SAFE_FIELDS)
      .populate('crop', CROP_SAFE_FIELDS)
      .populate('statusHistory.changedBy', 'name role');

    return res.status(200).json({
      success: true,
      message: `Order status updated to '${orderStatus}' successfully.`,
      data: { order: updated },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating order status.',
    });
  }
};

// @desc    Record buyer-reported payment status
//          Note: This records payment intent only — no real money is moved.
// @route   PATCH /api/orders/:id/payment
// @access  Private (Buyer only)
export const updatePaymentStatus = async (req, res) => {
  const { id } = req.params;
  const { paymentStatus, paymentReference } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ success: false, message: 'Order not found. Invalid order ID.' });
  }

  if (paymentStatus !== 'paid') {
    return res.status(400).json({
      success: false,
      message: "Invalid payment status. Only 'paid' is accepted. Payment cannot be reversed.",
    });
  }

  if (!paymentReference || typeof paymentReference !== 'string' || paymentReference.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'A non-empty payment reference is required when marking an order as paid.',
    });
  }

  if (paymentReference.trim().length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Payment reference cannot exceed 100 characters.',
    });
  }

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Only the order's buyer can mark payment
    if (order.buyer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the buyer of this order can report payment.',
      });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(409).json({
        success: false,
        message: 'Payment has already been marked as paid for this order.',
      });
    }

    order.paymentStatus = 'paid';
    order.paymentReference = paymentReference.trim();
    await order.save();

    const updated = await Order.findById(order._id)
      .populate('farmer', FARMER_SAFE_FIELDS)
      .populate('buyer', BUYER_SAFE_FIELDS)
      .populate('crop', CROP_SAFE_FIELDS);

    return res.status(200).json({
      success: true,
      message: 'Buyer-reported payment status recorded as paid.',
      data: { order: updated },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Error updating payment status.',
    });
  }
};
