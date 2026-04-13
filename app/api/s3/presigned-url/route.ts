import { NextResponse } from "next/server";
import { s3Service } from "@/services/s3.services";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

/**
 * POST /api/s3/presigned-url
 * Generates a presigned URL for client-side upload.
 *
 * Body: { contentType: string, folder?: string }
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { contentType, folder = "uploads" } = await req.json();

    if (!contentType) {
      return NextResponse.json({ error: "contentType is required" }, { status: 400 });
    }

    // Generate a unique key for the file to prevent collisions
    const fileId = nanoid();
    const extension = contentType.split("/")[1] || "bin";
    const key = `${folder}/${fileId}.${extension}`;

    const url = await s3Service.getPresignedUploadUrl(key, contentType);

    return NextResponse.json({ url, key });
  } catch (error) {
    console.error("[S3_PRESIGNED_URL_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate presigned URL" }, { status: 500 });
  }
}
