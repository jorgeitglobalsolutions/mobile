import { Timestamp } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { HabitDayDoc, LoggedExercise, MealEntry, MoodValue, RoutineDoc, WeightEntryDoc, WorkoutDoc } from '../types/domain';
import type { CustomFoodDoc } from '../types/food';
import type { SubscriptionFields, UserDocument, UserProfile, UserSettings } from '../types/firestoreUser';
import { PREDEFINED_ROUTINES_SEED } from '../data/predefinedRoutinesSeed';
import type { WorkoutDraftDoc } from '../services/workoutDraftRepo';

export const MOCK_UID = 'mock-local-user';

function ts(d = new Date()): Timestamp {
  return Timestamp.fromDate(d);
}

function trialSub(): SubscriptionFields {
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + 7);
  return {
    status: 'trial',
    trialEndsAt: ts(trialEnds),
    currentPeriodEndsAt: null,
    productId: null,
    platform: null,
    lastSyncedAt: ts(),
  };
}

function defaultUserDoc(email: string, displayName: string | null, profile: UserProfile | null): UserDocument {
  const now = new Date();
  return {
    email,
    displayName,
    createdAt: ts(now),
    updatedAt: ts(now),
    profile,
    subscription: trialSub(),
    settings: { notificationsEnabled: true, unitsMetric: true },
    pushToken: null,
  };
}

const userDocs = new Map<string, UserDocument>();
const routines = new Map<string, Map<string, RoutineDoc>>();
const workouts = new Map<string, { id: string; data: WorkoutDoc }[]>();
const habitDays = new Map<string, Map<string, HabitDayDoc>>();
const drafts = new Map<string, WorkoutDraftDoc | null>();
const weightEntries = new Map<string, { id: string; data: WeightEntryDoc }[]>();
const weightListeners = new Map<string, Set<(rows: { id: string; data: WeightEntryDoc }[]) => void>>();
const customFoods = new Map<string, { id: string; data: CustomFoodDoc }[]>();
const customFoodListeners = new Map<string, Set<(rows: { id: string; data: CustomFoodDoc }[]) => void>>();

const userDocListeners = new Map<string, Set<(d: UserDocument | null) => void>>();
const routineListeners = new Map<string, Set<(rows: { id: string; data: RoutineDoc }[]) => void>>();
const habitListeners = new Map<string, Set<(d: HabitDayDoc | null) => void>>();

function habitKey(uid: string, date: string) {
  return `${uid}|${date}`;
}

function seedRoutines(uid: string) {
  if (!routines.has(uid)) routines.set(uid, new Map());
  const map = routines.get(uid)!;
  for (const s of PREDEFINED_ROUTINES_SEED) {
    map.set(s.id, {
      title: s.title,
      muscles: s.muscles,
      minutes: s.minutes,
      exerciseCount: s.exercises.length,
      category: s.category,
      isPredefined: true,
      exercises: s.exercises,
      description: s.description,
      updatedAt: ts(),
    });
  }
}

function emitWeightEntries(uid: string) {
  const rows = weightEntries.get(uid) ?? [];
  weightListeners.get(uid)?.forEach((cb) => cb(rows));
}

function seedWeightEntries(uid: string) {
  if (weightEntries.has(uid)) return;
  const profileKg = userDocs.get(uid)?.profile?.weightKg ?? 75;
  const arr: { id: string; data: WeightEntryDoc }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 4);
    const jitter = (i - 3) * 0.35;
    const w = Math.round((profileKg + jitter) * 10) / 10;
    arr.push({
      id: `mock_we_${uid}_${i}`,
      data: {
        weightKg: w,
        loggedAt: ts(d),
      },
    });
  }
  arr.sort((a, b) => b.data.loggedAt.toMillis() - a.data.loggedAt.toMillis());
  weightEntries.set(uid, arr);
  emitWeightEntries(uid);
}

