type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";

export interface PlannerFood {
  id: string;
  slug: string;
  nameThai: string;
  nameEnglish: string;
  category: string;
  serving: string;
  calories: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  fiberG: number;
  diabetesFriendly: boolean;
  tags: string;
}

export interface PlannerInput {
  dailyCalories: number;
  mealsPerDay: number;
  includeSnack: boolean;
  excludeTags: string[];
}

const SLOT_DISTRIBUTION: Record<string, Record<MealSlot, number>> = {
  "3": {
    breakfast: 0.28,
    lunch: 0.38,
    dinner: 0.34,
    snack: 0,
  },
  "4": {
    breakfast: 0.24,
    lunch: 0.34,
    dinner: 0.3,
    snack: 0.12,
  },
};

function pickSlots(mealsPerDay: number, includeSnack: boolean): MealSlot[] {
  if (mealsPerDay <= 3 && !includeSnack) {
    return ["breakfast", "lunch", "dinner"];
  }

  return ["breakfast", "lunch", "dinner", "snack"];
}

function mealLabel(slot: MealSlot) {
  if (slot === "breakfast") return "มื้อเช้า";
  if (slot === "lunch") return "มื้อกลางวัน";
  if (slot === "dinner") return "มื้อเย็น";
  return "มื้อว่าง";
}

function parseTags(rawTags: string) {
  return rawTags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function pickFoodForSlot(
  slot: MealSlot,
  foods: PlannerFood[],
  targetCalories: number,
  targetCarbs: number,
  usedIds: Set<string>
) {
  const slotCandidates = foods.filter((food) => {
    if (!food.diabetesFriendly || usedIds.has(food.id)) {
      return false;
    }

    if (slot === "snack") {
      return food.category === "snack" || food.category === "drink";
    }

    return food.category === slot || food.category === "snack";
  });

  const candidates = slotCandidates.length > 0 ? slotCandidates : foods;

  let best = candidates[0];
  let bestScore = Number.POSITIVE_INFINITY;

  for (const food of candidates) {
    const calorieDelta = Math.abs(food.calories - targetCalories);
    const carbPenalty = Math.max(0, food.carbsG - targetCarbs) * 9;
    const score = calorieDelta + carbPenalty;

    if (score < bestScore) {
      best = food;
      bestScore = score;
    }
  }

  usedIds.add(best.id);
  return best;
}

export function generateDiabetesMealPlan(foods: PlannerFood[], input: PlannerInput) {
  const { dailyCalories, mealsPerDay, includeSnack, excludeTags } = input;
  const normalizedExcluded = excludeTags.map((tag) => tag.toLowerCase());

  const filteredFoods = foods.filter((food) => {
    if (!food.diabetesFriendly) {
      return false;
    }

    const tags = parseTags(food.tags);
    return !normalizedExcluded.some((excludedTag) => tags.includes(excludedTag));
  });

  if (filteredFoods.length === 0) {
    throw new Error("ไม่พบเมนูที่ตรงเงื่อนไข กรุณาลดข้อจำกัดและลองใหม่");
  }

  const slots = pickSlots(mealsPerDay, includeSnack);
  const distribution =
    slots.length === 3 ? SLOT_DISTRIBUTION["3"] : SLOT_DISTRIBUTION["4"];

  const dailyCarbBudget = (dailyCalories * 0.4) / 4;
  const usedIds = new Set<string>();

  const meals = slots.map((slot) => {
    const calorieTarget = Math.round(dailyCalories * distribution[slot]);
    const carbTarget = Math.round(dailyCarbBudget * distribution[slot]);
    const food = pickFoodForSlot(slot, filteredFoods, calorieTarget, carbTarget, usedIds);

    return {
      slot,
      label: mealLabel(slot),
      targetCalories: calorieTarget,
      targetCarbs: carbTarget,
      food: {
        id: food.id,
        nameThai: food.nameThai,
        nameEnglish: food.nameEnglish,
        serving: food.serving,
        calories: Math.round(food.calories),
        carbsG: Number(food.carbsG.toFixed(1)),
        proteinG: Number(food.proteinG.toFixed(1)),
        fatG: Number(food.fatG.toFixed(1)),
        fiberG: Number(food.fiberG.toFixed(1)),
      },
    };
  });

  const totals = meals.reduce(
    (acc, meal) => {
      acc.calories += meal.food.calories;
      acc.carbsG += meal.food.carbsG;
      acc.proteinG += meal.food.proteinG;
      acc.fatG += meal.food.fatG;
      acc.fiberG += meal.food.fiberG;
      return acc;
    },
    {
      calories: 0,
      carbsG: 0,
      proteinG: 0,
      fatG: 0,
      fiberG: 0,
    }
  );

  return {
    meals,
    totals: {
      calories: Math.round(totals.calories),
      carbsG: Number(totals.carbsG.toFixed(1)),
      proteinG: Number(totals.proteinG.toFixed(1)),
      fatG: Number(totals.fatG.toFixed(1)),
      fiberG: Number(totals.fiberG.toFixed(1)),
    },
  };
}
