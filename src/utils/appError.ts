function firebaseCode(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const code = (err as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err ?? '');
}

export function friendlyAppError(err: unknown, fallback: string): string {
  const code = firebaseCode(err);
  if (code === 'auth/requires-recent-login') {
    return 'For security, please sign in again and retry.';
  }
  if (code === 'permission-denied' || code === 'auth/permission-denied') {
    return 'You do not have permission to do this action.';
  }
  if (code === 'unavailable' || code === 'deadline-exceeded') {
    return 'Service is temporarily unavailable. Please try again in a moment.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your internet connection and try again.';
  }
  const raw = errMessage(err).toLowerCase();
  if (raw.includes('network') || raw.includes('internet')) {
    return 'Network error. Please check your internet connection and try again.';
  }
  return fallback;
}

export function friendlyPurchaseError(err: unknown): string {
  const raw = errMessage(err).toLowerCase();
  if (raw.includes('expo go')) {
    return 'Purchases require a development or store build. Expo Go does not support in-app purchases.';
  }
  if (raw.includes('timed out')) {
    return 'Purchase timed out. Please try again.';
  }
  if (raw.includes('cancel')) {
    return 'Purchase was cancelled.';
  }
  if (raw.includes('sku') || raw.includes('product')) {
    return 'Subscription product is not configured correctly yet. Please contact support.';
  }
  return friendlyAppError(err, 'We could not complete your subscription. Please try again.');
}

