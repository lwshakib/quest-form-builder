/**
 * This module contains server actions for managing Quests and their related entities.
 * Server actions provide a type-safe way to handle form submissions and data mutations
 * directly from the server, with integrated authentication and revalidation.
 */

"use server";

import prisma from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { TEMPLATES } from "./templates";

/**
 * Creates a new, empty Quest for the currently authenticated user.
 *
 * @param {string} title - The title of the quest.
 * @param {string} [backgroundImageUrl] - Optional URL for the quest's background image.
 * @returns {Promise<Quest>} The created quest object.
 */
export async function createQuest(title: string = "Untitled Quest", backgroundImageUrl?: string) {
  // Authentication check
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Database creation
  const quest = await prisma.quest.create({
    data: {
      title,
      userId: session.user.id,
      status: "Draft",
      backgroundImageUrl,
    },
  });

  // Revalidate the list view to show the new quest
  revalidatePath("/quests");
  return quest;
}

/**
 * Creates a new Quest pre-populated with questions and settings from a template.
 *
 * @param {string} templateId - The ID of the template to use.
 * @returns {Promise<Quest>} The created quest object.
 */
export async function createQuestFromTemplate(templateId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Find the template definition
  const template = TEMPLATES.find((t) => t.id === templateId);
  if (!template) {
    throw new Error("Template not found");
  }

  // Create the base quest
  const quest = await prisma.quest.create({
    data: {
      title: template.title,
      userId: session.user.id,
      status: "Draft",
      backgroundImageUrl: template.backgroundImage,
      templateId: template.id,
    },
  });

  // Create questions based on the template structure
  if (template.questions.length > 0) {
    const questionsData = template.questions.map((q, index) => ({
      questId: quest.id,
      type: q.type,
      title: q.title,
      description: q.description || "",
      order: index,
      required: q.required || false,
      options:
        q.options ||
        (q.type === "MULTIPLE_CHOICE" || q.type === "CHECKBOXES" || q.type === "DROPDOWN"
          ? ["Option 1"]
          : undefined),
    }));

    // Batch insert for efficiency
    await prisma.question.createMany({
      data: questionsData,
    });
  }

  revalidatePath("/quests");
  return quest;
}

/**
 * Retrieves the IDs of recently used templates for the user.
 * Used for the "Create New" screen to suggest templates.
 *
 * @returns {Promise<string[]>} An array of unique template IDs.
 */
export async function getRecentTemplates() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return [];
  }

  // Query quests that were created from templates
  const recentQuests = await prisma.quest.findMany({
    where: {
      userId: session.user.id,
      templateId: { not: null },
    },
    select: {
      templateId: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  // Return a unique list of the top 3 template IDs
  const uniqueTemplateIds = Array.from(new Set(recentQuests.map((q) => q.templateId as string)));
  return uniqueTemplateIds.slice(0, 3);
}

/**
 * Performs a global search across the user's quests and available templates.
 * Matches on quest titles, question titles, and question descriptions.
 *
 * @param {string} query - The search term.
 * @returns {Promise<{ quests: Quest[], templates: Template[] }>} Matched items.
 */
export async function globalSearch(query: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !query.trim()) {
    return { quests: [], templates: [] };
  }

  const q = query.toLowerCase();

  // Search local quests and their related questions using case-insensitive partial matching
  const userQuests = await prisma.quest.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        {
          questions: {
            some: { title: { contains: query, mode: "insensitive" } },
          },
        },
        {
          questions: {
            some: { description: { contains: query, mode: "insensitive" } },
          },
        },
      ],
    },
    include: {
      questions: {
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
      },
    },
    take: 5,
  });

  // Filter templates locally based on title, description, or question content
  const matchedTemplates = TEMPLATES.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.questions.some(
        (qn) => qn.title.toLowerCase().includes(q) || qn.description?.toLowerCase().includes(q),
      ),
  ).slice(0, 5);

  return {
    quests: userQuests,
    templates: matchedTemplates,
  };
}

/**
 * Retrieves all quests belonging to the authenticated user, ordered by last update.
 *
 * @returns {Promise<Quest[]>} An array of quest objects.
 */
export async function getQuests() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return [];
  }

  const quests = await prisma.quest.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return quests;
}

