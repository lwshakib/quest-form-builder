/**
 * API Route: /api/chat
 *
 * This is the main orchestration layer for the AI-powered quest builder.
 * It uses a custom GLM-4.7-Flash orchestrator to stream responses and provides 
 * server-side tools that the AI can call to manipulate the database in real-time.
 */

import { z } from "zod";
import { getQuestById } from "@/lib/actions";
import { streamText } from "@/llm/streamText";
import { BUILDER_SYSTEM_PROMPT } from "@/llm/prompts";

// Allow the edge function to run for up to 30 seconds to accommodate image generation and multiple tool calls.
export const maxDuration = 30;

/**
 * Handles incoming chat messages from the builder UI.
 * Orchestrates tools and streams the GLM model's response back to the client.
 */
export async function POST(req: Request) {
  const { messages, questId } = await req.json();

  // Fetch the current state of the quest to provide as a 'Ground Truth' context for the AI.
  const currentQuest = await getQuestById(questId);

  // Prepare the dynamic context for the quest
  const questContext = `
### CURRENT QUEST CONTEXT
Title: ${currentQuest?.title || "Untitled Quest"}
Description: ${currentQuest?.description || "None"}
Background Image: ${currentQuest?.backgroundImageUrl || "None"}
Current Questions: ${JSON.stringify(currentQuest?.questions || [], null, 2)}
  `.trim();

  // Construct the full conversation history
  const history = [
    { role: "system", content: BUILDER_SYSTEM_PROMPT },
    { role: "system", content: questContext },
    ...messages
  ];

  // Initialize the streaming process using our custom GLM orchestrator
  const stream = await streamText(history, questId);

  // Return the stream directly to the client
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}


/**
 * Utility to safely stringify objects for inclusion in the system prompt.
 */
function jsonStringify(obj: unknown) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "[]";
  }
}
