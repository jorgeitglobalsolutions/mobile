import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../lib/firebase';

/** Dev-only subscription grant via Cloud Function (required once Firestore rules block client subscription writes). */
export async function callGrantDevSubscription(): Promise<void> {
  const f = getFirebaseFunctions();
  if (!f) throw new Error('Firebase is not configured');
  const fn = httpsCallable(f, 'grantDevSubscription');
  await fn({});
}
