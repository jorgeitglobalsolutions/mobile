import Constants from 'expo-constants';
import { getFirebasePublicConfig, isFirebaseConfigured } from './firebaseConfig';

/**
 * Offline demo mode: no Firebase config required. Uses in-memory data (see `src/mock/inMemoryBackend.ts`).
 * Disabled automatically when real Firebase keys are present in `app.json` → `extra.firebase`.
 */
export function isMockDataMode(): boolean {
  if (isFirebaseConfigured(getFirebasePublicConfig())) {
    return false;
  }
  const extra = Constants.expoConfig?.extra as { useMockData?: boolean } | undefined;
  if (extra?.useMockData === true) {
    return true;
  }
  return process.env.EXPO_PUBLIC_USE_MOCK_DATA === '1';
}
