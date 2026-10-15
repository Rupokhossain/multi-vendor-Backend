import { Router } from 'express';
import { SystemSettingController } from './systemSetting.controller';
import { auth } from '../../middlewares/checkAuth';
import { Role } from '../../../generated/prisma/enums';
import validateRequest from '../../middlewares/validateRequest';
import { systemSettingValidations } from './systemSetting.validaiton';

const router = Router();

// ১. পাবলিকলি সব সেটিংস দেখার রাউট
router.get('/', SystemSettingController.getAllSettings);

// ২. নির্দিষ্ট সেটিং দেখা
router.get('/:key', SystemSettingController.getSettingByKey);

// ৩. অ্যাডমিন: সেটিং যুক্ত বা আপডেট করা
router.put(
  '/',
  auth( Role.SUPER_ADMIN),
  validateRequest(systemSettingValidations.upsertSystemSettingSchema),
  SystemSettingController.upsertSetting,
);

// ৪. অ্যাডমিন: সেটিং ডিলিট করা
router.delete(
  '/:key',
  auth( Role.SUPER_ADMIN),
  SystemSettingController.deleteSetting,
);

export const SystemSettingRoutes = router;