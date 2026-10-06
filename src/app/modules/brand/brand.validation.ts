import { z } from 'zod';

const createBrandSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Brand name is required'),
    logo: z.string().optional(),
  }),
});

const updateBrandSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    logo: z.string().optional(),
  }),
});

export const brandValidations = {
  createBrandSchema,
  updateBrandSchema,
};