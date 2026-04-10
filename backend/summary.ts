export interface NutritionRow {
  calories: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  fiberG: number;
}

export function summarizeNutrition(logs: NutritionRow[]) {
  const totals = logs.reduce(
    (acc, log) => {
      acc.calories += log.calories;
      acc.carbsG += log.carbsG;
      acc.proteinG += log.proteinG;
      acc.fatG += log.fatG;
      acc.fiberG += log.fiberG;
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
    calories: Math.round(totals.calories),
    carbsG: Number(totals.carbsG.toFixed(1)),
    proteinG: Number(totals.proteinG.toFixed(1)),
    fatG: Number(totals.fatG.toFixed(1)),
    fiberG: Number(totals.fiberG.toFixed(1)),
  };
}
