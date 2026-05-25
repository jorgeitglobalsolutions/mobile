import type { Timestamp } from 'firebase/firestore';

export type RoutineExerciseTemplate = {
  name: string;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
};

export type RoutineDoc = {
  title: string;
  muscles: string;
  minutes: number;
  exerciseCount: number;
  category: string;
  isPredefined: boolean;
  exercises: RoutineExerciseTemplate[];
  description?: string;
  color?: string;
  icon?: string;
  updatedAt: Timestamp;
};

export type LoggedSet = { weightKg: number; reps: number; done: boolean };
export type LoggedExercise = { name: string; sets: LoggedSet[] };

export type WorkoutDoc = {
  routineId: string | null;
  title: string;
  startedAt: Timestamp;
  endedAt: Timestamp;
  durationSeconds: number;
  exercises: LoggedExercise[];
  totalVolumeKg: number;
  totalSets: number;
  bestSetVolumeKg: number;
};

export type MoodValue = 'great' | 'good' | 'low' | 'tired' | 'stressed';

export type HabitDayDoc = {
  date: string;
  proteinG: number;
  waterMl: number;
  workoutCompleted: boolean;
  mood?: MoodValue | null;
  proteinGoalG: number;
  waterGoalMl: number;
  /** Optional macro / calorie tracking (Phase 2 Module 2). Treated as 0 when absent. */
  caloriesKcal?: number;
  carbsG?: number;
  fatG?: number;
  caloriesGoalKcal?: number;
  carbsGoalG?: number;
  fatGoalG?: number;
  /** Light meal log so we keep simple history without a full food DB. */
  meals?: MealEntry[];
  updatedAt: Timestamp;
};

export type MealEntry = {
  id: string;
  /** Optional descriptive name like "Chicken bowl". */
  name?: string;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** ms epoch — small and lets us sort without Firestore timestamps inside arrays. */
  loggedAtMs: number;
  /** Set when logged from the built-in food database. */
  catalogFoodId?: string;
  /** Set when logged from the user's saved custom foods. */
  customFoodId?: string;
  /** Portion size in grams used to scale per-100g macros. */
  grams?: number;
};

/** Single body-weight log (users/{uid}/weightEntries). */
export type WeightEntryDoc = {
  weightKg: number;
  loggedAt: Timestamp;
  note?: string;
};
