import Constants from 'expo-constants';

export type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

/**
 * Callable / HTTPS Functions region — must match deployed Cloud Functions (see `firebase/functions/src/index.ts`).
 * Override via app.json `extra.firebaseFunctionsRegion` or `EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION`.
 */
export function getFirebaseFunctionsRegion(): string {
  const extra = Constants.expoConfig?.extra as { firebaseFunctionsRegion?: string } | undefined;
  const fromExtra = extra?.firebaseFunctionsRegion?.trim();
  if (fromExtra) return fromExtra;
  const fromEnv = process.env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION?.trim();
  if (fromEnv) return fromEnv;
  return 'us-central1';
}

function envOverride(key: keyof FirebasePublicConfig): string {
  const map: Record<keyof FirebasePublicConfig, string> = {
    apiKey: 'EXPO_PUBLIC_FIREBASE_API_KEY',
    authDomain: 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
    projectId: 'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
    storageBucket: 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
    messagingSenderId: 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    appId: 'EXPO_PUBLIC_FIREBASE_APP_ID',
  };
  return String(process.env[map[key]] ?? '');
}

export function getFirebasePublicConfig(): FirebasePublicConfig {
  const extra = Constants.expoConfig?.extra as { firebase?: Partial<FirebasePublicConfig> } | undefined;
  const fb = extra?.firebase ?? {};
  return {
    apiKey: String(fb.apiKey ?? envOverride('apiKey')),
    authDomain: String(fb.authDomain ?? envOverride('authDomain')),
    projectId: String(fb.projectId ?? envOverride('projectId')),
    storageBucket: String(fb.storageBucket ?? envOverride('storageBucket')),
    messagingSenderId: String(fb.messagingSenderId ?? envOverride('messagingSenderId')),
    appId: String(fb.appId ?? envOverride('appId')),
  };
}

export function isFirebaseConfigured(cfg: FirebasePublicConfig): boolean {
  return Boolean(cfg.apiKey && cfg.projectId && cfg.appId);
}
