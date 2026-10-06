import { z } from 'zod';

const addToCartSchema = z.object({
  body: z.object({
    variantId: z
      .string()
      .min(1, 'Variant ID is required')
      .uuid('Invalid Variant ID format'),

    quantity: z
      .number()
      .int('Quantity must be a whole number')
      .positive('Quantity must be at least 1'),
  }),
});

const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z
      .number()
      .int('Quantity must be a whole number')
      .positive('Quantity must be at least 1'),
  }),
});

export const cartValidations = {
  addToCartSchema,
  updateCartItemSchema,
};