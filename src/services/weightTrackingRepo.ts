import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../lib/firebase';
import { isMockDataMode } from '../config/mockMode';
import * as mem from '../mock/inMemoryBackend';
import type { WeightEntryDoc } from '../types/domain';
import { trackUserEvent } from './userEvents';

function weightCol(db: Firestore, uid: string) {
  return collection(db, 'users', uid, 'weightEntries');
}

export type WeightEntryRow = { id: string; data: WeightEntryDoc };

/**
 * Live list of weight entries, newest first.
 */
export function subscribeWeightEntries(
  uid: string,
  onUpdate: (rows: WeightEntryRow[]) => void,
): Unsubscribe {
  if (isMockDataMode()) {
    return mem.mockSubscribeWeightEntries(uid, onUpdate);
  }
  const db = getFirebaseFirestore();
  if (!db) {
    onUpdate([]);
    return () => {};
  }
  const q = query(weightCol(db, uid), orderBy('loggedAt', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(snap.docs.map((d) => ({ id: d.id, data: d.data() as WeightEntryDoc })));
    },
    () => onUpdate([]),
  );
}

export async function addWeightEntry(
  uid: string,
  input: { weightKg: number; loggedAt?: Date; note?: string },
): Promise<string> {
  if (isMockDataMode()) {
    return mem.mockAddWeightEntry(uid, input);
  }
  const db = getFirebaseFirestore();
  if (!db) throw new Error('Firestore not initialized');
  const when = input.loggedAt ?? new Date();
  const payload: WeightEntryDoc = {
    weightKg: input.weightKg,
    loggedAt: Timestamp.fromDate(when),
    ...(input.note?.trim() ? { note: input.note.trim() } : {}),
  };
  const ref = await addDoc(weightCol(db, uid), payload);
  await trackUserEvent(uid, 'weight_logged', {
    entryId: ref.id,
    weightKg: input.weightKg,
    loggedAtMs: when.getTime(),
  });
  return ref.id;
}

export async function deleteWeightEntry(uid: string, entryId: string): Promise<void> {
  if (isMockDataMode()) {
    await mem.mockDeleteWeightEntry(uid, entryId);
    return;
  }
  const db = getFirebaseFirestore();
  if (!db) throw new Error('Firestore not initialized');
  await deleteDoc(doc(db, 'users', uid, 'weightEntries', entryId));
}
