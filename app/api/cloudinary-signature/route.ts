/**
 * API Route: /api/cloudinary-signature
 *
 * Provides a secure, signed signature for client-side file uploads to Cloudinary.
 * This approach allows us to perform direct uploads from the browser without
 * exposing our API Secret on the frontend.
 */

import { cloudinaryClient } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

/**
 * Handles GET requests to generate a new Cloudinary upload signature.
 *
 * @returns {NextResponse} JSON containing the signature, timestamp, and API config.
 */
export async function GET() {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    // Organizational folder in Cloudinary where files will be stored.
    const folder = "quest-form-builder";

    // Generate the SHA-1 signature using the secret key (server-side only).
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

    // Return detailed error in development, generic one in production.
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
