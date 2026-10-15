import { Router } from "express";
import { auth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { AddressController } from "./address.controller";
import { addressValidations } from "./address.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = Router();

// ১. কাস্টমারের সব সেভ করা ঠিকানা দেখা
router.get(
  '/my-addresses',
  auth(Role.CUSTOMER, Role.VENDOR, Role.SUPER_ADMIN),
  AddressController.getMyAddresses,
);

// ২. নতুন শিপিং ঠিকানা যোগ করা
router.post(
  '/',
  auth(Role.CUSTOMER, Role.VENDOR, Role.SUPER_ADMIN),
  validateRequest(addressValidations.createAddressSchema),
  AddressController.createAddress,
);

// ৩. একটি নির্দিষ্ট ঠিকানাকে ডিফল্ট হিসেবে সেট করা
router.patch(
  '/:id/default',
  auth(Role.CUSTOMER, Role.VENDOR, Role.SUPER_ADMIN),
  AddressController.setDefaultAddress,
);

// ৪. সিঙ্গেল অ্যাড্রেস দেখা
router.get(
  '/:id',
  auth(Role.CUSTOMER, Role.VENDOR, Role.SUPER_ADMIN),
  AddressController.getAddressById,
);

// ৫. অ্যাড্রেস এডিট করা
router.patch(
  '/:id',
  auth(Role.CUSTOMER, Role.VENDOR, Role.SUPER_ADMIN),
  validateRequest(addressValidations.updateAddressSchema),
  AddressController.updateAddress,
);

// ৬. অ্যাড্রেস মুছে ফেলা
router.delete(
  '/:id',
  auth(Role.CUSTOMER, Role.VENDOR, Role.SUPER_ADMIN),
  AddressController.deleteAddress,
);


export const AddressRoutes = router;