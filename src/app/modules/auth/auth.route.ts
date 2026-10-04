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

export const authRoutes = router;