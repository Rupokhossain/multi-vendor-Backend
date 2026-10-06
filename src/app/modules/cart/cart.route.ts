import { Router } from 'express';
import { Role } from '../../../generated/prisma/enums';
import { auth } from '../../middlewares/checkAuth';
import { cartController } from './cart.controller';
import validateRequest from '../../middlewares/validateRequest';
import { cartValidations } from './cart.validation';


const router = Router();

// যেকোনো লগইন করা ইউজার কার্ট ব্যবহার করতে পারবে
const allAuthRoles = [Role.CUSTOMER, Role.VENDOR, Role.STAFF, Role.SUPER_ADMIN];

router.get('/', auth(...allAuthRoles), cartController.getMyCart);

router.post(
  '/items',
  auth(...allAuthRoles),
  validateRequest(cartValidations.addToCartSchema),
  cartController.addToCart
);

router.patch(
  '/items/:id',
  auth(...allAuthRoles),
  validateRequest(cartValidations.updateCartItemSchema),
  cartController.updateCartItemQuantity
);

router.delete('/items/:id', auth(...allAuthRoles), cartController.removeCartItem);

router.delete('/clear', auth(...allAuthRoles), cartController.clearCart);

export const cartRoutes = router;