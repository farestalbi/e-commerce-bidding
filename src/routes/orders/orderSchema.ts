import Joi from 'joi';
import { OrderStatus } from '../../entities/Order';

// Create order schema
export const createOrderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().uuid().required(),
      quantity: Joi.number().integer().min(1).required()
    })
  ).min(1).required(),
  shippingAddress: Joi.string().optional(),
  notes: Joi.string().optional()
});

// Update order status schema
export const updateOrderStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(OrderStatus))
    .required()
});

// Get orders query schema
export const getOrdersQuerySchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(OrderStatus))
    .optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

// Order ID parameter schema
export const orderIdParamSchema = Joi.object({
  orderId: Joi.string().uuid().required()
}); 