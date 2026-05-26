/**
 * Builds realistic predefined routines from exercisesCatalog.
 * Run: node scripts/generatePredefinedRoutinesSeed.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const catalogPath = path.join(root, 'src', 'data', 'exercisesCatalog.ts');
const catalogSrc = fs.readFileSync(catalogPath, 'utf8');
const match = catalogSrc.match(/export const EXERCISES_CATALOG[^=]*=\s*(\[[\s\S]*?\])\s*as CatalogExercise/);
if (!match) throw new Error('Could not parse EXERCISES_CATALOG from exercisesCatalog.ts');
const catalog = JSON.parse(match[1]);
const catalogNames = new Set(catalog.map((e) => e.name));

const TIME_EXERCISES = new Set(['Plank', 'Wall sit']);

function repScheme(name) {
  if (TIME_EXERCISES.has(name)) {
    return { targetSets: 3, targetRepMin: 30, targetRepMax: 60 };
  }
  return { targetSets: 3, targetRepMin: 8, targetRepMax: 12 };
}

function toTemplate(name) {
  return { name, ...repScheme(name) };
}

function estimateMinutes(count) {
  return Math.min(75, Math.max(35, Math.round(count * 6 + 15)));
}

/**
 * Realistic gym programs — each session is 5–8 exercises (~40–60 min).
 * Categories match common training splits: Push, Pull, Legs, Full Body, Core.
 */
const ROUTINE_BLUEPRINTS = [
  {
    id: 'seed_push_chest',
    title: 'Push – Chest Focus',
    category: 'Push',
    muscles: 'Chest',
    description: 'Heavy pressing and fly work for chest development.',
    exercises: [
      'Dumbbell chest press',
      'Incline dumbbell press',
      'Incline barbell press',
      'Smith machine chest press',
      'Converging chest press machine',
      'Pec deck fly',
      'High cable chest fly',
    ],
  },
  {
    id: 'seed_push_chest_alt',
    title: 'Push – Chest & Bodyweight',
    category: 'Push',
    muscles: 'Chest',
    description: 'Machine and bodyweight chest variations for volume and control.',
    exercises: [
      'Wide grip chest press',
      'Close grip Smith chest press',
      'Single arm cable chest press',
      'Diamond push-up',
      'Wide chest push-up',
      'Pike push-up',
      'Hands elevated push-up',
      'Knee diamond push-up',
      'Push-up with shoulder tap',
      'Dumbbell pullover',
    ],
  },
  {
    id: 'seed_push_shoulders',
    title: 'Push – Shoulders',
    category: 'Push',
    muscles: 'Shoulders',
    description: 'Overhead pressing and delt isolation for strong, balanced shoulders.',
    exercises: [
      'Barbell overhead press',
      'Dumbbell overhead press',
      'Seated dumbbell shoulder press',
      'Smith machine shoulder press',
      'Dumbbell lateral raise',
      'Seated lateral raise',
      'Dumbbell front raise',
      'Single arm cable lateral raise',
      'Reverse cable fly',
      'Machine reverse fly',
    ],
  },
  {
    id: 'seed_push_triceps',
    title: 'Push – Triceps',
    category: 'Push',
    muscles: 'Triceps',
    description: 'Dedicated triceps session — extensions, pushdowns, and dips.',
    exercises: [
      'Rope triceps pushdown',
      'Straight bar triceps pushdown',
      'Triangle grip triceps pushdown',
      'Lying dumbbell triceps extension',
      'Single arm overhead cable triceps extension',
      'Bench dips',
    ],
  },
  {
    id: 'seed_pull_lat',
    title: 'Pull – Lat Focus',
    category: 'Pull',
    muscles: 'Back',
    description: 'Vertical pulling for back width and upper-back development.',
    exercises: [
      'Wide grip lat pulldown',
      'Close grip triangle lat pulldown',
      'Single arm cable pulldown',
      'Incline rope pulldown',
    ],
  },
  {
    id: 'seed_pull_rows',
    title: 'Pull – Rows',
    category: 'Pull',
    muscles: 'Back',
    description: 'Horizontal rowing for back thickness and mid-back strength.',
    exercises: [
      'Dumbbell row',
      'Incline barbell row',
      'Seated cable row',
      'Meadows row',
      'Wide grip T-bar row',
      'Converging machine row',
      'Inverted bench row',
    ],
  },
  {
    id: 'seed_pull_back_arms',
    title: 'Pull – Back & Biceps',
    category: 'Pull',
    muscles: 'Back, Biceps',
    description: 'Cable rows, lower back, and a full biceps finisher.',
    exercises: [
      'Close grip cable row',
      'Incline cable row',
      'Underhand wide grip cable row',
      'Roman chair hyperextension',
      'Alternating supinating curl',
      'Dumbbell bicep curl',
      'EZ bar curl',
      'EZ bar preacher curl',
      'Concentration curl',
      'EZ bar cable curl',
      'Reverse EZ bar curl',
      'Seated neutral grip alternating curl',
    ],
  },
  {
    id: 'seed_legs_quad',
    title: 'Legs – Quads & Squats',
    category: 'Legs',
    muscles: 'Quads, Glutes',
    description: 'Squat patterns, leg press, and quad-focused accessories.',
    exercises: [
      'Smith machine squat',
      'Hack squat machine',
      'Leg press',
      'Horizontal leg press',
      'Dumbbell Bulgarian split squat',
      'Dumbbell sumo squat',
      'Single leg extension',
      'Wall sit',
    ],
  },
  {
    id: 'seed_legs_posterior',
    title: 'Legs – Hinges & Hamstrings',
    category: 'Legs',
    muscles: 'Hamstrings, Glutes',
    description: 'Deadlifts, hip hinges, and hamstring isolation.',
    exercises: [
      'Barbell deadlift',
      'Dumbbell Romanian deadlift',
      'Barbell good morning',
      'Lying leg curl',
      'Seated leg curl',
      'Single leg curl machine',
      'Barbell hip thrust',
      'Smith machine hip thrust',
      'Dumbbell glute bridge',
    ],
  },
  {
    id: 'seed_legs_glutes',
    title: 'Legs – Glutes & Accessories',
    category: 'Legs',
    muscles: 'Glutes, Hips',
    description: 'Glute isolation, hip work, and unilateral leg accessories.',
    exercises: [
      'Low cable glute kickback',
      'Banded glute kickback on bench',
      'Hip abduction machine',
      'Hip adduction machine',
      'Banded hip abduction',
      'Cable hip abduction',
      'Dumbbell lunges',
      'Step-up with knee raise',
      'Dumbbell knee raise',
    ],
  },
  {
    id: 'seed_core',
    title: 'Core & Abs',
    category: 'Core',
    muscles: 'Core',
    description: 'Crunches, raises, and stability work for a strong midsection.',
    exercises: [
      'Plank',
      'Ab crunch',
      'Ab crunch on bench',
      'Bicycle crunch',
      'Oblique crunch',
      'Machine crunch',
      'High cable crunch',
      'Floor leg raise',
    ],
  },
  {
    id: 'seed_full_a',
    title: 'Full Body A',
    category: 'Full Body',
    muscles: 'Full Body',
    description: 'Balanced full-body session — squat, push, pull, and hinge.',
    exercises: [
      'Smith machine squat',
      'Dumbbell chest press',
      'Dumbbell row',
      'Barbell overhead press',
      'Dumbbell Romanian deadlift',
    ],
  },
  {
    id: 'seed_full_b',
    title: 'Full Body B',
    category: 'Full Body',
    muscles: 'Full Body',
    description: 'Second full-body day with different angles and patterns.',
    exercises: [
      'Leg press',
      'Incline dumbbell press',
      'Wide grip lat pulldown',
      'Seated cable row',
      'Rope triceps pushdown',
      'Dumbbell bicep curl',
    ],
  },
];

