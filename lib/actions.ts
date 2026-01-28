"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { TEMPLATES } from "./templates";

export async function createQuest(title: string = "Untitled Quest", backgroundImageUrl?: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const quest = await prisma.quest.create({
    data: {
      title,
      userId: session.user.id,
      status: "Draft",
      backgroundImageUrl,
    },
  });

  revalidatePath("/quests");
  return quest;
}

export async function createQuestFromTemplate(templateId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  const template = TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    throw new Error("Template not found");
  }

  const quest = await prisma.quest.create({
    data: {
      title: template.title,
      userId: session.user.id,
      status: "Draft",
      backgroundImageUrl: template.backgroundImage,
      templateId: template.id,
    },
  });

  // Create questions
  if (template.questions.length > 0) {
    const questionsData = template.questions.map((q, index) => ({
      questId: quest.id,
      type: q.type,
      title: q.title,
      description: q.description || "",
      order: index,
      required: q.required || false,
      options: q.options || (q.type === 'MULTIPLE_CHOICE' || q.type === 'CHECKBOXES' || q.type === 'DROPDOWN' ? ["Option 1"] : undefined),
    }));

    await prisma.question.createMany({
      data: questionsData,
    });
  }

  revalidatePath("/quests");
  return quest;
}

export async function getRecentTemplates() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return [];
  }

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

  const uniqueTemplateIds = Array.from(new Set(recentQuests.map(q => q.templateId as string)));
  return uniqueTemplateIds.slice(0, 3);
}

export async function globalSearch(query: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !query.trim()) {
    return { quests: [], templates: [] };
  }

  const q = query.toLowerCase();

  // Search local quests and their questions
  const userQuests = await prisma.quest.findMany({
    where: {
      userId: session.user.id,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { questions: { some: { title: { contains: query, mode: 'insensitive' } } } },
        { questions: { some: { description: { contains: query, mode: 'insensitive' } } } },
      ]
    },
    include: {
      questions: {
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ]
        }
      }
    },
    take: 5,
  });

  // Search templates
  const matchedTemplates = TEMPLATES.filter(t => 
    t.title.toLowerCase().includes(q) || 
    t.description.toLowerCase().includes(q) ||
    t.questions.some(qn => qn.title.toLowerCase().includes(q) || qn.description?.toLowerCase().includes(q))
  ).slice(0, 5);

  return {
    quests: userQuests,
    templates: matchedTemplates,
  };
}

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
      userId: session.user.id,
    },
    include: {
      questions: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  return quest;
}

export async function updateQuest(id: string, data: { 
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
  backgroundImageUrl?: string;
}) {
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

  revalidatePath("/quests");
  revalidatePath(`/quests/${id}`);
  return quest;
}

export async function publishQuest(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  // Generate a short ID if not exists
  const quest = await prisma.quest.findUnique({
    where: { id, userId: session.user.id }
  });

  if (!quest) throw new Error("Quest not found");

  let shortId = quest.shortId;
  if (!shortId) {
    // Basic short ID generation - in production use a more robust library
    shortId = Math.random().toString(36).substring(2, 8);
    
    // Simple collision check (just once for demo purposes)
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
      userId: session.user.id,
    },
  });

  revalidatePath("/quests");
}

// Question Actions
export async function createQuestion(questId: string, type: string, order: number, title?: string, description?: string, required?: boolean, options?: string[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const quest = await prisma.quest.findUnique({
    where: { id: questId },
    select: { questionsRequiredByDefault: true }
  });

  const question = await prisma.question.create({
    data: {
      questId,
      type,
      title: title || `Untitled ${type.toLowerCase().replace('_', ' ')}`,
      description,
      order,
      required: required ?? quest?.questionsRequiredByDefault ?? false,
      options: options || (type === 'MULTIPLE_CHOICE' || type === 'CHECKBOXES' || type === 'DROPDOWN' ? ["Option 1"] : type === 'VIDEO' || type === 'IMAGE' ? [""] : undefined),
    },
  });

  revalidatePath(`/quests/${questId}`);
  return question;
}

export async function updateQuestion(id: string, questId: string, data: any) {
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

export async function duplicateQuestion(id: string, questId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const original = await prisma.question.findUnique({
    where: { id, questId }
  });

  if (!original) throw new Error("Question not found");

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

  // Reorder all questions to accommodate the new one
  const allQuestions = await prisma.question.findMany({
    where: { questId },
    orderBy: { order: "asc" }
  });

  const updates = allQuestions.map((q, index) => 
    prisma.question.update({
      where: { id: q.id },
      data: { order: index }
    })
  );

  await prisma.$transaction(updates);

  revalidatePath(`/quests/${questId}`);
  return question;
}

export async function updateQuestionsOrder(questId: string, questionIds: string[]) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const updates = questionIds.map((id, index) => 
    prisma.question.update({
      where: { id, questId },
      data: { order: index },
    })
  );

  await prisma.$transaction(updates);
  revalidatePath(`/quests/${questId}`);
}

export async function getPublicQuest(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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

  if (!quest) {
    return null;
  }

  if (!quest || !quest.published) {
    return null;
  }

  return quest;
}

export async function submitResponse(questId: string, answers: Record<string, any>, duration?: number) {
  const quest = await prisma.quest.findUnique({
    where: { id: questId, published: true, acceptingResponses: true },
  });

  if (!quest) {
    throw new Error("Quest not found or not accepting responses");
  }

  const response = await prisma.$transaction(async (tx) => {
    const res = await tx.response.create({
      data: {
        questId,
        duration,
      },
    });

    const answerData = Object.entries(answers).map(([questionId, value]) => ({
      questionId,
      responseId: res.id,
      value: value as any,
    }));

    await tx.answer.createMany({
      data: answerData,
    });

    return res;
  });

  revalidatePath(`/quests/${questId}`);

  // Webhook trigger logic
  if (quest.webhookEnabled && quest.webhookUrl) {
    try {
      // Build the webhook payload
      const responseWithAnswers = await prisma.response.findUnique({
        where: { id: response.id },
        include: {
          answers: {
            include: {
              question: true
            }
          }
        }
      });

      if (responseWithAnswers) {
        // Run as fire-and-forget in the background
        fetch(quest.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'response.submitted',
            questId: quest.id,
            questTitle: quest.title,
            responseId: response.id,
            submittedAt: responseWithAnswers.createdAt,
            duration: responseWithAnswers.duration,
            answers: responseWithAnswers.answers.map(a => ({
              questionId: a.questionId,
              questionTitle: a.question.title,
              value: a.value
            }))
          }),
        }).catch(err => console.error("Webhook fetch failed:", err));
      }
    } catch (webhookErr) {
      console.error("Webhook processing failed:", webhookErr);
    }
  }

  return response;
}

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
        userId: session.user.id,
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
      createdAt: "desc",
    },
  });

  return responses;
}
