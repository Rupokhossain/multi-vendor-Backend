import { z } from "zod";
import { Role } from "../../../generated/prisma/enums";

const registerValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, "Name is required")
      .min(2, "Name must be at least 2 characters"),

    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),

    password: z
      .string()
      .min(1, "Password is required")
      .min(6, "Password must be at least 6 characters"),

    phone: z.string().optional(),

    role: z.enum(Role).optional(),
  }),
});

const loginValidationSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),

    password: z.string().min(1, "Password is required"),
  }),
});

const refreshTokenValidationSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().min(1, "Refresh token is required in cookies"),
  }),
});

const googleLoginValidationSchema = z.object({
  body: z.object({
    idToken: z.string("Google ID Token is required"),
  }),
});

const verifyEmailValidationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
  }),
});

const forgotPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
  }),
});
const resetPasswordValidationSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    otp: z.string().length(6, "OTP must be exactly 6 digits"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
  }),
});


const updateProfileValidationSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .min(2, 'Name must be at least 2 characters')
        .optional(),

      phone: z
        .string()
        .min(10, 'Phone must be at least 10 characters')
        .optional(),

      avatar: z
        .string()
        .url('Invalid avatar URL')
        .optional(),
    })
    .refine(
      (data) => Object.values(data).some((value) => value !== undefined),
      {
        message: 'At least one field is required to update profile',
      },
    ),
});

const changePasswordValidationSchema = z.object({
  body: z.object({
    oldPassword: z
      .string()
      .min(1, 'Current password is required'),

    newPassword: z
      .string()
      .min(1, 'New password is required')
      .min(6, 'New password must be at least 6 characters'),
  }),
});


export const authValidation = {
  registerValidationSchema,
  loginValidationSchema,
  refreshTokenValidationSchema,
  googleLoginValidationSchema,
  verifyEmailValidationSchema,
  forgotPasswordValidationSchema,
  resetPasswordValidationSchema,
  updateProfileValidationSchema,
  changePasswordValidationSchema
};
