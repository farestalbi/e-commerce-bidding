import { Router } from "express";
import { getAuctionStats } from "../../controllers/auctionController";
import { UserRole } from "../../entities/User";
import { authenticateToken } from "../../middleware/authentication";
import { authorization } from "../../middleware/authorization";

const router = Router();

// Get auction statistics
router.get(
  "/stats",
  authenticateToken,
  authorization(UserRole.ADMIN),
  getAuctionStats
);

export default router;
