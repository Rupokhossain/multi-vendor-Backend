
import { z } from 'zod';
import { BannerPosition } from '../../../generated/prisma/enums';

const createBannerSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Title is required')
      .min(2, 'Title must be at least 2 characters'),

    image: z
      .string()
      .min(1, 'Image URL is required')
      .url('Invalid image URL format'),

    link: z
      .string()
      .url('Invalid link URL format')
      .optional(),

    position: z
      .enum(BannerPosition)
      .optional(),

    isActive: z
      .boolean()
      .optional()
      .default(true),

    order: z
      .number()
      .int('Order must be an integer')
      .optional()
      .default(0),
  }),
});

const updateBannerSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(2, 'Title must be at least 2 characters')
      .optional(),

    image: z
      .string()
      .url('Invalid image URL format')
      .optional(),

    link: z
      .string()
      .url('Invalid link URL format')
      .optional(),

    position: z
      .enum(BannerPosition)
      .optional(),

    isActive: z
      .boolean()
      .optional(),

    order: z
      .number()
      .int('Order must be an integer')
      .optional(),
  }).refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    {
      message: 'At least one field is required to update a banner',
    },
  ),
});

export const bannerValidations = {
  createBannerSchema,
  updateBannerSchema,
};
