import { hashPassword, signAuthToken, verifyPassword } from "@/lib/auth";
import { conflict, unauthorized, badRequest } from "@/backend/errors";
import { prisma } from "@/lib/prisma";
import { loginSchema, registerSchema } from "@/lib/validators";

export async function registerUser(payload: unknown) {
  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    throw badRequest("ข้อมูลสมัครสมาชิกไม่ถูกต้อง", parsed.error.flatten());
  }

  const { email, name, password, diabetesType } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw conflict("อีเมลนี้ถูกใช้งานแล้ว");
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

  return {
    user,
    token,
  };
}

export async function loginUser(payload: unknown) {
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    throw badRequest("ข้อมูลเข้าสู่ระบบไม่ถูกต้อง", parsed.error.flatten());
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      passwordHash: true,
    },
  });

  if (!user) {
    throw unauthorized("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw unauthorized("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  }

  const token = await signAuthToken({
    sub: user.id,
    email: user.email,
    name: user.name,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    token,
  };
}
