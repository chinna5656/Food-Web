import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/current-user";
import { generateDiabetesMealPlan } from "@/lib/meal-planner";
import { prisma } from "@/lib/prisma";
import { mealPlanSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const parsed = mealPlanSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "ข้อมูลสำหรับสร้างแผนอาหารไม่ถูกต้อง",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const latestTarget = await prisma.userTarget.findFirst({
      where: { userId: user.id },
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

    return NextResponse.json({
      message: "สร้างแผนอาหารผู้ป่วยเบาหวานสำเร็จ",
      dailyCalories,
      ...plan,
    });
  } catch (error) {
    console.error("diabetes meal plan error", error);

    const errorMessage =
      error instanceof Error ? error.message : "ไม่สามารถสร้างแผนอาหารได้";

    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
