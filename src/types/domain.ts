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
  updatedAt: Timestamp;
};
