import express from 'express';
import { getMarketData } from '../controllers/marketController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, authorizeRoles('farmer', 'buyer', 'admin'), getMarketData);

export default router;
