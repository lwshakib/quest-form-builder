import { s3Service } from "@/services/s3.services";
import { nanoid } from "nanoid";
import { CHAT_MODEL_ID, IMAGE_GENERATION_MODEL_ID } from "@/lib/constants";

/**
 * Interface for OpenAI-compatible tool call.
 */
export interface GLMToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Interface for OpenAI-compatible chat messages.
 */
export interface GLMMessage {
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
 * Options for generating an image.
 */
export interface GenerateImageOptions {
  prompt: string;
  width?: number;
  height?: number;
  steps?: number;
  seed?: number;
  guidance?: number;
}

/**
 * The result of an image generation operation.
 */
export interface GenerateImageResult {
  success: boolean;
  image?: string;
  publicId?: string;
  prompt: string;
  width?: number;
  height?: number;
  model: string;
  error?: string;
}

class AiService {
  private endpoint: string;
  private apiKey: string;

  constructor(endpoint: string, apiKey: string) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
  }

  /**
   * Formats the tools for the model's 'tools' request parameter.
   * Simple mapping since tools now provide their own JSON schema.
   */
  private getToolSchema(
    toolsRegistry: Record<string, { description: string; parameters: unknown }>,
  ) {
    return Object.entries(toolsRegistry).map(([name, config]) => ({
      type: "function",
      function: {
        name,
        description: config.description,
        parameters: config.parameters,
      },
    }));
  }

  /**
   * Main streaming utility for building and manipulating quest items.
   * Optimized for GLM-4.7-Flash with tool calling and reasoning support.
   */
  async streamText(
    messages: GLMMessage[],
    questId: string,
    toolsRegistry: Record<
      string,
      {
        description: string;
        handler: (args: Record<string, unknown>, qId: string) => Promise<string>;
        parameters: unknown;
      }
    >,
  ) {
    const encoder = new TextEncoder();
    const conversation: GLMMessage[] = [...messages];

    return new ReadableStream({
      start: async (controller) => {
        const sendChunk = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        const runTurn = async (): Promise<void> => {
          try {
            const response = await fetch(this.endpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
                // "x-session-affinity": questId, // Optional: for prompt caching
              },
              body: JSON.stringify({
                model: CHAT_MODEL_ID,
                messages: conversation,
                stream: true,
                tools: this.getToolSchema(toolsRegistry),
                tool_choice: "auto",
              }),
            });

            if (!response.ok) {
              const errorBody = await response.text();
              let errorMessage = `API Error: ${response.status} ${response.statusText}`;
              try {
                const errData = JSON.parse(errorBody);
                if (errData.errors && errData.errors[0]) {
                  errorMessage = errData.errors[0].message || errorMessage;
                } else if (errData.message) {
                  errorMessage = errData.message;
                }
              } catch {
                errorMessage = errorBody || errorMessage;
              }
              throw new Error(errorMessage);
            }

            if (!response.body) return;

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            const assistantMessage: GLMMessage = { role: "assistant", content: "" };
            const currentToolCalls: { name: string; arguments: string; id: string }[] = [];
            let buffer = "";

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const cleanLine = line.trim();
                if (!cleanLine.startsWith("data: ") || cleanLine === "data: [DONE]") continue;

                try {
                  const data = JSON.parse(cleanLine.slice(6));

                  // Handle errors returned inside the stream chunks
                  if (data.errors && data.errors.length > 0) {
                    throw new Error(data.errors[0].message || "Stream error occurred");
                  }

                  if (!data.choices || data.choices.length === 0) continue;

                  const delta = data.choices[0].delta;

                  if (delta.tool_calls) {
                    delta.tool_calls.forEach((tc: ToolCallDelta) => {
                      const index = tc.index;
                      if (!currentToolCalls[index]) {
                        currentToolCalls[index] = {
                          name: tc.function?.name || "",
                          arguments: tc.function?.arguments || "",
                          id: tc.id || "",
                        };
                      } else if (tc.function) {
                        currentToolCalls[index].arguments += tc.function.arguments || "";
                      }
                    });
                  }

                  if (delta.content) {
                    assistantMessage.content = (assistantMessage.content || "") + delta.content;
                    sendChunk({ content: delta.content });
                  }

                  if (delta.reasoning_content) {
                    assistantMessage.reasoning_content =
                      (assistantMessage.reasoning_content || "") + delta.reasoning_content;
                    sendChunk({ reasoning: delta.reasoning_content });
                  }
                } catch (jsonErr) {
                  console.error("JSON parse error on line:", cleanLine, jsonErr);
                }
              }
            }

            if (currentToolCalls.length > 0) {
              assistantMessage.tool_calls = currentToolCalls.map((tc) => ({
                id: tc.id,
                type: "function",
                function: { name: tc.name, arguments: tc.arguments },
              }));

              conversation.push(assistantMessage);

              for (const tc of currentToolCalls) {
                try {
                  sendChunk({ toolCall: tc.name });
                  const args = JSON.parse(tc.arguments || "{}");
                  const toolConfig = toolsRegistry[tc.name];

                  const result = toolConfig
                    ? await toolConfig.handler(args, questId)
                    : `Error: Tool ${tc.name} not found.`;

                  conversation.push({
                    role: "tool",
                    tool_call_id: tc.id,
                    content: result,
                  });

                  sendChunk({ toolCall: tc.name, result });
                } catch (err) {
                  const errorMessage = `Error executing tool: ${err instanceof Error ? err.message : String(err)}`;
                  conversation.push({
                    role: "tool",
                    tool_call_id: tc.id,
                    content: errorMessage,
                  });
                  sendChunk({ toolCall: tc.name, error: errorMessage });
                }
              }
              await runTurn();
            }
          } catch (err) {
            console.error(err instanceof Error ? err.message : String(err));
            // Re-throw to be caught by the outer orchestration try/catch
            throw err;
          }
        };

