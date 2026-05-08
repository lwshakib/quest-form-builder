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
 * Represents a single part of a message in the Gemini model.
 */
export interface GLMPart {
  text?: string;
  thought?: boolean;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
    id: string;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
    id: string;
  };
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