function seedWorkouts(uid: string) {
  if (workouts.has(uid)) return;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const w: WorkoutDoc = {
    routineId: 'seed_push',
    title: 'Push Day',
    startedAt: ts(new Date(yesterday.getTime() - 3600_000)),
    endedAt: ts(yesterday),
    durationSeconds: 3600,
    exercises: [
      {
        name: 'Bench Press',
        sets: [
          { weightKg: 60, reps: 10, done: true },
          { weightKg: 70, reps: 8, done: true },
        ],
      },
    ],
    totalVolumeKg: 1160,
    totalSets: 2,
    bestSetVolumeKg: 560,
  };
  workouts.set(uid, [{ id: 'mock-workout-1', data: w }]);
}

export function ensureMockUser(uid: string, email: string, displayName: string | null, profile: UserProfile | null) {
  if (!userDocs.has(uid)) {
    userDocs.set(uid, defaultUserDoc(email, displayName, profile));
  }
  seedRoutines(uid);
  seedWorkouts(uid);
  seedWeightEntries(uid);
  notifyUser(uid);
  emitRoutines(uid);
}

export function getMockUserDocument(uid: string): UserDocument | null {
  return userDocs.get(uid) ?? null;
}

export function mockSubscribeUserDocument(uid: string, onData: (d: UserDocument | null) => void): () => void {
  if (!userDocListeners.has(uid)) userDocListeners.set(uid, new Set());
  userDocListeners.get(uid)!.add(onData);
  onData(userDocs.get(uid) ?? null);
  return () => userDocListeners.get(uid)?.delete(onData);
}

function notifyUser(uid: string) {
  const d = userDocs.get(uid) ?? null;
  userDocListeners.get(uid)?.forEach((fn) => fn(d));
}

export function mockPatchUserDocument(uid: string, patch: Partial<UserDocument>) {
  const cur = userDocs.get(uid);
  if (!cur) return;
  const next: UserDocument = {
    ...cur,
    ...patch,
    subscription: patch.subscription ? { ...cur.subscription, ...patch.subscription } : cur.subscription,
  };
  userDocs.set(uid, next);
  notifyUser(uid);
}

export function mockUpdateUserSettings(uid: string, settings: Partial<UserSettings>) {
  const cur = userDocs.get(uid);
  if (!cur) return;
  userDocs.set(uid, {
    ...cur,
    settings: { ...cur.settings, ...settings },
    updatedAt: ts(),
  });
  notifyUser(uid);
}

export function mockUpdatePushToken(uid: string, token: string | null) {
  const cur = userDocs.get(uid);
  if (!cur) return;
  userDocs.set(uid, { ...cur, pushToken: token, updatedAt: ts() });
  notifyUser(uid);
}

export function mockUpdateProfile(uid: string, profile: UserProfile) {
  const cur = userDocs.get(uid);
  if (!cur) return;
  userDocs.set(uid, { ...cur, profile, updatedAt: ts() });
  notifyUser(uid);
}

export function mockGrantActiveSubscription(uid: string) {
  const end = new Date();
  end.setDate(end.getDate() + 30);
  const cur = userDocs.get(uid);
  if (!cur) return;
  const sub: SubscriptionFields = {
    ...cur.subscription,
    status: 'active',
    currentPeriodEndsAt: ts(end),
    productId: 'mock_premium',
    platform: 'web',
    lastSyncedAt: ts(),
  };
  userDocs.set(uid, {
    ...cur,
    subscription: sub,
    updatedAt: ts(),
  });
  notifyUser(uid);
}

function getRoutineMap(uid: string) {
  seedRoutines(uid);
  return routines.get(uid)!;
}

function emitRoutines(uid: string) {
  const map = getRoutineMap(uid);
  const rows = [...map.entries()].map(([id, data]) => ({ id, data })).sort((a, b) => a.data.title.localeCompare(b.data.title));
  routineListeners.get(uid)?.forEach((cb) => cb(rows));
}

