import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/current-user";
import { getUtcDayBounds } from "@/lib/date";
import { prisma } from "@/lib/prisma";

function summarizeLogs(
  logs: Array<{ calories: number; carbsG: number; proteinG: number; fatG: number; fiberG: number }>
) {
  const totals = logs.reduce(
    (acc, log) => {
      acc.calories += log.calories;
      acc.carbsG += log.carbsG;
      acc.proteinG += log.proteinG;
      acc.fatG += log.fatG;
      acc.fiberG += log.fiberG;
      return acc;
    },
    {
      calories: 0,
      carbsG: 0,
      proteinG: 0,
      fatG: 0,
      fiberG: 0,
    }
  );

  return {
    calories: Math.round(totals.calories),
    carbsG: Number(totals.carbsG.toFixed(1)),
    proteinG: Number(totals.proteinG.toFixed(1)),
    fatG: Number(totals.fatG.toFixed(1)),
    fiberG: Number(totals.fiberG.toFixed(1)),
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { start, end, dateLabel } = getUtcDayBounds(request.nextUrl.searchParams.get("date"));

    const [latestTarget, logs] = await Promise.all([
      prisma.userTarget.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.calorieLog.findMany({
        where: {
          userId: user.id,
          date: {
            gte: start,
            lt: end,
          },
        },
        orderBy: [{ mealType: "asc" }, { createdAt: "desc" }],
      }),
    ]);

    const totals = summarizeLogs(logs);

    return NextResponse.json({
      user,
      latestTarget,
      today: {
        date: dateLabel,
        totals,
        logs,
      },
    });
  } catch (error) {
    console.error("profile error", error);
    return NextResponse.json({ message: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้" }, { status: 500 });
  }
}
