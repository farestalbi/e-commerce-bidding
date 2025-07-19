import Joi from 'joi';

// Place bid schema
export const placeBidSchema = Joi.object({
  amount: Joi.number().positive().required()
}); 