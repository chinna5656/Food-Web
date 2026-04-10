import { NextRequest, NextResponse } from "next/server";

import { createDiabetesMealPlanForUser } from "@/lib/backend/meal-plan.service";
import { respondWithError } from "@/lib/backend/response";
import { getUserFromRequest } from "@/lib/current-user";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const plan = await createDiabetesMealPlanForUser(user.id, payload);

    return NextResponse.json({
      message: "สร้างแผนอาหารผู้ป่วยเบาหวานสำเร็จ",
      ...plan,
    });
  } catch (error) {
    return respondWithError(error, "ไม่สามารถสร้างแผนอาหารได้", "diabetes meal plan error");
  }
}
