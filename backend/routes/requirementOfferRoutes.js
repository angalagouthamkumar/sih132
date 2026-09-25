import express from 'express';
import {
  createRequirementOffer,
  getFarmerProposals,
  updateProposalStatus,
} from '../controllers/requirementOfferController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authorizeRoles('farmer'), createRequirementOffer);
router.get('/mine', authorizeRoles('farmer'), getFarmerProposals);
router.patch('/:id/status', authorizeRoles('buyer'), updateProposalStatus);

export default router;
