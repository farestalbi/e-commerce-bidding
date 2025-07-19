import { Router } from 'express';
import authRoutes from './auth';
import productRoutes from './products';
import bidRoutes from './bids';

const router = Router();

// Auth routes
router.use('/auth', authRoutes);

// Product routes
router.use('/products', productRoutes);

// Bid routes
router.use('/bids', bidRoutes);

// Future route modules will be added here
// router.use('/users', userRoutes);
// router.use('/orders', orderRoutes);

export default router; 