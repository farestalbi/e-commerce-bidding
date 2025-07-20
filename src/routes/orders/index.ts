import { Router } from "express";
import {
  createOrder
} from "../../controllers/orderController";
import { authenticateToken } from "../../middleware/authentication";
import { validate } from "../../middleware/validation";
import {
  createOrderSchema
} from "./orderSchema";

const router = Router();

// User routes (require authentication)
router.use(authenticateToken);

// Create order (users)
router.post("/", validate(createOrderSchema), createOrder);

export default router;
