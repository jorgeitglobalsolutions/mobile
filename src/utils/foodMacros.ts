import type { FoodMacros } from '../types/food';

/** Scale per-100g macros to an arbitrary gram portion. */
export function macrosForGrams(macrosPer100g: FoodMacros, grams: number): FoodMacros {
  const g = Math.max(0, grams);
  const factor = g / 100;
  return {
    protein: round1(macrosPer100g.protein * factor),
    carbs: round1(macrosPer100g.carbs * factor),
    fat: round1(macrosPer100g.fat * factor),
    calories: Math.round(macrosPer100g.calories * factor),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function normalizeCustomFoodMacros(input: {
  name: string;
  proteinG: number;
  carbsG: number;
  fatG: number;
  caloriesKcal?: number;
}): FoodMacros & { name: string } {
  const protein = Math.max(0, input.proteinG);
  const carbs = Math.max(0, input.carbsG);
  const fat = Math.max(0, input.fatG);
  const calories =
    input.caloriesKcal != null && input.caloriesKcal > 0
      ? Math.round(input.caloriesKcal)
      : Math.round(protein * 4 + carbs * 4 + fat * 9);
  return {
    name: input.name.trim(),
    protein,
    carbs,
    fat,
    calories,
  };
}
