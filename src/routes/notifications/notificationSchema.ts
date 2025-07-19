import Joi from "joi";

// Add FCM token schema
export const addFcmTokenSchema = Joi.object({
  token: Joi.string().required(),
});

// Remove FCM token schema
export const removeFcmTokenSchema = Joi.object({
  token: Joi.string().required(),
}); 