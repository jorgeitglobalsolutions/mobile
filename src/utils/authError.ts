function firebaseCode(err: unknown): string {
  if (!err || typeof err !== 'object') return '';
  const code = (err as { code?: unknown }).code;
  return typeof code === 'string' ? code : '';
}

export function friendlySignInError(err: unknown): string {
  const code = firebaseCode(err);
  if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (code === 'auth/missing-password') return 'Please enter your password.';
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return 'Incorrect email or password. Please try again.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Too many attempts. Please wait a few minutes and try again.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your internet connection and try again.';
  }
  return 'Could not sign in right now. Please try again.';
}

export function friendlySignUpError(err: unknown): string {
  const code = firebaseCode(err);
  if (code === 'auth/invalid-email') return 'Please enter a valid email address.';
  if (code === 'auth/email-already-in-use') return 'This email is already registered. Please sign in instead.';
  if (code === 'auth/weak-password') return 'Password is too weak. Use at least 6 characters.';
  if (code === 'auth/network-request-failed') {
    return 'Network error. Please check your internet connection and try again.';
  }
  return 'Could not create account right now. Please try again.';
}

