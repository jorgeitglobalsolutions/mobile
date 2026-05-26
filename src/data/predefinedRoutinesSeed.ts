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

export const PREDEFINED_ROUTINES_SEED: SeedRoutine[] = [
  {
    id: 'seed_push',
    title: 'Push Day',
    muscles: 'Chest, Shoulders, Triceps',
    minutes: 60,
    category: 'Push',
    description: 'Focus on chest, shoulders, and triceps with compound movements and isolation work.',
    exercises: [
      { name: 'Bench Press', targetSets: 4, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Incline Dumbbell Press', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Overhead Press', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Lateral Raise', targetSets: 3, targetRepMin: 12, targetRepMax: 15 },
      { name: 'Triceps Pushdown', targetSets: 3, targetRepMin: 10, targetRepMax: 15 },
      { name: 'Cable Fly', targetSets: 3, targetRepMin: 12, targetRepMax: 15 },
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
      { name: 'Barbell Row', targetSets: 4, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Lat Pulldown', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Seated Cable Row', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Face Pull', targetSets: 3, targetRepMin: 12, targetRepMax: 15 },
      { name: 'Dumbbell Curl', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Hammer Curl', targetSets: 3, targetRepMin: 10, targetRepMax: 15 },
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
      { name: 'Back Squat', targetSets: 4, targetRepMin: 5, targetRepMax: 8 },
      { name: 'Romanian Deadlift', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Leg Press', targetSets: 3, targetRepMin: 10, targetRepMax: 15 },
      { name: 'Leg Curl', targetSets: 3, targetRepMin: 10, targetRepMax: 15 },
      { name: 'Walking Lunge', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Standing Calf Raise', targetSets: 4, targetRepMin: 12, targetRepMax: 20 },
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
      { name: 'Bench Press', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Barbell Row', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Overhead Press', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Lat Pulldown', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Dumbbell Curl', targetSets: 3, targetRepMin: 8, targetRepMax: 12 },
      { name: 'Triceps Pushdown', targetSets: 3, targetRepMin: 10, targetRepMax: 15 },
      { name: 'Lateral Raise', targetSets: 3, targetRepMin: 12, targetRepMax: 15 },
      { name: 'Face Pull', targetSets: 2, targetRepMin: 12, targetRepMax: 15 },
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
      { name: 'Back Squat', targetSets: 3, targetRepMin: 5, targetRepMax: 8 },
      { name: 'Bench Press', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Barbell Row', targetSets: 3, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Romanian Deadlift', targetSets: 2, targetRepMin: 6, targetRepMax: 10 },
      { name: 'Overhead Press', targetSets: 2, targetRepMin: 6, targetRepMax: 10 },
    ],
  },
];
