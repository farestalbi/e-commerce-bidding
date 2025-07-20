import { Router } from "express";
import authRoutes from "./auth";
import productRoutes from "./products";
import bidRoutes from "./bids";
import auctionRoutes from "./auctions";
import orderRoutes from "./orders";
import paymentRoutes from "./payments";

const router = Router();

// Auth routes
router.use("/auth", authRoutes);

// Product routes
router.use("/products", productRoutes);

// Bid routes
router.use("/", bidRoutes);

// Auction management routes (admin only)
router.use("/auctions", auctionRoutes);

// Order routes
router.use("/orders", orderRoutes);

// Payment routes
router.use("/payments", paymentRoutes);

// Future route modules will be added here
// router.use('/users', userRoutes);
// router.use('/orders', orderRoutes);

export default router;
