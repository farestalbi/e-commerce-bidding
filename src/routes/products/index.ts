import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from '../../controllers/productController';
import { UserRole } from '../../entities/User';
import { authenticateToken } from '../../middleware/authentication';
import { authorization } from '../../middleware/authorization';
import { validate, ValidationSource } from '../../middleware/validation';
import { createProductSchema, productIdSchema, updateProductSchema } from './productSchema';

const router = Router();

// Public products routes

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [fixed_price, auction]
 *         description: Filter products by type
 *         example: fixed_price
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter products by category
 *         example: Electronics
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, sold, expired]
 *         description: Filter products by status
 *         example: active
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *         example: 10
 *     responses:
 *       200:
 *         description: List of products retrieved successfully
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
 *                   example: Products retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getAllProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Product retrieved successfully
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
 *                   example: Product retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Product'
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
router.get('/:id', validate(productIdSchema, ValidationSource.PARAMS), getProductById);

// (Admin only)

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Create a new product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Product name
 *                 example: iPhone 15 Pro
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Product description
 *                 example: Latest iPhone with advanced features
 *               type:
 *                 type: string
 *                 enum: [fixed_price, auction]
 *                 description: Product type
 *                 example: fixed_price
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Product price (required for fixed_price products)
 *                 example: 999.99
 *               stockQuantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Available stock quantity (required for fixed_price products)
 *                 example: 10
 *               startingPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Starting price for auction products
 *                 example: 500.00
 *               auctionEndTime:
 *                 type: string
 *                 format: date-time
 *                 description: Auction end time (required for auction products)
 *                 example: 2024-12-31T23:59:59.000Z
 *               minimumBidIncrement:
 *                 type: number
 *                 minimum: 0
 *                 description: Minimum bid increment for auction products
 *                 example: 10.00
 *               category:
 *                 type: string
 *                 maxLength: 100
 *                 description: Product category
 *                 example: Electronics
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: Product image URL
 *                 example: https://example.com/image.jpg
 *     responses:
 *       201:
 *         description: Product created successfully
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
 *                   example: Product created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
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
router.post('/', authenticateToken, authorization(UserRole.ADMIN), validate(createProductSchema, ValidationSource.BODY), createProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Update product by ID (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Product name
 *                 example: iPhone 15 Pro Max
 *               description:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Product description
 *                 example: Latest iPhone with advanced features and larger screen
 *               price:
 *                 type: number
 *                 minimum: 0
 *                 description: Product price (for fixed_price products)
 *                 example: 1099.99
 *               stockQuantity:
 *                 type: integer
 *                 minimum: 0
 *                 description: Available stock quantity (for fixed_price products)
 *                 example: 15
 *               startingPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: Starting price for auction products
 *                 example: 600.00
 *               auctionEndTime:
 *                 type: string
 *                 format: date-time
 *                 description: Auction end time (for auction products)
 *                 example: 2024-12-31T23:59:59.000Z
 *               minimumBidIncrement:
 *                 type: number
 *                 minimum: 0
 *                 description: Minimum bid increment for auction products
 *                 example: 15.00
 *               category:
 *                 type: string
 *                 maxLength: 100
 *                 description: Product category
 *                 example: Electronics
 *               imageUrl:
 *                 type: string
 *                 format: uri
 *                 description: Product image URL
 *                 example: https://example.com/image.jpg
 *               status:
 *                 type: string
 *                 enum: [active, inactive, sold, expired]
 *                 description: Product status
 *                 example: active
 *     responses:
 *       200:
 *         description: Product updated successfully
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
 *                   example: Product updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         description: Validation error
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.put('/:id', authenticateToken, authorization(UserRole.ADMIN), validate(productIdSchema, ValidationSource.PARAMS), validate(updateProductSchema, ValidationSource.BODY), updateProduct);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Delete product by ID (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Product ID
 *         example: 123e4567-e89b-12d3-a456-426614174000
 *     responses:
 *       200:
 *         description: Product deleted successfully
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
 *                   example: Product deleted successfully
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
router.delete('/:id', authenticateToken, authorization(UserRole.ADMIN), validate(productIdSchema, ValidationSource.PARAMS), deleteProduct);

export default router;
