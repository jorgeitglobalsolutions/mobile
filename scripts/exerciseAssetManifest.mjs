/**
 * Shared scan of assets/exercises — used by catalog generation and Storage upload.
 */
import fs from 'fs';
import path from 'path';

export const FOLDER_MUSCLE = {
  'back exercises': 'Back',
  'biceps exercises': 'Biceps',
  'chest exercises': 'Chest',
  'core exercises': 'Core',
  'leg exercises': 'Legs',
  'shoulder exercises': 'Shoulders',
  'triceps exercises': 'Triceps',
};

export const INSTRUCTIONS_BY_MUSCLE = {
  Back: 'Brace your core, pull with your back muscles, and squeeze your shoulder blades at the peak.',
  Biceps: 'Keep your upper arm stable, curl with control, and avoid swinging your torso.',
  Chest: 'Retract your shoulder blades, control the lowering phase, and press through full range.',
  Core: 'Brace your abs, move with control, and keep your lower back stable throughout.',
  Legs: 'Track your knee over your foot, control the descent, and drive evenly through your working leg.',
  Shoulders: 'Keep your core tight, lead with your elbows, and avoid shrugging into your neck.',
  Triceps: 'Pin your elbows in place, extend fully, and control the return without flaring your ribs.',
};

export function slug(name) {
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
    out.push({
      id,
      name,
      muscle,
      instructions: INSTRUCTIONS_BY_MUSCLE[muscle],
      filePath: full,
      folder: folderName,
    });
  }
}

/** @returns {Array<{ id: string, name: string, muscle: string, instructions: string, filePath: string, folder: string }>} */
export function collectExerciseGifs(repoRoot) {
  const assetsRoot = path.join(repoRoot, 'assets', 'exercises');
  const items = [];
  for (const folder of fs.readdirSync(assetsRoot, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    walkGifs(path.join(assetsRoot, folder.name), folder.name, items);
  }
  items.sort((a, b) => a.muscle.localeCompare(b.muscle) || a.name.localeCompare(b.name));
  return items;
}

export function exerciseGifStoragePath(exerciseId) {
  return `exercises/${exerciseId}.gif`;
}

export function exerciseGifPublicUrl(exerciseId, storageBucket) {
  const objectPath = encodeURIComponent(exerciseGifStoragePath(exerciseId));
  return `https://firebasestorage.googleapis.com/v0/b/${storageBucket}/o/${objectPath}?alt=media`;
}
