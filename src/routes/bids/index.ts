import { Router } from "express";
import { placeBid } from "../../controllers/bidController";
import { authenticateToken } from "../../middleware/authentication";
import { validate } from "../../middleware/validation";
import { placeBidSchema } from "./bidSchema";

const router = Router();

// Place a bid on a product

/**
 * @swagger
 * /api/bids/product/{productId}/bids:
 *   post:
 *     summary: Place a bid on an auction product
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID to bid on
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *                 description: Bid amount (must be higher than current highest bid)
 *                 example: 550.00
 *     responses:
 *       201:
 *         description: Bid placed successfully
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
 *                   example: Bid placed successfully
 *                 data:
 *                   $ref: '#/components/schemas/Bid'
 *       400:
 *         description: Validation error or bid too low
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Product not found or not an auction
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Auction has ended or product is not available for bidding
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
router.post(
  "/product/:productId/bids",
  authenticateToken,
  validate(placeBidSchema),
  placeBid
);
export default router;
