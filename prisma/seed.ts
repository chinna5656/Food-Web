import { PrismaClient } from "@prisma/client";

import { FOOD_CATALOG } from "../lib/food-catalog";

const prisma = new PrismaClient();

async function main() {
  for (const item of FOOD_CATALOG) {
    await prisma.foodCatalog.upsert({
      where: { slug: item.slug },
      update: {
        nameThai: item.nameThai,
        nameEnglish: item.nameEnglish,
        category: item.category,
        serving: item.serving,
        calories: item.calories,
        carbsG: item.carbsG,
        proteinG: item.proteinG,
        fatG: item.fatG,
        fiberG: item.fiberG,
        sugarG: item.sugarG,
        sodiumMg: item.sodiumMg,
        diabetesFriendly: item.diabetesFriendly,
        tags: item.tags.join(","),
      },
      create: {
        slug: item.slug,
        nameThai: item.nameThai,
        nameEnglish: item.nameEnglish,
        category: item.category,
        serving: item.serving,
        calories: item.calories,
        carbsG: item.carbsG,
        proteinG: item.proteinG,
        fatG: item.fatG,
        fiberG: item.fiberG,
        sugarG: item.sugarG,
        sodiumMg: item.sodiumMg,
        diabetesFriendly: item.diabetesFriendly,
        tags: item.tags.join(","),
      },
    });
  }

  console.log(`Seeded ${FOOD_CATALOG.length} food items`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
