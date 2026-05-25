import {
  Timestamp,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../lib/firebase';
import { isMockDataMode } from '../config/mockMode';
import * as mem from '../mock/inMemoryBackend';
import type { HabitDayDoc, MealEntry, MoodValue } from '../types/domain';
import type { UserProfile } from '../types/firestoreUser';
import { trackUserEvent } from './userEvents';
import { caloriesFromMacros, defaultNutritionTarget } from './nutritionTargets';

function habitDayRef(uid: string, date: string) {
  const db = getFirebaseFirestore();
  if (!db) throw new Error('Firestore not initialized');
  return doc(db, 'users', uid, 'habitDays', date);
}

export type HabitDefaults = {
  proteinGoalG: number;
  waterGoalMl: number;
  caloriesGoalKcal: number;
  carbsGoalG: number;
  fatGoalG: number;
};

/**
 * @deprecated Prefer {@link defaultHabitGoalsFromProfile} — kept for back-compat callers.
 */
export function defaultGoalsFromProfile(
  weightKg?: number,
  goal?: string,
): { proteinG: number; waterMl: number } {
  const w = weightKg && weightKg > 0 ? weightKg : 70;
  let proteinPerKg = 1.8;
  if (goal === 'lose') proteinPerKg = 2.0;
  if (goal === 'build') proteinPerKg = 2.2;
  const proteinG = Math.round(w * proteinPerKg);
  const waterMl = Math.round(w * 35);
  return { proteinG, waterMl };
}

/** Full per-day defaults derived from profile, including calorie & macro targets. */
export function defaultHabitGoalsFromProfile(profile: UserProfile | null | undefined): HabitDefaults {
  const w = profile?.weightKg && profile.weightKg > 0 ? profile.weightKg : 70;
  const waterMl = Math.round(w * 35);
  const target = defaultNutritionTarget(profile ?? null);
  return {
    proteinGoalG: target.proteinG,
    waterGoalMl: waterMl,
    caloriesGoalKcal: target.caloriesKcal,
    carbsGoalG: target.carbsG,
    fatGoalG: target.fatG,
  };
}

function applyGoalDefaults(cur: HabitDayDoc, defaults: HabitDefaults): Partial<HabitDayDoc> {
  return {
    proteinGoalG: cur.proteinGoalG || defaults.proteinGoalG,
    waterGoalMl: cur.waterGoalMl || defaults.waterGoalMl,
    caloriesGoalKcal: cur.caloriesGoalKcal || defaults.caloriesGoalKcal,
    carbsGoalG: cur.carbsGoalG || defaults.carbsGoalG,
    fatGoalG: cur.fatGoalG || defaults.fatGoalG,
  };
}

export async function getOrCreateHabitDay(
  uid: string,
  date: string,
  defaults: HabitDefaults,
): Promise<HabitDayDoc> {
  if (isMockDataMode()) {
    return mem.mockGetOrCreateHabitDay(uid, date, defaults);
  }
  const ref = habitDayRef(uid, date);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as HabitDayDoc;
  const initial: Omit<HabitDayDoc, 'updatedAt'> & { updatedAt: ReturnType<typeof serverTimestamp> } = {
    date,
    proteinG: 0,
    waterMl: 0,
    caloriesKcal: 0,
    carbsG: 0,
    fatG: 0,
    workoutCompleted: false,
    mood: null,
    proteinGoalG: defaults.proteinGoalG,
    waterGoalMl: defaults.waterGoalMl,
    caloriesGoalKcal: defaults.caloriesGoalKcal,
    carbsGoalG: defaults.carbsGoalG,
    fatGoalG: defaults.fatGoalG,
    meals: [],
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, initial);
  return { ...(initial as unknown as HabitDayDoc), updatedAt: Timestamp.now() };
}

export function subscribeHabitDay(
  uid: string,
  date: string,
  defaults: HabitDefaults,
  onData: (doc: HabitDayDoc | null) => void,
): Unsubscribe {
  if (isMockDataMode()) {
    return mem.mockSubscribeHabitDay(uid, date, defaults, onData);
  }
  const ref = habitDayRef(uid, date);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      onData({
        date,
        proteinG: 0,
        waterMl: 0,
        caloriesKcal: 0,
        carbsG: 0,
        fatG: 0,
        workoutCompleted: false,
        mood: null,
        proteinGoalG: defaults.proteinGoalG,
        waterGoalMl: defaults.waterGoalMl,
        caloriesGoalKcal: defaults.caloriesGoalKcal,
        carbsGoalG: defaults.carbsGoalG,
        fatGoalG: defaults.fatGoalG,
        meals: [],
        updatedAt: Timestamp.now(),
      });
      void setDoc(
        ref,
        {
          date,
          proteinG: 0,
          waterMl: 0,
          caloriesKcal: 0,
          carbsG: 0,
          fatG: 0,
          workoutCompleted: false,
          mood: null,
          proteinGoalG: defaults.proteinGoalG,
          waterGoalMl: defaults.waterGoalMl,
          caloriesGoalKcal: defaults.caloriesGoalKcal,
          carbsGoalG: defaults.carbsGoalG,
          fatGoalG: defaults.fatGoalG,
          meals: [],
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      return;
    }
    onData(snap.data() as HabitDayDoc);
  });
}

