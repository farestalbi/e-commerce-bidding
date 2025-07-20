import Joi from "joi";

// Product ID parameter validation
export const productIdSchema = Joi.object({
  id: Joi.string().uuid().required(),
});

// Create product schema
export const createProductSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().min(1).max(1000).required(),
  type: Joi.string().valid("fixed_price", "auction").required(),
  price: Joi.when("type", {
    is: "fixed_price",
    then: Joi.number().positive().required(),
    otherwise: Joi.forbidden(),
  }),
  stockQuantity: Joi.when("type", {
    is: "fixed_price",
    then: Joi.number().integer().min(0).required(),
    otherwise: Joi.forbidden(),
  }),
  startingPrice: Joi.when("type", {
    is: "auction",
    then: Joi.number().positive().required(),
    otherwise: Joi.forbidden(),
  }),
  auctionEndTime: Joi.when("type", {
    is: "auction",
    then: Joi.date().greater("now").required(),
    otherwise: Joi.forbidden(),
  }),

  category: Joi.string().max(100).optional(),
  imageUrl: Joi.string().uri().optional(),
});

// Update product schema
export const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().min(1).max(1000).optional(),
  price: Joi.number().positive().optional(),
  stockQuantity: Joi.number().integer().min(0).optional(),
  startingPrice: Joi.number().positive().optional(),
  auctionEndTime: Joi.date().greater("now").optional(),

  category: Joi.string().max(100).optional(),
  imageUrl: Joi.string().uri().optional(),
  status: Joi.string().valid("active", "inactive", "sold", "expired").optional(),
});
