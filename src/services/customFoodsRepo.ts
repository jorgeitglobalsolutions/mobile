import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../lib/firebase';
import { isMockDataMode } from '../config/mockMode';
import * as mem from '../mock/inMemoryBackend';
import type { CustomFoodDoc, CustomFoodRow } from '../types/food';
import { normalizeCustomFoodMacros } from '../utils/foodMacros';
import { trackUserEvent } from './userEvents';

function customFoodsCol(db: Firestore, uid: string) {
  return collection(db, 'users', uid, 'customFoods');
}

export function subscribeCustomFoods(uid: string, onUpdate: (rows: CustomFoodRow[]) => void): Unsubscribe {
  if (isMockDataMode()) {
    return mem.mockSubscribeCustomFoods(uid, onUpdate);
  }
  const db = getFirebaseFirestore();
  if (!db) {
    onUpdate([]);
    return () => {};
  }
  const q = query(customFoodsCol(db, uid), orderBy('updatedAtMs', 'desc'));
  return onSnapshot(
    q,
    (snap) => {
      onUpdate(
        snap.docs.map((d) => ({
          id: d.id,
          data: d.data() as CustomFoodDoc,
        })),
      );
    },
    () => onUpdate([]),
  );
}

export async function saveCustomFood(
  uid: string,
  input: { name: string; proteinG: number; carbsG: number; fatG: number; caloriesKcal?: number },
  existingId?: string,
): Promise<string> {
  const normalized = normalizeCustomFoodMacros(input);
  if (!normalized.name) throw new Error('Food name is required');

  const now = Date.now();
  const payload: CustomFoodDoc = {
    name: normalized.name,
    proteinPer100g: normalized.protein,
    carbsPer100g: normalized.carbs,
    fatPer100g: normalized.fat,
    caloriesPer100g: normalized.calories,
    createdAtMs: now,
    updatedAtMs: now,
  };

  if (isMockDataMode()) {
    const id = await mem.mockSaveCustomFood(uid, payload, existingId);
    await trackUserEvent(uid, 'custom_food_saved', { foodId: id, name: payload.name });
    return id;
  }

  const db = getFirebaseFirestore();
  if (!db) throw new Error('Firestore not initialized');

  if (existingId) {
    const ref = doc(db, 'users', uid, 'customFoods', existingId);
    const snap = await getDoc(ref);
    const prev = snap.exists() ? (snap.data() as CustomFoodDoc) : null;
    await setDoc(
      ref,
      {
        ...payload,
        createdAtMs: prev?.createdAtMs ?? now,
        updatedAtMs: now,
      },
      { merge: true },
    );
    await trackUserEvent(uid, 'custom_food_saved', { foodId: existingId, name: payload.name });
    return existingId;
  }

  const ref = await addDoc(customFoodsCol(db, uid), payload);
  await trackUserEvent(uid, 'custom_food_saved', { foodId: ref.id, name: payload.name });
  return ref.id;
}

export async function deleteCustomFood(uid: string, foodId: string): Promise<void> {
  if (isMockDataMode()) {
    await mem.mockDeleteCustomFood(uid, foodId);
    return;
  }
  const db = getFirebaseFirestore();
  if (!db) throw new Error('Firestore not initialized');
  await deleteDoc(doc(db, 'users', uid, 'customFoods', foodId));
}
