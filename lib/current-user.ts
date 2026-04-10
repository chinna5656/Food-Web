import type { NextRequest } from "next/server";

import { verifyAuthToken } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/config";
import { prisma } from "@/lib/prisma";

export async function getUserFromRequest(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyAuthToken(token);

  if (!payload?.sub) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      diabetesType: true,
      age: true,
      sex: true,
      weightKg: true,
      heightCm: true,
      activityLevel: true,
      goal: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}
