/* eslint-env node */
/**
 * Firebase client config at bundle time via EXPO_PUBLIC_* env vars only.
 * - Local dev: copy `.env.example` → `.env` (gitignored)
 * - EAS / Play Store: set EXPO_PUBLIC_FIREBASE_* in EAS → Environment variables → production
 * Do NOT commit API keys in app.json (GitHub secret scanning + public repo risk).
 */
const appJson = require('./app.json');

function firebaseField(envKey) {
  return process.env[envKey]?.trim() ?? '';
}

module.exports = () => ({
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo.extra ?? {}),
      firebase: {
        apiKey: firebaseField('EXPO_PUBLIC_FIREBASE_API_KEY'),
        authDomain: firebaseField('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
        projectId: firebaseField('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
        storageBucket: firebaseField('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
        messagingSenderId: firebaseField('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
        appId: firebaseField('EXPO_PUBLIC_FIREBASE_APP_ID'),
      },
    },
  },
});
