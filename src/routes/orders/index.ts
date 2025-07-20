import { Router } from "express";
import { createOrder } from "../../controllers/orderController";
import { authenticateToken } from "../../middleware/authentication";
import { validate } from "../../middleware/validation";
import { createOrderSchema } from "./orderSchema";

const router = Router();

// Create order (users)

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                       description: Product ID to order
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       description: Quantity to order
 *                       example: 2
 *               shippingAddress:
 *                 type: string
 *                 description: Shipping address
 *                 example: 123 Main St, City, Country
 *               notes:
 *                 type: string
 *                 description: Order notes
 *                 example: Please deliver in the morning
 *     responses:
 *       201:
 *         description: Order created successfully
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
 *                   example: Order created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Validation error or insufficient stock
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
 *         description: Product not found
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
router.post("/", authenticateToken, validate(createOrderSchema), createOrder);

export default router;
