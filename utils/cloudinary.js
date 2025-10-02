import { v2 as cloudinary } from "cloudinary";
import { configDotenv } from "dotenv";

configDotenv();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload file to Cloudinary from buffer
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise<string>} - Secure URL of uploaded file
 */
export const uploadToCloudinary = async (fileBuffer, folder = "aqualink") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        resource_type: "auto", // Supports PDF, images, etc.
        format: "pdf", // Force PDF format
      },
      (error, result) => {
        if (error) {
          reject(new Error(`Failed to upload file: ${error.message}`));
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete file from Cloudinary
 * @param {string} fileUrl - Cloudinary file URL
 */
export const deleteFromCloudinary = async (fileUrl) => {
  try {
    // Extract public_id from URL
    const parts = fileUrl.split("/");
    const fileName = parts[parts.length - 1];
    const folderPath = parts.slice(-3, -1).join("/");
    const publicId = `${folderPath}/${fileName.split(".")[0]}`;

    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch (error) {
    console.error("Failed to delete file:", error);
  }
};

export default cloudinary;
