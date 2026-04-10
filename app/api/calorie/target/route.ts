import { NextRequest, NextResponse } from "next/server";

import { calculateAndSaveCalorieTarget } from "@/lib/backend/calorie.service";
import { respondWithError } from "@/lib/backend/response";
import { getUserFromRequest } from "@/lib/current-user";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const result = await calculateAndSaveCalorieTarget(user.id, payload);

    return NextResponse.json({
      message: "คำนวณและบันทึกเป้าหมายแคลอรี่แล้ว",
      target: result,
    });
  } catch (error) {
    return respondWithError(error, "ไม่สามารถคำนวณแคลอรี่ได้", "calorie target error");
  }
}
