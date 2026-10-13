import { Router } from 'express';

import { Role } from '../../../generated/prisma/enums';
import { PayoutController } from './payout.controller';
import validateRequest from '../../middlewares/validateRequest';
import { payoutValidations } from './payout.validation';
import { auth } from '../../middlewares/checkAuth';


const router = Router();

// ১. ভেন্ডারের ওয়ালেট স্ট্যাটস ও সামারি দেখা
router.get(
  '/stats',
  auth(Role.VENDOR, Role.SUPER_ADMIN),
  PayoutController.getVendorPayoutStats,
);

// ২. ভেন্ডার পে-আউট রিকোয়েস্ট সাবমিট করা
router.post(
  '/request',
  auth(Role.VENDOR, Role.SUPER_ADMIN),
  validateRequest(payoutValidations.createPayoutRequestSchema),
  PayoutController.createPayoutRequest,
);

// ৩. ভেন্ডারের নিজের সব রিকোয়েস্ট দেখা
router.get(
  '/my-requests',
  auth(Role.VENDOR, Role.SUPER_ADMIN),
  PayoutController.getMyPayoutRequests,
);

// ৪. অ্যাডমিন: সব ভেন্ডারের পে-আউট রিকোয়েস্ট লিস্ট
router.get(
  '/admin/all',
  auth(Role.SUPER_ADMIN, Role.STAFF),
  PayoutController.getAllPayoutRequests,
);

// ৫. অ্যাডমিন: রিকোয়েস্ট Approve বা Reject করা
router.patch(
  '/admin/:id/status',
   auth(Role.SUPER_ADMIN, Role.STAFF),
  validateRequest(payoutValidations.updatePayoutStatusSchema),
  PayoutController.updatePayoutStatus,
);

export const PayoutRoutes = router;