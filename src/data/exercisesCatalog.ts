export type CatalogExercise = {
  id: string;
  name: string;
  muscle: string;
  /** Short coaching cue; expand later with CMS or Firestore. */
  instructions: string;
};

export const EXERCISES_CATALOG: CatalogExercise[] = [
  {
    id: 'bench-press',
    name: 'Bench Press',
    muscle: 'Chest',
    instructions:
      'Retract shoulder blades, drive feet into the floor, lower bar to mid-chest with control, press up in a slight arc.',
  },
  {
    id: 'incline-db-press',
    name: 'Incline Dumbbell Press',
    muscle: 'Chest',
    instructions: 'Set bench 30–45°, keep wrists stacked over elbows, control the stretch at the bottom without bouncing.',
  },
  {
    id: 'push-up',
    name: 'Push-Up',
    muscle: 'Chest',
    instructions: 'Body in a straight line from head to heels, chest travels to the floor, elbows ~45° from torso.',
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    muscle: 'Back',
    instructions: 'Hinge at hips, flat back, pull bar to lower ribs, squeeze shoulder blades at the top.',
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    muscle: 'Back',
    instructions: 'Lean slightly back, pull bar to upper chest, elbows track down and slightly back.',
  },
  {
    id: 'pull-up',
    name: 'Pull-Up',
    muscle: 'Back',
    instructions: 'Full hang to start, drive elbows toward hips, chin clears bar without excessive kip.',
  },
  {
    id: 'back-squat',
    name: 'Back Squat',
    muscle: 'Legs',
    instructions: 'Brace core, sit between hips and knees to depth you own, drive up evenly through mid-foot.',
  },
  {
    id: 'rdl',
    name: 'Romanian Deadlift',
    muscle: 'Legs',
    instructions: 'Soft knee bend, push hips back, bar tracks close to legs, feel hamstrings load before standing.',
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    muscle: 'Legs',
    instructions: 'Full foot contact on platform, lower under control without rounding low back off the pad.',
  },
  {
    id: 'ohp',
    name: 'Overhead Press',
    muscle: 'Shoulders',
    instructions: 'Glutes and core tight, bar path vertical over mid-foot, clear the face then press overhead.',
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    muscle: 'Shoulders',
    instructions: 'Slight bend in elbows, lead with elbows to shoulder height, control the lowering phase.',
  },
  {
    id: 'face-pull',
    name: 'Face Pull',
    muscle: 'Shoulders',
    instructions: 'Pull rope toward face with high elbows, externally rotate at end range for rear delts and rotator cuff.',
  },
  {
    id: 'db-curl',
    name: 'Dumbbell Curl',
    muscle: 'Arms',
    instructions: 'Keep upper arms vertical, supinate as you curl, no swinging from the low back.',
  },
  {
    id: 'tricep-pushdown',
    name: 'Triceps Pushdown',
    muscle: 'Arms',
    instructions: 'Elbows pinned to sides, extend fully without shrugging, stretch triceps at the top.',
  },
  {
    id: 'skullcrusher',
    name: 'Skull Crusher',
    muscle: 'Arms',
    instructions: 'Upper arms angled slightly back, hinge only at elbows, lower bar toward forehead with control.',
  },
  {
    id: 'plank',
    name: 'Plank',
    muscle: 'Core',
    instructions: 'Forearms under shoulders, ribs down, squeeze glutes, breathe behind the brace.',
  },
  {
    id: 'cable-crunch',
    name: 'Cable Crunch',
    muscle: 'Core',
    instructions: 'Round upper back to flex spine, exhale as you crunch down, avoid pulling with arms only.',
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    muscle: 'Back',
    instructions: 'Mid-foot under bar, hinge pattern, lats engaged, stand tall without hyperextending low back.',
  },
  {
    id: 'hip-thrust',
    name: 'Hip Thrust',
    muscle: 'Legs',
    instructions: 'Upper back on bench, shins vertical at top, squeeze glutes without overarching lumbar.',
  },
  {
    id: 'walking-lunge',
    name: 'Walking Lunge',
    muscle: 'Legs',
    instructions: 'Short controlled steps, torso tall, front knee tracks over foot without collapsing inward.',
  },
];

const byId = new Map(EXERCISES_CATALOG.map((e) => [e.id, e]));

export function getCatalogExercise(id: string): CatalogExercise | undefined {
  return byId.get(id);
}

export const MUSCLE_CATEGORIES = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'] as const;
