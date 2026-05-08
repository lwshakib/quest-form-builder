import { client } from "./client";
import { CHAT_MODEL_ID } from "./constants";
import type { GLMMessage, ToolRegistry } from "./types";
import type { Content, Part } from "@google/genai";

/**
 * Transforms the generic GLMMessage structure into Google GenAI's content format.
 * Gemini 3 expects tool results to be part of a 'user' role turn containing functionResponse parts.
 */
function transformMessages(messages: GLMMessage[]): Content[] {
  return messages
    .filter((msg) => msg.role !== "system")
    .map((msg) => {
      const parts: Part[] = [];

      if (msg.content) {
        parts.push({ text: msg.content });
      }

      if (msg.reasoning_content) {
        parts.push({ text: msg.reasoning_content });
      }

      if (msg.tool_calls) {
        msg.tool_calls.forEach((tc) => {
          if (tc.function?.name) {
            parts.push({
              functionCall: {
                name: tc.function.name,
                args: JSON.parse(tc.function.arguments || "{}"),
              },
            });
          }
        });
      }

      if (msg.role === "tool") {
        parts.push({
          functionResponse: {
            name: msg.tool_call_id || "unknown",
            response: { result: msg.content || "Success" },
          },
        });
      }

      // Gemini requires at least one part per message.
      if (parts.length === 0) {
        parts.push({ text: " " });
      }

      return {
        role: msg.role === "assistant" ? "model" : "user",
        parts,
      };
    });
}

/**
 * Streams text from Gemini 3.1 Flash with recursive tool calling support.
 */
export async function streamText(
  messages: GLMMessage[],
  questId: string,
  toolsRegistry: ToolRegistry,
) {
  const encoder = new TextEncoder();

  // Extract system instructions from all system role messages
  const systemInstruction = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");

  // Prepare non-system messages
  const nonSystemMessages = messages.filter((m) => m.role !== "system");

  // Transform all but the last message for history
  const history = transformMessages(nonSystemMessages.slice(0, -1));

  // The last message turn (could be text or tool result)
  const lastTurn = transformMessages([nonSystemMessages[nonSystemMessages.length - 1]])[0];
  const lastParts = lastTurn?.parts || [{ text: " " }];

  // Prepare tools for Gemini
  const googleTools = [
    {
      functionDeclarations: Object.entries(toolsRegistry).map(([name, tool]) => ({
        name,
        description: tool.description,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        parameters: tool.parameters as any,
      })),
    },
  ];

  return new ReadableStream({
    start: async (controller) => {
      const sendChunk = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const chat = client.chats.create({
          model: CHAT_MODEL_ID,
          config: {
            systemInstruction,
            tools: googleTools,
          },
          history: history,
        });

        /**
         * Recursive function to handle model turns, including tool calls.
         */
        const runTurn = async (parts: Part[]) => {
          // Ensure parts is not empty
          if (!parts || parts.length === 0) {
            console.warn("[STREAM_TEXT] Empty parts in turn, skipping.");
            return;
          }

          console.log(
            "[STREAM_TEXT] Starting turn with parts:",
            JSON.stringify(parts).slice(0, 200),
          );
          const result = await chat.sendMessageStream({ message: parts });
          let hasToolCalls = false;
          const toolCalls: Part[] = [];

          for await (const chunk of result) {
            if (!chunk.candidates?.[0]?.content?.parts) continue;

            for (const part of chunk.candidates[0].content.parts) {
              if (part.text) {
                sendChunk({ content: part.text });
              }
              if (part.thought) {
                sendChunk({ reasoning: part.text });
              }
              if (part.functionCall) {
                hasToolCalls = true;
                toolCalls.push(part as Part);
                console.log(`[STREAM_TEXT] Model requested tool: ${part.functionCall.name}`);
                sendChunk({ toolCall: part.functionCall.name });
              }
            }
          }

          if (hasToolCalls) {
            const functionResponses = await Promise.all(
              toolCalls.map(async (tcPart) => {
                const tc = tcPart.functionCall!;
                if (!tc.name) {
                  console.error("[STREAM_TEXT] Tool name missing in functionCall");
                  return {
                    functionResponse: {
                      name: "unknown",
                      response: { error: "Tool name missing" },
                    },
                  };
                }
                try {
                  console.log(`[STREAM_TEXT] Executing tool: ${tc.name}`, tc.args);
                  const tool = toolsRegistry[tc.name];
                  if (tool) {
                    const toolResult = await tool.handler(
                      tc.args as Record<string, unknown>,
                      questId,
                    );
                    const resultString =
                      typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult);
                    sendChunk({ toolCall: tc.name, result: resultString });
                    return {
                      functionResponse: {
                        name: tc.name,
                        response: { result: resultString },
                      },
                    };
                  }
                  throw new Error(`Tool ${tc.name} not found`);
                } catch (toolErr) {
                  const errorMessage = toolErr instanceof Error ? toolErr.message : String(toolErr);
                  console.error(`[STREAM_TEXT] Tool execution failed: ${tc.name}`, errorMessage);
                  sendChunk({ toolCall: tc.name, error: errorMessage });
                  return {
                    functionResponse: {
                      name: tc.name,
                      response: { error: errorMessage },
                    },
                  };
                }
              }),
            );

            console.log(`[STREAM_TEXT] Continuing with ${functionResponses.length} tool responses`);
            // Continue the conversation with the tool results as a single turn
            await runTurn(functionResponses as Part[]);
          }
        };

        await runTurn(lastParts);
      } catch (err) {
        console.error("[STREAM_TEXT_ERROR]", err);
        sendChunk({ error: err instanceof Error ? err.message : String(err) });
      } finally {
        controller.close();
      }
    },
  });
}
