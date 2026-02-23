/**
 * This module manages the configuration and instantiation of Google Gemini models.
 * It includes logic for API key rotation and random model selection to balance load
 * and potentially use different capabilities within the Gemini family.
 */

import { GOOGLE_API_KEY } from "@/lib/env";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Retrieves a single API key from a comma-separated list of keys provided in environment variables.
 * This implements a basic round-robin or random distribution strategy for API keys to avoid rate limits.
 * @returns {string} A randomly selected API key.
 */
export const getSingleApiKey = () => {
  if (!GOOGLE_API_KEY) return "";
  const keys = GOOGLE_API_KEY.split(",");
  return keys[Math.floor(Math.random() * keys.length)];
};

/**
 * Returns a randomly selected model name from a predefined list of supported Gemini models.
 * @returns {string} The name of the selected model.
 */
export const getModelName = () => {
  const allowedModels = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];
  return allowedModels[Math.floor(Math.random() * allowedModels.length)];
};

/**
 * Creates and returns a configured instance of a Gemini model using the AI SDK.
 * It dynamically selects an API key and a model version each time it's called.
 * @returns {ReturnType<ReturnType<typeof createGoogleGenerativeAI>>} The initialized model instance.
 */
export const GeminiModel = () => {
  // Initialize the Google Generative AI provider with a randomly selected API key
  const gemini = createGoogleGenerativeAI({
    apiKey: getSingleApiKey(),
  });

  // Return the model instance for the randomly selected model name
  return gemini(getModelName());
};
