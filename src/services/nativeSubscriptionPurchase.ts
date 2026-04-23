import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as IAP from 'expo-iap';
import type { Purchase } from 'expo-iap';
import { isMockDataMode } from '../config/mockMode';
import { mockGrantActiveSubscription, MOCK_UID } from '../mock/inMemoryBackend';
import { callVerifyPurchase } from './purchaseVerification';

function extraString(key: string, fallback: string): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  const v = extra[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}

const isExpoGo = Constants.appOwnership === 'expo';

function listenForPurchase(sku: string, timeoutMs: number): Promise<Purchase> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const to = setTimeout(() => {
      if (settled) return;
      settled = true;
      ok.remove();
      bad.remove();
      reject(new Error('Purchase timed out'));
    }, timeoutMs);
    const ok = IAP.purchaseUpdatedListener((p) => {
      if (p.productId !== sku) return;
      if (settled) return;
      settled = true;
      clearTimeout(to);
      ok.remove();
      bad.remove();
      resolve(p);
    });
    const bad = IAP.purchaseErrorListener((e) => {
      if (settled) return;
      settled = true;
      clearTimeout(to);
      ok.remove();
      bad.remove();
      reject(new Error(e.message || 'Purchase failed'));
    });
  });
}

/**
 * Native subscription purchase + server-side entitlement update.
 * Requires a dev/production build with store products configured (not Expo Go).
 */
export async function purchaseEmFitSubscription(plan: 'month' | 'year'): Promise<void> {
  if (isMockDataMode()) {
    mockGrantActiveSubscription(MOCK_UID);
    return;
  }
  if (isExpoGo) {
    throw new Error('In-app purchases need a development or store build (Expo Go does not include native IAP).');
  }

  const skuMonth = extraString('iapSkuMonthly', 'em_fit_monthly');
  const skuYear = extraString('iapSkuYearly', 'em_fit_yearly');
  const sku = plan === 'month' ? skuMonth : skuYear;

  await IAP.initConnection();
  const products = (await IAP.fetchProducts({ skus: [sku], type: 'subs' })) ?? [];
  if (!products.length) {
    throw new Error(
      'Store did not return this subscription SKU. Configure product IDs in the store and in app.json extra (iapSkuMonthly / iapSkuYearly).',
    );
  }

  const purchaseWait = listenForPurchase(sku, 120_000);
  await IAP.requestPurchase({
    request: {
      apple: { sku },
      google: { skus: [sku] },
    },
    type: 'subs',
  });

  const purchase = await purchaseWait;
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
  const purchaseToken = purchase.purchaseToken ?? null;

  await callVerifyPurchase({
    platform,
    productId: purchase.productId,
    purchaseToken,
    plan,
  });

  await IAP.finishTransaction({ purchase, isConsumable: false });
}

/** Restore store purchases and sync entitlement via `verifyPurchase` (native / store build only). */
export async function restoreSubscriptionsAndVerify(): Promise<void> {
  if (isMockDataMode()) {
    mockGrantActiveSubscription(MOCK_UID);
    return;
  }
  if (isExpoGo) {
    throw new Error('In-app purchases need a development or store build (Expo Go does not include native IAP).');
  }
  await IAP.initConnection();
  await IAP.restorePurchases();
  const purchases = (await IAP.getAvailablePurchases()) ?? [];
  const sub = purchases.find((p) => p.purchaseToken) ?? purchases[0];
  if (!sub?.purchaseToken) {
    throw new Error('No subscription purchases found to restore.');
  }
  const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
  const plan: 'month' | 'year' =
    sub.productId?.toLowerCase().includes('year') || sub.currentPlanId?.toLowerCase().includes('year')
      ? 'year'
      : 'month';
  await callVerifyPurchase({
    platform,
    productId: sub.productId,
    purchaseToken: sub.purchaseToken,
    plan,
  });
}
