import { Router } from 'express';
import { auth } from '../../middlewares/checkAuth';
import { Role } from '../../../generated/prisma/enums';
import { WishlistController } from './wishlist.controller';
import validateRequest from '../../middlewares/validateRequest';
import { wishlistValidations } from './wishlist.validation';



const router = Router();
// ১. গ্রাহকের উইশলিস্টের সব পণ্য দেখা
router.get(
  '/my-wishlist',
  auth(Role.CUSTOMER, Role.STAFF, Role.SUPER_ADMIN),
  WishlistController.getMyWishlist,
);
// ২. স্মার্ট টগল (লাইক/আনলাইক - উইশলিস্টে যোগ করা বা বাদ দেওয়া)
router.post(
  '/toggle',
   auth(Role.CUSTOMER, Role.STAFF, Role.SUPER_ADMIN),
  validateRequest(wishlistValidations.toggleWishlistSchema),
  WishlistController.toggleWishlist,
);
// ৩. সম্পূর্ণ উইশলিস্ট ফাঁকা করা
router.delete(
  '/clear',
  auth(Role.CUSTOMER, Role.STAFF, Role.SUPER_ADMIN),
  WishlistController.clearWishlist,
);
// ৪. নির্দিষ্ট পণ্য উইশলিস্ট থেকে সরানো
router.delete(
  '/product/:productId',
  auth(Role.CUSTOMER, Role.STAFF, Role.SUPER_ADMIN),
  WishlistController.removeFromWishlist,
);
export const WishlistRoutes = router;