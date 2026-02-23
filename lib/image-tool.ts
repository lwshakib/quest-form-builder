/**
 * This module defines an AI-powered image generation tool for use within the Quest builder.
 * It leverages the 'ai' library's tool system to provide a high-level interface
 * for creating professional visuals via the Nebius AI API (Flux Schnell model).
 */

import { tool } from "ai";
import { z } from "zod";
import { v2 as cloudinary } from "cloudinary";
import { NEBIUS_API_KEY } from "@/lib/env";

// Configure Cloudinary server-side SDK using standard environment variables.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * The 'generateImage' tool.
 * Can be invoked by AI agents or directly in code to create custom imagery.
 */
export const generateImageTool = tool({
  description:
    "Generate high-quality, professional images using AI. Use this to create cinematic visuals, illustrations, and background photos for the quest/form. The tool produces fast, high-end content tailored to your specific design prompts.",

  // Define the expected input structure using Zod for validation and type safety.
  inputSchema: z.object({
    prompt: z
      .string()
      .describe(
        "Detailed description of the image to generate. Be specific about style, composition, colors, subject, mood, and any other relevant details.",
      ),
    width: z
      .number()
      .int()
      .min(256)
      .max(1440)
      .default(1024)
      .describe("Width of the image in pixels"),
    height: z
      .number()
      .int()
      .min(256)
      .max(1440)
      .default(1024)
      .describe("Height of the image in pixels"),
  }),

  /**
   * The logic executed when the tool is called.
   * Connects to Nebius AI, generates the image, and uploads it to Cloudinary.
   */
  execute: async ({ prompt, width = 1024, height = 1024 }) => {
    console.log(`[GENERATOR] Running Image Tool for prompt: "${prompt}"`);

    // Safety check for API keys
    if (!NEBIUS_API_KEY) {
      return { success: false, error: "Missing NEBIUS_API_KEY" };
    }

    try {
      // Step 1: Call Nebius AI's image generation endpoint.
      // We use the 'flux-schnell' model for high-speed, high-quality output.
      const response = await fetch("https://api.tokenfactory.nebius.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${NEBIUS_API_KEY}`,
        },
        body: JSON.stringify({
          model: "black-forest-labs/flux-schnell",
          response_format: "b64_json",
          response_extension: "png",
          width,
          height,
          num_inference_steps: 4, // 'Schnell' models require very few steps
          seed: -1,
          loras: null,
          prompt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.statusText}`);
      }

      const data = await response.json();
      const base64Image = data.data?.[0]?.b64_json;

      if (!base64Image) {
        throw new Error("No image generated in response");
      }

      // Step 2: Persist the generated image.
      // Since Nebius returns a ephemeral base64 string, we upload it to Cloudinary
      // for permanent hosting and CDN delivery.
      const imageBuffer = Buffer.from(base64Image, "base64");
      const uploadResult = await new Promise<{
        secure_url: string;
        public_id: string;
      }>((resolve, reject) => {
        // Use Cloudinary's streaming upload to handle the buffer efficiently
        cloudinary.uploader
          .upload_stream(
            {
              folder: "quest-backgrounds",
              resource_type: "image",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else if (result) {
                resolve({
                  secure_url: result.secure_url,
                  public_id: result.public_id,
                });
              } else {
                reject(new Error("Upload returned no result"));
              }
            },
          )
          .end(imageBuffer);
      });

      // Step 3: Return the final metadata to the caller
      return {
        success: true,
        secure_url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        prompt,
        width,
        height,
        model: "black-forest-labs/flux-schnell",
      };
    } catch (error) {
      console.error("Image generation error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        prompt,
      };
    }
  },
});
