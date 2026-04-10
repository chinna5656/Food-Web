import { NextRequest, NextResponse } from "next/server";

import { getProfileSnapshot } from "@/lib/backend/profile.service";
import { respondWithError } from "@/lib/backend/response";
import { getUserFromRequest } from "@/lib/current-user";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const profileSnapshot = await getProfileSnapshot(
      user.id,
      request.nextUrl.searchParams.get("date")
    );

    return NextResponse.json({
      user,
      ...profileSnapshot,
    });
  } catch (error) {
    return respondWithError(error, "ไม่สามารถโหลดข้อมูลผู้ใช้ได้", "profile error");
  }
}
