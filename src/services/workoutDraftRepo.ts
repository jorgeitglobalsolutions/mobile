import { doc, deleteDoc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getFirebaseFirestore } from '../lib/firebase';
import { isMockDataMode } from '../config/mockMode';
import * as mem from '../mock/inMemoryBackend';
import type { LoggedExercise } from '../types/domain';

export type WorkoutDraftDoc = {
  routineId: string;
  title: string;
  startedAtMs: number;
  exercises: LoggedExercise[];
};

const DRAFT_ID = 'active';

function draftRef(uid: string) {
  const db = getFirebaseFirestore();
  if (!db) throw new Error('Firestore not initialized');
  return doc(db, 'users', uid, 'workoutDrafts', DRAFT_ID);
}

export async function getWorkoutDraft(uid: string): Promise<WorkoutDraftDoc | null> {
  if (isMockDataMode()) {
    return mem.mockGetWorkoutDraft(uid);
  }
  const db = getFirebaseFirestore();
  if (!db) return null;
  const s = await getDoc(draftRef(uid));
  if (!s.exists()) return null;
  const d = s.data() as WorkoutDraftDoc & { updatedAt?: unknown };
  return {
    routineId: d.routineId,
    title: d.title,
    startedAtMs: d.startedAtMs,
    exercises: d.exercises ?? [],
  };
}

export async function saveWorkoutDraft(
  uid: string,
  payload: { routineId: string; title: string; startedAtMs: number; exercises: LoggedExercise[] },
): Promise<void> {
  if (isMockDataMode()) {
    await mem.mockSaveWorkoutDraft(uid, {
      routineId: payload.routineId,
      title: payload.title,
      startedAtMs: payload.startedAtMs,
      exercises: payload.exercises,
    });
    return;
  }
  await setDoc(draftRef(uid), {
    ...payload,
    updatedAt: serverTimestamp(),
  });
}

export async function clearWorkoutDraft(uid: string): Promise<void> {
  if (isMockDataMode()) {
    await mem.mockClearWorkoutDraft(uid);
    return;
  }
  const db = getFirebaseFirestore();
  if (!db) return;
  try {
    await deleteDoc(draftRef(uid));
  } catch {
    // ignore
  }
}
