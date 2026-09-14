import express from 'express';
import {
  createCrop,
  getMyCrops,
  getCrops,
  getCropById,
  updateCrop,
  deleteCrop,
} from '../controllers/cropController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Important: Define /mine before /:id to prevent route shadowing
router.post('/', protect, authorizeRoles('farmer'), createCrop);
router.get('/mine', protect, authorizeRoles('farmer'), getMyCrops);
router.get('/', protect, getCrops);
router.get('/:id', protect, getCropById);
router.patch('/:id', protect, authorizeRoles('farmer'), updateCrop);
router.delete('/:id', protect, authorizeRoles('farmer'), deleteCrop);

export default router;
