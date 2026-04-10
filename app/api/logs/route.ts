import { NextRequest, NextResponse } from "next/server";

import {
  createLogForUser,
  deleteLogForUser,
  getLogsByDate,
} from "@/lib/backend/logs.service";
import { respondWithError } from "@/lib/backend/response";
import { getUserFromRequest } from "@/lib/current-user";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const result = await getLogsByDate(user.id, request.nextUrl.searchParams.get("date"));
    return NextResponse.json(result);
  } catch (error) {
    return respondWithError(error, "ไม่สามารถโหลดบันทึกแคลอรี่ได้", "logs get error");
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const created = await createLogForUser(user.id, payload);

    return NextResponse.json({
      message: "บันทึกแคลอรี่สำเร็จ",
      log: created,
    });
  } catch (error) {
    return respondWithError(error, "ไม่สามารถบันทึกแคลอรี่ได้", "logs create error");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await deleteLogForUser(user.id, request.nextUrl.searchParams.get("id"));

    return NextResponse.json({ message: "ลบบันทึกแคลอรี่แล้ว" });
  } catch (error) {
    return respondWithError(error, "ไม่สามารถลบบันทึกได้", "logs delete error");
  }
}
