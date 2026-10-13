
import { z } from 'zod';
import { PayoutStatus } from '../../../generated/prisma/enums';

const createPayoutRequestSchema = z.object({
  body: z.object({
    amount: z
      .number()
      .positive('Amount must be greater than zero')
      .min(500, 'Minimum withdrawal amount is 500 BDT'),

    paymentMethod: z
      .string()
      .min(1, 'Payment method is required')
      .min(
        2,
        'Payment method must be specified (e.g. Bank Transfer, bKash)',
      ),

    accountInfo: z
      .string()
      .min(1, 'Account details are required')
      .min(
        5,
        'Provide valid account details (e.g. Account No, Bank Name, Branch / Mobile No)',
      ),
  }),
});

const updatePayoutStatusSchema = z.object({
  body: z.object({
    status: z.enum(PayoutStatus),

    adminNotes: z.string().optional(),
  }),
});

export const payoutValidations = {
  createPayoutRequestSchema,
  updatePayoutStatusSchema,
};
