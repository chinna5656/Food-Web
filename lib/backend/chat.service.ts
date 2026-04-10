import { isAiAdvisorEnabled, requestAiAdvisorReply } from "@/lib/ai-advisor";
import { badRequest, notFound } from "@/lib/backend/errors";
import {
  generateAdvisorReply,
  type AdvisorContext,
  type AdvisorHistoryMessage,
} from "@/lib/chat-advisor";
import { getUtcDayBounds } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { chatAdviceSchema } from "@/lib/validators";

export interface ChatUserIdentity {
  id: string;
  name: string;
  diabetesType: string | null;
}

function summarizeToday(logs: Array<{ calories: number; carbsG: number }>) {
  return logs.reduce(
    (acc, log) => {
      acc.calories += log.calories;
      acc.carbsG += log.carbsG;
      return acc;
    },
    { calories: 0, carbsG: 0 }
  );
}

async function loadAdvisorContext(user: ChatUserIdentity) {
  const { start, end } = getUtcDayBounds();

  const [latestTarget, logsToday] = await Promise.all([
    prisma.userTarget.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { dailyCalories: true },
    }),
    prisma.calorieLog.findMany({
      where: {
        userId: user.id,
        date: {
          gte: start,
          lt: end,
        },
      },
      select: {
        calories: true,
        carbsG: true,
      },
    }),
  ]);

  const totals = summarizeToday(logsToday);

  const context: AdvisorContext = {
    userName: user.name,
    diabetesType: user.diabetesType,
    dailyCaloriesTarget: latestTarget?.dailyCalories ?? null,
    consumedCaloriesToday: totals.calories,
    carbsToday: totals.carbsG,
    mealsLoggedToday: logsToday.length,
  };

  return context;
}

export async function getChatSession(user: ChatUserIdentity) {
  const [context, messages] = await Promise.all([
    loadAdvisorContext(user),
    prisma.chatMessage.findMany({
      where: { userId: user.id },
      take: 40,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const ordered = messages.reverse();

  const welcomeMessage =
    ordered.length === 0
      ? [
          {
            id: "welcome",
            role: "assistant",
            content: generateAdvisorReply("สวัสดี", context),
            createdAt: new Date().toISOString(),
          },
        ]
      : [];

  return {
    context,
    messages: [...welcomeMessage, ...ordered],
    ai: {
      enabled: isAiAdvisorEnabled(),
    },
  };
}

export async function sendChatMessage(user: ChatUserIdentity, payload: unknown) {
  const parsed = chatAdviceSchema.safeParse(payload);

  if (!parsed.success) {
    throw badRequest("ข้อมูลข้อความไม่ถูกต้อง", parsed.error.flatten());
  }

  const [context, recentMessages] = await Promise.all([
    loadAdvisorContext(user),
    prisma.chatMessage.findMany({
      where: { userId: user.id },
      take: 16,
      orderBy: { createdAt: "desc" },
      select: {
        role: true,
        content: true,
      },
    }),
  ]);

  const orderedHistory: AdvisorHistoryMessage[] = recentMessages
    .reverse()
    .map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    }));

  const userMessageText = parsed.data.message;
  const aiReply = await requestAiAdvisorReply(userMessageText, context, orderedHistory);
  const advisorText = aiReply ?? generateAdvisorReply(userMessageText, context, orderedHistory);
  const engine = aiReply ? "ai" : "rule-based";

  const [userMessage, assistantMessage] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        userId: user.id,
        role: "user",
        content: userMessageText,
      },
    }),
    prisma.chatMessage.create({
      data: {
        userId: user.id,
        role: "assistant",
        content: advisorText,
      },
    }),
  ]);

  return {
    context,
    userMessage,
    assistantMessage,
    engine,
  };
}

export async function deleteChatMessages(userId: string, params: URLSearchParams) {
  const clearAll = params.get("all") === "true";

  if (clearAll) {
    const result = await prisma.chatMessage.deleteMany({
      where: { userId },
    });

    return {
      message: "ล้างประวัติแชทเรียบร้อย",
      deletedCount: result.count,
    };
  }

  const messageId = params.get("id");

  if (!messageId) {
    throw badRequest("ไม่พบข้อความที่ต้องการลบ");
  }

  const existing = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    select: {
      id: true,
      userId: true,
    },
  });

  if (!existing || existing.userId !== userId) {
    throw notFound("ไม่พบข้อความที่ต้องการลบ");
  }

  await prisma.chatMessage.delete({ where: { id: messageId } });

  return {
    message: "ลบข้อความสำเร็จ",
    deletedId: messageId,
  };
}
