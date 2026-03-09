/**
 * Tool definitions for the GLM-4.7-Flash model.
 * Each tool is defined as a self-contained object in the TOOLS_REGISTRY.
 */

import { z } from "zod";
import {
  updateQuest,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestById,
} from "@/lib/actions";
import { generateImage } from "./generateImage";

/**
 * Interface representing a tool definition for the GLM model.
 */
export interface GLMTool {
  description: string;
  parameters: z.ZodObject<any>;
  handler: (args: any, questId: string) => Promise<string>;
}

/**
 * --- Tool Definitions ---
 */

const generateImageTool: GLMTool = {
  description: "Generate a high-quality background image for the quest based on a prompt.",
  parameters: z.object({
    prompt: z.string().describe("Visual description of the desired image. IMPORTANT: Never add text contents or labels on the image unless explicitly requested by the user."),
    width: z.number().int().optional().default(1024),
    height: z.number().int().optional().default(1024),
    steps: z.number().int().optional().default(28).describe("Optimization steps (20-35 recommended)."),
  }),
  handler: async (args, questId) => {
    const result = await generateImage({
      prompt: args.prompt,
      width: args.width ?? 1024,
      height: args.height ?? 1024,
      steps: args.steps ?? 28,
      mode: 'text-to-image',
    });
    
    if (result.success && result.image) {
      await updateQuest(questId, { backgroundImageUrl: result.image });
      return `Success: Background image generated and applied. URL: ${result.image}`;
    }
    
    return `Error: ${result.error || "Failed to generate image"}`;
  },
};

const updateQuestTool: GLMTool = {
  description: "Update quest details like title, description, settings, or background image.",
  parameters: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    backgroundImageUrl: z.string().optional(),
    isQuiz: z.boolean().optional(),
    showProgressBar: z.boolean().optional(),
    shuffleQuestionOrder: z.boolean().optional(),
  }),
  handler: async (props, questId) => {
    await updateQuest(questId, props);
    return `Successfully updated quest details: ${Object.keys(props).join(", ")}`;
  },
};

const createQuestionsTool: GLMTool = {
  description: "Add multiple new questions to the quest at once.",
  parameters: z.object({
    questions: z.array(
      z.object({
        type: z.enum([
          "SHORT_TEXT",
          "PARAGRAPH",
          "MULTIPLE_CHOICE",
          "CHECKBOXES",
          "DROPDOWN",
          "DATE",
          "TIME",
          "VIDEO",
          "IMAGE",
        ]).describe("The input type. Strictly use the provided enum."),
        title: z.string().describe("Clear, context-specific question title. No placeholders."),
        description: z.string().optional().describe("Helpful hint or context for the question."),
        required: z.boolean().optional().describe("Whether the question is mandatory."),
        options: z.array(z.string()).optional().describe("List of choices for MULTIPLE_CHOICE, CHECKBOXES, or DROPDOWN."),
      })
    ),
  }),
  handler: async ({ questions }, questId) => {
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
        q.options
      );
    }
    return `Success: Created ${questions.length} question(s).`;
  },
};

const deleteQuestionTool: GLMTool = {
  description: "Delete a specific question by its unique ID.",
  parameters: z.object({
    questionId: z.string(),
  }),
  handler: async ({ questionId }, questId) => {
    await deleteQuestion(questionId, questId);
    return `Success: Deleted question with ID ${questionId}`;
  },
};

const updateQuestionTool: GLMTool = {
  description: "Update the content or settings of an existing question.",
  parameters: z.object({
    questionId: z.string().describe("The unique ID of the question to update."),
    title: z.string().optional().describe("New title for the question."),
    description: z.string().optional().describe("New description or hint."),
    required: z.boolean().optional().describe("Whether the question should be mandatory."),
    options: z.array(z.string()).optional().describe("Updated list of options for choice-based questions."),
  }),
  handler: async ({ questionId, ...props }, questId) => {
    await updateQuestion(questionId, questId, props);
    return `Success: Updated question ${questionId}`;
  },
};

/**
 * --- Tools Registry ---
 * Maps tool names to their respective tool definitions.
 */

export const TOOLS_REGISTRY = {
  generateImage: generateImageTool,
  updateQuest: updateQuestTool,
  createQuestions: createQuestionsTool,
  deleteQuestion: deleteQuestionTool,
  updateQuestion: updateQuestionTool,
};

export type ToolName = keyof typeof TOOLS_REGISTRY;