export function mockSubscribeRoutines(uid: string, onUpdate: (rows: { id: string; data: RoutineDoc }[]) => void): () => void {
  seedRoutines(uid);
  if (!routineListeners.has(uid)) routineListeners.set(uid, new Set());
  routineListeners.get(uid)!.add(onUpdate);
  const map = getRoutineMap(uid);
  onUpdate([...map.entries()].map(([id, data]) => ({ id, data })).sort((a, b) => a.data.title.localeCompare(b.data.title)));
  return () => routineListeners.get(uid)?.delete(onUpdate);
}

export async function mockGetRoutine(uid: string, routineId: string): Promise<RoutineDoc | null> {
  return getRoutineMap(uid).get(routineId) ?? null;
}

export async function mockSaveUserRoutine(
  uid: string,
  routineId: string | undefined,
  data: Omit<RoutineDoc, 'updatedAt' | 'isPredefined'> & { isPredefined?: boolean },
): Promise<string> {
  const map = getRoutineMap(uid);
  const id = routineId ?? `custom_${Date.now()}`;
  const doc: RoutineDoc = {
    ...data,
    isPredefined: data.isPredefined ?? false,
    updatedAt: ts(),
  };
  map.set(id, doc);
  emitRoutines(uid);
  return id;
}

export async function mockDeleteRoutine(uid: string, routineId: string): Promise<void> {
  const map = getRoutineMap(uid);
  const d = map.get(routineId);
  if (!d || d.isPredefined) return;
  map.delete(routineId);
  emitRoutines(uid);
}

export async function mockSeedPredefinedIfEmpty(uid: string): Promise<void> {
  seedRoutines(uid);
}

function bestVolume(exercises: LoggedExercise[]): number {
  let best = 0;
  for (const ex of exercises) {
    for (const s of ex.sets) {
      if (!s.done) continue;
      const v = s.weightKg * s.reps;
      if (v > best) best = v;
    }
  }
  return Math.round(best * 10) / 10;
}

function totalVolume(exercises: LoggedExercise[]): number {
  let t = 0;
  for (const ex of exercises) {
    for (const s of ex.sets) {
      if (!s.done) continue;
      t += s.weightKg * s.reps;
    }
  }
  return Math.round(t);
}

function countSets(exercises: LoggedExercise[]): number {
  return exercises.reduce((acc, ex) => acc + ex.sets.filter((s) => s.done).length, 0);
}

export async function mockSaveWorkoutSession(
  uid: string,
  input: {
    routineId: string | null;
    title: string;
    startedAt: Date;
    endedAt: Date;
    exercises: LoggedExercise[];
  },
): Promise<string> {
  seedWorkouts(uid);
  const durationSeconds = Math.max(0, Math.floor((input.endedAt.getTime() - input.startedAt.getTime()) / 1000));
  const doc: WorkoutDoc = {
    routineId: input.routineId,
    title: input.title,
    startedAt: ts(input.startedAt),
    endedAt: ts(input.endedAt),
    durationSeconds,
    exercises: input.exercises,
    totalVolumeKg: totalVolume(input.exercises),
    totalSets: countSets(input.exercises),
    bestSetVolumeKg: bestVolume(input.exercises),
  };
  const id = `w_${Date.now()}`;
  workouts.get(uid)!.unshift({ id, data: doc });
  return id;
}

export async function mockListRecentWorkouts(uid: string, max: number): Promise<{ id: string; data: WorkoutDoc }[]> {
  seedWorkouts(uid);
  return (workouts.get(uid) ?? []).slice(0, max);
}

export async function mockGetWorkout(uid: string, workoutId: string): Promise<WorkoutDoc | null> {
  return (workouts.get(uid) ?? []).find((w) => w.id === workoutId)?.data ?? null;
}

function getHabitMap(uid: string) {
  if (!habitDays.has(uid)) habitDays.set(uid, new Map());
  return habitDays.get(uid)!;
}