export async function incrementProtein(
  uid: string,
  date: string,
  deltaG: number,
  defaults: HabitDefaults,
) {
  if (isMockDataMode()) {
    await mem.mockIncrementProtein(uid, date, deltaG, defaults);
    return;
  }
  const ref = habitDayRef(uid, date);
  const cur = await getOrCreateHabitDay(uid, date, defaults);
  const next = Math.max(0, (cur.proteinG ?? 0) + deltaG);
  await setDoc(
    ref,
    {
      proteinG: next,
      ...applyGoalDefaults(cur, defaults),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await trackUserEvent(uid, 'habit_protein_updated', { date, deltaG, proteinG: next });
}

export async function incrementCarbs(
  uid: string,
  date: string,
  deltaG: number,
  defaults: HabitDefaults,
) {
  if (isMockDataMode()) {
    await mem.mockIncrementCarbs(uid, date, deltaG, defaults);
    return;
  }
  const ref = habitDayRef(uid, date);
  const cur = await getOrCreateHabitDay(uid, date, defaults);
  const next = Math.max(0, (cur.carbsG ?? 0) + deltaG);
  await setDoc(
    ref,
    {
      carbsG: next,
      ...applyGoalDefaults(cur, defaults),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await trackUserEvent(uid, 'habit_carbs_updated', { date, deltaG, carbsG: next });
}

export async function incrementFat(
  uid: string,
  date: string,
  deltaG: number,
  defaults: HabitDefaults,
) {
  if (isMockDataMode()) {
    await mem.mockIncrementFat(uid, date, deltaG, defaults);
    return;
  }
  const ref = habitDayRef(uid, date);
  const cur = await getOrCreateHabitDay(uid, date, defaults);
  const next = Math.max(0, (cur.fatG ?? 0) + deltaG);
  await setDoc(
    ref,
    {
      fatG: next,
      ...applyGoalDefaults(cur, defaults),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await trackUserEvent(uid, 'habit_fat_updated', { date, deltaG, fatG: next });
}

export async function incrementCalories(
  uid: string,
  date: string,
  deltaKcal: number,
  defaults: HabitDefaults,
) {
  if (isMockDataMode()) {
    await mem.mockIncrementCalories(uid, date, deltaKcal, defaults);
    return;
  }
  const ref = habitDayRef(uid, date);
  const cur = await getOrCreateHabitDay(uid, date, defaults);
  const next = Math.max(0, (cur.caloriesKcal ?? 0) + deltaKcal);
  await setDoc(
    ref,
    {
      caloriesKcal: next,
      ...applyGoalDefaults(cur, defaults),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await trackUserEvent(uid, 'habit_calories_updated', { date, deltaKcal, caloriesKcal: next });
}

export async function incrementWater(
  uid: string,
  date: string,
  deltaMl: number,
  defaults: HabitDefaults,
) {
  if (isMockDataMode()) {
    await mem.mockIncrementWater(uid, date, deltaMl, defaults);
    return;
  }
  const ref = habitDayRef(uid, date);
  const cur = await getOrCreateHabitDay(uid, date, defaults);
  const next = Math.max(0, (cur.waterMl ?? 0) + deltaMl);
  await setDoc(
    ref,
    {
      waterMl: next,
      ...applyGoalDefaults(cur, defaults),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await trackUserEvent(uid, 'habit_water_updated', { date, deltaMl, waterMl: next });
}

export async function setWorkoutCompleted(
  uid: string,
  date: string,
  completed: boolean,
  defaults: HabitDefaults,
) {
  if (isMockDataMode()) {
    await mem.mockSetWorkoutCompleted(uid, date, completed, defaults);
    return;
  }
  const ref = habitDayRef(uid, date);
  const cur = await getOrCreateHabitDay(uid, date, defaults);
  await setDoc(
    ref,
    {
      workoutCompleted: completed,
      ...applyGoalDefaults(cur, defaults),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await trackUserEvent(uid, 'habit_workout_completed', { date, completed });
}

export async function setMood(
  uid: string,
  date: string,
  mood: MoodValue | null,
  defaults: HabitDefaults,
) {
  if (isMockDataMode()) {
    await mem.mockSetMood(uid, date, mood, defaults);
    return;
  }
  const ref = habitDayRef(uid, date);
  const cur = await getOrCreateHabitDay(uid, date, defaults);
  await setDoc(
    ref,
    {
      mood,
      ...applyGoalDefaults(cur, defaults),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await trackUserEvent(uid, 'habit_mood_updated', { date, mood });
}

/**
 * Append a meal entry (and bump totals in one write). The caller passes the macros;
 * calories are normalized via caloriesFromMacros so totals stay consistent.
 */
export async function logMeal(
  uid: string,
  date: string,
  input: {
    name?: string;
    proteinG: number;
    carbsG: number;
    fatG: number;
    caloriesKcal?: number;
    catalogFoodId?: string;
    customFoodId?: string;
    grams?: number;
  },
  defaults: HabitDefaults,
): Promise<MealEntry> {
  const protein = Math.max(0, Math.round(input.proteinG * 10) / 10);
  const carbs = Math.max(0, Math.round(input.carbsG * 10) / 10);
  const fat = Math.max(0, Math.round(input.fatG * 10) / 10);
  const kcal = Math.max(0, Math.round(input.caloriesKcal ?? caloriesFromMacros(protein, carbs, fat)));
  const entry: MealEntry = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name?.trim() || undefined,
    proteinG: protein,
    carbsG: carbs,
    fatG: fat,
    caloriesKcal: kcal,
    loggedAtMs: Date.now(),
    ...(input.catalogFoodId ? { catalogFoodId: input.catalogFoodId } : {}),
    ...(input.customFoodId ? { customFoodId: input.customFoodId } : {}),
    ...(input.grams != null && input.grams > 0 ? { grams: input.grams } : {}),
  };
  if (isMockDataMode()) {
    await mem.mockAppendMeal(uid, date, entry, defaults);
    return entry;
  }
  const ref = habitDayRef(uid, date);
  const cur = await getOrCreateHabitDay(uid, date, defaults);
  const meals = Array.isArray(cur.meals) ? [...cur.meals, entry] : [entry];
  await setDoc(
    ref,
    {
      meals,
      proteinG: Math.max(0, (cur.proteinG ?? 0) + protein),
      carbsG: Math.max(0, (cur.carbsG ?? 0) + carbs),
      fatG: Math.max(0, (cur.fatG ?? 0) + fat),
      caloriesKcal: Math.max(0, (cur.caloriesKcal ?? 0) + kcal),
      ...applyGoalDefaults(cur, defaults),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await trackUserEvent(uid, 'meal_logged', {
    date,
    mealId: entry.id,
    proteinG: protein,
    carbsG: carbs,
    fatG: fat,
    caloriesKcal: kcal,
  });
  return entry;
}

export async function removeMeal(
  uid: string,
  date: string,
  mealId: string,
  defaults: HabitDefaults,
): Promise<void> {
  if (isMockDataMode()) {
    await mem.mockRemoveMeal(uid, date, mealId, defaults);
    return;
  }
  const ref = habitDayRef(uid, date);
  const cur = await getOrCreateHabitDay(uid, date, defaults);
  const existing = (cur.meals ?? []).find((m) => m.id === mealId);
  if (!existing) return;
  const meals = (cur.meals ?? []).filter((m) => m.id !== mealId);
  await setDoc(
    ref,
    {
      meals,
      proteinG: Math.max(0, (cur.proteinG ?? 0) - existing.proteinG),
      carbsG: Math.max(0, (cur.carbsG ?? 0) - existing.carbsG),
      fatG: Math.max(0, (cur.fatG ?? 0) - existing.fatG),
      caloriesKcal: Math.max(0, (cur.caloriesKcal ?? 0) - existing.caloriesKcal),
      ...applyGoalDefaults(cur, defaults),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  await trackUserEvent(uid, 'meal_removed', { date, mealId });
}
