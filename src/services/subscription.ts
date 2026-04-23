import { Timestamp } from 'firebase/firestore';
import type { SubscriptionFields, SubscriptionStatus } from '../types/firestoreUser';

export type AccessLevel = 'full' | 'paywalled';

function tsToDate(t: Timestamp | null | undefined): Date | null {
  if (!t) return null;
  return t.toDate();
}

/**
 * Client-side access rule (MVP). Production apps should verify purchases
 * with App Store / Play Billing via Cloud Functions and treat this as a cache.
 */
export function computeAccessLevel(sub: SubscriptionFields | null | undefined): {
  level: AccessLevel;
  status: SubscriptionStatus;
} {
  if (!sub) return { level: 'paywalled', status: 'unknown' };

  const now = Date.now();
  const trialEnd = tsToDate(sub.trialEndsAt);
  const periodEnd = tsToDate(sub.currentPeriodEndsAt);

  if (sub.status === 'active') {
    if (periodEnd && periodEnd.getTime() < now) {
      return { level: 'paywalled', status: 'expired' };
    }
    return { level: 'full', status: 'active' };
  }

  if (sub.status === 'trial') {
    if (trialEnd && trialEnd.getTime() >= now) {
      return { level: 'full', status: 'trial' };
    }
    return { level: 'paywalled', status: 'expired' };
  }

  if (sub.status === 'expired') {
    return { level: 'paywalled', status: 'expired' };
  }

  return { level: 'paywalled', status: 'unknown' };
}
