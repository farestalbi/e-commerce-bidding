import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Bid } from "../entities/Bid";
import { Product, ProductType, ProductStatus } from "../entities/Product";
import { User } from "../entities/User";
import { asyncHandler } from "../utils/asyncHandler";
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from "../utils/ApiError";
import { NotificationService } from "../services/notificationService";

// Place a bid on an auction product
export const placeBid = asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;
  const { amount } = req.body;
  const userId = (req as any).user.id;

  const bidRepository = AppDataSource.getRepository(Bid);
  const productRepository = AppDataSource.getRepository(Product);
  const userRepository = AppDataSource.getRepository(User);

  // Check if product exists and is an auction
  const product = await productRepository.findOne({
    where: { id: productId },
  });

  if (!product) {
    throw new NotFoundError("Product not found");
  }

  if (product.type !== ProductType.AUCTION) {
    throw new BadRequestError("Bids can only be placed on auction products");
  }

  if (product.status !== ProductStatus.ACTIVE) {
    throw new BadRequestError("Auction is not active");
  }

  // Check if auction has ended
  if (product.auctionEndTime && new Date() > product.auctionEndTime) {
    throw new BadRequestError("Auction has ended");
  }

  // Check if user exists
  const user = await userRepository.findOne({ where: { id: userId } });
  if (!user) {
    throw new NotFoundError("User not found");
  }

  // Validate bid amount using database field
  const currentHighestBid = product.currentHighestBid || product.startingPrice;

  if (amount <= currentHighestBid) {
    throw new BadRequestError(
      `Bid must be higher than current highest bid (${currentHighestBid})`
    );
  }

  // Check if user is not bidding on their own product (if they own it)
  // This would require adding an owner field to Product entity

  // Create the bid
  const bid = bidRepository.create({
    amount,
    userId,
    productId,
  });

  const createdBid = await bidRepository.save(bid);

  // Update product's current highest bid
  await productRepository.update(productId, {
    currentHighestBid: amount,
  });

  // Send notification to previous highest bidder (if different user)
  if (currentHighestBid > product.startingPrice) {
    // Find the previous highest bidder
    const previousHighestBid = await bidRepository.findOne({
      where: {
        productId: productId,
        amount: currentHighestBid,
      },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });

    if (previousHighestBid && previousHighestBid.userId !== userId) {
      // Send outbid notification to the previous highest bidder
      await NotificationService.sendOutbidNotification(
        previousHighestBid.userId,
        product.name,
        amount,
        productId
      );
    }
  }

  res.status(201).json({
    success: true,
    message: "Bid placed successfully",
    data: {
      createdBid,
    },
  });
});

// Get bid history for a product
export const getBidHistory = asyncHandler(
  async (req: Request, res: Response) => {
    const { productId } = req.params;

    const bidRepository = AppDataSource.getRepository(Bid);
    const productRepository = AppDataSource.getRepository(Product);

    // Check if product exists
    const product = await productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundError("Product not found");
    }

    // Get bids with user information
    const bids = await bidRepository.find({
      where: { productId },
      relations: ["user"],
      order: { amount: "DESC", createdAt: "ASC" },
    });

    res.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          type: product.type,
          currentHighestBid: product.currentHighestBid,
          auctionEndTime: product.auctionEndTime,
        },
        bids: bids.map((bid) => ({
          id: bid.id,
          amount: bid.amount,
          createdAt: bid.createdAt,
          user: {
            id: bid.user.id,
            firstName: bid.user.firstName,
            lastName: bid.user.lastName,
          },
        })),
      },
    });
  }
);

// Get user's bid history
export const getUserBids = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user.id;

  const bidRepository = AppDataSource.getRepository(Bid);

  const bids = await bidRepository.find({
    where: { userId },
    relations: ["product"],
    order: { createdAt: "DESC" },
  });

  res.json({
    success: true,
    data: {
      bids: bids.map((bid) => ({
        id: bid.id,
        amount: bid.amount,
        createdAt: bid.createdAt,
        product: {
          id: bid.product.id,
          name: bid.product.name,
          type: bid.product.type,
          currentHighestBid: bid.product.currentHighestBid,
          auctionEndTime: bid.product.auctionEndTime,
          status: bid.product.status,
        },
      })),
    },
  });
});

// Cancel a bid (if allowed)
export const cancelBid = asyncHandler(async (req: Request, res: Response) => {
  const { bidId } = req.params;
  const userId = (req as any).user.id;

  const bidRepository = AppDataSource.getRepository(Bid);

  const bid = await bidRepository.findOne({
    where: { id: bidId },
    relations: ["product"],
  });

  if (!bid) {
    throw new NotFoundError("Bid not found");
  }

  if (bid.userId !== userId) {
    throw new ForbiddenError("You can only cancel your own bids");
  }

  // Check if auction has ended
  if (bid.product.auctionEndTime && new Date() > bid.product.auctionEndTime) {
    throw new BadRequestError("Cannot cancel bid after auction has ended");
  }

  await bidRepository.remove(bid);

  res.json({
    success: true,
    message: "Bid cancelled successfully",
  });
});
