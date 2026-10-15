// src/app/middlewares/fileUpload.ts
import multer from 'multer';
import httpStatus from 'http-status';
import { AppError } from '../utils/AppError';

const storage = multer.memoryStorage();

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // শুধুমাত্র ইমেজ ফরম্যাট অনুমোদন
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        httpStatus.BAD_REQUEST,
        'Only image files (jpeg, jpg, png, webp) are allowed!'
      )
    );
  }
};

export const fileUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // সর্বোচ্চ 5MB সাইজ
  },
  fileFilter,
});