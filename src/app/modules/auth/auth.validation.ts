import { z } from 'zod';
import { Role } from '../../../generated/prisma/enums';

const registerValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')
      .min(2, 'Name must be at least 2 characters'),

    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),

    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be at least 6 characters'),

    phone: z.string().optional(),

    role: z.enum(Role).optional(),
  }),
});

const loginValidationSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Invalid email address'),

    password: z
      .string()
      .min(1, 'Password is required'),
  }),
});

const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z
      .string()
      .min(1, 'Refresh token is required in cookies'),
  }),
});

export const authValidation = {
  registerValidationSchema,
  loginValidationSchema,
  refreshTokenValidationSchema,
};