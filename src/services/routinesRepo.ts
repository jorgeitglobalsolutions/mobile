import {
  Timestamp,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  deleteDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../lib/firebase';
import type { RoutineDoc } from '../types/domain';
import { PREDEFINED_ROUTINES_SEED } from '../data/predefinedRoutinesSeed';

function routinesCol(uid: string) {
  const db = getFirebaseFirestore();
  if (!db) throw new Error('Firestore not initialized');
  return collection(db, 'users', uid, 'routines');
}

export async function seedPredefinedRoutinesIfEmpty(uid: string): Promise<void> {
  const db = getFirebaseFirestore();
  if (!db) return;
  const col = routinesCol(uid);
  const snap = await getDocs(query(col));
  if (!snap.empty) return;

  for (const seed of PREDEFINED_ROUTINES_SEED) {
    const ref = doc(col, seed.id);
    const payload: Omit<RoutineDoc, 'updatedAt'> & { updatedAt: ReturnType<typeof serverTimestamp> } = {
      title: seed.title,
      muscles: seed.muscles,
      minutes: seed.minutes,
      exerciseCount: seed.exercises.length,
      category: seed.category,
      isPredefined: true,
      exercises: seed.exercises,
      description: seed.description,
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, payload);
  }
}

export function subscribeRoutines(
  uid: string,
  onUpdate: (rows: { id: string; data: RoutineDoc }[]) => void,
): Unsubscribe {
  const q = query(routinesCol(uid), orderBy('title'));
  return onSnapshot(q, (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, data: d.data() as RoutineDoc }));
    onUpdate(rows);
  });
}

export async function getRoutine(uid: string, routineId: string): Promise<RoutineDoc | null> {
  const ref = doc(routinesCol(uid), routineId);
  const s = await getDoc(ref);
  if (!s.exists()) return null;
  return s.data() as RoutineDoc;
}

export async function saveUserRoutine(
  uid: string,
  routineId: string | undefined,
  data: Omit<RoutineDoc, 'updatedAt' | 'isPredefined'> & { isPredefined?: boolean },
): Promise<string> {
  const col = routinesCol(uid);
  const id = routineId ?? doc(col).id;
  const ref = doc(col, id);
  const payload: Record<string, unknown> = {
    ...data,
    isPredefined: data.isPredefined ?? false,
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, payload, { merge: true });
  return id;
}

export async function deleteRoutine(uid: string, routineId: string): Promise<void> {
  const ref = doc(routinesCol(uid), routineId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const d = snap.data() as RoutineDoc;
  if (d.isPredefined) return;
  await deleteDoc(ref);
}

export function routineToWorkoutBlocks(r: RoutineDoc) {
  return r.exercises.map((ex) => ({
    name: ex.name,
    sets: Array.from({ length: ex.targetSets }).map(() => ({
      weightKg: 0,
      reps: 0,
      done: false,
    })),
  }));
}

export function estimateMinutes(r: RoutineDoc): number {
  return r.minutes;
}
