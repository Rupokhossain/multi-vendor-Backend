import { Router } from 'express';
import { auth } from '../../middlewares/checkAuth';
import { Role } from '../../../generated/prisma/enums';
import validateRequest from '../../middlewares/validateRequest';
import { storeValidation } from './store.validation';
import { storeController } from './store.controller';


const router = Router();

// ১. নতুন দোকান তৈরি (লগইন করা ইউজার)
router.post(
  '/create',
  auth(Role.CUSTOMER, Role.VENDOR, Role.SUPER_ADMIN),
  validateRequest(storeValidation.createStoreValidationSchema),
  storeController.createStore
);

// ২. ভেন্ডরের নিজস্ব দোকান দেখা
router.get(
  '/my-store',
  auth(Role.VENDOR, Role.SUPER_ADMIN),
  storeController.getMyStore
);

// ৩. ভেন্ডরের নিজস্ব দোকান আপডেট করা
router.patch(
  '/update',
  auth(Role.VENDOR, Role.SUPER_ADMIN),
  validateRequest(storeValidation.updateStoreValidationSchema),
  storeController.updateMyStore
);

// ৪. সব দোকানের তালিকা দেখা (পাবলিক)
router.get('/', storeController.getAllStores);

// ৫. স্লাগ দিয়ে নির্দিষ্ট দোকান দেখা (পাবলিক)
router.get('/:slug', storeController.getStoreBySlug);

// ৬. স্টোর অ্যাপ্রুভ বা রিজেক্ট করা (শুধুমাত্র সুপার অ্যাডমিন)
router.patch(
  '/:id/status',
  auth(Role.SUPER_ADMIN),
  validateRequest(storeValidation.updateStoreStatusValidationSchema),
  storeController.updateStoreStatus
);

export const storeRoutes = router;