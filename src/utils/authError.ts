import i18n from '../i18n';

function firebaseCode(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const code = (err as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
}

export function friendlySignInError(err: unknown): string {
  const code = firebaseCode(err);
  if (code === 'auth/invalid-email') return i18n.t('errors.authError.signInInvalidEmail');
  if (code === 'auth/missing-password') return i18n.t('errors.authError.signInMissingPassword');
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return i18n.t('errors.authError.signInWrongCredentials');
  }
  if (code === 'auth/too-many-requests') {
    return i18n.t('errors.authError.signInTooManyRequests');
  }
  if (code === 'auth/network-request-failed') {
    return i18n.t('errors.appError.networkError');
  }
  return i18n.t('errors.authError.signInGeneric');
}

export function friendlySignUpError(err: unknown): string {
  const code = firebaseCode(err);
  if (code === 'auth/invalid-email') return i18n.t('errors.authError.signUpInvalidEmail');
  if (code === 'auth/email-already-in-use') return i18n.t('errors.authError.signUpEmailInUse');
  if (code === 'auth/weak-password') return i18n.t('errors.authError.signUpWeakPassword');
  if (code === 'auth/network-request-failed') {
    return i18n.t('errors.appError.networkError');
  }
  return i18n.t('errors.authError.signUpGeneric');
}
