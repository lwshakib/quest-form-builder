/**
 * This module configures and exports the Cloudinary SDK for server-side usage.
 * It uses environment variables for secure authentication.
 */

import { v2 as cloudinary } from "cloudinary";
import * as env from "@/lib/env";

// Configure the Cloudinary instance with credentials from environmental variables.
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true, // Force HTTPS for all Cloudinary interactions
});

/**
 * The initialized Cloudinary client used for server-side operations
 * like generating signatures, deleting files, or applying transformations.
 */
export const cloudinaryClient = cloudinary;

/**
 * Persists an image buffer to Cloudinary.
 *
 * @param buffer - The binary image data.
 * @returns Object with the uploaded URL and public ID.
 */
export const saveImageToCloudinary = async (
  buffer: Buffer,
): Promise<{ url: string; publicId: string }> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "quest-backgrounds",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            console.error("[CLOUDINARY_UPLOAD_ERROR]", error);
            reject(error);
          } else if (result) {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          } else {
            reject(new Error("Cloudinary upload failed without error message"));
          }
        },
      )
      .end(buffer);
  });
};
