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
import { isMockDataMode } from '../config/mockMode';
import { createMockAuthUser, ensureMockUser, MOCK_UID } from '../mock/inMemoryBackend';
import { computeAccessLevel } from '../services/subscription';
import {
  createUserDocument,
  ensureUserDocument,
  subscribeUserDocument,
} from '../services/userDocument';
import { registerForPushNotificationsAsync } from '../services/notifications';
import type { UserDocument, UserProfile } from '../types/firestoreUser';
import { trackUserEvent } from '../services/userEvents';

type AccessLevel = ReturnType<typeof computeAccessLevel>['level'];

type AuthContextValue = {
  firebaseReady: boolean;
  /** True when Firebase is configured OR mock demo mode is on (app can show main flows). */
  firebaseConfigured: boolean;
  useMockData: boolean;
  user: User | null;
  userDoc: UserDocument | null;
  /** False while signed-in user's Firestore doc has not emitted its first snapshot for this session (uid). Always true when logged out. */
  userDocHydrated: boolean;
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
  const [userDocHydrated, setUserDocHydrated] = useState(true);
  const pushRegisterUid = useRef<string | null>(null);

  const configured = useMemo(() => isFirebaseConfigured(getFirebasePublicConfig()), []);
  const mockMode = useMemo(() => isMockDataMode(), []);
  const dataLayerOk = useMemo(() => configured || mockMode, [configured, mockMode]);

  useEffect(() => {
    if (mockMode) {
      setFirebaseReady(true);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setFirebaseReady(true);
      return;
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setFirebaseReady(true);
    });
  }, [configured, mockMode]);

  useEffect(() => {
    if (!user) {
      setUserDoc(null);
      setUserDocHydrated(true);
      return;
    }
    setUserDocHydrated(false);
    setUserDoc(null);
    let cancelled = false;
    let unsubDoc: (() => void) | undefined;
    const applySnapshot = (d: UserDocument | null) => {
      setUserDoc(d);
      setUserDocHydrated(true);
    };
    void (async () => {
      if (mockMode) {
        unsubDoc = subscribeUserDocument(user.uid, applySnapshot);
        return;
      }
      try {
        await ensureUserDocument(user);
      } catch {
        // ignore; listener may still populate later
      }
      if (cancelled) return;
      unsubDoc = subscribeUserDocument(user.uid, applySnapshot);
    })();
    return () => {
      cancelled = true;
      unsubDoc?.();
    };
  }, [user?.uid, mockMode]);

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

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (isMockDataMode()) {
        const e = email.trim() || 'demo@mock.local';
        const u = createMockAuthUser(e, e.split('@')[0] ?? 'Demo');
        ensureMockUser(MOCK_UID, e, u.displayName ?? 'Demo', null);
        setUser(u);
        return;
      }
      const auth = getFirebaseAuth();
      if (!auth) throw new Error('Firebase is not configured');
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      try {
        await trackUserEvent(cred.user.uid, 'auth_sign_in', { email: email.trim() });
      } catch {
        // Never block sign-in if audit logging fails (e.g. rules / network).
      }
    },
    [],
  );

  const signUp = useCallback(async (email: string, password: string, profile: UserProfile | null) => {
    if (isMockDataMode()) {
      const e = email.trim() || 'demo@mock.local';
      const u = createMockAuthUser(e, e.split('@')[0] ?? 'Athlete');
      ensureMockUser(MOCK_UID, e, u.displayName ?? 'Athlete', profile);
      setUser(u);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase is not configured');
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await createUserDocument(cred.user, profile);
  }, []);

  const signOutUser = useCallback(async () => {
    if (isMockDataMode()) {
      setUser(null);
      setUserDoc(null);
      setUserDocHydrated(true);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) return;
    if (user?.uid) {
      await trackUserEvent(user.uid, 'auth_sign_out');
    }
    await signOut(auth);
  }, [user?.uid]);

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
      firebaseConfigured: dataLayerOk,
      useMockData: mockMode,
      user,
      userDoc,
      userDocHydrated,
      accessLevel: level,
      subscriptionStatus: status,
      signIn,
      signUp,
      signOutUser,
    };
  }, [
    firebaseReady,
    dataLayerOk,
    mockMode,
    user,
    userDoc,
    userDocHydrated,
    signIn,
    signUp,
    signOutUser,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
