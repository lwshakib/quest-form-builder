import { client } from "./client";
import { IMAGE_GENERATION_MODEL_ID } from "./constants";
import * as s3 from "@/lib/s3";
import { nanoid } from "nanoid";

/**
 * Options for generating an image.
 */
export interface GenerateImageOptions {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  guidance?: number;
}

/**
 * The result of an image generation operation.
 */
export interface GenerateImageResult {
  success: boolean;
  image?: string;
  publicId?: string;
  prompt: string;
  width?: number;
  height?: number;
  model: string;
  error?: string;
}

/**
 * Generates an image using Gemini 3.1 Flash (Nano Banana 2).
 */
export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
  const {
    prompt,
    width = 1024,
    height = 1024,
    // Note: Gemini 3.1 Flash doesn't necessarily use these exact parameters like Flux
    // but we can pass them in the config if supported or just focus on the prompt.
  } = options;

  try {
    console.log(`[LLM] Generating image with Gemini: ${IMAGE_GENERATION_MODEL_ID}`);

    // As per ai-text.md, we generate image by requesting it in contents
    const response = await client.models.generateContent({
      model: IMAGE_GENERATION_MODEL_ID,
      contents: [{ text: prompt }],
      config: {
        // Based on ai-text.md, we can specify responseModalities
        responseModalities: ["IMAGE"],
      },
    });

    if (!response.candidates?.[0]?.content?.parts) {
      throw new Error("No image generated in the response");
    }

    let imageBuffer: Buffer | null = null;

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64Data = part.inlineData.data;
        imageBuffer = Buffer.from(base64Data as string, "base64");
        break;
      }
    }

    if (!imageBuffer) {
      throw new Error("Could not find image data in the response parts");
    }

    const imageKey = `generated/${nanoid()}.png`;
    const uploadedKey = await s3.uploadFile(imageBuffer, imageKey, "image/png");

    return {
      success: true,
      image: uploadedKey,
      prompt,
      width,
      height,
      model: IMAGE_GENERATION_MODEL_ID,
    };
  } catch (error) {
    console.error("[LLM_GENERATE_IMAGE_EXCEPTION]", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during image generation",
      prompt,
      model: IMAGE_GENERATION_MODEL_ID,
    };
  }
}
