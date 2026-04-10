import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const FOOD_CATEGORIES = ["breakfast", "lunch", "dinner", "snack", "drink"];

export async function searchFoods(params: URLSearchParams) {
  const queryText = params.get("q")?.trim() ?? "";
  const category = params.get("category")?.trim();
  const diabetesFriendlyParam = params.get("diabetesFriendly") === "true";

  const take = Math.min(Math.max(Number(params.get("limit") ?? 25) || 25, 1), 60);

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

  return {
    foods,
    count: foods.length,
  };
}
