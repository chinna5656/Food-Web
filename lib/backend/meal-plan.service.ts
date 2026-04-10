import { badRequest } from "@/lib/backend/errors";
import { generateDiabetesMealPlan } from "@/lib/meal-planner";
import { prisma } from "@/lib/prisma";
import { mealPlanSchema } from "@/lib/validators";

export async function createDiabetesMealPlanForUser(userId: string, payload: unknown) {
  const parsed = mealPlanSchema.safeParse(payload);

  if (!parsed.success) {
    throw badRequest("ข้อมูลสำหรับสร้างแผนอาหารไม่ถูกต้อง", parsed.error.flatten());
  }

  const latestTarget = await prisma.userTarget.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { dailyCalories: true },
  });

  const dailyCalories = parsed.data.dailyCalories ?? latestTarget?.dailyCalories ?? 1800;

  const foods = await prisma.foodCatalog.findMany({
    where: { diabetesFriendly: true },
    orderBy: [{ category: "asc" }, { calories: "asc" }],
    select: {
      id: true,
      slug: true,
      nameThai: true,
      nameEnglish: true,
      category: true,
      serving: true,
      calories: true,
      carbsG: true,
      proteinG: true,
      fatG: true,
      fiberG: true,
      diabetesFriendly: true,
      tags: true,
    },
  });

  const plan = generateDiabetesMealPlan(foods, {
    dailyCalories,
    mealsPerDay: parsed.data.mealsPerDay,
    includeSnack: parsed.data.includeSnack,
    excludeTags: parsed.data.excludeTags,
  });

  return {
    dailyCalories,
    ...plan,
  };
}