/**
 * Fetches a specific quest by its ID, including all its associated questions.
 *
 * @param {string} id - The unique ID of the quest.
 * @returns {Promise<Quest | null>} The quest object with questions, or null if not found.
 */
export async function getQuestById(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const quest = await prisma.quest.findUnique({
    where: {
      id,
      userId: session.user.id, // Ensure user can only access their own quest
    },
    include: {
      questions: {
        orderBy: {
          order: "asc", // Return questions in their defined playback order
        },
      },
    },
  });

  return quest;
}

/**
 * Updates a quest's settings or metadata.
 *
 * @param {string} id - The ID of the quest to update.
 * @param {Object} data - Partial quest data containing fields to update.
 * @returns {Promise<Quest>} The updated quest object.
 */
export async function updateQuest(
  id: string,
  data: {
    title?: string;
    description?: string;
    status?: string;
    published?: boolean;
    acceptingResponses?: boolean;
    shortId?: string;
    isQuiz?: boolean;
    showProgressBar?: boolean;
    shuffleQuestionOrder?: boolean;
    confirmationMessage?: string;
    showLinkToSubmitAnother?: boolean;
    limitToOneResponse?: boolean;
    viewResultsSummary?: boolean;
    questionsRequiredByDefault?: boolean;
    webhookEnabled?: boolean;
    webhookUrl?: string;
    backgroundImageUrl?: string | null;
  },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const quest = await prisma.quest.update({
    where: {
      id,
      userId: session.user.id,
    },
    data,
  });

  // Revalidate cache to ensure UI reflects updates
  revalidatePath("/quests");
  revalidatePath(`/quests/${id}`);
  return quest;
}

/**
 * Publishes a quest, making it accessible to the public.
 * Automatically generates a shared short ID if one doesn't exist.
 *
 * @param {string} id - The unique ID of the quest to publish.
 * @returns {Promise<Quest>} The updated quest object.
 */
export async function publishQuest(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Ensure the quest exists and belongs to the user
  const quest = await prisma.quest.findUnique({
    where: { id, userId: session.user.id },
  });

  if (!quest) throw new Error("Quest not found");

  // Generate a random 6-character short ID for public sharing if not already present
  let shortId = quest.shortId;
  if (!shortId) {
    shortId = Math.random().toString(36).substring(2, 8);

    // Basic collision check: if ID exists, try one more time with a slightly longer ID
    const existing = await prisma.quest.findUnique({ where: { shortId } });
    if (existing) shortId = Math.random().toString(36).substring(2, 9);
  }

  const updatedQuest = await prisma.quest.update({
    where: {
      id,
      userId: session.user.id,
    },
    data: {
      status: "Published",
      published: true,
      acceptingResponses: true,
      shortId,
    },
  });

  revalidatePath("/quests");
  revalidatePath(`/quests/${id}`);
  return updatedQuest;
}

/**
 * Reverts a published quest to a draft state, making it inaccessible to the public.
 *
 * @param {string} id - The ID of the quest to unpublish.
 * @returns {Promise<Quest>} The updated quest object.
 */
export async function unpublishQuest(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const updatedQuest = await prisma.quest.update({
    where: {
      id,
      userId: session.user.id,
    },
    data: {
      status: "Draft",
      published: false,
    },
  });

  revalidatePath("/quests");
  revalidatePath(`/quests/${id}`);
  return updatedQuest;
}

/**
 * Permanently deletes a quest and all its associated data (questions, responses, etc.).
 *
 * @param {string} id - The ID of the quest to delete.
 */
export async function deleteQuest(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  await prisma.quest.delete({
    where: {
      id,
      userId: session.user.id, // Security: Ensure user owns the quest
    },
  });

  revalidatePath("/quests");
}

/**
 * Adds a new question to a specific quest.
 *
 * @param {string} questId - The parent quest's ID.
 * @param {string} type - The type of question (e.g., MULTIPLE_CHOICE).
 * @param {number} order - The display order for the question.
 * @param {string} [title] - Optional title.
 * @param {string} [description] - Optional help text.
 * @param {boolean} [required] - Whether the question is mandatory.
 * @param {string[]} [options] - List of selectable options (if applicable).
 * @returns {Promise<Question>} The created question object.
 */
