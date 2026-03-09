/**
 * Custom streaming orchestration for the GLM-4.7-Flash model.
 * This utility handles streaming text, multi-turn tool calling,
 * and maintains conversational state across multiple model turns.
 */

import { TOOLS_REGISTRY, ToolName } from "./tools";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Interface for OpenAI-compatible chat messages used by GLM.
 */
interface GLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | any[] | null;
  reasoning_content?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

/**
 * Formats the tools for the GLM model's 'tools' request parameter.
 * Converts Zod schemas from TOOLS_REGISTRY into JSON Schema.
 */
function getGLMToolSchema() {
  return Object.entries(TOOLS_REGISTRY).map(([name, config]) => ({
    type: "function",
    function: {
      name,
      description: config.description,
      parameters: zodToJsonSchema(config.parameters as any),
    },
  }));
}

/**
 * Main streaming utility for building and manipulating quest items.
 *
 * @param {GLMMessage[]} messages - Persistent history of user and model messages.
 * @param {string} questId - The unique ID of the quest being edited.
 * @param {string} systemPrompt - Instructions defining persona and boundaries.
 * @returns {ReadableStream} A standard browser stream containing SSE events.
 */
export async function streamText(
  messages: GLMMessage[],
  questId: string
) {
  const encoder = new TextEncoder();
  const workerURL = process.env.GLM_WORKER_URL;
  const API_KEY = process.env.CLOUDFLARE_API_KEY;

  if (!workerURL || !API_KEY) {
    throw new Error("Missing GLM_WORKER_URL or CLOUDFLARE_API_KEY in .env");
  }

  return new ReadableStream({
    async start(controller) {
      // 1. We use the messages provided directly as the conversation history
      let conversation: GLMMessage[] = messages;

      const sendChunk = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      /**
       * Sub-routine to perform a recursive model-turn to handle potential tool calls.
       */
      const runTurn = async () => {
        const response = await fetch(workerURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
          },
          body: JSON.stringify({
            messages: conversation,
            stream: true,
            tools: getGLMToolSchema(), // Inject available tools using JSON Schema
            tool_choice: "auto"
          })
        });

        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantMessage: GLMMessage = { role: "assistant", content: "" };
        let currentToolCalls: any[] = [];

        // --- Process Streaming Chunks ---
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ") || line === "data: [DONE]") continue;

            try {
              const data = JSON.parse(line.slice(6));
              const delta = data.choices[0].delta;

              // Handle tool call detection and aggregation
              if (delta.tool_calls) {
                delta.tool_calls.forEach((tc: any) => {
                  const index = tc.index;
                  if (!currentToolCalls[index]) {
                    currentToolCalls[index] = { ...tc.function, id: tc.id };
                  } else {
                    currentToolCalls[index].arguments += tc.function.arguments || "";
                  }
                });
              }

              // Handle text content streaming
              if (delta.content) {
                assistantMessage.content += delta.content;
                sendChunk({ content: delta.content });
              }

              // Handle reasoning/thinking streaming
              if (delta.reasoning_content) {
                assistantMessage.reasoning_content = (assistantMessage.reasoning_content || "") + delta.reasoning_content;
                sendChunk({ reasoning: delta.reasoning_content });
              }
            } catch (jsonErr) {
              console.error("JSON parse error on line:", line, jsonErr);
            }
          }
        }

        // --- Handle Finalized Tool Calls (Recursive Turn) ---
        if (currentToolCalls.length > 0) {
          assistantMessage.tool_calls = currentToolCalls.map(tc => ({
            id: tc.id,
            type: "function",
            function: { name: tc.name, arguments: tc.arguments }
          }));

          conversation.push(assistantMessage);

          // Execute each tool call and provide results back to the model
          for (const tc of currentToolCalls) {
            try {
              // 1. Inform the client that a tool is about to start running
              sendChunk({ toolCall: tc.name });

              const args = JSON.parse(tc.arguments || "{}");
              const toolConfig = TOOLS_REGISTRY[tc.name as ToolName];
              
              const result = toolConfig 
                ? await toolConfig.handler(args, questId) 
                : `Error: Tool ${tc.name} not found.`;

              conversation.push({
                role: "tool",
                tool_call_id: tc.id,
                content: result
              });

              // 2. Inform the client that the tool execution finished with a result
              sendChunk({ toolCall: tc.name, result });
            } catch (err) {
              const errorMessage = `Error executing tool: ${err instanceof Error ? err.message : String(err)}`;
              conversation.push({
                role: "tool",
                tool_call_id: tc.id,
                content: errorMessage
              });
              sendChunk({ toolCall: tc.name, error: errorMessage });
            }
          }

          // Recursively call runTurn to let the model generate a final text response after tool results
          await runTurn();
        }
      };

      try {
        await runTurn();
      } catch (err) {
        sendChunk({ error: `Orchestration error: ${err instanceof Error ? err.message : String(err)}` });
      } finally {
        controller.close();
      }
    }
  });
}
