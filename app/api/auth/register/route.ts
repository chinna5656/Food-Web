import { NextRequest, NextResponse } from "next/server";

import { registerUser } from "@/lib/backend/auth.service";
import { respondWithError } from "@/lib/backend/response";
import { setAuthCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { user, token } = await registerUser(payload);

    const response = NextResponse.json({
      message: "สมัครสมาชิกสำเร็จ",
      user,
    });

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    return respondWithError(error, "ไม่สามารถสมัครสมาชิกได้", "register error");
  }
}
