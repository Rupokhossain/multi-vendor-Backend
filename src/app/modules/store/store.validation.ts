import { z } from 'zod';
import { VerificationStatus } from '../../../generated/prisma/enums';

const createStoreValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, 'Store name must be at least 3 characters'),

    description: z.string().optional(),

    logo: z
      .string()
      .url('Invalid logo URL')
      .optional(),

    banner: z
      .string()
      .url('Invalid banner URL')
      .optional(),

    tradeLicense: z.string().optional(),
  }),
});

const updateStoreValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(3, 'Store name must be at least 3 characters')
      .optional(),

    description: z.string().optional(),

    logo: z
      .string()
      .url('Invalid logo URL')
      .optional(),

    banner: z
      .string()
      .url('Invalid banner URL')
      .optional(),

    tradeLicense: z.string().optional(),
  }),
});

const updateStoreStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(VerificationStatus, {
      message:
        'Verification status is required (PENDING, APPROVED, REJECTED)',
    }),
  }),
});

export const storeValidation = {
  createStoreValidationSchema,
  updateStoreValidationSchema,
  updateStoreStatusValidationSchema,
};