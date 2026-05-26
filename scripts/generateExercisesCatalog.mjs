/**
 * Scans assets/exercises and generates catalog + static require map.
 * Run: node scripts/generateExercisesCatalog.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const assetsRoot = path.join(root, 'assets', 'exercises');

const FOLDER_MUSCLE = {
  'back exercises': 'Back',
  'biceps exercises': 'Biceps',
  'chest exercises': 'Chest',
  'core exercises': 'Core',
  'leg exercises': 'Legs',
  'shoulder exercises': 'Shoulders',
  'triceps exercises': 'Triceps',
};

const INSTRUCTIONS_BY_MUSCLE = {
  Back: 'Brace your core, pull with your back muscles, and squeeze your shoulder blades at the peak.',
  Biceps: 'Keep your upper arm stable, curl with control, and avoid swinging your torso.',
  Chest: 'Retract your shoulder blades, control the lowering phase, and press through full range.',
  Core: 'Brace your abs, move with control, and keep your lower back stable throughout.',
  Legs: 'Track your knee over your foot, control the descent, and drive evenly through your working leg.',
  Shoulders: 'Keep your core tight, lead with your elbows, and avoid shrugging into your neck.',
  Triceps: 'Pin your elbows in place, extend fully, and control the return without flaring your ribs.',
};

function slug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function walkGifs(dir, folderName, out) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      walkGifs(full, ent.name, out);
      continue;
    }
    if (!ent.name.toLowerCase().endsWith('.gif')) continue;
    const name = ent.name.slice(0, -4);
    const muscle = FOLDER_MUSCLE[folderName];
    if (!muscle) {
      console.warn('Unknown folder:', folderName);
      continue;
    }
    let id = slug(name);
    let n = 1;
    while (out.some((x) => x.id === id)) {
      id = `${slug(name)}-${n++}`;
    }
    const relPath = path.relative(path.join(root, 'src', 'data'), full).replace(/\\/g, '/');
    out.push({
      id,
      name,
      muscle,
      instructions: INSTRUCTIONS_BY_MUSCLE[muscle],
      relPath,
      folder: folderName,
    });
  }
}

function main() {
  const items = [];
  for (const folder of fs.readdirSync(assetsRoot, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    walkGifs(path.join(assetsRoot, folder.name), folder.name, items);
  }
  items.sort((a, b) => a.muscle.localeCompare(b.muscle) || a.name.localeCompare(b.name));

  const muscles = [...new Set(items.map((i) => i.muscle))].sort();

  const catalogTs = `import type { CatalogExercise } from '../types/exercise';

/** Auto-generated from assets/exercises — run: node scripts/generateExercisesCatalog.mjs */
export const EXERCISES_CATALOG: CatalogExercise[] = ${JSON.stringify(
    items.map(({ id, name, muscle, instructions }) => ({ id, name, muscle, instructions })),
    null,
    2,
  )} as CatalogExercise[];

const byId = new Map(EXERCISES_CATALOG.map((e) => [e.id, e]));
const byNameKey = new Map(
  EXERCISES_CATALOG.map((e) => [e.name.trim().toLowerCase(), e]),
);

export function getCatalogExercise(id: string): CatalogExercise | undefined {
  return byId.get(id);
}

export function getCatalogExerciseByName(name: string): CatalogExercise | undefined {
  return byNameKey.get(name.trim().toLowerCase());
}

export const MUSCLE_CATEGORIES = ['All', ${muscles.map((m) => `'${m}'`).join(', ')}] as const;
`;

  const assetLines = items.map(
    (i) => `  '${i.id}': require('${i.relPath}'),`,
  );

  const assetsTs = `/* Auto-generated — run: node scripts/generateExercisesCatalog.mjs */
import type { ImageSourcePropType } from 'react-native';

export const EXERCISE_GIF_BY_ID: Record<string, ImageSourcePropType> = {
${assetLines.join('\n')}
};

export function getExerciseGif(id: string): ImageSourcePropType | undefined {
  return EXERCISE_GIF_BY_ID[id];
}
`;

  fs.writeFileSync(path.join(root, 'src', 'types', 'exercise.ts'), `export type CatalogExercise = {
  id: string;
  name: string;
  muscle: string;
  instructions: string;
};
`);

  fs.writeFileSync(path.join(root, 'src', 'data', 'exercisesCatalog.ts'), catalogTs);
  fs.writeFileSync(path.join(root, 'src', 'data', 'exerciseAssets.generated.ts'), assetsTs);

  console.log(`Wrote ${items.length} exercises (${muscles.join(', ')})`);
}

main();
