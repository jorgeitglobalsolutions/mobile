import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, RoutinesScreenProps } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getRoutine, routineToWorkoutBlocks, saveUserRoutine } from '../services/routinesRepo';
import { saveWorkoutSession } from '../services/workoutsRepo';
import { clearWorkoutDraft, getWorkoutDraft, saveWorkoutDraft } from '../services/workoutDraftRepo';
import { defaultHabitGoalsFromProfile, setWorkoutCompleted } from '../services/habitsRepo';
import { localDateKey } from '../utils/dateKey';
import type { LoggedExercise, RoutineDoc } from '../types/domain';
import { friendlyAppError } from '../utils/appError';
import { consumePickedExercises } from '../services/exercisePickerBridge';
import { getCatalogExerciseByName } from '../data/exercisesCatalog';
import { getExerciseDisplayName } from '../i18n/catalogDisplay';
import { useLocale } from '../context/LocaleContext';

type Props = RoutinesScreenProps<'WorkoutActive'>;

function formatElapsed(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function totalVolumeKg(exercises: LoggedExercise[]): number {
  let t = 0;
  for (const ex of exercises) {
    for (const st of ex.sets) {
      if (st.done) t += st.weightKg * st.reps;
    }
  }
  return Math.round(t);
}

function rowHasInput(row: { weightKg: number; reps: number; done: boolean }): boolean {
  return row.done || row.weightKg > 0 || row.reps > 0;
}

function ensureTrailingEmptyRow(rows: { weightKg: number; reps: number; done: boolean }[]) {
  if (!rows.length) return [{ weightKg: 0, reps: 0, done: false }];
  const last = rows[rows.length - 1];
  if (rowHasInput(last)) {
    return [...rows, { weightKg: 0, reps: 0, done: false }];
  }
  return rows;
}

function exerciseHasLoggedSets(ex: LoggedExercise): boolean {
  return ex.sets.some((s) => rowHasInput(s));
}

function isTrailingEmptyRow(ex: LoggedExercise, setIndex: number): boolean {
  if (setIndex !== ex.sets.length - 1) return false;
  const row = ex.sets[setIndex];
  return !rowHasInput(row);
}

export default function WorkoutActiveScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { language } = useLocale();
  const { user, userDoc } = useAuth();
  const { routineId, title: initialTitle } = route.params;
  const pickerSessionIdRef = useRef(`wa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [routine, setRoutine] = useState<RoutineDoc | null>(null);
  const [routineTitle, setRoutineTitle] = useState(initialTitle);
  const startedAtRef = useRef<Date>(new Date());
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const allowExitRef = useRef(false);

  const displayExerciseName = useCallback(
    (name: string) => {
      const catalog = getCatalogExerciseByName(name);
      if (catalog) return getExerciseDisplayName(catalog.id, catalog.name, language);
      return name;
    },
    [language],
  );

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (restRemaining === null || restRemaining <= 0) return;
    const id = setInterval(() => {
      setRestRemaining((r) => {
        if (r === null || r <= 1) return null;
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [restRemaining]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const loadedRoutine = await getRoutine(user.uid, routineId);
        if (cancelled) return;
        if (!loadedRoutine) {
          Alert.alert(t('workoutActive.alerts.routineTitle'), t('workoutActive.alerts.loadError'));
          navigation.goBack();
          return;
        }
        setRoutine(loadedRoutine);
        setRoutineTitle(loadedRoutine.title);
        const draft = await getWorkoutDraft(user.uid);
        if (draft && draft.routineId === routineId && draft.exercises?.length) {
          startedAtRef.current = new Date(draft.startedAtMs);
          setExercises(draft.exercises);
          const elapsed = Math.max(0, Math.floor((Date.now() - draft.startedAtMs) / 1000));
          setSeconds(elapsed);
        } else {
          startedAtRef.current = new Date();
          setExercises(
            routineToWorkoutBlocks(loadedRoutine).map((ex) => ({
              ...ex,
              sets: ex.sets.slice(0, 1),
            })),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, routineId, navigation, t]);

  useEffect(() => {
    if (!user?.uid || loading) return;
    const timer = setTimeout(() => {
      void saveWorkoutDraft(user.uid, {
        routineId,
        title: routineTitle,
        startedAtMs: startedAtRef.current.getTime(),
        exercises,
      }).catch(() => {});
    }, 8000);
    return () => clearTimeout(timer);
  }, [user?.uid, loading, routineId, routineTitle, exercises]);

  const addExerciseByName = useCallback((name: string) => {
    const n = name.trim();
    if (!n) return;
    setExercises((prev) => [...prev, { name: n, sets: [{ weightKg: 0, reps: 0, done: false }] }]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      const picked = consumePickedExercises(pickerSessionIdRef.current);
      if (!picked.length) return;
      picked.forEach((n) => addExerciseByName(n));
    }, [addExerciseByName]),
  );

  const openExercisePicker = () => {
    const root = navigation.getParent()?.getParent() as NativeStackNavigationProp<RootStackParamList> | undefined;
    root?.navigate('ExerciseLibrary', {
      mode: 'pick',
      returnRoutineId: routineId,
      pickerSessionId: pickerSessionIdRef.current,
    });
  };

  const removeExercise = (exIndex: number) => {
    const ex = exercises[exIndex];
    if (!ex) return;
    const doRemove = () => setExercises((prev) => prev.filter((_, i) => i !== exIndex));
    if (!exerciseHasLoggedSets(ex)) {
      doRemove();
      return;
    }
    Alert.alert(
      t('workoutActive.removeExerciseTitle'),
      t('workoutActive.removeExerciseMessage', { name: displayExerciseName(ex.name) }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.remove'), style: 'destructive', onPress: doRemove },
      ],
    );
  };

  const removeSet = (exIndex: number, setIndex: number) => {
    const ex = exercises[exIndex];
    if (!ex || isTrailingEmptyRow(ex, setIndex)) return;
    const doRemove = () =>
      setExercises((prev) =>
        prev.map((item, ei) =>
          ei !== exIndex
            ? item
            : {
                ...item,
                sets: ensureTrailingEmptyRow(item.sets.filter((_, si) => si !== setIndex)),
              },
        ),
      );
    if (!rowHasInput(ex.sets[setIndex])) {
      doRemove();
      return;
    }
    Alert.alert(t('workoutActive.removeSetTitle'), t('workoutActive.removeSetMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.remove'), style: 'destructive', onPress: doRemove },
    ]);
  };

  const addSet = (exIndex: number) => {
    setExercises((prev) =>
      prev.map((ex, ei) =>
        ei !== exIndex
          ? ex
          : { ...ex, sets: ensureTrailingEmptyRow([...ex.sets, { weightKg: 0, reps: 0, done: false }]) },
      ),
    );
  };

  const updateSet = useCallback(
    (exIndex: number, setIndex: number, patch: Partial<{ weightKg: number; reps: number; done: boolean }>) => {
      setExercises((prev) =>
        prev.map((ex, ei) =>
          ei !== exIndex
            ? ex
            : {
                ...ex,
                sets: ensureTrailingEmptyRow(
                  ex.sets.map((st, si) => (si !== setIndex ? st : { ...st, ...patch })),
                ),
              },
        ),
      );
    },
    [],
  );

  const totalSets = useMemo(
    () => exercises.reduce((acc, ex) => acc + ex.sets.filter((x) => x.done).length, 0),
    [exercises],
  );
  const vol = useMemo(() => totalVolumeKg(exercises), [exercises]);

  const onSave = useCallback(async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      let sessionRoutineId = routineId;
      if (routine?.isPredefined) {
        const copyId = `predef_copy_${routineId}`;
        const existingCopy = await getRoutine(user.uid, copyId);
        if (!existingCopy) {
          await saveUserRoutine(user.uid, copyId, {
            title: routine.title,
            muscles: routine.muscles,
            minutes: routine.minutes,
            exerciseCount: routine.exerciseCount,
            category: routine.category,
            exercises: routine.exercises,
            description: routine.description ?? '',
            isPredefined: false,
          });
        }
        sessionRoutineId = copyId;
      }
      const ended = new Date();
      await saveWorkoutSession(user.uid, {
        routineId: sessionRoutineId,
        title: routineTitle,
        startedAt: startedAtRef.current,
        endedAt: ended,
        exercises: exercises.map((ex) => ({
          ...ex,
          sets: ex.sets.filter((s) => rowHasInput(s)),
        })),
      });
      const defs = defaultHabitGoalsFromProfile(userDoc?.profile ?? null);
      await setWorkoutCompleted(user.uid, localDateKey(), true, defs);
      await clearWorkoutDraft(user.uid);
      allowExitRef.current = true;
      navigation.popToTop();
    } catch (e: unknown) {
      Alert.alert(t('workoutActive.alerts.workoutTitle'), friendlyAppError(e, 'workoutActive.alerts.saveError'));
    } finally {
      setSaving(false);
    }
  }, [user?.uid, routine, routineId, routineTitle, exercises, userDoc?.profile, navigation, t]);

  const onEndPress = () => {
    Alert.alert(t('workoutActive.alerts.endTitle'), t('workoutActive.alerts.endMessage'), [
      { text: t('common.keepTraining'), style: 'cancel' },
      {
        text: t('common.discard'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (user?.uid) {
              try {
                await clearWorkoutDraft(user.uid);
              } catch {
                // ignore
              }
            }
            allowExitRef.current = true;
            navigation.goBack();
          })();
        },
      },
      {
        text: t('workoutActive.alerts.saveWorkout'),
        onPress: () => void onSave(),
      },
    ]);
  };

  const onMenuPress = () => {
    Alert.alert(t('workoutActive.menuTitle'), undefined, [
      { text: t('workoutActive.addExercise'), onPress: openExercisePicker },
      { text: t('workoutActive.alerts.endTitle'), onPress: onEndPress },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const confirmExit = useCallback(() => {
    Alert.alert(t('workoutActive.alerts.endTitle'), t('workoutActive.alerts.endMessage'), [
      { text: t('common.keepTraining'), style: 'cancel' },
      {
        text: t('common.discard'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            if (user?.uid) {
              try {
                await clearWorkoutDraft(user.uid);
              } catch {
                // ignore
              }
            }
            allowExitRef.current = true;
            navigation.goBack();
          })();
        },
      },
      { text: t('workoutActive.alerts.saveWorkout'), onPress: () => void onSave() },
    ]);
  }, [navigation, onSave, t, user?.uid]);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (allowExitRef.current) return;
      e.preventDefault();
      confirmExit();
    });
    return unsub;
  }, [navigation, confirmExit]);

  const onRestPress = () => setRestRemaining(90);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          {routineTitle}
        </Text>
        <TouchableOpacity hitSlop={12} onPress={onMenuPress}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.timerRow}>
          <View>
            <Text style={styles.timer}>{formatElapsed(seconds)}</Text>
            <Text style={styles.timerLabel}>{t('workoutActive.workoutTime')}</Text>
          </View>
          <View style={styles.timerActions}>
            <MiniBtn icon="time-outline" label={t('workoutActive.rest')} onPress={onRestPress} />
            <MiniBtn icon="stop-outline" label={t('workoutActive.end')} onPress={onEndPress} disabled={saving} />
          </View>
        </View>

        <View style={styles.summaryBar}>
          <SummaryItem icon="barbell-outline" text={t('workoutActive.exercisesSummary', { count: exercises.length })} />
          <SummaryItem icon="layers-outline" text={t('workoutActive.setsSummary', { count: totalSets })} />
          <SummaryItem icon="trophy-outline" text={t('workoutActive.volumeSummary', { volume: vol.toLocaleString() })} />
        </View>

        {exercises.map((block, bi) => (
          <View key={`${block.name}-${bi}`} style={styles.exCard}>
            <View style={styles.exHead}>
              <View style={styles.exThumb}>
                <Ionicons name="barbell" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.exTitle, { flex: 1 }]}>{displayExerciseName(block.name)}</Text>
              <TouchableOpacity onPress={() => removeExercise(bi)} hitSlop={8} style={{ marginRight: 4 }}>
                <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { width: 36 }]}>{t('workoutActive.setHeader')}</Text>
              <Text style={[styles.th, { flex: 1 }]}>{t('workoutActive.weightHeader')}</Text>
              <Text style={[styles.th, { flex: 1 }]}>{t('workoutActive.repsHeader')}</Text>
              <Text style={{ width: 56 }} />
            </View>
            {block.sets.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.td, { width: 36 }]}>{idx + 1}</Text>
                <TextInput
                  style={[styles.inputCell, { flex: 1 }]}
                  keyboardType="decimal-pad"
                  value={row.weightKg ? String(row.weightKg) : ''}
                  onChangeText={(text) =>
                    updateSet(bi, idx, { weightKg: parseFloat(text) || 0, done: row.done })
                  }
                  editable={!row.done}
                  placeholder={t('workoutActive.weightPlaceholder')}
                />
                <TextInput
                  style={[styles.inputCell, { flex: 1 }]}
                  keyboardType="number-pad"
                  value={row.reps ? String(row.reps) : ''}
                  onChangeText={(text) =>
                    updateSet(bi, idx, { reps: parseInt(text, 10) || 0, done: row.done })
                  }
                  editable={!row.done}
                  placeholder={t('workoutActive.repsPlaceholder')}
                />
                <View style={styles.rowActions}>
                  {!isTrailingEmptyRow(block, idx) ? (
                    <TouchableOpacity onPress={() => removeSet(bi, idx)} hitSlop={6}>
                      <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  ) : (
                    <View style={{ width: 18 }} />
                  )}
                  {row.done ? (
                    <TouchableOpacity onPress={() => updateSet(bi, idx, { done: false })}>
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity hitSlop={8} onPress={() => updateSet(bi, idx, { done: true })}>
                      <Ionicons name="ellipse-outline" size={22} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(bi)} activeOpacity={0.85}>
              <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
              <Text style={styles.addSetText}>{t('workoutActive.addSet')}</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addExerciseBtn} onPress={openExercisePicker} activeOpacity={0.9}>
          <Ionicons name="add" size={22} color={colors.primary} />
          <Text style={styles.addExerciseText}>{t('workoutActive.addExercise')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.9} onPress={onSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>{t('workoutActive.saveWorkout')}</Text>}
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>

      <Modal visible={restRemaining !== null && restRemaining > 0} transparent animationType="fade">
        <View style={styles.restOverlay}>
          <View style={styles.restCard}>
            <Text style={styles.restTitle}>{t('workoutActive.restTitle')}</Text>
            <Text style={styles.restTimer}>
              {restRemaining !== null ? formatElapsed(restRemaining) : '00:00:00'}
            </Text>
            <Text style={styles.restHint}>{t('workoutActive.restHint')}</Text>
            <TouchableOpacity style={styles.restSkip} onPress={() => setRestRemaining(null)} activeOpacity={0.9}>
              <Text style={styles.restSkipText}>{t('workoutActive.skip')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function MiniBtn({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.miniBtn, disabled && { opacity: 0.45 }]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
      <Text style={styles.miniLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function SummaryItem({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.sumItem}>
      <Ionicons name={icon} size={16} color={colors.primaryMuted} style={{ marginRight: 4 }} />
      <Text style={styles.sumText} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 24 },
  timerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  timer: { fontSize: 36, fontWeight: '800', color: colors.text, fontVariant: ['tabular-nums'] },
  timerLabel: { fontSize: 11, color: colors.textMuted, letterSpacing: 1, marginTop: 4 },
  timerActions: { flexDirection: 'row', gap: spacing.sm },
  miniBtn: {
    width: 64,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLabel: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  summaryBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.purpleBar,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  sumItem: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.md },
  sumText: { fontSize: 12, fontWeight: '700', color: colors.text, maxWidth: 120 },
  exCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  exHead: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  exThumb: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  exTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  tableHead: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 6 },
  th: { fontSize: 11, color: colors.textMuted, fontWeight: '700' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  td: { fontSize: 15, fontWeight: '600', color: colors.text },
  inputCell: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  rowActions: { width: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  addSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingVertical: 6,
  },
  addSetText: { marginLeft: 6, fontSize: 14, fontWeight: '600', color: colors.primary },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  addExerciseText: { marginLeft: 6, fontSize: 16, fontWeight: '700', color: colors.primary },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  restOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  restCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  restTitle: { fontSize: 14, fontWeight: '700', color: colors.textSecondary, letterSpacing: 1 },
  restTimer: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.primary,
    marginVertical: spacing.md,
    fontVariant: ['tabular-nums'],
  },
  restHint: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  restSkip: {
    marginTop: spacing.lg,
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
  },
  restSkipText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
