import express from 'express';
import {
  createOffer,
  getSentOffers,
  getReceivedOffers,
  updateOfferStatus,
} from '../controllers/offerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorizeRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Static routes defined before dynamic /:id/status route to prevent route shadowing
router.post('/', protect, authorizeRoles('buyer'), createOffer);
router.get('/sent', protect, authorizeRoles('buyer'), getSentOffers);
router.get('/received', protect, authorizeRoles('farmer'), getReceivedOffers);
router.patch('/:id/status', protect, authorizeRoles('farmer'), updateOfferStatus);

export default router;
