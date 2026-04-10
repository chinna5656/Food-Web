import { z } from "zod";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const registerSchema = z.object({
  name: z.string().trim().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร").max(80),
  email: z.string().email("อีเมลไม่ถูกต้อง").transform(normalizeEmail),
  password: z
    .string()
    .min(8, "รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร")
    .max(72, "รหัสผ่านยาวเกินไป"),
  diabetesType: z
    .enum(["type1", "type2", "prediabetes", "gestational", "other"])
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง").transform(normalizeEmail),
  password: z.string().min(8).max(72),
});

export const calorieTargetSchema = z.object({
  age: z.coerce.number().int().min(15).max(90),
  sex: z.enum(["male", "female"]),
  weightKg: z.coerce.number().min(30).max(250),
  heightCm: z.coerce.number().min(120).max(230),
  activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very-active"]),
  goal: z.enum(["maintain", "lose", "gain"]),
});

export const mealPlanSchema = z.object({
  dailyCalories: z.coerce.number().int().min(1200).max(4000).optional(),
  mealsPerDay: z.coerce.number().int().min(3).max(4).default(4),
  includeSnack: z.boolean().default(true),
  excludeTags: z.array(z.string().trim().min(1).max(40)).default([]),
});

export const mealTypeSchema = z.enum(["breakfast", "lunch", "dinner", "snack"]);

export const logCreateSchema = z
  .object({
    date: z.string().optional(),
    mealType: mealTypeSchema,
    foodId: z.string().optional(),
    servingMultiplier: z.coerce.number().min(0.25).max(4).default(1),
    customFoodName: z.string().trim().min(1).max(120).optional(),
    customServing: z.string().trim().max(60).optional(),
    calories: z.coerce.number().min(0).max(3000).optional(),
    carbsG: z.coerce.number().min(0).max(500).optional(),
    proteinG: z.coerce.number().min(0).max(300).optional(),
    fatG: z.coerce.number().min(0).max(300).optional(),
    fiberG: z.coerce.number().min(0).max(120).optional(),
    note: z.string().trim().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    const useFoodCatalog = Boolean(data.foodId);
    const useCustomFood = Boolean(data.customFoodName && data.calories !== undefined);

    if (!useFoodCatalog && !useCustomFood) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["foodId"],
        message: "กรุณาเลือกอาหารจากระบบ หรือกรอกข้อมูลอาหารเอง",
      });
    }
  });

export const chatAdviceSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "กรุณาพิมพ์ข้อความก่อนส่ง")
    .max(600, "ข้อความยาวเกินไป กรุณาลดให้น้อยกว่า 600 ตัวอักษร"),
});
