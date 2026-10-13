import { Router } from 'express';
import { auth } from '../../middlewares/checkAuth';
import { ReviewController } from './review.controller';
import { Role } from '../../../generated/prisma/enums';
import validateRequest from '../../middlewares/validateRequest';
import { reviewValidations } from './review.validation';


const router = Router();

// ১. নির্দিষ্ট প্রোডাক্টের সব রিভিউ দেখা (পাবলিক - নো লগইন রিকোয়ার্ড)
router.get('/product/:productId', ReviewController.getProductReviews);

// ২. কাস্টমারের নিজের রিভিউ দেখা
router.get(
  '/my-reviews',
  auth(Role.CUSTOMER),
  ReviewController.getMyReviews,
);

// ৩. নতুন রিভিউ দেওয়া (গ্রাহক বা এডমিন)
router.post(
  '/',
  auth(Role.CUSTOMER, Role.VENDOR, Role.SUPER_ADMIN),
  validateRequest(reviewValidations.createReviewSchema),
  ReviewController.createReview,
);

// ৪. রিভিউ আপডেট করা
router.patch(
  '/:id',
  auth(Role.CUSTOMER, Role.VENDOR, Role.SUPER_ADMIN),
  validateRequest(reviewValidations.updateReviewSchema),
  ReviewController.updateReview,
);

// ৫. রিভিউ ডিলিট করা
router.delete(
  '/:id',
  auth(Role.CUSTOMER, Role.VENDOR, Role.SUPER_ADMIN),
  ReviewController.deleteReview,
);

export const ReviewRoutes = router;