import { z } from 'zod';

const initiatePaymentSchema = z.object({
  body: z.object({
    orderId: z
      .string()
      .min(1, 'Order ID is required')
      .uuid('Invalid order ID format'),
  }),
});

export const paymentValidations = {
  initiatePaymentSchema,
};