function emitHabit(uid: string, date: string) {
  const key = habitKey(uid, date);
  const d = getHabitMap(uid).get(date) ?? null;
  habitListeners.get(key)?.forEach((fn) => fn(d));
}

export type MockHabitDefaults = {
  proteinGoalG: number;
  waterGoalMl: number;
  caloriesGoalKcal?: number;
  carbsGoalG?: number;
  fatGoalG?: number;
};

function blankHabitDay(date: string, defaults: MockHabitDefaults): HabitDayDoc {
  return {
    date,
    proteinG: 0,
    waterMl: 0,
    caloriesKcal: 0,
    carbsG: 0,
    fatG: 0,
    workoutCompleted: false,
    mood: null,
    proteinGoalG: defaults.proteinGoalG,
    waterGoalMl: defaults.waterGoalMl,
    caloriesGoalKcal: defaults.caloriesGoalKcal ?? 0,
    carbsGoalG: defaults.carbsGoalG ?? 0,
    fatGoalG: defaults.fatGoalG ?? 0,
    meals: [],
    updatedAt: ts(),
  };
}

function applyGoalDefaults(cur: HabitDayDoc, defaults: MockHabitDefaults): Partial<HabitDayDoc> {
  return {
    proteinGoalG: cur.proteinGoalG || defaults.proteinGoalG,
    waterGoalMl: cur.waterGoalMl || defaults.waterGoalMl,
    caloriesGoalKcal: cur.caloriesGoalKcal || defaults.caloriesGoalKcal || 0,
    carbsGoalG: cur.carbsGoalG || defaults.carbsGoalG || 0,
    fatGoalG: cur.fatGoalG || defaults.fatGoalG || 0,
  };
}

export async function mockGetOrCreateHabitDay(
  uid: string,
  date: string,
  defaults: MockHabitDefaults,
): Promise<HabitDayDoc> {
  const map = getHabitMap(uid);
  let d = map.get(date);
  if (!d) {
    d = blankHabitDay(date, defaults);
    map.set(date, d);
    emitHabit(uid, date);
  }
  return d;
}

export function mockSubscribeHabitDay(
  uid: string,
  date: string,
  defaults: MockHabitDefaults,
  onData: (d: HabitDayDoc | null) => void,
): () => void {
  const key = habitKey(uid, date);
  if (!habitListeners.has(key)) habitListeners.set(key, new Set());
  habitListeners.get(key)!.add(onData);
  const map = getHabitMap(uid);
  let doc = map.get(date);
  if (!doc) {
    doc = blankHabitDay(date, defaults);
    map.set(date, doc);
  }
  onData(doc);
  return () => habitListeners.get(key)?.delete(onData);
}

export async function mockIncrementProtein(uid: string, date: string, deltaG: number, defaults: MockHabitDefaults) {
  const map = getHabitMap(uid);
  const cur = map.get(date) ?? blankHabitDay(date, defaults);
  map.set(date, {
    ...cur,
    proteinG: Math.max(0, (cur.proteinG ?? 0) + deltaG),
    ...applyGoalDefaults(cur, defaults),
    updatedAt: ts(),
  });
  emitHabit(uid, date);
}

export async function mockIncrementCarbs(uid: string, date: string, deltaG: number, defaults: MockHabitDefaults) {
  const map = getHabitMap(uid);
  const cur = map.get(date) ?? blankHabitDay(date, defaults);
  map.set(date, {
    ...cur,
    carbsG: Math.max(0, (cur.carbsG ?? 0) + deltaG),
    ...applyGoalDefaults(cur, defaults),
    updatedAt: ts(),
  });
  emitHabit(uid, date);
}

export async function mockIncrementFat(uid: string, date: string, deltaG: number, defaults: MockHabitDefaults) {
  const map = getHabitMap(uid);
  const cur = map.get(date) ?? blankHabitDay(date, defaults);
  map.set(date, {
    ...cur,
    fatG: Math.max(0, (cur.fatG ?? 0) + deltaG),
    ...applyGoalDefaults(cur, defaults),
    updatedAt: ts(),
  });
  emitHabit(uid, date);
}

