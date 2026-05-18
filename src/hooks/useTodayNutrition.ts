import { useEffect, useMemo, useState } from 'react';
import type { HabitDayDoc } from '../types/domain';
import type { UserProfile } from '../types/firestoreUser';
import { defaultHabitGoalsFromProfile, subscribeHabitDay } from '../services/habitsRepo';
import { defaultNutritionTarget } from '../services/nutritionTargets';
import { localDateKey } from '../utils/dateKey';

export type NutritionSnapshot = {
  dateKey: string;
  caloriesCur: number;
  caloriesGoal: number;
  proteinCur: number;
  proteinGoal: number;
  carbsCur: number;
  carbsGoal: number;
  fatCur: number;
  fatGoal: number;
  mealCount: number;
  caloriesPct: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
  caloriesRemaining: number;
  caloriesOver: number;
};

function pct(cur: number, goal: number): number {
  if (goal <= 0) return 0;
  return Math.min(1, Math.max(0, cur / goal));
}

export function buildNutritionSnapshot(
  habitDay: HabitDayDoc | null,
  defaults: ReturnType<typeof defaultHabitGoalsFromProfile>,
  dateKey: string,
): NutritionSnapshot {
  const caloriesCur = habitDay?.caloriesKcal ?? 0;
  const caloriesGoal = habitDay?.caloriesGoalKcal || defaults.caloriesGoalKcal;
  const proteinCur = habitDay?.proteinG ?? 0;
  const proteinGoal = habitDay?.proteinGoalG || defaults.proteinGoalG;
  const carbsCur = habitDay?.carbsG ?? 0;
  const carbsGoal = habitDay?.carbsGoalG || defaults.carbsGoalG;
  const fatCur = habitDay?.fatG ?? 0;
  const fatGoal = habitDay?.fatGoalG || defaults.fatGoalG;

  return {
    dateKey,
    caloriesCur,
    caloriesGoal,
    proteinCur,
    proteinGoal,
    carbsCur,
    carbsGoal,
    fatCur,
    fatGoal,
    mealCount: habitDay?.meals?.length ?? 0,
    caloriesPct: pct(caloriesCur, caloriesGoal),
    proteinPct: pct(proteinCur, proteinGoal),
    carbsPct: pct(carbsCur, carbsGoal),
    fatPct: pct(fatCur, fatGoal),
    caloriesRemaining: Math.max(0, Math.round(caloriesGoal - caloriesCur)),
    caloriesOver: Math.max(0, Math.round(caloriesCur - caloriesGoal)),
  };
}

export function useTodayNutrition(uid: string | undefined, profile: UserProfile | null | undefined) {
  const [habitDay, setHabitDay] = useState<HabitDayDoc | null>(null);
  const dateKey = localDateKey();

  const defaults = useMemo(() => defaultHabitGoalsFromProfile(profile ?? null), [profile]);
  const targets = useMemo(() => defaultNutritionTarget(profile ?? null), [profile]);

  useEffect(() => {
    if (!uid) {
      setHabitDay(null);
      return;
    }
    const unsub = subscribeHabitDay(uid, dateKey, defaults, setHabitDay);
    return () => unsub();
  }, [
    uid,
    dateKey,
    defaults.proteinGoalG,
    defaults.waterGoalMl,
    defaults.caloriesGoalKcal,
    defaults.carbsGoalG,
    defaults.fatGoalG,
  ]);

  const snapshot = useMemo(
    () => buildNutritionSnapshot(habitDay, defaults, dateKey),
    [habitDay, defaults, dateKey],
  );

  return { habitDay, defaults, targets, snapshot, dateKey };
}
