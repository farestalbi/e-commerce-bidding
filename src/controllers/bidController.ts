import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Bid } from "../entities/Bid";
import { Product, ProductStatus, ProductType } from "../entities/Product";
import { User } from "../entities/User";
import { NotificationService } from "../services/notificationService";
import {
  BadRequestError,
  NotFoundError
} from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

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

  // Validate bid amount
  const currentHighestBid = product.currentHighestBid || product.startingPrice;

  if (amount <= currentHighestBid) {
    throw new BadRequestError(
      `Bid must be higher than current highest bid (${currentHighestBid})`
    );
  }

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

  res.status(201).json({
    success: true,
    message: "Bid placed successfully",
    data: {
      createdBid,
    },
  });
});
