/** User completed the onboarding wizard (local). Next step is sign-up / login. */
export const ONBOARDING_WIZARD_KEY = 'onboarding_wizard_completed';

/** Persisted app language override (`en` | `es`). */
export const LOCALE_STORAGE_KEY = 'app_locale';

/**
 * Dev-only override that grants paywall access without a real purchase.
 * Honored ONLY when `__DEV__` is true so it cannot leak into production builds.
 */
export const DEV_SUBSCRIPTION_OVERRIDE_KEY = 'dev_subscription_override';
