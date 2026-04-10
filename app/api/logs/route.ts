import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/current-user";
import { getUtcDayBounds } from "@/lib/date";
import { prisma } from "@/lib/prisma";
import { logCreateSchema } from "@/lib/validators";

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

async function loadLogsForDate(userId: string, dateText?: string | null) {
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
    totals: summarizeLogs(logs),
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await loadLogsForDate(user.id, request.nextUrl.searchParams.get("date"));
    return NextResponse.json(result);
  } catch (error) {
    console.error("logs get error", error);
    return NextResponse.json({ message: "ไม่สามารถโหลดบันทึกแคลอรี่ได้" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const parsed = logCreateSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "ข้อมูลบันทึกแคลอรี่ไม่ถูกต้อง",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
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
        return NextResponse.json({ message: "ไม่พบข้อมูลอาหารที่เลือก" }, { status: 404 });
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

    const created = await prisma.calorieLog.create({
      data: {
        userId: user.id,
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

    return NextResponse.json({
      message: "บันทึกแคลอรี่สำเร็จ",
      log: created,
    });
  } catch (error) {
    console.error("logs create error", error);
    return NextResponse.json({ message: "ไม่สามารถบันทึกแคลอรี่ได้" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const logId = request.nextUrl.searchParams.get("id");

    if (!logId) {
      return NextResponse.json({ message: "ไม่พบรหัสบันทึกที่ต้องการลบ" }, { status: 400 });
    }

    const existing = await prisma.calorieLog.findUnique({ where: { id: logId } });

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ message: "ไม่พบรายการที่ต้องการลบ" }, { status: 404 });
    }

    await prisma.calorieLog.delete({ where: { id: logId } });

    return NextResponse.json({ message: "ลบบันทึกแคลอรี่แล้ว" });
  } catch (error) {
    console.error("logs delete error", error);
    return NextResponse.json({ message: "ไม่สามารถลบบันทึกได้" }, { status: 500 });
  }
}
