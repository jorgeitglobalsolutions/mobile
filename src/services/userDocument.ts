import {
  Timestamp,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { getFirebaseFirestore } from '../lib/firebase';
import { isMockDataMode } from '../config/mockMode';
import * as mem from '../mock/inMemoryBackend';
import type { SubscriptionFields, UserDocument, UserProfile, UserSettings } from '../types/firestoreUser';
import { trackUserEvent } from './userEvents';

export const USERS_COLLECTION = 'users';

export function userDocRef(uid: string) {
  const db = getFirebaseFirestore();
  if (!db) throw new Error('Firestore not initialized');
  return doc(db, USERS_COLLECTION, uid);
}

export async function ensureUserDocument(user: User): Promise<void> {
  if (isMockDataMode()) {
    mem.ensureMockUser(user.uid, user.email ?? '', user.displayName, mem.getMockUserDocument(user.uid)?.profile ?? null);
    return;
  }
  const ref = userDocRef(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await createUserDocument(user, null);
}

export async function createUserDocument(user: User, profile: UserProfile | null): Promise<void> {
  if (isMockDataMode()) {
    mem.ensureMockUser(user.uid, user.email ?? '', user.displayName, profile);
    return;
  }
  const ref = userDocRef(user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 7);

  await setDoc(ref, {
    email: user.email ?? '',
    displayName: user.displayName,
    profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    subscription: {
      status: 'trial' as const,
      trialEndsAt: Timestamp.fromDate(trialEnds),
      currentPeriodEndsAt: null,
      productId: null,
      platform: null,
      lastSyncedAt: serverTimestamp(),
    },
  });
  await trackUserEvent(user.uid, 'auth_sign_up', {
    email: user.email ?? '',
    hasProfile: Boolean(profile),
    trialDays: 7,
  });
}

export async function updateUserSettings(uid: string, settings: Partial<UserSettings>): Promise<void> {
  if (isMockDataMode()) {
    mem.mockUpdateUserSettings(uid, settings);
    return;
  }
  const ref = userDocRef(uid);
  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  (Object.keys(settings) as (keyof UserSettings)[]).forEach((k) => {
    const v = settings[k];
    if (v !== undefined) updates[`settings.${k}`] = v;
  });
  await updateDoc(ref, updates);
  await trackUserEvent(uid, 'user_settings_updated', { keys: Object.keys(settings) });
}

export async function updatePushToken(uid: string, pushToken: string | null): Promise<void> {
  if (isMockDataMode()) {
    mem.mockUpdatePushToken(uid, pushToken);
    return;
  }
  await updateDoc(userDocRef(uid), {
    pushToken: pushToken ?? null,
    updatedAt: serverTimestamp(),
  });
}

export async function updateUserProfile(uid: string, profile: UserProfile): Promise<void> {
  if (isMockDataMode()) {
    mem.mockUpdateProfile(uid, profile);
    return;
  }
  const ref = userDocRef(uid);
  await updateDoc(ref, {
    profile,
    updatedAt: serverTimestamp(),
  });
  await trackUserEvent(uid, 'user_profile_updated', {
    goal: profile.goal,
    weightKg: profile.weightKg,
    heightCm: profile.heightCm,
  });
}

export async function updateSubscriptionFields(
  uid: string,
  partial: Partial<SubscriptionFields>,
): Promise<void> {
  if (isMockDataMode()) {
    const cur = mem.getMockUserDocument(uid);
    if (cur) {
      mem.mockPatchUserDocument(uid, { subscription: { ...cur.subscription, ...partial } });
    }
    return;
  }
  const ref = userDocRef(uid);
  const updates: Record<string, unknown> = { updatedAt: serverTimestamp() };
  (Object.keys(partial) as (keyof SubscriptionFields)[]).forEach((k) => {
    const v = partial[k];
    if (v !== undefined) updates[`subscription.${k}`] = v;
  });
  await updateDoc(ref, updates);
}

/**
 * @deprecated Subscription fields must be updated via Cloud Functions. Use `callGrantDevSubscription`.
 */
export async function applyDevMonthlySubscription(_uid: string): Promise<void> {
  throw new Error('applyDevMonthlySubscription is disabled under Firestore rules. Use callGrantDevSubscription().');
}

export function subscribeUserDocument(uid: string, onData: (doc: UserDocument | null) => void): Unsubscribe {
  if (isMockDataMode()) {
    return mem.mockSubscribeUserDocument(uid, onData);
  }
  const ref = userDocRef(uid);
  return onSnapshot(ref, (snap) => {
    if (!snap.exists()) {
      onData(null);
      return;
    }
    onData(snap.data() as UserDocument);
  });
}
