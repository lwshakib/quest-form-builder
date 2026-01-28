import { generateObject, UIMessage, convertToModelMessages } from "ai";
import { GeminiModel } from "./model";
import { z } from "zod";

export const generateObjectFromAI = async (
  prompt: string,
  objectSchema: z.ZodSchema
) => {
  const response = await generateObject({
    model: GeminiModel(),
    schema: objectSchema,
    prompt,
  });
  return response.object;
};
