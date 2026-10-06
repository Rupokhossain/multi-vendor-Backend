
import { z } from 'zod';

const createCategoryValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Category name is required')
      .min(2, 'Category name must be at least 2 characters'),

    icon: z.string().optional(),

    parentId: z
      .string()
      .uuid('Invalid parent category ID')
      .optional(),
  }),
});

const updateCategoryValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Category name must be at least 2 characters')
      .optional(),

    icon: z.string().optional(),

    parentId: z
      .string()
      .uuid('Invalid parent category ID')
      .optional(),
  }),
});

export const categoryValidation = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
};

