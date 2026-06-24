import i18n from '../i18n';

function firebaseCode(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const code = (err as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err ?? '');
}

export function friendlyAppError(err: unknown, fallbackKey: string): string {
  const code = firebaseCode(err);
  if (code === 'auth/requires-recent-login') {
    return i18n.t('errors.appError.requiresRecentLogin');
  }
  if (code === 'permission-denied' || code === 'auth/permission-denied') {
    return i18n.t('errors.appError.permissionDenied');
  }
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return i18n.t('errors.appError.unavailable');
  }
  if (code === 'auth/network-request-failed') {
    return i18n.t('errors.appError.networkError');
  }
  const raw = errMessage(err).toLowerCase();
  if (raw.includes('network') || raw.includes('internet')) {
    return i18n.t('errors.appError.networkError');
  }
  return i18n.t(fallbackKey);
}

export function friendlyPurchaseError(err: unknown): string {
  const raw = errMessage(err).toLowerCase();
  if (raw.includes('expo go')) {
    return i18n.t('errors.appError.purchaseExpoGo');
  }
  if (raw.includes('timed out')) {
    return i18n.t('errors.appError.purchaseTimeout');
  }
  if (raw.includes('cancel')) {
    return i18n.t('errors.appError.purchaseCancelled');
  }
  if (raw.includes('sku') || raw.includes('product')) {
    return i18n.t('errors.appError.purchaseSku');
  }
  return friendlyAppError(err, 'errors.appError.purchaseGeneric');
}
