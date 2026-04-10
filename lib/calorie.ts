export type BiologicalSex = "male" | "female";
export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very-active";
export type GoalType = "maintain" | "lose" | "gain";

export interface CalorieInput {
  age: number;
  sex: BiologicalSex;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: GoalType;
}

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  "very-active": 1.9,
};

const GOAL_ADJUSTMENT: Record<GoalType, number> = {
  maintain: 0,
  lose: -400,
  gain: 250,
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function calculateCalorieTarget(input: CalorieInput) {
  const { age, sex, weightKg, heightCm, activityLevel, goal } = input;

  const baseBmr =
    sex === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;

  const tdee = baseBmr * ACTIVITY_MULTIPLIER[activityLevel];
  const dailyCalories = Math.round(clamp(tdee + GOAL_ADJUSTMENT[goal], 1200, 4000));

  const carbsG = Math.round((dailyCalories * 0.4) / 4);
  const proteinG = Math.round((dailyCalories * 0.3) / 4);
  const fatG = Math.round((dailyCalories * 0.3) / 9);

  return {
    bmr: Math.round(baseBmr),
    tdee: Math.round(tdee),
    dailyCalories,
    macros: {
      carbsG,
      proteinG,
      fatG,
    },
    calorieRange: {
      lower: Math.round(dailyCalories * 0.92),
      upper: Math.round(dailyCalories * 1.08),
    },
  };
}
