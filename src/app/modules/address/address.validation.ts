
import { z } from 'zod';

const createAddressSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .min(2, 'Name must be at least 2 characters'),

    phone: z
      .string()
      .min(1, 'Phone number is required')
      .min(10, 'Valid phone number is required'),

    city: z
      .string()
      .min(1, 'City is required')
      .min(2, 'City must be at least 2 characters'),

    area: z
      .string()
      .min(1, 'Area is required')
      .min(2, 'Area is required (e.g. Dhanmondi, Gulshan)'),

    street: z
      .string()
      .min(1, 'Street address is required')
      .min(3, 'Street address is required (e.g. House 12, Road 5)'),

    postalCode: z.string().optional(),

    isDefault: z.boolean().optional().default(false),
  }),
});

const updateAddressSchema = z.object({
  body: z.object({
    fullName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .optional(),

    phone: z
      .string()
      .min(10, 'Valid phone number is required')
      .optional(),

    city: z
      .string()
      .min(2, 'City must be at least 2 characters')
      .optional(),

    area: z
      .string()
      .min(2, 'Area must be at least 2 characters')
      .optional(),

    street: z
      .string()
      .min(3, 'Street address must be at least 3 characters')
      .optional(),

    postalCode: z.string().optional(),

    isDefault: z.boolean().optional(),
  }).refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    {
      message: 'At least one field is required to update an address',
    },
  ),
});

export const addressValidations = {
  createAddressSchema,
  updateAddressSchema,
};