export async function mockIncrementCalories(uid: string, date: string, deltaKcal: number, defaults: MockHabitDefaults) {
  const map = getHabitMap(uid);
  const cur = map.get(date) ?? blankHabitDay(date, defaults);
  map.set(date, {
    ...cur,
    caloriesKcal: Math.max(0, (cur.caloriesKcal ?? 0) + deltaKcal),
    ...applyGoalDefaults(cur, defaults),
    updatedAt: ts(),
  });
  emitHabit(uid, date);
}

export async function mockIncrementWater(uid: string, date: string, deltaMl: number, defaults: MockHabitDefaults) {
  const map = getHabitMap(uid);
  const cur = map.get(date) ?? blankHabitDay(date, defaults);
  map.set(date, {
    ...cur,
    waterMl: Math.max(0, (cur.waterMl ?? 0) + deltaMl),
    ...applyGoalDefaults(cur, defaults),
    updatedAt: ts(),
  });
  emitHabit(uid, date);
}

export async function mockAppendMeal(uid: string, date: string, entry: MealEntry, defaults: MockHabitDefaults) {
  const map = getHabitMap(uid);
  const cur = map.get(date) ?? blankHabitDay(date, defaults);
  map.set(date, {
    ...cur,
    meals: [...(cur.meals ?? []), entry],
    proteinG: Math.max(0, (cur.proteinG ?? 0) + entry.proteinG),
    carbsG: Math.max(0, (cur.carbsG ?? 0) + entry.carbsG),
    fatG: Math.max(0, (cur.fatG ?? 0) + entry.fatG),
    caloriesKcal: Math.max(0, (cur.caloriesKcal ?? 0) + entry.caloriesKcal),
    ...applyGoalDefaults(cur, defaults),
    updatedAt: ts(),
  });
  emitHabit(uid, date);
}

export async function mockRemoveMeal(uid: string, date: string, mealId: string, defaults: MockHabitDefaults) {
  const map = getHabitMap(uid);
  const cur = map.get(date);
  if (!cur) return;
  const existing = (cur.meals ?? []).find((m) => m.id === mealId);
  if (!existing) return;
  map.set(date, {
    ...cur,
    meals: (cur.meals ?? []).filter((m) => m.id !== mealId),
    proteinG: Math.max(0, (cur.proteinG ?? 0) - existing.proteinG),
    carbsG: Math.max(0, (cur.carbsG ?? 0) - existing.carbsG),
    fatG: Math.max(0, (cur.fatG ?? 0) - existing.fatG),
    caloriesKcal: Math.max(0, (cur.caloriesKcal ?? 0) - existing.caloriesKcal),
    ...applyGoalDefaults(cur, defaults),
    updatedAt: ts(),
  });
  emitHabit(uid, date);
}

export async function mockSetWorkoutCompleted(
  uid: string,
  date: string,
  completed: boolean,
  defaults: MockHabitDefaults,
) {
  const map = getHabitMap(uid);
  const cur = map.get(date);
  if (!cur) {
    map.set(date, { ...blankHabitDay(date, defaults), workoutCompleted: completed });
  } else {
    map.set(date, { ...cur, workoutCompleted: completed, updatedAt: ts() });
  }
  emitHabit(uid, date);
}

export async function mockSetMood(uid: string, date: string, mood: MoodValue | null, defaults: MockHabitDefaults) {
  const map = getHabitMap(uid);
  const cur = map.get(date);
  if (!cur) {
    map.set(date, { ...blankHabitDay(date, defaults), mood });
  } else {
    map.set(date, { ...cur, mood, updatedAt: ts() });
  }
  emitHabit(uid, date);
}

