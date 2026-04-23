import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';

initializeApp();
const db = getFirestore();

type VerifyBody = {
  platform: string;
  productId: string;
  purchaseToken?: string | null;
  plan?: string;
};

/** Shape-only checks; replace with App Store Server API / Play Developer API for production. */
function tokenLooksValid(platform: string, token: string): boolean {
  if (platform === 'ios') {
    return token.split('.').length === 3;
  }
  if (platform === 'android') {
    return token.length >= 20;
  }
  return false;
}

export const verifyPurchase = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in required');
  }
  const uid = request.auth.uid;
  const data = request.data as VerifyBody;
  const platform = data.platform;
  const productId = data.productId?.trim();
  const plan = data.plan === 'year' ? 'year' : 'month';
  const token = (data.purchaseToken ?? '').trim();

  if (!productId) {
    throw new HttpsError('invalid-argument', 'productId is required');
  }
  if (platform !== 'ios' && platform !== 'android') {
    throw new HttpsError('invalid-argument', 'platform must be ios or android');
  }
  if (!tokenLooksValid(platform, token)) {
    throw new HttpsError('invalid-argument', 'Invalid or missing purchase token');
  }

  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const yearMs = 365 * 24 * 60 * 60 * 1000;
  const end = new Date(Date.now() + (plan === 'year' ? yearMs : monthMs));

  await db.doc(`users/${uid}`).update({
    'subscription.status': 'active',
    'subscription.currentPeriodEndsAt': Timestamp.fromDate(end),
    'subscription.productId': productId,
    'subscription.platform': platform,
    'subscription.lastSyncedAt': FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  logger.info('verifyPurchase: subscription mirrored', { uid, productId, platform, plan });
  return { ok: true };
});

/**
 * Dev-only: grant active subscription (30d) for QA. Enable with Firebase env `ALLOW_DEV_SUBSCRIPTION=true`
 * or run under the Functions emulator (`FUNCTIONS_EMULATOR=true`).
 */
export const grantDevSubscription = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'Sign in required');
  }
  const allow =
    process.env.FUNCTIONS_EMULATOR === 'true' || process.env.ALLOW_DEV_SUBSCRIPTION === 'true';
  if (!allow) {
    throw new HttpsError(
      'permission-denied',
      'Dev subscription grant is disabled. Set ALLOW_DEV_SUBSCRIPTION=true on the function or use the emulator.',
    );
  }
  const uid = request.auth.uid;
  const end = new Date();
  end.setDate(end.getDate() + 30);
  await db.doc(`users/${uid}`).update({
    'subscription.status': 'active',
    'subscription.currentPeriodEndsAt': Timestamp.fromDate(end),
    'subscription.lastSyncedAt': FieldValue.serverTimestamp(),
    'subscription.productId': 'dev_em_fit_monthly',
    'subscription.platform': 'web',
    updatedAt: FieldValue.serverTimestamp(),
  });
  logger.info('grantDevSubscription', { uid });
  return { ok: true };
});

/**
 * Sends a daily reminder via Expo Push API (Android tokens are FCM-backed on device; delivery uses Expo's service).
 * For first-party FCM-only payloads, migrate tokens to raw FCM and use firebase-admin messaging.
 */
export const sendDailyHabitReminders = onSchedule('every day 13:00', async () => {
  const snap = await db.collection('users').limit(500).get();
  let sent = 0;
  for (const doc of snap.docs) {
    const d = doc.data() as {
      pushToken?: string | null;
      settings?: { notificationsEnabled?: boolean };
    };
    if (!d.pushToken || typeof d.pushToken !== 'string') continue;
    if (d.settings?.notificationsEnabled === false) continue;

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: d.pushToken,
          title: 'EM Fit',
          body: 'Quick check-in: log protein, water, or start a workout.',
          sound: 'default',
        }),
      });
      if (!res.ok) {
        logger.warn('Expo push failed', { uid: doc.id, status: res.status });
        continue;
      }
      sent += 1;
    } catch (e) {
      logger.warn('Expo push error', { uid: doc.id, err: String(e) });
    }
  }
  logger.info('sendDailyHabitReminders done', { scanned: snap.size, sent });
});
