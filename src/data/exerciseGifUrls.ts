import { getFirebasePublicConfig } from '../config/firebaseConfig';
import { getCatalogExercise } from './exercisesCatalog';

/** Matches Firebase project when `.env` is not loaded (e.g. some tooling). */
const DEFAULT_STORAGE_BUCKET = 'em-fit-system-c0d3d.firebasestorage.app';

export function exerciseGifStoragePath(exerciseId: string): string {
  return `exercises/${exerciseId}.gif`;
}

export function buildExerciseGifUrl(exerciseId: string, storageBucket?: string): string {
  const bucket =
    storageBucket?.trim() ||
    getFirebasePublicConfig().storageBucket.trim() ||
    DEFAULT_STORAGE_BUCKET;
  const objectPath = encodeURIComponent(exerciseGifStoragePath(exerciseId));
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${objectPath}?alt=media`;
}

/** Remote GIF URL for a catalog exercise, or undefined if id is unknown. */
export function getExerciseGifUrl(exerciseId: string): string | undefined {
  if (!getCatalogExercise(exerciseId)) return undefined;
  return buildExerciseGifUrl(exerciseId);
}
