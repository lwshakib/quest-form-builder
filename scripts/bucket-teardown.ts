import {
  S3Client,
  DeleteBucketCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { config } from "dotenv";

// Load environment variables from .env
config();

const bucketName = process.env.AWS_S3_BUCKET_NAME;
const endpoint = process.env.AWS_ENDPOINT;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION || "auto";

if (!bucketName || !endpoint || !accessKeyId || !secretAccessKey) {
  console.error("Missing required S3 environment variables in .env");
  process.exit(1);
}

const s3Client = new S3Client({
  region,
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function teardown() {
  console.log(`Starting teardown for bucket: ${bucketName}...`);

  try {
    // 1. List all objects
    console.log("Listing objects to delete...");
    const listCommand = new ListObjectsV2Command({ Bucket: bucketName });
    const { Contents } = await s3Client.send(listCommand);

    if (Contents && Contents.length > 0) {
      // 2. Delete all objects
      console.log(`Deleting ${Contents.length} object(s)...`);
      const deleteObjectsCommand = new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: Contents.map((obj) => ({ Key: obj.Key })),
        },
      });
      await s3Client.send(deleteObjectsCommand);
      console.log("Objects deleted.");
    } else {
      console.log("Bucket is already empty.");
    }

    // 3. Delete bucket
    console.log(`Deleting bucket "${bucketName}"...`);
    await s3Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
    console.log(`Bucket "${bucketName}" deleted successfully.`);
    console.log("S3 teardown complete.");
  } catch (error: any) {
    if (error.name === "NoSuchBucket") {
      console.log(`Bucket "${bucketName}" does not exist.`);
    } else {
      console.error("Error during S3 teardown:", error);
      process.exit(1);
    }
  }
}

teardown();
