import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  type Firestore,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../lib/firebase';
import { isMockDataMode } from '../config/mockMode';
import * as mem from '../mock/inMemoryBackend';
import type { LoggedExercise, WorkoutDoc } from '../types/domain';

function workoutsCol(db: Firestore, uid: string) {
  return collection(db, 'users', uid, 'workouts');
}

function bestVolume(exercises: LoggedExercise[]): number {
  let best = 0;
  for (const ex of exercises) {
    for (const s of ex.sets) {
      if (!s.done) continue;
      const v = s.weightKg * s.reps;
      if (v > best) best = v;
    }
  }
  return Math.round(best * 10) / 10;
}

function totalVolume(exercises: LoggedExercise[]): number {
  let t = 0;
  for (const ex of exercises) {
    for (const s of ex.sets) {
      if (!s.done) continue;
      t += s.weightKg * s.reps;
    }
  }
  return Math.round(t);
}

function countSets(exercises: LoggedExercise[]): number {
  return exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.done).length, 0);
}

export async function saveWorkoutSession(
  uid: string,
  input: {
    routineId: string | null;
    title: string;
    startedAt: Date;
    endedAt: Date;
    exercises: LoggedExercise[];
  },
): Promise<string> {
  if (isMockDataMode()) {
    return mem.mockSaveWorkoutSession(uid, input);
  }
  const db = getFirebaseFirestore();
  if (!db) throw new Error('Firestore not initialized');
  const durationSeconds = Math.max(0, Math.floor((input.endedAt.getTime() - input.startedAt.getTime()) / 1000));
  const docData: Omit<WorkoutDoc, 'startedAt' | 'endedAt'> & {
    startedAt: Timestamp;
    endedAt: Timestamp;
  } = {
    routineId: input.routineId,
    title: input.title,
    startedAt: Timestamp.fromDate(input.startedAt),
    endedAt: Timestamp.fromDate(input.endedAt),
    durationSeconds,
    exercises: input.exercises,
    totalVolumeKg: totalVolume(input.exercises),
    totalSets: countSets(input.exercises),
    bestSetVolumeKg: bestVolume(input.exercises),
  };
  const ref = await addDoc(workoutsCol(db, uid), docData);
  return ref.id;
}

export async function listRecentWorkouts(uid: string, max = 50): Promise<{ id: string; data: WorkoutDoc }[]> {
  if (isMockDataMode()) {
    return mem.mockListRecentWorkouts(uid, max);
  }
  const db = getFirebaseFirestore();
  if (!db) return [];
  const q = query(workoutsCol(db, uid), orderBy('endedAt', 'desc'), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as WorkoutDoc }));
}

export async function getWorkout(uid: string, workoutId: string): Promise<WorkoutDoc | null> {
  if (isMockDataMode()) {
    return mem.mockGetWorkout(uid, workoutId);
  }
  const db = getFirebaseFirestore();
  if (!db) return null;
  const ref = doc(workoutsCol(db, uid), workoutId);
  const s = await getDoc(ref);
  if (!s.exists()) return null;
  return s.data() as WorkoutDoc;
}
