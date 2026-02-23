/**
 * API Route: /api/chat
 *
 * This is the main orchestration layer for the AI-powered quest builder.
 * It uses Vercel AI SDK to stream responses from Gemini and provides several
 * server-side tools that the AI can call to manipulate the database in real-time.
 */

import { streamText, tool, convertToModelMessages, stepCountIs } from "ai";
import { GeminiModel } from "@/llm/model";
import { z } from "zod";
import {
  updateQuest,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestById,
} from "@/lib/actions";
import { generateImageTool } from "@/lib/image-tool";

// Allow the edge function to run for up to 30 seconds to accommodate image generation and multiple tool calls.
export const maxDuration = 30;

/**
 * Handles incoming chat messages from the builder UI.
 * Orchestrates tools and streams the AI's response back to the client.
 */
export async function POST(req: Request) {
  const { messages, questId } = await req.json();

  // Fetch the current state of the quest to provide as a 'Ground Truth' context for the AI.
  const currentQuest = await getQuestById(questId);

  // Initialize the streaming text process
  const result = streamText({
    model: GeminiModel(),
    messages: await convertToModelMessages(messages),
    // The system prompt defines the AI's personality, goals, and operational boundaries.
    system: `You are a helpful AI assistant that helps users build their form/quest.
    
    Current Quest Context:
    Title: ${currentQuest?.title || "Untitled Quest"}
    Description: ${currentQuest?.description || "None"}
    Background Image: ${currentQuest?.backgroundImageUrl || "None"}
    Questions: ${jsonStringify(currentQuest?.questions || [])}

    Your goal is to build a COMPLETE, professional quest (metadata, background, and questions) in a single multi-step interaction:
    1. **Metadata & Visuals (Step 1)**: 
       - If the title is generic, generate a professional title and description.
       - If there is no background image, use 'generateImage' to create a high-quality one.
       - Call 'updateQuest' and 'generateImage' in parallel.
    2. **Apply & Build (Step 2+)**:
       - Capture the 'secure_url' from 'generateImage' and use 'updateQuest' to apply it.
       - Simultaneously, generate ALL the questions for the form. 
       - You MUST use 'createQuestions' to add questions (it accepts an array, so providing one object adds one question, and multiple objects add multiple questions).
    3. **High-Quality Choice Options**: For choice-based questions, provide comprehensive, professional options.
    4. **Communicate**: Briefly tell the user the full plan at the start. Example: "I'll set up a registration form with a professional title, a custom picnic-themed background, and 6 questions covering attendance, dietary needs, and activities."

    CRITICAL: Do not stop after just generating the title or image. Continue until all questions are created.
    `,
    toolChoice: "auto",
    // Prevent infinite loops while allowing enough steps for complex building sequences.
    stopWhen: stepCountIs(10),
    tools: {
      /**
       * Tool: updateQuest
       * Allows the AI to modify the quest's global settings and appearance.
       */
      updateQuest: tool({
        description: "Update quest details like title, description, settings, or background image.",
        inputSchema: z.object({
          title: z.string().optional(),
          description: z.string().optional(),
          backgroundImageUrl: z.string().optional(),
          isQuiz: z.boolean().optional(),
          showProgressBar: z.boolean().optional(),
          shuffleQuestionOrder: z.boolean().optional(),
        }),
        execute: async (props) => {
          await updateQuest(questId, props);
          return `Updated quest details: ${Object.keys(props).join(", ")}`;
        },
      }),

      /**
       * Tool: generateImage
       * Leverages the custom tool from lib/image-tool to create AI backgrounds.
       */
      generateImage: generateImageTool,

      /**
       * Tool: createQuestions
       * Allows bulk-creation of multiple questions in a single step.
       */
      createQuestions: tool({
        description: "Add new questions to the quest. Accepts an array of question objects.",
        inputSchema: z.object({
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
              ]),
              title: z.string(),
              description: z.string().optional(),
              required: z.boolean().optional(),
              options: z.array(z.string()).optional(),
            }),
          ),
        }),
        execute: async ({ questions }) => {
          const latestQuest = await getQuestById(questId);
          let startOrder = latestQuest?.questions?.length || 0;

          // Sequentially create each question to maintain the correct display order.
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
          return `Created ${questions.length} question(s).`;
        },
      }),

      /**
       * Tool: deleteQuestion
       * Allows the AI to remove specific questions.
       */
      deleteQuestion: tool({
        description: "Delete a question by its ID.",
        inputSchema: z.object({
          questionId: z.string(),
        }),
        execute: async ({ questionId }) => {
          await deleteQuestion(questionId, questId);
          return `Deleted question ${questionId}`;
        },
      }),

      /**
       * Tool: updateQuestion
       * Allows the AI to refine existing questions.
       */
      updateQuestion: tool({
        description: "Update a question by its ID.",
        inputSchema: z.object({
          questionId: z.string(),
          title: z.string().optional(),
          description: z.string().optional(),
          required: z.boolean().optional(),
          options: z.array(z.string()).optional(),
        }),
        execute: async ({ questionId, ...props }) => {
          await updateQuestion(questionId, questId, props);
          return `Updated question ${questionId}`;
        },
      }),
    },
  });

  // Convert the result into a stream format that the Vercel AI SDK 'useChat' hook expects.
  return result.toUIMessageStreamResponse();
}

/**
 * Utility to safely stringify objects for inclusion in the system prompt.
 */
function jsonStringify(obj: unknown) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return "[]";
  }
}
