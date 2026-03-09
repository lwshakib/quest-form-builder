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
 * This structure maps exactly to the expected OpenAI-style tool spec.
 */
export interface GLMTool {
  description: string; // The text that tells the AI *when* and *why* to use this tool
  parameters: z.ZodObject<any>; // Zod schema mapping the expected JSON input
  handler: (args: any, questId: string) => Promise<string>; // The execution logic executed on the server
}

/**
 * --- Tool Definitions ---
 */

// Tool 1: generateImageTool
// Invokes the Flux model to render new background images for Quests
const generateImageTool: GLMTool = {
  description: "Generate a high-quality background image for the quest based on a prompt.",
  parameters: z.object({
    prompt: z.string().describe("Visual description of the desired image. IMPORTANT: Never add text contents or labels on the image unless explicitly requested by the user."),
    width: z.number().int().optional().default(1024),
    height: z.number().int().optional().default(1024),
    steps: z.number().int().optional().default(28).describe("Optimization steps (20-35 recommended)."),
  }),
  handler: async (args, questId) => {
    // Ping the AI Generation backend with parameters
    const result = await generateImage({
      prompt: args.prompt,
      width: args.width ?? 1024,
      height: args.height ?? 1024,
      steps: args.steps ?? 28,
      mode: 'text-to-image',
    });
    
    // If generated successfully, automatically assign it to the Quest via DB actions
    if (result.success && result.image) {
      await updateQuest(questId, { backgroundImageUrl: result.image });
      return `Success: Background image generated and applied. URL: ${result.image}`;
    }
    
    // Return explicit error to the AI so it can self-correct or inform the user
    return `Error: ${result.error || "Failed to generate image"}`;
  },
};

// Tool 2: updateQuestTool
// Allows the AI to modify top-level settings of the form/quest
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
    // Perform database mutation immediately
    await updateQuest(questId, props);
    return `Successfully updated quest details: ${Object.keys(props).join(", ")}`;
  },
};

// Tool 3: createQuestionsTool
// Crucial tool for bulk-adding questions so the AI can rapidly create whole surveys at once
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
    // Retrieve current questions to figure out the proper sequential numbering (order factor)
    const latestQuest = await getQuestById(questId);
    let startOrder = latestQuest?.questions?.length || 0;

    // Build each question sequentially. 
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

// Tool 4: deleteQuestionTool
// Single action deletion utility based on question ID
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

// Tool 5: updateQuestionTool
// Patch an existing single question (ideal for fixing typos or inserting options)
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
 * Maps tool names to their respective tool definitions to be securely
 * exported to the AI API routing layer without passing the actual code.
 */
export const TOOLS_REGISTRY = {
  generateImage: generateImageTool,
  updateQuest: updateQuestTool,
  createQuestions: createQuestionsTool,
  deleteQuestion: deleteQuestionTool,
  updateQuestion: updateQuestionTool,
};

// Exports valid parameter key types
export type ToolName = keyof typeof TOOLS_REGISTRY;
