import Constants from 'expo-constants';

export type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export function getFirebasePublicConfig(): FirebasePublicConfig {
  const extra = Constants.expoConfig?.extra as { firebase?: Partial<FirebasePublicConfig> } | undefined;
  const fb = extra?.firebase ?? {};
  return {
    apiKey: String(fb.apiKey ?? ''),
    authDomain: String(fb.authDomain ?? ''),
    projectId: String(fb.projectId ?? ''),
    storageBucket: String(fb.storageBucket ?? ''),
    messagingSenderId: String(fb.messagingSenderId ?? ''),
    appId: String(fb.appId ?? ''),
  };
}

export function isFirebaseConfigured(cfg: FirebasePublicConfig): boolean {
  return Boolean(cfg.apiKey && cfg.projectId && cfg.appId);
}
