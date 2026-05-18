import type { UserProfile } from '../types/firestoreUser';

/**
 * Daily nutrition target derived from the user profile.
 * We don't ask for age/sex/activity yet, so we use sensible adult defaults
 * (age 30, unisex average BMR, light-to-moderate activity).
 */
export type NutritionTarget = {
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

const KCAL_PER_G_PROTEIN = 4;
const KCAL_PER_G_CARBS = 4;
const KCAL_PER_G_FAT = 9;

const DEFAULT_AGE_YEARS = 30;
const ACTIVITY_MULTIPLIER = 1.45;

/**
 * Mifflin-St Jeor, averaged across sexes (we don't collect biological sex in the profile).
 * Result rounded to a whole kcal for clean display.
 */
function bmrUnisex(weightKg: number, heightCm: number, ageYears: number): number {
  const male = 10 * weightKg + 6.25 * heightCm - 5 * ageYears + 5;
  const female = 10 * weightKg + 6.25 * heightCm - 5 * ageYears - 161;
  return Math.round((male + female) / 2);
}

function clampMin(value: number, min: number): number {
  return value < min ? min : value;
}

export function defaultNutritionTarget(profile: UserProfile | null | undefined): NutritionTarget {
  const weightKg = profile?.weightKg && profile.weightKg > 0 ? profile.weightKg : 70;
  const heightCm = profile?.heightCm && profile.heightCm > 0 ? profile.heightCm : 175;
  const goal = profile?.goal ?? 'maintain';

  const bmr = bmrUnisex(weightKg, heightCm, DEFAULT_AGE_YEARS);
  const tdee = bmr * ACTIVITY_MULTIPLIER;

  let calories = tdee;
  if (goal === 'lose') calories -= 500;
  if (goal === 'build') calories += 300;
  calories = clampMin(Math.round(calories / 10) * 10, 1200);

  let proteinPerKg = 1.8;
  if (goal === 'lose') proteinPerKg = 2.0;
  if (goal === 'build') proteinPerKg = 2.2;
  const proteinG = Math.round(weightKg * proteinPerKg);

  const fatKcal = calories * 0.25;
  const fatG = clampMin(Math.round(fatKcal / KCAL_PER_G_FAT), 30);

  const proteinKcal = proteinG * KCAL_PER_G_PROTEIN;
  const fatKcalRounded = fatG * KCAL_PER_G_FAT;
  const carbKcal = clampMin(calories - proteinKcal - fatKcalRounded, 0);
  const carbsG = clampMin(Math.round(carbKcal / KCAL_PER_G_CARBS), 0);

  return { caloriesKcal: calories, proteinG, carbsG, fatG };
}

/** Total kcal for a meal entry computed from its macros (used to keep the doc consistent). */
export function caloriesFromMacros(proteinG: number, carbsG: number, fatG: number): number {
  return Math.round(
    proteinG * KCAL_PER_G_PROTEIN + carbsG * KCAL_PER_G_CARBS + fatG * KCAL_PER_G_FAT,
  );
}

export const NUTRITION_KCAL_PER_G = {
  protein: KCAL_PER_G_PROTEIN,
  carbs: KCAL_PER_G_CARBS,
  fat: KCAL_PER_G_FAT,
};
