import { Router } from "express";
import { getAuctionStats } from "../../controllers/auctionController";
import { UserRole } from "../../entities/User";
import { authenticateToken } from "../../middleware/authentication";
import { authorization } from "../../middleware/authorization";

const router = Router();

// Get auction statistics

/**
 * @swagger
 * /api/auctions/stats:
 *   get:
 *     summary: Get auction statistics (Admin only)
 *     tags: [Auctions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Auction statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Auction statistics retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/AuctionStats'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  "/stats",
  authenticateToken,
  authorization(UserRole.ADMIN),
  getAuctionStats
);

export default router;