export async function createQuestion(
  questId: string,
  type: string,
  order: number,
  title?: string,
  description?: string,
  required?: boolean,
  options?: string[],
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  // Check quest settings for default 'required' behavior
  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    select: { questionsRequiredByDefault: true },
  });

  const question = await prisma.question.create({
    data: {
      questId,
      type,
      title: title || `Untitled ${type.toLowerCase().replace("_", " ")}`,
      description,
      order,
      // Priority: explicit parameter > quest default > false
      required: required ?? quest?.questionsRequiredByDefault ?? false,
      options:
        options ||
        (type === "MULTIPLE_CHOICE" || type === "CHECKBOXES" || type === "DROPDOWN"
          ? ["Option 1"]
          : type === "VIDEO" || type === "IMAGE"
            ? [""]
            : undefined),
    },
  });

  revalidatePath(`/quests/${questId}`);
  return question;
}

/**
 * Updates an existing question's properties.
 *
 * @param {string} id - The unique ID of the question.
 * @param {string} questId - The parent quest's ID (used for security validation).
 * @param {Record<string, unknown>} data - The fields to update.
 * @returns {Promise<Question>} The updated question object.
 */
export async function updateQuestion(id: string, questId: string, data: Record<string, unknown>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const question = await prisma.question.update({
    where: { id, questId },
    data,
  });

  revalidatePath(`/quests/${questId}`);
  return question;
}

/**
 * Removes a question from a quest.
 *
 * @param {string} id - The ID of the question to delete.
 * @param {string} questId - The parent quest's ID.
 */
export async function deleteQuestion(id: string, questId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  await prisma.question.delete({
    where: { id, questId },
  });

  revalidatePath(`/quests/${questId}`);
}

/**
 * Creates a copy of an existing question and inserts it immediately after the original.
 * Handles reordering of all subsequent questions to maintain a consistent 'order' sequence.
 *
 * @param {string} id - The ID of the question to duplicate.
 * @param {string} questId - The parent quest's ID.
 * @returns {Promise<Question>} The newly created duplicate question.
 */
export async function duplicateQuestion(id: string, questId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const original = await prisma.question.findUnique({
    where: { id, questId },
  });

  if (!original) throw new Error("Question not found");

  // Create the new question with data from the original
  const question = await prisma.question.create({
    data: {
      questId,
      type: original.type,
      title: `${original.title} (Copy)`,
      description: original.description,
      order: original.order + 1,
      required: original.required,
      options: original.options || undefined,
      points: original.points,
      correctAnswer: original.correctAnswer || undefined,
      feedback: original.feedback,
    },
  });

  // Re-fetch and re-order all questions in this quest to ensure no gaps or duplicate order numbers
  const allQuestions = await prisma.question.findMany({
    where: { questId },
    orderBy: { order: "asc" },
  });

  const updates = allQuestions.map((q, index) =>
    prisma.question.update({
      where: { id: q.id },
      data: { order: index },
    }),
  );

  // Execute all updates in a single database transaction for consistency
  await prisma.$transaction(updates);

  revalidatePath(`/quests/${questId}`);
  return question;
}

/**
 * Updates the sort order of multiple questions at once.
 *
 * @param {string} questId - The parent quest's ID.
 * @param {string[]} questionIds - An ordered array of question IDs reflecting the new sequence.
 */