        try {
          await runTurn();
        } catch (err) {
          console.error(err instanceof Error ? err.message : String(err));
          sendChunk({
            error: err instanceof Error ? err.message : String(err),
          });
        } finally {
          controller.close();
        }
      },
    });
  }

  async generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
    const {
      prompt,
      width = 1024,
      height = 1024,
      steps = 4, // Schnell is optimized for low steps (default 4)
      seed,
      guidance = 7.5,
    } = options;

    try {
      console.log(`[AiService] Generating image with model: ${IMAGE_GENERATION_MODEL_ID}`);
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: IMAGE_GENERATION_MODEL_ID,
          prompt,
          width,
          height,
          steps: steps,
          guidance,
          seed,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Image generation failed (${response.status}): ${errorText}`);
      }

      const jsonResult = await response.json();

      // Look for the image data in various possible properties
      let base64Image = jsonResult.image || jsonResult.result?.image;

      if (!base64Image) {
        throw new Error(
          `Cloudflare AI error: ${JSON.stringify(jsonResult?.errors || jsonResult || "No image data found")}`,
        );
      }

      // We MUST strip the data header (if present) before converting to Buffer to ensure it is valid binary
      if (typeof base64Image === "string" && base64Image.includes("base64,")) {
        base64Image = base64Image.split("base64,")[1];
      }

      const imageBuffer = Buffer.from(base64Image, "base64");

      const imageKey = `generated/${nanoid()}.png`;
      const uploadedKey = await s3Service.uploadFile(imageBuffer, imageKey, "image/png");

      return {
        success: true,
        image: uploadedKey, // Return the key (path)
        prompt,
        width,
        height,
        model: IMAGE_GENERATION_MODEL_ID,
      };
    } catch (error) {
      console.error("[GENERATE_IMAGE_EXCEPTION]", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during image generation",
        prompt,
        model: IMAGE_GENERATION_MODEL_ID,
      };
    }
  }
}

export const aiService = new AiService(
  process.env.CLOUDFLARE_AI_GATEWAY_ENDPOINT!,
  process.env.CLOUDFLARE_AI_GATEWAY_API_KEY!,
);
