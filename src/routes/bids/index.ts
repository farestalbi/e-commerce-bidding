import { Router } from 'express';
import {
  cancelBid,
  getBidHistory,
  getUserBids,
  placeBid
} from '../../controllers/bidController';
import { authenticateToken } from '../../middleware/authentication';
import { validate } from '../../middleware/validation';
import { placeBidSchema } from './bidSchema';

const router = Router();

// Public routes
router.get('/product/:productId', getBidHistory);

// Protected routes
router.post('/product/:productId', authenticateToken, validate(placeBidSchema), placeBid);
router.get('/user', authenticateToken, getUserBids);
router.delete('/:bidId', authenticateToken, cancelBid);

export default router; 