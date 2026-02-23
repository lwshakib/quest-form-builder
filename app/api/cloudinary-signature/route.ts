import { cloudinaryClient } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "infera-notebook";
    const signature = cloudinaryClient.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET!,
    );
    return NextResponse.json({
      signature,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
      timestamp,
      folder,
      apiKey: process.env.CLOUDINARY_API_KEY!,
    });
  } catch (error) {
    console.error("Error in cloudinary-signature GET:", error);
    return NextResponse.json(
      {
        error:
          process.env.NODE_ENV === "development"
            ? `Internal Server Error: ${error instanceof Error ? error.message : String(error)}`
            : "Internal Server Error",
        ...(process.env.NODE_ENV === "development" &&
          error instanceof Error && { stack: error.stack }),
      },
      { status: 500 },
    );
  }
}
