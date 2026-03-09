/**
 * Custom streaming orchestration for the GLM-4.7-Flash model.
 * This utility handles streaming text, multi-turn tool calling,
 * and maintains conversational state across multiple model turns.
 */

import { TOOLS_REGISTRY, ToolName } from "./tools";
import { zodToJsonSchema } from "zod-to-json-schema";

/**
 * Interface for OpenAI-compatible tool call.
 */
interface GLMToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Interface for OpenAI-compatible chat messages used by GLM.
 */
interface GLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  reasoning_content?: string;
  tool_call_id?: string;
  tool_calls?: GLMToolCall[];
}

/**
 * Interface for tool call delta in stream.
 */
interface ToolCallDelta {
  index: number;
  id?: string;
  type?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      parameters: zodToJsonSchema(config.parameters as any),
    },
  }));
}

/**
 * Main streaming utility for building and manipulating quest items.
 *
 * @param {GLMMessage[]} messages - Persistent history of user and model messages.
 * @param {string} questId - The unique ID of the quest being edited.
 * @returns {ReadableStream} A standard browser stream containing SSE events.
 */
export async function streamText(messages: GLMMessage[], questId: string) {
  const encoder = new TextEncoder();
  const workerURL = process.env.GLM_WORKER_URL;
  const API_KEY = process.env.CLOUDFLARE_API_KEY;

  if (!workerURL || !API_KEY) {
    throw new Error("Missing GLM_WORKER_URL or CLOUDFLARE_API_KEY in .env");
  }

  // Create a new ReadableStream to push Server-Sent Events (SSE) individually to the client.
  return new ReadableStream({
    async start(controller) {
      // 1. We use the messages provided directly as the initial conversation history.
      const conversation: GLMMessage[] = messages;

      // Helper to enqueue properly formatted SSE data strings to the client buffer.
      const sendChunk = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      /**
       * Sub-routine to perform a recursive model-turn to handle potential tool calls.
       * If the model calls a tool, we execute it, append the result, and recursively call this to get the next response.
       */
      const runTurn = async (): Promise<void> => {
        // Send request to Cloudflare-hosted GLM model API via OpenAI-compatible endpoint.
        const response = await fetch(workerURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify({
            messages: conversation,
            stream: true, // We want chunks as they are generated
            tools: getGLMToolSchema(), // Inject available tools using JSON Schema dynamically
            tool_choice: "auto", // Let the AI decide when to use a tool
          }),
        });

        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        // Track the current message elements from stream
        const assistantMessage: GLMMessage = {
          role: "assistant",
          content: "",
        };
        const currentToolCalls: {
          name: string;
          arguments: string;
          id: string;
        }[] = [];
        let buffer = ""; // Buffer to handle incomplete JSON chunks across stream fragments.

        // --- Process Streaming Chunks ---
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode bytes into string and append to buffer
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Last element might be incomplete, so pop it back into buffer
          buffer = lines.pop() || "";

          // Process complete lines
          for (const line of lines) {
            const cleanLine = line.trim();
            // Ignore keep-alive or final done signals
            if (!cleanLine.startsWith("data: ") || cleanLine === "data: [DONE]") continue;

            try {
              // Parse the JSON payload inside the SSE data property
              const data = JSON.parse(cleanLine.slice(6));

              // Ignore chunks without content delta choices (typically usage metadata frames)
              if (!data.choices || data.choices.length === 0) {
                continue;
              }

              const delta = data.choices[0].delta;

              // Handle tool call detection and aggregation
              // OpenAI schemas chunk tool arguments over time, so we must concatenate `tc.function.arguments`
              if (delta.tool_calls) {
                delta.tool_calls.forEach((tc: ToolCallDelta) => {
                  const index = tc.index;
                  if (!currentToolCalls[index]) {
                    // Initialize a new tool call tracking object
                    currentToolCalls[index] = {
                      name: tc.function?.name || "",
                      arguments: tc.function?.arguments || "",
                      id: tc.id || "",
                    };
                  } else if (tc.function) {
                    // Append subsequent argument chunks
                    currentToolCalls[index].arguments += tc.function.arguments || "";
                  }
                });
              }

              // Handle standard textual content streaming
              if (delta.content) {
                assistantMessage.content = (assistantMessage.content || "") + delta.content;
                sendChunk({ content: delta.content }); // Forward to the frontend client
              }

              // Handle reasoning/thinking processing (if the model provides thoughts prior to content)
              if (delta.reasoning_content) {
                assistantMessage.reasoning_content =
                  (assistantMessage.reasoning_content || "") + delta.reasoning_content;
                sendChunk({ reasoning: delta.reasoning_content }); // Forward thinking to frontend
              }
            } catch (jsonErr) {
              console.error("JSON parse error on line:", cleanLine, jsonErr);
            }
          }
        }

        // --- Handle Finalized Tool Calls (Recursive Turn) ---
        if (currentToolCalls.length > 0) {
          // Format the completely received tool calls into the assistant message object
          assistantMessage.tool_calls = currentToolCalls.map((tc) => ({
            id: tc.id,
            type: "function",
            function: { name: tc.name, arguments: tc.arguments },
          }));

          // Append the model's tool invocations to history
          conversation.push(assistantMessage);

          // Execute each tool call and provide results back to the model
          for (const tc of currentToolCalls) {
            try {
              // 1. Inform the frontend client that a tool is about to start running (shows loading UI)
              sendChunk({ toolCall: tc.name });

              // Parse compiled JSON arguments dynamically
              const args = JSON.parse(tc.arguments || "{}");
              const toolConfig = TOOLS_REGISTRY[tc.name as ToolName];

              // Run the tool server-side using the predefined config mapping
              const result = toolConfig
                ? await toolConfig.handler(args, questId)
                : `Error: Tool ${tc.name} not found.`;

              // Report the output of the tool back into the conversation history
              conversation.push({
                role: "tool",
                tool_call_id: tc.id,
                content: result,
              });

              // 2. Inform the frontend client that the tool execution finished with a specific result string
              sendChunk({ toolCall: tc.name, result });
            } catch (err) {
              const errorMessage = `Error executing tool: ${
                err instanceof Error ? err.message : String(err)
              }`;

              // Log error directly to the model so it can try to correct its mistakes
              conversation.push({
                role: "tool",
                tool_call_id: tc.id,
                content: errorMessage,
              });

              // Notify frontend about error
              sendChunk({ toolCall: tc.name, error: errorMessage });
            }
          }

          // Recursively call runTurn to let the model evaluate the tools outputs and generate a final text response.
          await runTurn();
        }
      };

      try {
        // Initiate the first LLM generation turn
        await runTurn();
      } catch (err) {
        // Catch network or major system failures and forward to the client
        sendChunk({
          error: `Orchestration error: ${err instanceof Error ? err.message : String(err)}`,
        });
      } finally {
        // Close the streaming channel when done recursively generating content and tools
        controller.close();
      }
    },
  });
}
