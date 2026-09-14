import express from 'express';
import { getProfile, updateProfile, getFarmerDashboard, getBuyerDashboard } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.patch('/profile', updateProfile);

router.get('/farmer/dashboard', authorizeRoles('farmer'), getFarmerDashboard);
router.get('/buyer/dashboard', authorizeRoles('buyer'), getBuyerDashboard);

export default router;
