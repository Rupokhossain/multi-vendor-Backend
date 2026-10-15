// src/app/modules/upload/upload.controller.ts
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { catchAsync } from '../../utils/catchAsync';
import { AppError } from '../../utils/AppError';
import { uploadToCloudinary } from '../../lib/cloudinary';
import sendResponse from '../../utils/sendResponse';


const uploadSingleImage = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please select an image file to upload!');
  }

  const result = await uploadToCloudinary(req.file, 'nexus-market/products');

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Image uploaded successfully to Cloudinary!',
    data: {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
    },
  });
});

const uploadMultipleImages = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please select at least one image!');
  }

  const uploadPromises = files.map((file) =>
    uploadToCloudinary(file, 'nexus-market/gallery')
  );

  const results = await Promise.all(uploadPromises);

  const uploadedData = results.map((result) => ({
    url: result.secure_url,
    publicId: result.public_id,
  }));

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: `${uploadedData.length} images uploaded successfully!`,
    data: uploadedData,
  });
});

export const uploadController = {
  uploadSingleImage,
  uploadMultipleImages,
};