import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../lib/firebase';
import { isMockDataMode } from '../config/mockMode';
import { mockDeleteAccount, MOCK_UID } from '../mock/inMemoryBackend';

/**
 * Permanently deletes the signed-in user's Firestore data and Firebase Auth account.
 * Mock mode: clears in-memory demo data only.
 */
export async function callDeleteAccount(uid?: string): Promise<void> {
  if (isMockDataMode()) {
    mockDeleteAccount(uid ?? MOCK_UID);
    return;
  }
  const f = getFirebaseFunctions();
  if (!f) throw new Error('Firebase is not configured');
  const fn = httpsCallable(f, 'deleteAccount');
  await fn({});
}
