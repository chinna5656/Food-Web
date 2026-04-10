import { NextRequest, NextResponse } from "next/server";

import { loginUser } from "@/lib/backend/auth.service";
import { respondWithError } from "@/lib/backend/response";
import { setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { user, token } = await loginUser(payload);

    const response = NextResponse.json({
      message: "เข้าสู่ระบบสำเร็จ",
      user,
    });

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return respondWithError(error, "ไม่สามารถเข้าสู่ระบบได้", "login error");
  }
}