function buildRoutine(bp) {
  const unknown = bp.exercises.filter((n) => !catalogNames.has(n));
  if (unknown.length) {
    throw new Error(`Unknown exercises in ${bp.id}: ${unknown.join(', ')}`);
  }
  return {
    id: bp.id,
    title: bp.title,
    muscles: bp.muscles,
    minutes: estimateMinutes(bp.exercises.length),
    category: bp.category,
    description: bp.description,
    exercises: bp.exercises.map(toTemplate),
  };
}

const PREDEFINED_ROUTINES_SEED = ROUTINE_BLUEPRINTS.map(buildRoutine);

const FULL_BODY_IDS = new Set(['seed_full_a', 'seed_full_b']);

const assigned = new Map();
for (const r of PREDEFINED_ROUTINES_SEED) {
  for (const ex of r.exercises) {
    if (assigned.has(ex.name) && !FULL_BODY_IDS.has(r.id)) {
      console.error(`Duplicate assignment: ${ex.name} in ${assigned.get(ex.name)} and ${r.id}`);
      process.exit(1);
    }
    if (!FULL_BODY_IDS.has(r.id)) {
      assigned.set(ex.name, r.id);
    }
  }
}

const missing = [...catalogNames].filter((n) => !assigned.has(n));
if (missing.length) {
  console.error('Exercises not assigned to any routine:', missing);
  process.exit(1);
}

const ts = `import type { RoutineExerciseTemplate } from '../types/domain';

export type SeedRoutine = {
  id: string;
  title: string;
  muscles: string;
  minutes: number;
  category: string;
  description: string;
  exercises: RoutineExerciseTemplate[];
};

/** Auto-generated — run: node scripts/generatePredefinedRoutinesSeed.mjs */
export const PREDEFINED_ROUTINES_SEED: SeedRoutine[] = ${JSON.stringify(PREDEFINED_ROUTINES_SEED, null, 2)};
`;

fs.writeFileSync(path.join(root, 'src', 'data', 'predefinedRoutinesSeed.ts'), ts);
fs.writeFileSync(
  path.join(root, 'src', 'data', 'predefinedRoutinesSeed.json'),
  JSON.stringify(PREDEFINED_ROUTINES_SEED, null, 2),
);

const byCat = {};
for (const r of PREDEFINED_ROUTINES_SEED) {
  byCat[r.category] = (byCat[r.category] ?? 0) + 1;
}
console.log(`Wrote ${PREDEFINED_ROUTINES_SEED.length} routines covering ${assigned.size} exercises`);
console.log('By category:', byCat);
