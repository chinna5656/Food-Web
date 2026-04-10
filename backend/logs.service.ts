import { badRequest, notFound } from "@/backend/errors";
import { getUtcDayBounds } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { logCreateSchema } from "@/lib/validators";
import { summarizeNutrition } from "@/backend/summary";

export async function getLogsByDate(userId: string, dateText?: string | null) {
  const { start, end, dateLabel } = getUtcDayBounds(dateText);

  const logs = await prisma.calorieLog.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lt: end,
      },
    },
    orderBy: [{ mealType: "asc" }, { createdAt: "desc" }],
  });

  return {
    date: dateLabel,
    logs,
    totals: summarizeNutrition(logs),
  };
}

export async function createLogForUser(userId: string, payload: unknown) {
  const parsed = logCreateSchema.safeParse(payload);

  if (!parsed.success) {
    throw badRequest("ข้อมูลบันทึกแคลอรี่ไม่ถูกต้อง", parsed.error.flatten());
  }

  const data = parsed.data;
  const { start } = getUtcDayBounds(data.date);

  let foodName = data.customFoodName ?? "";
  let serving = data.customServing ?? null;
  let calories = data.calories ?? 0;
  let carbsG = data.carbsG ?? 0;
  let proteinG = data.proteinG ?? 0;
  let fatG = data.fatG ?? 0;
  let fiberG = data.fiberG ?? 0;

  if (data.foodId) {
    const selectedFood = await prisma.foodCatalog.findUnique({
      where: { id: data.foodId },
    });

    if (!selectedFood) {
      throw notFound("ไม่พบข้อมูลอาหารที่เลือก");
    }

    const multiplier = data.servingMultiplier ?? 1;
    foodName = selectedFood.nameThai;
    serving = `${selectedFood.serving} x ${multiplier}`;
    calories = selectedFood.calories * multiplier;
    carbsG = selectedFood.carbsG * multiplier;
    proteinG = selectedFood.proteinG * multiplier;
    fatG = selectedFood.fatG * multiplier;
    fiberG = selectedFood.fiberG * multiplier;
  }

  return prisma.calorieLog.create({
    data: {
      userId,
      date: start,
      mealType: data.mealType,
      foodName,
      serving,
      calories,
      carbsG,
      proteinG,
      fatG,
      fiberG,
      note: data.note,
    },
  });
}

export async function deleteLogForUser(userId: string, logId: string | null) {
  if (!logId) {
    throw badRequest("ไม่พบรหัสบันทึกที่ต้องการลบ");
  }

  const existing = await prisma.calorieLog.findUnique({ where: { id: logId } });

  if (!existing || existing.userId !== userId) {
    throw notFound("ไม่พบรายการที่ต้องการลบ");
  }

  await prisma.calorieLog.delete({ where: { id: logId } });

  return { deletedId: logId };
}
