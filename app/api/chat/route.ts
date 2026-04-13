/**
 * API Route: /api/chat
 *
 * This is the main orchestration layer for the AI-powered quest builder.
 * It uses a custom GLM-4.7-Flash orchestrator to stream responses and provides
 * server-side tools that the AI can call to manipulate the database in real-time.
 */

import { getQuestById, getUserCredits, decrementUserCredits } from "@/lib/actions";
import { aiService } from "@/services/ai.services";
import { BUILDER_SYSTEM_PROMPT } from "@/lib/prompts";
import { TOOLS_REGISTRY } from "@/lib/tools";

// Allow the edge function to run for up to 30 seconds to accommodate image generation and multiple tool calls.
export const maxDuration = 30;

/**
 * Handles incoming chat messages from the builder UI.
 * Orchestrates tools and streams the GLM model's response back to the client.
 */
export async function POST(req: Request) {
  // Extract user messages array and the targeted questId from the incoming JSON body.
  const { messages, questId } = await req.json();

  // Retrieve the current credit balance for the authenticated user.
  const credits = await getUserCredits();

  // If the user has 0 or fewer credits, reject the request early with a 403 Forbidden status.
  if (credits <= 0) {
    return new Response(JSON.stringify({ error: "Credits exhausted, wait for daily reset" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Deduct 1 credit from the user's account for this AI request.
  await decrementUserCredits();

  // Fetch the current state of the quest from the database to provide as a 'Ground Truth' context for the AI.
  const currentQuest = await getQuestById(questId);

  // Prepare a dynamic, text-based representation of the quest's current state.
  // This helps the AI understand what the form looks like right now so it can answer contextually.
  const questContext = `
### CURRENT QUEST CONTEXT
Title: ${currentQuest?.title || "Untitled Quest"}
Description: ${currentQuest?.description || "None"}
Background Image: ${currentQuest?.backgroundImageUrl || "None"}
Current Questions: ${JSON.stringify(currentQuest?.questions || [], null, 2)}
  `.trim();

  // Dynamically generate the documentation for the tools the AI is allowed to call.
  // We use the pre-defined JSON schemas in the TOOLS_REGISTRY to provide structured documentation for the AI.
  const toolsContext = `
### AVAILABLE TOOLS
Here is the list of tools you can use, along with their input schemas and expected outputs:
${Object.entries(TOOLS_REGISTRY)
  .map(
    ([name, config]) => `
- **Name**: \`${name}\`
  - **Description**: ${config.description}
  - **Input Schema**: ${
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jsonStringify(config.parameters as any)
  }
  - **Expected Output**: A string describing the result of the operation (e.g. Success or Error).
`,
  )
  .join("\n")}
  `.trim();

  // Construct the full conversation history to send to the language model.
  // This array combines hardcoded system guidelines, tool contexts, the current quest state, and the user's prompts.
  const history = [
    { role: "system", content: BUILDER_SYSTEM_PROMPT }, // Persona and operating boundary rules
    { role: "system", content: toolsContext }, // Details about tools the AI can use
    { role: "system", content: questContext }, // The live snapshot of the user's quest
    ...messages, // The back-and-forth chat history from the interface
  ];

  let stream;
  try {
    // Initialize the streaming process using our custom GLM orchestrator, passing the compiled history, questId, and TOOLS_REGISTRY.
    stream = await aiService.streamText(history, questId, TOOLS_REGISTRY);
  } catch (err) {
    console.error("[FairCredit] Stream initialization failed, refunding credit:", err);
    await import("@/lib/actions").then((m) => m.refundUserCredit());
    return new Response(JSON.stringify({ error: "Failed to initialize AI stream" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let hasProducedValue = false;
  const decoder = new TextDecoder();

  // Create a TransformStream to monitor the content passing through
  const monitoringStream = new TransformStream({
    async transform(chunk, controller) {
      const text = decoder.decode(chunk, { stream: true });
      // Check if this chunk contains any meaningful output data
      if (text.includes('"content"') || text.includes('"reasoning"') || text.includes('"result"')) {
        hasProducedValue = true;
      }
      controller.enqueue(chunk);
    },
    async flush() {
      // If the stream finished without producing any value, refund the credit
      if (!hasProducedValue) {
        console.log("[FairCredit] Refund triggered: No productive output detected.");
        await import("@/lib/actions").then((m) => m.refundUserCredit());
      }
    },
  });

  // Return the monitored stream directly to the client interface
  return new Response(stream.pipeThrough(monitoringStream), {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

/**
 * Utility function to safely stringify objects for inclusion in the system prompt.
 * If stringification fails (e.g. Circular logic), it defaults to an empty array string.
 */
function jsonStringify(obj: unknown) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "[]";
  }
}
