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
router.get('/', getAllProducts);
router.get('/:id', validate(productIdSchema, ValidationSource.PARAMS), getProductById);

// (Admin only)
router.post('/', authenticateToken, authorization(UserRole.ADMIN), validate(createProductSchema, ValidationSource.BODY), createProduct);
router.put('/:id', authenticateToken, authorization(UserRole.ADMIN), validate(productIdSchema, ValidationSource.PARAMS), validate(updateProductSchema, ValidationSource.BODY), updateProduct);
router.delete('/:id', authenticateToken, authorization(UserRole.ADMIN), validate(productIdSchema, ValidationSource.PARAMS), deleteProduct);

export default router;
