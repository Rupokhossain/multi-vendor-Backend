import { Router } from 'express';
import { auth } from '../../middlewares/checkAuth';
import { Role } from '../../../generated/prisma/enums';
import { AnalyticsController } from './analytics.controller';


const router = Router();


// ১. সুপার অ্যাডমিন ড্যাশবোর্ড এনালাইটিক্স
router.get(
  '/admin',
  auth(Role.SUPER_ADMIN),
  AnalyticsController.getAdminAnalytics,
);
// ২. ভেন্ডার ড্যাশবোর্ড এনালাইটিক্স
router.get(
  '/vendor',
  auth(Role.VENDOR, Role.STAFF, Role.SUPER_ADMIN),
  AnalyticsController.getVendorAnalytics,
);
export const AnalyticsRoutes = router;