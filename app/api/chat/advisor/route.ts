import { NextRequest, NextResponse } from "next/server";

import {
  generateAdvisorReply,
  type AdvisorContext,
  type AdvisorHistoryMessage,
} from "@/lib/chat-advisor";
import { getUserFromRequest } from "@/lib/current-user";
import { getUtcDayBounds } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { chatAdviceSchema } from "@/lib/validators";

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

async function loadAdvisorContext(userId: string, userName: string, diabetesType: string | null) {
  const { start, end } = getUtcDayBounds();

  const [latestTarget, logsToday] = await Promise.all([
    prisma.userTarget.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { dailyCalories: true },
    }),
    prisma.calorieLog.findMany({
      where: {
        userId,
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
    userName,
    diabetesType,
    dailyCaloriesTarget: latestTarget?.dailyCalories ?? null,
    consumedCaloriesToday: totals.calories,
    carbsToday: totals.carbsG,
    mealsLoggedToday: logsToday.length,
  };

  return context;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [context, messages] = await Promise.all([
      loadAdvisorContext(user.id, user.name, user.diabetesType),
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

    return NextResponse.json({
      context,
      messages: [...welcomeMessage, ...ordered],
    });
  } catch (error) {
    console.error("chat get error", error);
    return NextResponse.json({ message: "ไม่สามารถโหลดประวัติแชทได้" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const parsed = chatAdviceSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "ข้อมูลข้อความไม่ถูกต้อง",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const [context, recentMessages] = await Promise.all([
      loadAdvisorContext(user.id, user.name, user.diabetesType),
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
    const advisorText = generateAdvisorReply(userMessageText, context, orderedHistory);

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

    return NextResponse.json({
      context,
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error("chat post error", error);
    return NextResponse.json({ message: "ไม่สามารถส่งข้อความได้" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const clearAll = request.nextUrl.searchParams.get("all") === "true";

    if (clearAll) {
      const result = await prisma.chatMessage.deleteMany({
        where: { userId: user.id },
      });

      return NextResponse.json({
        message: "ล้างประวัติแชทเรียบร้อย",
        deletedCount: result.count,
      });
    }

    const messageId = request.nextUrl.searchParams.get("id");

    if (!messageId) {
      return NextResponse.json({ message: "ไม่พบข้อความที่ต้องการลบ" }, { status: 400 });
    }

    const existing = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ message: "ไม่พบข้อความที่ต้องการลบ" }, { status: 404 });
    }

    await prisma.chatMessage.delete({ where: { id: messageId } });

    return NextResponse.json({ message: "ลบข้อความสำเร็จ", deletedId: messageId });
  } catch (error) {
    console.error("chat delete error", error);
    return NextResponse.json({ message: "ไม่สามารถลบข้อความได้" }, { status: 500 });
  }
}
