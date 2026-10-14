import { Router } from "express";
import { auth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import validateRequest from "../../middlewares/validateRequest";
import { paymentValidations } from "./payment.validation";
import { PaymentController } from "./payment.controller";

const router = Router();

// ১. কাস্টমার পেমেন্ট সেশন শুরু করা (Initiate)
router.post(
  '/initiate',
  auth(Role.CUSTOMER, Role.STAFF, Role.SUPER_ADMIN),
  validateRequest(paymentValidations.initiatePaymentSchema),
  PaymentController.initiatePayment,
);

// ২. SSLCommerz কলব্যাক রাউটসমূহ (গেটওয়ে থেকে স্বয়ংক্রিয়ভাবে ফর্ম-পোস্ট আসবে, তাই পাবলিক)
router.post('/sslcommerz/success', PaymentController.sslCommerzSuccess);
router.post('/sslcommerz/fail', PaymentController.sslCommerzFail);
router.post('/sslcommerz/cancel', PaymentController.sslCommerzCancel);
router.post('/sslcommerz/ipn', PaymentController.sslCommerzIpn);

// ৩. নির্দিষ্ট অর্ডারের পেমেন্ট ডিটেইলস দেখা
router.get(
  '/order/:orderId',
  auth(Role.CUSTOMER, Role.STAFF, Role.SUPER_ADMIN),
  PaymentController.getPaymentByOrderId,
);
export const PaymentRoutes = router;