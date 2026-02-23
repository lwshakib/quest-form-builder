/**
 * This utility function facilitates generating structured objects from the AI model.
 * It uses the 'ai' package's generateObject function along with a Zod schema
 * to ensure the output adheres to a specific format.
 */

import { generateObject } from "ai";
import { GeminiModel } from "./model";
import { z } from "zod";

/**
 * Generates a structured object from the AI model based on a provided prompt and schema.
 *
 * @param {string} prompt - The natural language instruction for the AI.
 * @param {z.ZodSchema} objectSchema - The Zod schema that defines the structure of the expected object.
 * @returns {Promise<any>} A promise that resolves to the generated object, validated against the schema.
 */
export const generateObjectFromAI = async (prompt: string, objectSchema: z.ZodSchema) => {
  // Call the structured generation utility from the 'ai' library
  const response = await generateObject({
    model: GeminiModel(), // Use our configured Gemini model
    schema: objectSchema, // Enplace the expected output structure
    prompt, // Pass the user instruction
  });

  // Return the validated object from the response
  return response.object;
};
