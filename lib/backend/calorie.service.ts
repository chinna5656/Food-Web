import { calculateCalorieTarget } from "@/lib/calorie";
import { badRequest } from "@/lib/backend/errors";
import { prisma } from "@/lib/prisma";
import { calorieTargetSchema } from "@/lib/validators";

export async function calculateAndSaveCalorieTarget(userId: string, payload: unknown) {
  const parsed = calorieTargetSchema.safeParse(payload);

  if (!parsed.success) {
    throw badRequest("ข้อมูลคำนวณแคลอรี่ไม่ถูกต้อง", parsed.error.flatten());
  }

  const result = calculateCalorieTarget(parsed.data);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        age: parsed.data.age,
        sex: parsed.data.sex,
        weightKg: parsed.data.weightKg,
        heightCm: parsed.data.heightCm,
        activityLevel: parsed.data.activityLevel,
        goal: parsed.data.goal,
      },
    }),
    prisma.userTarget.create({
      data: {
        userId,
        dailyCalories: result.dailyCalories,
        carbsG: result.macros.carbsG,
        proteinG: result.macros.proteinG,
        fatG: result.macros.fatG,
        bmr: result.bmr,
        tdee: result.tdee,
        goal: parsed.data.goal,
      },
    }),
  ]);

  return result;
}
