/**
 * QuestToolCall represents a tool call initiated by the model.
 */
export interface QuestToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string; // JSON string of arguments
  };
}

/**
 * QuestMessage represents a single message in the conversation.
 * It's a provider-agnostic format that we transform for specific LLMs (like Gemini).
 */
export interface QuestMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  reasoning_content?: string | null;
  tool_calls?: QuestToolCall[];
  tool_call_id?: string;
  id?: string;
}

/**
 * QuestPart represents a single part of a message (text or tool call).
 */
export interface QuestPart {
  type: "text" | "reasoning" | "tool";
  content?: string;
  name?: string;
  status?: "running" | "success" | "error";
}

/**
 * Registry interface for tools.
 */
export interface ToolRegistry {
  [key: string]: {
    description: string;
    handler: (args: Record<string, unknown>, qId: string) => Promise<string>;
    parameters: unknown;
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
