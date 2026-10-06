import { z } from 'zod';
import { PaymentMethod, SubOrderStatus } from '../../../generated/prisma/enums';

const shippingAddressSchema = z.object({
  street: z
    .string()
    .min(1, 'Street address is required')
    .min(3, 'Street address must be at least 3 characters'),

  city: z
    .string()
    .min(1, 'City is required')
    .min(2, 'City must be at least 2 characters'),

  state: z.string().optional(),

  postalCode: z
    .string()
    .min(1, 'Postal code is required'),

  country: z
    .string()
    .default('Bangladesh'),

  phone: z
    .string()
    .min(1, 'Contact phone number is required')
    .min(10, 'Contact phone number must be at least 10 characters'),
});

const createOrderSchema = z.object({
  body: z.object({
    shippingAddress: shippingAddressSchema,

    paymentMethod: z.enum(PaymentMethod),

    items: z
      .array(
        z.object({
          variantId: z
            .string()
            .uuid('Invalid variant ID'),

          quantity: z
            .number()
            .int('Quantity must be a whole number')
            .positive('Quantity must be greater than 0'),
        }),
      )
      .min(1, 'Order must contain at least one item')
      .optional(), // ✅ শুধু এই .optional() যোগ করলেই আর undefined এরর আসবে না!
  }),
});

const updateSubOrderStatusSchema = z.object({
  body: z.object({
    status: z.enum(SubOrderStatus),

    trackingNumber: z
      .string()
      .optional(),
  }),
});

export const orderValidations = {
  createOrderSchema,
  updateSubOrderStatusSchema,
};