import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Initialize S3 Client for Cloudflare R2 / AWS S3.
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "auto",
  endpoint: process.env.AWS_ENDPOINT!,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;

/**
 * Generates a presigned URL for uploading a file via PUT request.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600,
) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generates a signed URL for reading a private file.
 */
export async function getSignedUrlForS3Key(key: string, expiresIn: number = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Uploads a file buffer directly to S3 from the server.
 */
export async function uploadFile(buffer: Buffer, key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return key; // Return the key (path) for database storage
}

/**
 * Deletes a file from the S3 bucket.
 */
export async function deleteFile(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Compatibility export for existing code that uses the s3Service instance.
 */
export const s3Service = {
  getPresignedUploadUrl,
  getSignedReadUrl: getSignedUrlForS3Key,
  uploadFile,
  deleteFile,
};
