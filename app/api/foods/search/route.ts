import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

const FOOD_CATEGORIES = ["breakfast", "lunch", "dinner", "snack", "drink"];

export async function GET(request: NextRequest) {
  try {
    const queryText = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const category = request.nextUrl.searchParams.get("category")?.trim();
    const diabetesFriendlyParam =
      request.nextUrl.searchParams.get("diabetesFriendly") === "true";

    const take = Math.min(
      Math.max(Number(request.nextUrl.searchParams.get("limit") ?? 25) || 25, 1),
      60
    );

    const where: Prisma.FoodCatalogWhereInput = {};

    if (queryText) {
      where.OR = [
        { nameThai: { contains: queryText } },
        { nameEnglish: { contains: queryText } },
        { tags: { contains: queryText.toLowerCase() } },
      ];
    }

    if (category && FOOD_CATEGORIES.includes(category)) {
      where.category = category;
    }

    if (diabetesFriendlyParam) {
      where.diabetesFriendly = true;
    }

    const foods = await prisma.foodCatalog.findMany({
      where,
      take,
      orderBy: [{ diabetesFriendly: "desc" }, { calories: "asc" }],
    });

    return NextResponse.json({ foods, count: foods.length });
  } catch (error) {
    console.error("foods search error", error);
    return NextResponse.json({ message: "ไม่สามารถค้นหาอาหารได้" }, { status: 500 });
  }
}
