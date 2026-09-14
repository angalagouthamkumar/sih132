import express from 'express';
import {
  getFarmerOrders,
  getBuyerOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
} from '../controllers/orderController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Static routes defined BEFORE dynamic /:id to prevent route shadowing
router.get('/farmer', protect, authorizeRoles('farmer'), getFarmerOrders);
router.get('/buyer', protect, authorizeRoles('buyer'), getBuyerOrders);

// Dynamic routes after static ones
router.get('/:id', protect, authorizeRoles('farmer', 'buyer', 'admin'), getOrderById);
router.patch('/:id/status', protect, authorizeRoles('farmer', 'buyer'), updateOrderStatus);
router.patch('/:id/payment', protect, authorizeRoles('buyer'), updatePaymentStatus);

export default router;
