import { Router } from 'express';
import { Role } from '../../../generated/prisma/enums';
import { auth } from '../../middlewares/checkAuth';
import validateRequest from '../../middlewares/validateRequest';
import { orderValidations } from './order.validation';
import { orderController } from './order.controller';


const router = Router();

const allAuthRoles = [Role.CUSTOMER, Role.VENDOR, Role.STAFF, Role.SUPER_ADMIN];

// ১. কাস্টমার অর্ডার তৈরি করবে (কার্ট থেকে চেকআউট)
router.post(
  '/',
  auth(...allAuthRoles),
  validateRequest(orderValidations.createOrderSchema),
  orderController.createOrder
);

// ২. কাস্টমারের নিজস্ব অর্ডারসমূহ
router.get('/my-orders', auth(...allAuthRoles), orderController.getMyOrders);

// ৩. ভেন্ডরের নিজস্ব সাব-অর্ডারসমূহ (ভেন্ডর ড্যাশবোর্ড)
router.get(
  '/vendor/sub-orders',
  auth(Role.VENDOR, Role.SUPER_ADMIN),
  orderController.getVendorSubOrders
);

// ৪. ভেন্ডর তার সাব-অর্ডারের স্ট্যাটাস আপডেট করবে
router.patch(
  '/sub-orders/:id/status',
  auth(Role.VENDOR, Role.SUPER_ADMIN),
  validateRequest(orderValidations.updateSubOrderStatusSchema),
  orderController.updateSubOrderStatus
);

export const orderRoutes = router;