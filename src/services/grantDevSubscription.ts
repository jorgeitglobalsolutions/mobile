import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../lib/firebase';
import { isMockDataMode } from '../config/mockMode';
import { mockGrantActiveSubscription, MOCK_UID } from '../mock/inMemoryBackend';

/**
 * Dev: subscription grant via Cloud Function (Firestore rules block client writes).
 * Mock mode: grants premium locally (no network).
 */
export async function callGrantDevSubscription(uid?: string): Promise<void> {
  if (isMockDataMode()) {
    mockGrantActiveSubscription(uid ?? MOCK_UID);
    return;
  }
  const f = getFirebaseFunctions();
  if (!f) throw new Error('Firebase is not configured');
  const fn = httpsCallable(f, 'grantDevSubscription');
  await fn({});
}
