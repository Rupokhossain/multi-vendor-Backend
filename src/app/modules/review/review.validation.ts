
import { z } from 'zod';

const createReviewSchema = z.object({
  body: z.object({
    productId: z
      .string()
      .min(1, 'Product ID is required')
      .uuid('Invalid product ID format'),

    rating: z
      .number()
      .int('Rating must be an integer')
      .min(1, 'Rating must be at least 1 star')
      .max(5, 'Rating cannot exceed 5 stars'),

    comment: z
      .string()
      .min(3, 'Comment must be at least 3 characters')
      .max(1000, 'Comment cannot exceed 1000 characters')
      .optional(),

    images: z
      .array(z.string().url('Each image must be a valid URL'))
      .optional()
      .default([]),
  }),
});

const updateReviewSchema = z.object({
  body: z
    .object({
      rating: z
        .number()
        .int('Rating must be an integer')
        .min(1, 'Rating must be at least 1 star')
        .max(5, 'Rating cannot exceed 5 stars')
        .optional(),

      comment: z
        .string()
        .min(3, 'Comment must be at least 3 characters')
        .max(1000, 'Comment cannot exceed 1000 characters')
        .optional(),

      images: z
        .array(z.string().url('Each image must be a valid URL'))
        .optional(),
    })
    .refine(
      (data) =>
        data.rating !== undefined ||
        data.comment !== undefined ||
        data.images !== undefined,
      {
        message: 'At least one field is required to update a review',
      },
    ),
});

export const reviewValidations = {
  createReviewSchema,
  updateReviewSchema,
};