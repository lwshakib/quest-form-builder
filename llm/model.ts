import { GOOGLE_API_KEY } from "@/lib/env";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const getSingleApiKey = () => {
  return GOOGLE_API_KEY?.split(",")[
    Math.floor(Math.random() * GOOGLE_API_KEY.split(",").length)
  ];
};

export const getModelName = () => {
  const allowedModels = ["gemini-2.5-flash-lite"];
  return allowedModels[Math.floor(Math.random() * allowedModels.length)];
};


export const GeminiModel = () => {
  const gemini = createGoogleGenerativeAI({
    apiKey: getSingleApiKey(),
  });

  return gemini(getModelName());
};