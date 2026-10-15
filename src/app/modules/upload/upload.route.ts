// src/app/modules/upload/upload.route.ts
import { Router } from 'express';
import { auth } from '../../middlewares/checkAuth';
import { Role } from '../../../generated/prisma/enums';
import { fileUpload } from '../../middlewares/fileUpload';
import { uploadController } from './upload.controller';

const router = Router();

// সিঙ্গেল ইমেজ আপলোড (কাস্টমার, ভেন্ডার, অ্যাডমিন সবাই অ্যাক্সেস করতে পারবে)
router.post(
  '/image',
  auth(Role.CUSTOMER, Role.VENDOR, Role.STAFF, Role.SUPER_ADMIN),
  fileUpload.single('image'),
  uploadController.uploadSingleImage
);

// মাল্টিপল ইমেজ আপলোড (সর্বোচ্চ ১০টি ছবি একসাথে)
router.post(
  '/images',
  auth(Role.VENDOR, Role.STAFF, Role.SUPER_ADMIN),
  fileUpload.array('images', 10),
  uploadController.uploadMultipleImages
);

export const uploadRoutes = router;