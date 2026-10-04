import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { authValidation } from "./auth.validation";
import { authController } from "./auth.controller";
import { auth } from "../../middlewares/checkAuth";
import { Role } from "../../../generated/prisma/enums";


const router = Router();

router.post(
  '/register',
  validateRequest(authValidation.registerValidationSchema),
  authController.register
);

router.post(
  '/login',
  validateRequest(authValidation.loginValidationSchema),
  authController.login
);

router.post(
  '/refresh-token',
  validateRequest(authValidation.refreshTokenValidationSchema),
  authController.refreshToken
);

router.get(
  '/me',
  auth(Role.CUSTOMER, Role.VENDOR, Role.STAFF, Role.SUPER_ADMIN),
  authController.getMyProfile
);


router.post(
  '/google-login',
  validateRequest(authValidation.googleLoginValidationSchema),
  authController.googleLogin
);


router.post(
  '/verify-email',
  validateRequest(authValidation.verifyEmailValidationSchema),
  authController.verifyEmail
);
router.post(
  '/forgot-password',
  validateRequest(authValidation.forgotPasswordValidationSchema),
  authController.forgotPassword
);
router.post(
  '/reset-password',
  validateRequest(authValidation.resetPasswordValidationSchema),
  authController.resetPassword
);

export const authRoutes = router;