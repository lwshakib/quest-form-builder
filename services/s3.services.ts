import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Service for interacting with Cloudflare R2 (S3-compatible) storage.
 * Handles presigned URLs for client-side uploads and signed URLs for private reads.
 */
class S3Service {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET_NAME!;

    this.client = new S3Client({
      region: process.env.AWS_REGION || "auto",
      endpoint: process.env.AWS_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  /**
   * Generates a presigned URL for uploading a file via PUT request.
   * Useful for client-side uploads to avoid routing large files through the server.
   *
   * @param key - The unique path/name of the file in the bucket.
   * @param contentType - The MIME type of the file.
   * @param expiresIn - Expiration time in seconds (default 3600).
   */
  async getPresignedUploadUrl(key: string, contentType: string, expiresIn: number = 3600) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Generates a signed URL for reading a file from the bucket.
   * Required for accessing objects in a private bucket.
   *
   * @param key - The unique path/name of the file in the bucket.
   * @param expiresIn - Expiration time in seconds (default 3600).
   */
  async getSignedReadUrl(key: string, expiresIn: number = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  /**
   * Uploads a file buffer directly from the server.
   * Useful for background tasks like generating and saving AI images.
   *
   * @param buffer - The file content.
   * @param key - The unique path/name of the file.
   * @param contentType - The MIME type of the file.
   */
  async uploadFile(buffer: Buffer, key: string, contentType: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.client.send(command);
    return key; // Return the path (key) as requested
  }

  /**
   * Deletes a file from the bucket.
   *
   * @param key - The unique path/name of the file.
   */
  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }
}

export const s3Service = new S3Service();
