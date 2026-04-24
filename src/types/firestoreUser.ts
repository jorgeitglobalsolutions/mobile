import type { Timestamp } from 'firebase/firestore';

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'unknown';

export type UserProfile = {
  weightKg: number;
  heightCm: number;
  goal: 'lose' | 'build' | 'maintain';
};

export type SubscriptionFields = {
  status: SubscriptionStatus;
  trialEndsAt: Timestamp | null;
  currentPeriodEndsAt: Timestamp | null;
  productId: string | null;
  platform: 'ios' | 'android' | 'web' | null;
  lastSyncedAt: Timestamp | null;
};

export type UserSettings = {
  notificationsEnabled?: boolean;
  unitsMetric?: boolean;
  /** 0–23 UTC hour for scheduled push reminder; omit or null = server default (13). */
  reminderHourUtc?: number | null;
};

export type UserDocument = {
  email: string;
  displayName: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profile: UserProfile | null;
  subscription: SubscriptionFields;
  settings?: UserSettings;
  pushToken?: string | null;
};