export async function mockGetWorkoutDraft(uid: string): Promise<WorkoutDraftDoc | null> {
  return drafts.get(uid) ?? null;
}

export async function mockSaveWorkoutDraft(uid: string, payload: WorkoutDraftDoc): Promise<void> {
  drafts.set(uid, payload);
}

export async function mockClearWorkoutDraft(uid: string): Promise<void> {
  drafts.delete(uid);
}

export function mockSubscribeWeightEntries(
  uid: string,
  onUpdate: (rows: { id: string; data: WeightEntryDoc }[]) => void,
): () => void {
  seedWeightEntries(uid);
  if (!weightListeners.has(uid)) weightListeners.set(uid, new Set());
  weightListeners.get(uid)!.add(onUpdate);
  onUpdate(weightEntries.get(uid) ?? []);
  return () => weightListeners.get(uid)?.delete(onUpdate);
}

export async function mockAddWeightEntry(
  uid: string,
  input: { weightKg: number; loggedAt?: Date; note?: string },
): Promise<string> {
  seedWeightEntries(uid);
  const when = input.loggedAt ?? new Date();
  const id = `we_${Date.now()}`;
  const row = {
    id,
    data: {
      weightKg: input.weightKg,
      loggedAt: ts(when),
      ...(input.note?.trim() ? { note: input.note.trim() } : {}),
    } as WeightEntryDoc,
  };
  const list = [...(weightEntries.get(uid) ?? []), row];
  list.sort((a, b) => b.data.loggedAt.toMillis() - a.data.loggedAt.toMillis());
  weightEntries.set(uid, list);
  emitWeightEntries(uid);
  return id;
}

export async function mockDeleteWeightEntry(uid: string, entryId: string): Promise<void> {
  const list = weightEntries.get(uid);
  if (!list) return;
  weightEntries.set(
    uid,
    list.filter((x) => x.id !== entryId),
  );
  emitWeightEntries(uid);
}

function emitCustomFoods(uid: string) {
  const rows = customFoods.get(uid) ?? [];
  customFoodListeners.get(uid)?.forEach((cb) => cb(rows));
}

export function mockSubscribeCustomFoods(
  uid: string,
  onUpdate: (rows: { id: string; data: CustomFoodDoc }[]) => void,
): () => void {
  if (!customFoodListeners.has(uid)) customFoodListeners.set(uid, new Set());
  customFoodListeners.get(uid)!.add(onUpdate);
  onUpdate(customFoods.get(uid) ?? []);
  return () => customFoodListeners.get(uid)?.delete(onUpdate);
}

export async function mockSaveCustomFood(
  uid: string,
  payload: CustomFoodDoc,
  existingId?: string,
): Promise<string> {
  const list = [...(customFoods.get(uid) ?? [])];
  if (existingId) {
    const idx = list.findIndex((x) => x.id === existingId);
    if (idx >= 0) {
      list[idx] = {
        id: existingId,
        data: { ...payload, createdAtMs: list[idx].data.createdAtMs, updatedAtMs: Date.now() },
      };
    } else {
      list.unshift({ id: existingId, data: payload });
    }
    customFoods.set(uid, list);
    emitCustomFoods(uid);
    return existingId;
  }
  const id = `cf_${Date.now()}`;
  list.unshift({ id, data: payload });
  customFoods.set(uid, list);
  emitCustomFoods(uid);
  return id;
}

export async function mockDeleteCustomFood(uid: string, foodId: string): Promise<void> {
  const list = customFoods.get(uid);
  if (!list) return;
  customFoods.set(
    uid,
    list.filter((x) => x.id !== foodId),
  );
  emitCustomFoods(uid);
}

/** Build a Firebase `User` object sufficient for the UI (mock mode only). */
export function createMockAuthUser(email: string, displayName: string | null): User {
  return {
    uid: MOCK_UID,
    email: email || 'demo@mock.local',
    emailVerified: true,
    displayName: displayName ?? 'Demo Athlete',
  } as User;
}
