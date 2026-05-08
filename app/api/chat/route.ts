/**
 * API Route: /api/chat
 *
 * This is the main orchestration layer for the AI-powered quest builder.
 * It uses a custom AI orchestrator to stream responses and provides
 * server-side tools that the AI can call to manipulate the database in real-time.
 */

import { getQuestById, getUserCredits, decrementUserCredits } from "@/lib/actions";
import { streamText } from "@/llm/stream-text";
import { TOOLS_REGISTRY } from "@/lib/tools";
import { BUILDER_SYSTEM_PROMPT } from "@/llm/prompts";
import type { QuestMessage } from "@/llm/types";

// Allow the edge function to run for up to 30 seconds to accommodate image generation and multiple tool calls.
export const maxDuration = 30;

/**
 * Handles incoming chat messages from the builder UI.
 * Orchestrates tools and streams the AI model's response back to the client.
 */
export async function POST(req: Request) {
  try {
    // Extract user messages array and the targeted questId from the incoming JSON body.
    const { messages, questId } = (await req.json()) as {
      messages: QuestMessage[];
      questId: string;
    };

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
    const questContext = `
### CURRENT QUEST CONTEXT
Title: ${currentQuest?.title || "Untitled Quest"}
Description: ${currentQuest?.description || "None"}
Background Image: ${currentQuest?.backgroundImageUrl || "None"}
Current Questions: ${JSON.stringify(currentQuest?.questions || [], null, 2)}
  `.trim();

    // Dynamically generate the documentation for the tools the AI is allowed to call.
    const toolsContext = `
### AVAILABLE TOOLS
Here is the list of tools you can use, along with their input schemas and expected outputs:
${Object.entries(TOOLS_REGISTRY)
  .map(
    ([name, config]) => `
- **Name**: \`${name}\`
  - **Description**: ${config.description}
  - **Input Schema**: ${jsonStringify(config.parameters)}
  - **Expected Output**: A string describing the result of the operation.
`,
  )
  .join("\n")}
  `.trim();

    // Construct the full conversation history to send to the language model.
    const history: QuestMessage[] = [
      { role: "system", content: BUILDER_SYSTEM_PROMPT },
      { role: "system", content: toolsContext },
      { role: "system", content: questContext },
      ...messages,
    ];

    // Initialize the streaming process using our custom AI orchestrator.
    const stream = await streamText(history, questId, TOOLS_REGISTRY);

    let hasProducedValue = false;
    const decoder = new TextDecoder();

    // Create a TransformStream to monitor the content passing through for fair credit usage.
    const monitoringStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true });
        if (
          text.includes('"content"') ||
          text.includes('"reasoning"') ||
          text.includes('"result"')
        ) {
          hasProducedValue = true;
        }
        controller.enqueue(chunk);
      },
      async flush() {
        if (!hasProducedValue) {
          console.log("[FairCredit] Refund triggered: No productive output detected.");
          await import("@/lib/actions").then((m) => m.refundUserCredit());
        }
      },
    });

    return new Response(stream.pipeThrough(monitoringStream), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[FairCredit] Stream initialization failed, refunding credit:", err);
    await import("@/lib/actions").then((m) => m.refundUserCredit());
    return new Response(JSON.stringify({ error: "Failed to initialize AI stream" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * Utility function to safely stringify objects for inclusion in the system prompt.
 */
function jsonStringify(obj: unknown) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "[]";
  }
}
