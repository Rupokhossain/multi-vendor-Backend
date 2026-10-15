
import { z } from 'zod';

const upsertSystemSettingSchema = z.object({
  body: z.object({
    key: z
      .string()
      .min(1, 'Setting key is required')
      .transform((val) => val.trim().toUpperCase())
      .pipe(
        z.string().min(2, 'Setting key must be at least 2 characters'),
      ),

    value: z
      .string()
      .min(1, 'Setting value is required'),

    description: z
      .string()
      .optional(),
  }),
});

export const systemSettingValidations = {
  upsertSystemSettingSchema,
};
