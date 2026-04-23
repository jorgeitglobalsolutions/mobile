import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from '../lib/firebase';
import { isMockDataMode } from '../config/mockMode';

export type VerifyPurchasePayload = {
  platform: 'ios' | 'android' | 'web';
  productId: string;
  purchaseToken: string | null;
  plan: 'month' | 'year';
};

export async function callVerifyPurchase(payload: VerifyPurchasePayload): Promise<{ ok?: boolean }> {
  if (isMockDataMode()) {
    return { ok: true };
  }
  const f = getFirebaseFunctions();
  if (!f) throw new Error('Firebase is not configured');
  const fn = httpsCallable(f, 'verifyPurchase');
  const res = await fn(payload);
  return (res.data as { ok?: boolean } | undefined) ?? {};
}
