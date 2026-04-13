import {
  S3Client,
  CreateBucketCommand,
  PutBucketCorsCommand,
  HeadBucketCommand,
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

async function setup() {
  console.log(`Setting up bucket: ${bucketName}...`);

  try {
    // 1. Check if bucket exists
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
      console.log(`Bucket "${bucketName}" already exists.`);
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        // 2. Create bucket
        console.log(`Creating bucket "${bucketName}"...`);
        await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`Bucket "${bucketName}" created successfully.`);
      } else {
        throw error;
      }
    }

    // 3. Configure CORS
    console.log("Configuring CORS...");
    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedHeaders: ["*"],
              AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
              AllowedOrigins: ["*"],
              ExposeHeaders: ["ETag"],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      }),
    );
    console.log("CORS configuration applied.");
    console.log("S3 setup complete.");
  } catch (error) {
    console.error("Error during S3 setup:", error);
    process.exit(1);
  }
}

setup();
