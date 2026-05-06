import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getFirebaseFirestore } from '../lib/firebase';
import { isMockDataMode } from '../config/mockMode';

export type UserEventType =
  | 'auth_sign_in'
  | 'auth_sign_up'
  | 'auth_sign_out'
  | 'user_profile_updated'
  | 'user_settings_updated'
  | 'habit_protein_updated'
  | 'habit_water_updated'
  | 'habit_workout_completed'
  | 'habit_mood_updated'
  | 'workout_saved';

/**
 * Writes a lightweight audit/event record under users/{uid}/events.
 * Errors are swallowed so event logging never blocks user flows.
 */
export async function trackUserEvent(
  uid: string,
  type: UserEventType,
  payload: Record<string, unknown> = {},
): Promise<void> {
  if (!uid || isMockDataMode()) return;
  const db = getFirebaseFirestore();
  if (!db) return;
  try {
    await addDoc(collection(db, 'users', uid, 'events'), {
      type,
      payload,
      createdAt: serverTimestamp(),
    });
  } catch {
    // no-op: analytics/audit should not break app usage
  }
}

