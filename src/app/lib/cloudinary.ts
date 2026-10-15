import httpStatus from "http-status";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import config from "../config";
import { AppError } from "../utils/AppError";
import { Readable } from "stream";
import 'multer'

cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});
export const uploadToCloudinary = (
  file: Express.Multer.File,
  folderName: string = "nexus-market",
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderName,
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            new AppError(
              httpStatus.BAD_REQUEST,
              `Cloudinary upload failed: ${error?.message || "Unknown error"}`,
            ),
          );
        }
        resolve(result);
      },
    );
    // Native Node stream এর মাধ্যমে বাফার স্ট্রিম পাস করা
    const readableStream = Readable.from(file.buffer);
    readableStream.pipe(uploadStream);
  });
};
export default cloudinary;
