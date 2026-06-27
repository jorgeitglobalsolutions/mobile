/* eslint-env node */
/**
 * Firebase client config at bundle time:
 * - Local dev: `.env` EXPO_PUBLIC_* overrides (see `.env.example`)
 * - EAS / Play Store: falls back to `app.json` → `extra.firebase` (`.env` is not uploaded)
 */
const appJson = require('./app.json');

const embeddedFirebase = appJson.expo?.extra?.firebase ?? {};

function firebaseField(key, envKey) {
  const fromEnv = process.env[envKey]?.trim();
  if (fromEnv) return fromEnv;
  const fromJson = embeddedFirebase[key];
  return fromJson != null ? String(fromJson) : '';
}

module.exports = () => ({
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra ?? {}),
      firebase: {
        apiKey: firebaseField('apiKey', 'EXPO_PUBLIC_FIREBASE_API_KEY'),
        authDomain: firebaseField('authDomain', 'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
        projectId: firebaseField('projectId', 'EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
        storageBucket: firebaseField('storageBucket', 'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: firebaseField('messagingSenderId', 'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
        appId: firebaseField('appId', 'EXPO_PUBLIC_FIREBASE_APP_ID'),
      },
    },
  },
});
