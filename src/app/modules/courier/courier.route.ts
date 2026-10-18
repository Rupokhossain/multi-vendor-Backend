import { Router } from 'express';
import { auth } from '../../middlewares/checkAuth';
import { Role } from '../../../generated/prisma/enums';
import { courierController } from './courier.controller';


const router = Router();

// ১. ভেন্ডার তার পার্সেল কুরিয়ারে বুকিং দেবে
router.post(
  '/book/:subOrderId',
  auth(Role.VENDOR, Role.STAFF, Role.SUPER_ADMIN),
  courierController.bookShipment
);

// ২. কাস্টমার / ভেন্ডার লাইভ পার্সেল ট্র্যাক করবে
router.get(
  '/track/:subOrderId',
  auth(Role.CUSTOMER, Role.VENDOR, Role.STAFF, Role.SUPER_ADMIN),
  courierController.trackShipment
);

// ৩. পার্সেল ডেলিভারি কনফার্মেশন (রাইডার ডেলিভারি সম্পন্ন করলে)
router.post(
  '/confirm-delivery/:subOrderId',
  auth(Role.STAFF, Role.SUPER_ADMIN),
  courierController.confirmDelivery
);

export const courierRoutes = router;