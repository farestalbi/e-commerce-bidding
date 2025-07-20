import { Request, Response } from 'express';
import { AuctionService } from '../services/auctionService';
import { asyncHandler } from '../utils/asyncHandler';

const auctionService = new AuctionService();

/**
 * Get auction statistics
 */
export const getAuctionStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await auctionService.getAuctionStats();

  res.json({
    success: true,
    data: stats
  });
});

 