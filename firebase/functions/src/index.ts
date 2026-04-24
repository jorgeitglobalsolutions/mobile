import { FieldPath, FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { verifyStorePurchase } from './verifyPurchaseStores';

initializeApp();
const db = getFirestore();

type VerifyBody = {
  platform: string;
  productId: string;
  purchaseToken?: string | null;
  plan?: string;
};

function useVerifyPurchaseStub(): boolean {
  return process.env.FUNCTIONS_EMULATOR === 'true' || process.env.ALLOW_VERIFY_PURCHASE_STUB === 'true';
}

/** Legacy shape check used only when stub mode is on (emulator / explicit flag). */
function tokenLooksValidStub(platform: string, token: string): boolean {
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

  if (useVerifyPurchaseStub()) {
    if (!tokenLooksValidStub(platform, token)) {
      throw new HttpsError('invalid-argument', 'Invalid or missing purchase token (stub mode)');
    }
    logger.warn('verifyPurchase: STUB mode — not checking Apple/Google. Disable ALLOW_VERIFY_PURCHASE_STUB in production.');
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
    return { ok: true, stub: true };
  }

  const verified = await verifyStorePurchase({
    platform,
    productId,
    purchaseToken: token,
    plan,
  });

  if (verified.expiresAt.getTime() <= Date.now()) {
    throw new HttpsError('failed-precondition', 'Subscription is already expired according to the store.');
  }

  await db.doc(`users/${uid}`).update({
    'subscription.status': 'active',
    'subscription.currentPeriodEndsAt': Timestamp.fromDate(verified.expiresAt),
    'subscription.productId': verified.verifiedProductId,
    'subscription.platform': platform,
    'subscription.lastSyncedAt': FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  logger.info('verifyPurchase: store-verified', {
    uid,
    productId: verified.verifiedProductId,
    platform,
    plan,
    expiresAt: verified.expiresAt.toISOString(),
  });
  return { ok: true, stub: false };
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

type UserPushFields = {
  pushToken?: string | null;
  settings?: { notificationsEnabled?: boolean; reminderHourUtc?: number | null };
};

const DEFAULT_REMINDER_HOUR_UTC = 13;

function shouldSendReminderThisHour(data: UserPushFields, utcHour: number): boolean {
  if (data.settings?.notificationsEnabled === false) return false;
  const h = data.settings?.reminderHourUtc;
  const target = h === undefined || h === null || Number.isNaN(Number(h)) ? DEFAULT_REMINDER_HOUR_UTC : Number(h);
  return target === utcHour;
}

async function clearPushToken(uid: string) {
  try {
    await db.doc(`users/${uid}`).update({
      pushToken: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    logger.warn('clearPushToken failed', { uid, err: String(e) });
  }
}

type ExpoPushTicket = { status?: string; message?: string; details?: { error?: string } };

/**
 * Hourly job: sends habit reminder only in the user's configured UTC hour (default 13).
 * Paginates all `users` docs (ordered by document id) so more than 500 accounts are covered.
 */
export const sendDailyHabitReminders = onSchedule('every 60 minutes', async () => {
  const utcHour = new Date().getUTCHours();
  let lastId: string | undefined;
  let scanned = 0;
  let sent = 0;
  let clearedTokens = 0;
  let failures = 0;

  while (true) {
    let q = db.collection('users').orderBy(FieldPath.documentId()).limit(300);
    if (lastId) q = q.startAfter(lastId);
    const snap = await q.get();
    if (snap.empty) break;

    for (const doc of snap.docs) {
      scanned += 1;
      const d = doc.data() as UserPushFields;
      if (!d.pushToken || typeof d.pushToken !== 'string') continue;
      if (!shouldSendReminderThisHour(d, utcHour)) continue;

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
        const json = (await res.json()) as { data?: ExpoPushTicket | ExpoPushTicket[] };
        if (!res.ok) {
          failures += 1;
          logger.warn('Expo push HTTP error', { uid: doc.id, status: res.status, body: json });
          continue;
        }
        const raw = json.data;
        const ticket = Array.isArray(raw) ? raw[0] : raw;
        if (ticket?.status === 'error') {
          failures += 1;
          const err = ticket.details?.error ?? ticket.message ?? 'unknown';
          logger.warn('Expo push ticket error', { uid: doc.id, err });
          if (err === 'DeviceNotRegistered' || err === 'InvalidCredentials') {
            await clearPushToken(doc.id);
            clearedTokens += 1;
          }
          continue;
        }
        sent += 1;
      } catch (e) {
        failures += 1;
        logger.warn('Expo push error', { uid: doc.id, err: String(e) });
      }
    }

    lastId = snap.docs[snap.docs.length - 1].id;
    if (snap.size < 300) break;
  }

  logger.info('sendDailyHabitReminders done', {
    utcHour,
    scanned,
    sent,
    failures,
    clearedTokens,
  });
});
