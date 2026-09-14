import express from 'express';
import {
  createRequirement,
  getMyRequirements,
  getAllRequirements,
  getRequirementById,
  updateRequirement,
  deleteRequirement
} from '../controllers/requirementController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authorizeRoles('buyer'), createRequirement);
router.get('/mine', authorizeRoles('buyer'), getMyRequirements);
router.get('/', authorizeRoles('farmer', 'admin'), getAllRequirements);
router.get('/:id', getRequirementById);
router.patch('/:id', authorizeRoles('buyer'), updateRequirement);
router.delete('/:id', authorizeRoles('buyer', 'admin'), deleteRequirement);

export default router;
