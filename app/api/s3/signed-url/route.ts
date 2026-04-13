import { NextResponse } from "next/server";
import { s3Service } from "@/services/s3.services";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * GET /api/s3/signed-url?key=...
 * Generates a signed URL for reading a private file from S3.
 *
 * Query: ?key=string
 */
export async function GET(req: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json({ error: "key is required" }, { status: 400 });
    }

    const url = await s3Service.getSignedReadUrl(key);

    return NextResponse.json({ url });
  } catch (error) {
    console.error("[S3_SIGNED_URL_ERROR]", error);
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
  }
}
