import express from 'express';
import {
  getDashboardStats,
  getUsers,
  updateUserAccess,
  updateUserVerification,
  getCrops,
  updateCropStatus,
  getOffers,
  getOrders,
  getMarketData,
  createMarketData,
  updateMarketData,
  deleteMarketData,
  getTransportConfig,
  updateTransportConfig,
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Apply auth and admin role check to all routes
router.use(protect);
router.use(authorizeRoles('admin'));

// --- Dashboard Stats ---
router.get('/stats', getDashboardStats);

// --- User Management ---
router.get('/users', getUsers);
router.patch('/users/:id/access', updateUserAccess);
router.patch('/users/:id/verification', updateUserVerification);

// --- Crop Moderation ---
router.get('/crops', getCrops);
router.patch('/crops/:id/status', updateCropStatus);

// --- Offers & Orders ---
router.get('/offers', getOffers);
router.get('/orders', getOrders);

// --- Market Data ---
router.get('/market-data', getMarketData);
router.post('/market-data', createMarketData);
router.patch('/market-data/:id', updateMarketData);
router.delete('/market-data/:id', deleteMarketData);

// --- Dynamic Transport Configuration ---
router.get('/transport-config', getTransportConfig);
router.post('/transport-config', updateTransportConfig);
router.patch('/transport-config', updateTransportConfig);

export default router;
