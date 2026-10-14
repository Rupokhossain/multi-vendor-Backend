import { Router } from 'express';
import { CouponController } from './coupon.controller';
import { Role } from '../../../generated/prisma/enums';
import validateRequest from '../../middlewares/validateRequest';
import { couponValidations } from './coupon.validation';
import { auth } from '../../middlewares/checkAuth';


const router = Router();

router.get('/active', CouponController.getActiveCoupons);

router.post(
  '/apply',
  auth(Role.CUSTOMER, Role.STAFF, Role.SUPER_ADMIN),
  validateRequest(couponValidations.applyCouponSchema),
  CouponController.applyCoupon,
);


router.post(
  '/',
  auth(Role.STAFF, Role.SUPER_ADMIN),
  validateRequest(couponValidations.createCouponSchema),
  CouponController.createCoupon,
);
// ৪. অ্যাডমিন: সব কুপনের তালিকা দেখা
router.get(
  '/',
  auth(Role.STAFF, Role.SUPER_ADMIN),
  CouponController.getAllCoupons,
);
// ৫. অ্যাডমিন: নির্দিষ্ট কুপন বিস্তারিত দেখা
router.get(
  '/:id',
  auth(Role.STAFF, Role.SUPER_ADMIN),
  CouponController.getCouponById,
);
// ৬. অ্যাডমিন: কুপন এডিট বা সক্রিয়/নিষ্ক্রিয় করা
router.patch(
  '/:id',
  auth(Role.STAFF, Role.SUPER_ADMIN),
  validateRequest(couponValidations.updateCouponSchema),
  CouponController.updateCoupon,
);
// ৭. অ্যাডমিন: কুপন মুছে ফেলা
router.delete(
  '/:id',
  auth(Role.STAFF, Role.SUPER_ADMIN),
  CouponController.deleteCoupon,
);
export const CouponRoutes = router;