export async function updateQuestionsOrder(questId: string, questionIds: string[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const updates = questionIds.map((id, index) =>
    prisma.question.update({
      where: { id, questId },
      data: { order: index },
    }),
  );

  await prisma.$transaction(updates);
  revalidatePath(`/quests/${questId}`);
}

/**
 * Fetches a quest for public viewing (e.g., when a user is taking the quest).
 * Unlike other retrieval actions, this does NOT require an authenticated session,
 * but it DOES require the quest to be published.
 *
 * @param {string} id - The unique ID (or shortId) of the quest.
 * @returns {Promise<Quest | null>} The quest object with questions, or null if inaccessible.
 */
export async function getPublicQuest(id: string) {
  const quest = await prisma.quest.findUnique({
    where: {
      id,
    },
    include: {
      questions: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  // Security check: quest must exist and must be in a 'Published' state.
  if (!quest || !quest.published) {
    return null;
  }

  return quest;
}

/**
 * Records a user's answers to a quest.
 * This action is typically used by the public-facing 'play' or 'take' view.
 *
 * @param {string} questId - The ID of the quest being completed.
 * @param {Record<string, unknown>} answers - A map of question IDs to user-provided values.
 * @param {number} [duration] - Optional time taken to complete the quest (in seconds).
 * @returns {Promise<Response>} The created response object.
 */
export async function submitResponse(
  questId: string,
  answers: Record<string, unknown>,
  duration?: number,
) {
  // Check if quest exists and is currently accepting responses.
  const quest = await prisma.quest.findUnique({
    where: { id: questId, published: true, acceptingResponses: true },
  });

  if (!quest) {
    throw new Error("Quest not found or not accepting responses");
  }

  // Create the response and associated answers in a single transaction.
  const response = await prisma.$transaction(async (tx) => {
    // 1. Create the top-level Response entity
    const res = await tx.response.create({
      data: {
        questId,
        duration,
      },
    });

    // 2. Prepare and bulk-create the individual Answer entities
    const answerData = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      responseId: res.id,
      value: value as Prisma.InputJsonValue,
    }));

    await tx.answer.createMany({
      data: answerData,
    });

    return res;
  });

  // Keep the server-side cache fresh
  revalidatePath(`/quests/${questId}`);

  // Webhook Integration: If the quest owner has configured a webhook URL,
  // we trigger it now with the full payload of answers.
  if (quest.webhookEnabled && quest.webhookUrl) {
    try {
      // Fetch details needed for the webhook payload
      const responseWithAnswers = await prisma.response.findUnique({
        where: { id: response.id },
        include: {
          answers: {
            include: {
              question: true,
            },
          },
        },
      });

      if (responseWithAnswers) {
        // Fire-and-forget: execute the webhook call asynchronously
        // We don't await this so the user doesn't have to wait for the external server.
        fetch(quest.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            event: "response.submitted",
            questId: quest.id,
            questTitle: quest.title,
            responseId: response.id,
            submittedAt: responseWithAnswers.createdAt,
            duration: responseWithAnswers.duration,
            answers: responseWithAnswers.answers.map((a) => ({
              questionId: a.questionId,
              questionTitle: a.question.title,
              value: a.value,
            })),
          }),
        }).catch((err) => console.error("Webhook fetch failed:", err));
      }
    } catch (webhookErr) {
      console.error("Webhook processing failed:", webhookErr);
    }
  }

  return response;
}

/**
 * Retrieves all submitted responses for a specific quest.
 * Only accessible by the quest owner.
 *
 * @param {string} questId - The ID of the quest.
 * @returns {Promise<Response[]>} Responses with their answers and questions.
 */
export async function getQuestResponses(questId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const responses = await prisma.response.findMany({
    where: {
      questId,
      quest: {
        userId: session.user.id, // Validation: User must own the quest
      },
    },
    include: {
      answers: {
        include: {
          question: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc", // Show newest responses first
    },
  });

  return responses;
}

/**
 * Checks for new, unread responses across all of the user's quests.
 * Compares response creation time against the last time the user viewed the responses page.
 *
 * @returns {Promise<Notification[]>} List of quests with unread counts.
 */
export async function getUnreadNotifications() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return [];
  }

  // Get all of the user's quests and their last-viewed timestamps
  const quests = await prisma.quest.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      lastViewedResponsesAt: true,
    },
  });

  const unreadQuests = [];

  for (const quest of quests) {
    const lastViewed = quest.lastViewedResponsesAt || new Date(0);

    // Count responses created AFTER the last time the user checked
    const newCount = await prisma.response.count({
      where: {
        questId: quest.id,
        createdAt: {
          gt: lastViewed,
        },
      },
    });

    if (newCount > 0) {
      unreadQuests.push({
        id: quest.id,
        title: quest.title,
        newCount,
        updatedAt: quest.updatedAt,
      });
    }
  }

  return unreadQuests;
}

/**
 * Updates the 'lastViewedResponsesAt' timestamp for a quest to current time.
 * Effectively clears any 'unread' badges or notifications for that quest.
 *
 * @param {string} questId - The ID of the quest to mark as read.
 */
export async function markQuestResponsesAsRead(questId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  await prisma.quest.update({
    where: {
      id: questId,
      userId: session.user.id,
    },
    data: {
      lastViewedResponsesAt: new Date(),
    },
  });

  revalidatePath("/quests");
  revalidatePath(`/quests/${questId}`);
}
