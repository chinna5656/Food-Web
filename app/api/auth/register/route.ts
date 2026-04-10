import { NextRequest, NextResponse } from "next/server";

import { hashPassword, setAuthCookie, signAuthToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const parsed = registerSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "ข้อมูลสมัครสมาชิกไม่ถูกต้อง",
          errors: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { email, name, password, diabetesType } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json({ message: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        diabetesType,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const token = await signAuthToken({
      sub: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json({
      message: "สมัครสมาชิกสำเร็จ",
      user,
    });

    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error("register error", error);
    return NextResponse.json({ message: "ไม่สามารถสมัครสมาชิกได้" }, { status: 500 });
  }
}
