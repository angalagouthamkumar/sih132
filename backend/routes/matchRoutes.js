import express from 'express';
import { getMatchesForFarmer, getMatchesForBuyer } from '../controllers/matchController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/farmer', authorizeRoles('farmer'), getMatchesForFarmer);
router.get('/buyer', authorizeRoles('buyer'), getMatchesForBuyer);

export default router;
