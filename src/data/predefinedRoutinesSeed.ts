import type { RoutineExerciseTemplate } from '../types/domain';

export type SeedRoutine = {
  id: string;
  title: string;
  muscles: string;
  minutes: number;
  category: string;
  description: string;
  exercises: RoutineExerciseTemplate[];
};

/** Uses exercise names from assets/exercises catalog (see exercisesCatalog.ts). */
export const PREDEFINED_ROUTINES_SEED: SeedRoutine[] = [
  {
    id: 'seed_push',
    title: 'Push Day',
    muscles: 'Chest, Shoulders, Triceps',
    minutes: 60,
    category: 'Push',
    description: 'Focus on chest, shoulders, and triceps with compound movements and isolation work.',
    exercises: [
      { name: 'Dumbbell chest press', targetSets: 4, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Incline dumbbell press', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Barbell overhead press', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Dumbbell lateral raise', targetSets: 3, targetRepMin: 12, targetRepMax: 15 },
      { name: 'Rope triceps pushdown', targetSets: 3, targetRepMin: 10, targetRepMax: 15 },
      { name: 'High cable chest fly', targetSets: 3, targetRepMin: 12, targetRepMax: 15 },
    ],
  },
  {
    id: 'seed_pull',
    title: 'Pull Day',
    muscles: 'Back, Biceps',
    minutes: 58,
    category: 'Pull',
    description: 'Back width and thickness with biceps assistance work.',
    exercises: [
      { name: 'Incline barbell row', targetSets: 4, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Wide grip lat pulldown', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Seated cable row', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Reverse cable fly', targetSets: 3, targetRepMin: 12, targetRepMax: 15 },
      { name: 'Dumbbell bicep curl', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Seated neutral grip alternating curl', targetSets: 3, targetRepMin: 10, targetRepMax: 15 },
    ],
  },
  {
    id: 'seed_legs',
    title: 'Leg Day',
    muscles: 'Quads, Hamstrings, Glutes',
    minutes: 65,
    category: 'Legs',
    description: 'Lower body strength and hypertrophy.',
    exercises: [
      { name: 'Smith machine squat', targetSets: 4, targetRepMin: 5, targetRepMax: 8 },
      { name: 'Dumbbell Romanian deadlift', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Leg press', targetSets: 3, targetRepMin: 10, targetRepMax: 15 },
      { name: 'Lying leg curl', targetSets: 3, targetRepMin: 10, targetRepMax: 15 },
      { name: 'Dumbbell lunges', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Barbell hip thrust', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Plank', targetSets: 3, targetRepMin: 30, targetRepMax: 60 },
    ],
  },
  {
    id: 'seed_upper',
    title: 'Upper Body',
    muscles: 'Chest, Back, Arms',
    minutes: 70,
    category: 'Upper',
    description: 'Balanced upper session.',
    exercises: [
      { name: 'Dumbbell chest press', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Dumbbell row', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Barbell overhead press', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Wide grip lat pulldown', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Dumbbell bicep curl', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Rope triceps pushdown', targetSets: 3, targetRepMin: 10, targetRepMax: 15 },
      { name: 'Dumbbell lateral raise', targetSets: 3, targetRepMin: 12, targetRepMax: 15 },
      { name: 'Reverse cable fly', targetSets: 2, targetRepMin: 12, targetRepMax: 15 },
    ],
  },
  {
    id: 'seed_full',
    title: 'Full Body',
    muscles: 'Full Body',
    minutes: 55,
    category: 'Full Body',
    description: 'Efficient full-body strength session.',
    exercises: [
      { name: 'Smith machine squat', targetSets: 3, targetRepMin: 5, targetRepMax: 8 },
      { name: 'Dumbbell chest press', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Dumbbell row', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Dumbbell Romanian deadlift', targetSets: 2, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Barbell overhead press', targetSets: 2, targetRepMin: 6, targetRepMax: 10 },
    ],
  },
];
