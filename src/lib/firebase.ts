import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getFunctions, type Functions } from 'firebase/functions';
import { getFirebasePublicConfig, isFirebaseConfigured } from '../config/firebaseConfig';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let functions: Functions | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  const cfg = getFirebasePublicConfig();
  if (!isFirebaseConfigured(cfg)) {
    return null;
  }
  if (!app) {
    app = getApps().length ? getApps()[0]! : initializeApp(cfg);
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!auth) {
    auth = getAuth(a);
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!db) {
    db = getFirestore(a);
  }
  return db;
}

export function getFirebaseFunctions(): Functions | null {
  const a = getFirebaseApp();
  if (!a) return null;
  if (!functions) {
    functions = getFunctions(a);
  }
  return functions;
}
