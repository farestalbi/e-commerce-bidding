import { Router } from 'express';
import { 
  handlePaymentCallback
} from '../../controllers/paymentController';

const router = Router();

// MyFatoorah webhook callback (public endpoint)
router.post('/callback', handlePaymentCallback);

export default router; 