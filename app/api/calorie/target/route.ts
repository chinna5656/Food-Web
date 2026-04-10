import { NextRequest, NextResponse } from "next/server";

import { calculateCalorieTarget } from "@/lib/calorie";
import { getUserFromRequest } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { calorieTargetSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const parsed = calorieTargetSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "ข้อมูลคำนวณแคลอรี่ไม่ถูกต้อง",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = calculateCalorieTarget(parsed.data);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
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
          userId: user.id,
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

    return NextResponse.json({
      message: "คำนวณและบันทึกเป้าหมายแคลอรี่แล้ว",
      target: result,
    });
  } catch (error) {
    console.error("calorie target error", error);
    return NextResponse.json({ message: "ไม่สามารถคำนวณแคลอรี่ได้" }, { status: 500 });
  }
}
