
import { z } from 'zod';
import { DiscountType } from '../../../generated/prisma/enums';

const createCouponSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(1, 'Coupon code is required')
      .transform((val) => val.trim().toUpperCase())
      .pipe(
        z
          .string()
          .min(3, 'Code must be at least 3 characters')
          .max(30, 'Code cannot exceed 30 characters'),
      ),

    discountType: z.enum(DiscountType),

    value: z
      .number()
      .positive('Discount value must be positive'),

    minPurchase: z
      .number()
      .nonnegative('Minimum purchase cannot be negative')
      .optional()
      .default(0),

    maxDiscount: z
      .number()
      .positive('Maximum discount must be positive')
      .optional(),

    usageLimit: z
      .number()
      .int('Usage limit must be an integer')
      .positive('Usage limit must be positive')
      .optional(),

    expiresAt: z
      .string()
      .min(1, 'Expiration date is required')
      .datetime('Invalid expiration date format'),

    isActive: z
      .boolean()
      .optional()
      .default(true),
  }),
});

const updateCouponSchema = z.object({
  body: z.object({
    code: z
      .string()
      .transform((val) => val.trim().toUpperCase())
      .pipe(
        z
          .string()
          .min(3, 'Code must be at least 3 characters')
          .max(30, 'Code cannot exceed 30 characters'),
      )
      .optional(),

    discountType: z.enum(DiscountType).optional(),

    value: z
      .number()
      .positive('Discount value must be positive')
      .optional(),

    minPurchase: z
      .number()
      .nonnegative('Minimum purchase cannot be negative')
      .optional(),

    maxDiscount: z
      .number()
      .positive('Maximum discount must be positive')
      .optional(),

    usageLimit: z
      .number()
      .int('Usage limit must be an integer')
      .positive('Usage limit must be positive')
      .optional(),

    expiresAt: z
      .string()
      .min(1, 'Expiration date cannot be empty')
      .datetime('Invalid expiration date format')
      .optional(),

    isActive: z.boolean().optional(),
  }),
});

const applyCouponSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(1, 'Coupon code is required')
      .transform((val) => val.trim().toUpperCase())
      .pipe(
        z.string().min(1, 'Coupon code cannot be empty'),
      ),

    orderAmount: z
      .number()
      .positive('Order amount must be greater than zero')
      .optional(),
  }),
});

export const couponValidations = {
  createCouponSchema,
  updateCouponSchema,
  applyCouponSchema,
};
