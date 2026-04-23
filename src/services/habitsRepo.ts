import {
  Timestamp,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../lib/firebase';
import type { HabitDayDoc, MoodValue } from '../types/domain';

function habitDayRef(uid: string, date: string) {
  const db = getFirebaseFirestore();
  if (!db) throw new Error('Firestore not initialized');
  return doc(db, 'users', uid, 'habitDays', date);
}

export function defaultGoalsFromProfile(weightKg?: number, goal?: string): { proteinG: number; waterMl: number } {
  const w = weightKg && weightKg > 0 ? weightKg : 70;
  let proteinPerKg = 1.8;
  if (goal === 'lose') proteinPerKg = 2.0;
  if (goal === 'build') proteinPerKg = 2.2;
  const proteinG = Math.round(w * proteinPerKg);
  const waterMl = Math.round(w * 35);
  return { proteinG, waterMl };
}

export async function getOrCreateHabitDay(
  uid: string,
  date: string,
  defaults: { proteinGoalG: number; waterGoalMl: number },
): Promise<HabitDayDoc> {
  const ref = habitDayRef(uid, date);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as HabitDayDoc;
  const initial: Omit<HabitDayDoc, 'updatedAt'> & { updatedAt: ReturnType<typeof serverTimestamp> } = {
    date,
    proteinG: 0,
    waterMl: 0,
    workoutCompleted: false,
    mood: null,
    proteinGoalG: defaults.proteinGoalG,
    waterGoalMl: defaults.waterGoalMl,
    updatedAt: serverTimestamp(),
  };
  await setDoc(ref, initial);
  return { ...(initial as unknown as HabitDayDoc), updatedAt: Timestamp.now() };
}

export function subscribeHabitDay(
  uid: string,
  date: string,
  defaults: { proteinGoalG: number; waterGoalMl: number },
  onData: (doc: HabitDayDoc | null) => void,
): Unsubscribe {
  const ref = habitDayRef(uid, date);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      onData({
        date,
        proteinG: 0,
        waterMl: 0,
        workoutCompleted: false,
        mood: null,
        proteinGoalG: defaults.proteinGoalG,
        waterGoalMl: defaults.waterGoalMl,
        updatedAt: Timestamp.now(),
      });
      void setDoc(
        ref,
        {
          date,
          proteinG: 0,
          waterMl: 0,
          workoutCompleted: false,
          mood: null,
          proteinGoalG: defaults.proteinGoalG,
          waterGoalMl: defaults.waterGoalMl,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      return;
    }
    onData(snap.data() as HabitDayDoc);
  });
}

export async function incrementProtein(uid: string, date: string, deltaG: number, defaults: { proteinGoalG: number; waterGoalMl: number }) {
  const ref = habitDayRef(uid, date);
  const cur = await getOrCreateHabitDay(uid, date, defaults);
  await setDoc(
    ref,
    {
      proteinG: Math.max(0, cur.proteinG + deltaG),
      proteinGoalG: cur.proteinGoalG || defaults.proteinGoalG,
      waterGoalMl: cur.waterGoalMl || defaults.waterGoalMl,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function incrementWater(uid: string, date: string, deltaMl: number, defaults: { proteinGoalG: number; waterGoalMl: number }) {
  const ref = habitDayRef(uid, date);
  const cur = await getOrCreateHabitDay(uid, date, defaults);
  await setDoc(
    ref,
    {
      waterMl: Math.max(0, cur.waterMl + deltaMl),
      proteinGoalG: cur.proteinGoalG || defaults.proteinGoalG,
      waterGoalMl: cur.waterGoalMl || defaults.waterGoalMl,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function setWorkoutCompleted(
  uid: string,
  date: string,
  completed: boolean,
  defaults: { proteinGoalG: number; waterGoalMl: number },
) {
  const ref = habitDayRef(uid, date);
  const cur = await getOrCreateHabitDay(uid, date, defaults);
  await setDoc(
    ref,
    {
      workoutCompleted: completed,
      proteinGoalG: cur.proteinGoalG || defaults.proteinGoalG,
      waterGoalMl: cur.waterGoalMl || defaults.waterGoalMl,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function setMood(uid: string, date: string, mood: MoodValue | null, defaults: { proteinGoalG: number; waterGoalMl: number }) {
  const ref = habitDayRef(uid, date);
  const cur = await getOrCreateHabitDay(uid, date, defaults);
  await setDoc(
    ref,
    {
      mood,
      proteinGoalG: cur.proteinGoalG || defaults.proteinGoalG,
      waterGoalMl: cur.waterGoalMl || defaults.waterGoalMl,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
