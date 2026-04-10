import { getUtcDayBounds } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { summarizeNutrition } from "@/backend/summary";

export async function getProfileSnapshot(userId: string, dateText?: string | null) {
  const { start, end, dateLabel } = getUtcDayBounds(dateText);

  const [latestTarget, logs] = await Promise.all([
    prisma.userTarget.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.calorieLog.findMany({
      where: {
        userId,
        date: {
          gte: start,
          lt: end,
        },
      },
      orderBy: [{ mealType: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  return {
    latestTarget,
    today: {
      date: dateLabel,
      totals: summarizeNutrition(logs),
      logs,
    },
  };
}
