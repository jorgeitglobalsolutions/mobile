import * as fs from 'fs';
import * as path from 'path';
import { Environment, SignedDataVerifier, VerificationException } from '@apple/app-store-server-library';
import { JWT } from 'google-auth-library';
import { google } from 'googleapis';
import { GaxiosError } from 'gaxios';
import { HttpsError } from 'firebase-functions/v2/https';

export type VerifyPurchaseInput = {
  platform: 'ios' | 'android';
  productId: string;
  purchaseToken: string;
  plan: 'month' | 'year';
};

export type VerifiedSubscription = {
  expiresAt: Date;
  verifiedProductId: string;
};

function loadAppleRootCertificates(): Buffer[] {
  const certPath = path.join(__dirname, '..', 'certs', 'AppleRootCA-G3.cer');
  if (!fs.existsSync(certPath)) {
    throw new HttpsError(
      'failed-precondition',
      'Apple root CA missing. Add firebase/functions/certs/AppleRootCA-G3.cer (see certs/README.md).',
    );
  }
  return [fs.readFileSync(certPath)];
}

function allowedProductIds(): Set<string> {
  const fromEnv = (process.env.IAP_ALLOWED_PRODUCT_IDS ?? '')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);
  if (fromEnv.length) return new Set(fromEnv);
  const monthly = process.env.IAP_SKU_MONTHLY ?? 'em_fit_monthly';
  const yearly = process.env.IAP_SKU_YEARLY ?? 'em_fit_yearly';
  return new Set([monthly, yearly]);
}

function assertHttpsProduct(productId: string, allowed: Set<string>) {
  if (!allowed.has(productId)) {
    throw new HttpsError('invalid-argument', `Product ID is not allowed for this app: ${productId}`);
  }
}

async function verifyAppleJws(signedTransaction: string, allowed: Set<string>): Promise<VerifiedSubscription> {
  const bundleId = process.env.APPLE_IOS_BUNDLE_ID?.trim();
  if (!bundleId) {
    throw new HttpsError(
      'failed-precondition',
      'Set APPLE_IOS_BUNDLE_ID on the verifyPurchase function (e.g. com.company.app).',
    );
  }
  const appAppleIdRaw = process.env.APPLE_APP_APPLE_ID?.trim();
  const appAppleId = appAppleIdRaw ? Number(appAppleIdRaw) : undefined;
  const roots = loadAppleRootCertificates();
  const attempts: string[] = [];

  for (const storeEnv of [Environment.SANDBOX, Environment.PRODUCTION]) {
    if (storeEnv === Environment.PRODUCTION && (appAppleId === undefined || Number.isNaN(appAppleId))) {
      attempts.push('production: skipped (set APPLE_APP_APPLE_ID numeric App ID from App Store Connect)');
      continue;
    }
    const verifier = new SignedDataVerifier(
      roots,
      true,
      storeEnv,
      bundleId,
      storeEnv === Environment.PRODUCTION ? appAppleId : undefined,
    );
    try {
      const tx = await verifier.verifyAndDecodeTransaction(signedTransaction);
      if (!tx.productId) {
        throw new HttpsError('invalid-argument', 'Apple transaction missing productId');
      }
      assertHttpsProduct(tx.productId, allowed);
      if (tx.revocationDate) {
        throw new HttpsError('failed-precondition', 'This Apple subscription transaction was revoked.');
      }
      const expiresMs = tx.expiresDate;
      if (!expiresMs || expiresMs < Date.now()) {
        throw new HttpsError('failed-precondition', 'Apple subscription is not active or has no future expiry.');
      }
      return { expiresAt: new Date(expiresMs), verifiedProductId: tx.productId };
    } catch (e) {
      if (e instanceof HttpsError) throw e;
      if (e instanceof VerificationException) {
        attempts.push(`${storeEnv}: ${e.message ?? 'verification failed'}`);
        continue;
      }
      attempts.push(`${storeEnv}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  throw new HttpsError('invalid-argument', `Apple JWS could not be verified. ${attempts.join(' | ')}`);
}

function isGaxios404(e: unknown): boolean {
  return e instanceof GaxiosError && e.response?.status === 404;
}

async function verifyGooglePlay(
  purchaseToken: string,
  clientProductId: string,
  allowed: Set<string>,
): Promise<VerifiedSubscription> {
  const packageName = process.env.GOOGLE_PLAY_PACKAGE_NAME?.trim();
  const saJson = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON?.trim();
  if (!packageName || !saJson) {
    throw new HttpsError(
      'failed-precondition',
      'Set GOOGLE_PLAY_PACKAGE_NAME and GOOGLE_PLAY_SERVICE_ACCOUNT_JSON (JSON key with Android Publisher API enabled).',
    );
  }
  let credentials: Record<string, unknown>;
  try {
    credentials = JSON.parse(saJson) as Record<string, unknown>;
  } catch {
    throw new HttpsError('failed-precondition', 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON must be valid JSON.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  const authClient = (await auth.getClient()) as JWT;
  const androidpublisher = google.androidpublisher({ version: 'v3', auth: authClient });

  assertHttpsProduct(clientProductId, allowed);

  try {
    const { data } = await androidpublisher.purchases.subscriptionsv2.get({
      packageName,
      token: purchaseToken,
    });

    const state = data.subscriptionState ?? '';
    if (state === 'SUBSCRIPTION_STATE_EXPIRED') {
      throw new HttpsError('failed-precondition', 'Google Play subscription is expired.');
    }

    const items = data.lineItems ?? [];
    let bestExpiryMs = 0;
    let verifiedProductId = clientProductId;
    for (const li of items) {
      const pid = li.productId ?? clientProductId;
      if (li.productId && !allowed.has(li.productId)) continue;
      if (li.expiryTime) {
        const ms = Date.parse(li.expiryTime);
        if (!Number.isNaN(ms) && ms > bestExpiryMs) {
          bestExpiryMs = ms;
          verifiedProductId = pid;
        }
      }
    }

    if (bestExpiryMs > Date.now()) {
      return { expiresAt: new Date(bestExpiryMs), verifiedProductId };
    }
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    if (!isGaxios404(e)) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new HttpsError('internal', `Google Play subscriptionsv2.get failed: ${msg}`);
    }
  }

  try {
    const { data } = await androidpublisher.purchases.subscriptions.get({
      packageName,
      subscriptionId: clientProductId,
      token: purchaseToken,
    });
    const ms = Number(data.expiryTimeMillis ?? 0);
    if (!ms || ms < Date.now()) {
      throw new HttpsError('failed-precondition', 'Google Play subscription is not active or has no future expiry.');
    }
    const st = data.paymentState;
    if (st === 0) {
      throw new HttpsError('failed-precondition', 'Google Play subscription payment is still pending.');
    }
    return { expiresAt: new Date(ms), verifiedProductId: clientProductId };
  } catch (e) {
    if (e instanceof HttpsError) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    throw new HttpsError('invalid-argument', `Google Play could not verify subscription: ${msg}`);
  }
}

/**
 * Verifies an IAP purchase against Apple (signed transaction JWS) or Google Play (purchase token).
 * Throws HttpsError on invalid input, revoked/expired subs, or missing server configuration.
 */
export async function verifyStorePurchase(input: VerifyPurchaseInput): Promise<VerifiedSubscription> {
  const allowed = allowedProductIds();
  const token = input.purchaseToken?.trim();
  if (!token) {
    throw new HttpsError('invalid-argument', 'purchaseToken is required');
  }

  if (input.platform === 'ios') {
    return verifyAppleJws(token, allowed);
  }
  return verifyGooglePlay(token, input.productId.trim(), allowed);
}
