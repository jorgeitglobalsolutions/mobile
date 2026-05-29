/**
 * Scans assets/exercises and generates exercisesCatalog.ts.
 * GIFs are served from Firebase Storage — run uploadExerciseGifs.mjs after adding files.
 * Run: node scripts/generateExercisesCatalog.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { collectExerciseGifs } from './exerciseAssetManifest.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function main() {
  const items = collectExerciseGifs(root);
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

  fs.writeFileSync(path.join(root, 'src', 'types', 'exercise.ts'), `export type CatalogExercise = {
  id: string;
  name: string;
  muscle: string;
  instructions: string;
};
`);

  fs.writeFileSync(path.join(root, 'src', 'data', 'exercisesCatalog.ts'), catalogTs);

  console.log(`Wrote ${items.length} exercises (${muscles.join(', ')})`);
  console.log('GIFs: upload with node firebase/functions/scripts/uploadExerciseGifs.mjs');
}

main();
