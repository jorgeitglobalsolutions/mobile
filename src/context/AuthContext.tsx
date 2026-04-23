import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from '../lib/firebase';
import { getFirebasePublicConfig, isFirebaseConfigured } from '../config/firebaseConfig';
import { computeAccessLevel } from '../services/subscription';
import { createUserDocument, ensureUserDocument, subscribeUserDocument } from '../services/userDocument';
import { seedPredefinedRoutinesIfEmpty } from '../services/routinesRepo';
import { registerForPushNotificationsAsync } from '../services/notifications';
import type { UserDocument, UserProfile } from '../types/firestoreUser';

type AccessLevel = ReturnType<typeof computeAccessLevel>['level'];

type AuthContextValue = {
  firebaseReady: boolean;
  firebaseConfigured: boolean;
  user: User | null;
  userDoc: UserDocument | null;
  accessLevel: AccessLevel;
  subscriptionStatus: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, profile: UserProfile | null) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseReady, setFirebaseReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userDoc, setUserDoc] = useState<UserDocument | null>(null);
  const pushRegisterUid = useRef<string | null>(null);

  const configured = useMemo(() => isFirebaseConfigured(getFirebasePublicConfig()), []);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setFirebaseReady(true);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setFirebaseReady(true);
    });
  }, [configured]);

  useEffect(() => {
    if (!user?.uid) return;
    void seedPredefinedRoutinesIfEmpty(user.uid);
  }, [user?.uid]);

  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      return;
    }
    let cancelled = false;
    let unsubDoc: (() => void) | undefined;
    void (async () => {
      try {
        await ensureUserDocument(user);
      } catch {
        // ignore; listener may still populate later
      }
      if (cancelled) return;
      unsubDoc = subscribeUserDocument(user.uid, setUserDoc);
    })();
    return () => {
      cancelled = true;
      unsubDoc?.();
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) {
      pushRegisterUid.current = null;
      return;
    }
    if (!userDoc) return;
    if (userDoc.settings?.notificationsEnabled === false) return;
    if (pushRegisterUid.current === user.uid) return;
    pushRegisterUid.current = user.uid;
    void registerForPushNotificationsAsync(user.uid);
  }, [user?.uid, userDoc]);

  const signIn = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase is not configured');
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUp = useCallback(async (email: string, password: string, profile: UserProfile | null) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase is not configured');
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await createUserDocument(cred.user, profile);
  }, []);

  const signOutUser = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    await signOut(auth);
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    let level: AccessLevel = 'paywalled';
    let status = 'unknown';
    if (!user) {
      level = 'paywalled';
      status = 'unknown';
    } else if (!userDoc) {
      // Avoid flashing the paywall while the first snapshot is loading.
      level = 'full';
      status = 'syncing';
    } else {
      const r = computeAccessLevel(userDoc.subscription);
      level = r.level;
      status = r.status;
    }
    return {
      firebaseReady,
      firebaseConfigured: configured,
      user,
      userDoc,
      accessLevel: level,
      subscriptionStatus: status,
      signIn,
      signUp,
      signOutUser,
    };
  }, [firebaseReady, configured, user, userDoc, signIn, signUp, signOutUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
