import Joi from 'joi';

// Register user schema
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required()
});

// Login user schema
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Update profile schema
export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  avatar: Joi.string().uri().optional()
});

// Add FCM token schema
export const addFcmTokenSchema = Joi.object({
  token: Joi.string().required()
});

// Remove FCM token schema
export const removeFcmTokenSchema = Joi.object({
  token: Joi.string().required()
}); 