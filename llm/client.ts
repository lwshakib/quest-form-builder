import { GoogleGenAI } from "@google/genai";

/**
 * Initialize and export the Google GenAI client.
 * Uses the GOOGLE_API_KEY from environment variables.
 */
export const client = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});
