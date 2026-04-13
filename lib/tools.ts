/**
 * Tool definitions for the GLM-4.7-Flash model.
 * Each tool is defined as a self-contained object in the TOOLS_REGISTRY.
 * This version uses direct JSON schemas instead of Zod for tool definitions.
 */

import {
  updateQuest,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestById,
} from "@/lib/actions";
import { aiService } from "@/services/ai.services";

/**
 * Interface representing a tool definition for the GLM model.
 * This structure maps exactly to the expected OpenAI-style tool spec.
 */
export interface GLMTool {
  description: string; // The text that tells the AI *when* and *why* to use this tool
  parameters: Record<string, unknown>; // Direct JSON schema mapping the expected input
  handler: (args: Record<string, unknown>, questId: string) => Promise<string>; // The execution logic executed on the server
}

/**
 * --- Tool Definitions ---
 */

// Tool 1: generateImageTool
const generateImageTool: GLMTool = {
  description: "Generate a high-quality background image for the quest based on a prompt.",
  parameters: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Visual description of the desired image. IMPORTANT: Never add text contents or labels on the image unless explicitly requested by the user.",
      },
      width: { type: "integer", default: 1024 },
      height: { type: "integer", default: 1024 },
      steps: {
        type: "integer",
        default: 28,
        description: "Optimization steps (20-35 recommended).",
      },
    },
    required: ["prompt"],
  },
  handler: async (args, questId) => {
    const { prompt, width, height, steps } = args as {
      prompt: string;
      width?: number;
      height?: number;
      steps?: number;
    };
    const result = await aiService.generateImage({
      prompt: prompt,
      width: width ?? 1024,
      height: height ?? 1024,
      steps: steps ?? 28,
      mode: "text-to-image",
    });

    if (result.success && result.image) {
      await updateQuest(questId, { backgroundImageUrl: result.image });
      return `Success: Background image generated and applied. URL: ${result.image}`;
    }

    return `Error: ${result.error || "Failed to generate image"}`;
  },
};

// Tool 2: updateQuestTool
const updateQuestTool: GLMTool = {
  description: "Update quest details like title, description, settings, or background image.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      backgroundImageUrl: { type: "string" },
      isQuiz: { type: "boolean" },
      showProgressBar: { type: "boolean" },
      shuffleQuestionOrder: { type: "boolean" },
    },
    required: [],
  },
  handler: async (props, questId) => {
    await updateQuest(questId, props as Parameters<typeof updateQuest>[1]);
    return `Successfully updated quest details: ${Object.keys(props).join(", ")}`;
  },
};

// Tool 3: createQuestionsTool
const createQuestionsTool: GLMTool = {
  description: "Add multiple new questions to the quest at once.",
  parameters: {
    type: "object",
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: [
                "SHORT_TEXT",
                "PARAGRAPH",
                "MULTIPLE_CHOICE",
                "CHECKBOXES",
                "DROPDOWN",
                "DATE",
                "TIME",
                "VIDEO",
                "IMAGE",
              ],
              description: "The input type.",
            },
            title: { type: "string", description: "Clear, context-specific question title." },
            description: { type: "string", description: "Helpful hint or context." },
            required: { type: "boolean", description: "Whether the question is mandatory." },
            options: {
              type: "array",
              items: { type: "string" },
              description: "List of choices for choice-based questions.",
            },
          },
          required: ["type", "title"],
        },
      },
    },
    required: ["questions"],
  },
  handler: async (args, questId) => {
    const { questions } = args as {
      questions: Array<{
        type: any;
        title: string;
        description?: string;
        required?: boolean;
        options?: string[];
      }>;
    };
    const latestQuest = await getQuestById(questId);
    let startOrder = latestQuest?.questions?.length || 0;

    for (const q of questions) {
      await createQuestion(
        questId,
        q.type,
        startOrder++,
        q.title,
        q.description,
        q.required,
        q.options,
      );
    }
    return `Success: Created ${questions.length} question(s).`;
  },
};

// Tool 4: deleteQuestionTool
const deleteQuestionTool: GLMTool = {
  description: "Delete a specific question by its unique ID.",
  parameters: {
    type: "object",
    properties: {
      questionId: { type: "string" },
    },
    required: ["questionId"],
  },
  handler: async (args, questId) => {
    const { questionId } = args as { questionId: string };
    await deleteQuestion(questionId, questId);
    return `Success: Deleted question with ID ${questionId}`;
  },
};

// Tool 5: updateQuestionTool
const updateQuestionTool: GLMTool = {
  description: "Update the content or settings of an existing question.",
  parameters: {
    type: "object",
    properties: {
      questionId: { type: "string", description: "The unique ID of the question to update." },
      title: { type: "string", description: "New title for the question." },
      description: { type: "string", description: "New description or hint." },
      required: { type: "boolean", description: "Whether the question should be mandatory." },
      options: {
        type: "array",
        items: { type: "string" },
        description: "Updated list of options.",
      },
    },
    required: ["questionId"],
  },
  handler: async (args, questId) => {
    const { questionId, ...props } = args as {
      questionId: string;
      title?: string;
      description?: string;
      required?: boolean;
      options?: string[];
    };
    await updateQuestion(questionId, questId, props);
    return `Success: Updated question ${questionId}`;
  },
};

/**
 * --- Tools Registry ---
 */
export const TOOLS_REGISTRY = {
  generateImage: generateImageTool,
  updateQuest: updateQuestTool,
  createQuestions: createQuestionsTool,
  deleteQuestion: deleteQuestionTool,
  updateQuestion: updateQuestionTool,
};

export type ToolName = keyof typeof TOOLS_REGISTRY;
