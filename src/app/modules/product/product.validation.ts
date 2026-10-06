
import { z } from 'zod';

const variantSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .min(3, 'SKU must be at least 3 characters'),

  price: z
    .number()
    .positive('Price must be greater than 0'),

  stock: z
    .number()
    .int('Stock must be a whole number')
    .nonnegative('Stock cannot be negative'),

  attributes: z
    .record(z.string(), z.any())
    .refine(
      (value) => Object.keys(value).length > 0,
      'Variant attributes are required',
    ),
});

const createProductSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Product title is required')
      .min(3, 'Title must be at least 3 characters'),

    description: z
      .string()
      .min(1, 'Description is required')
      .min(10, 'Description must be at least 10 characters'),

    categoryId: z
      .string()
      .min(1, 'Category ID is required')
      .uuid('Invalid Category ID'),

    brandId: z
      .string()
      .uuid('Invalid Brand ID')
      .optional(),

    images: z
      .array(z.string().url('Invalid image URL'))
      .min(1, 'At least one product image is required'),

    isPublished: z
      .boolean()
      .optional()
      .default(true),

    variants: z
      .array(variantSchema)
      .min(1, 'Product must have at least one variant'),
  }),
});

const updateProductSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(3, 'Title must be at least 3 characters')
      .optional(),

    description: z
      .string()
      .min(10, 'Description must be at least 10 characters')
      .optional(),

    categoryId: z
      .string()
      .uuid('Invalid Category ID')
      .optional(),

    brandId: z
      .string()
      .uuid('Invalid Brand ID')
      .optional(),

    images: z
      .array(z.string().url('Invalid image URL'))
      .min(1, 'At least one product image is required')
      .optional(),

    isPublished: z
      .boolean()
      .optional(),
  }),
});

export const productValidations = {
  createProductSchema,
  updateProductSchema,
};
