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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RoutinesScreenProps } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getRoutine, routineToWorkoutBlocks } from '../services/routinesRepo';
import { saveWorkoutSession } from '../services/workoutsRepo';
import { clearWorkoutDraft, getWorkoutDraft, saveWorkoutDraft } from '../services/workoutDraftRepo';
import { defaultGoalsFromProfile, setWorkoutCompleted } from '../services/habitsRepo';
import { localDateKey } from '../utils/dateKey';
import type { LoggedExercise } from '../types/domain';

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

export default function WorkoutActiveScreen({ navigation, route }: Props) {
  const { user, userDoc } = useAuth();
  const { routineId, title } = route.params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const startedAtRef = useRef<Date>(new Date());

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      try {
        const routine = await getRoutine(user.uid, routineId);
        if (cancelled) return;
        if (!routine) {
          Alert.alert('Routine', 'Could not load this routine.');
          navigation.goBack();
          return;
        }
        const draft = await getWorkoutDraft(user.uid);
        if (draft && draft.routineId === routineId && draft.exercises?.length) {
          startedAtRef.current = new Date(draft.startedAtMs);
          setExercises(draft.exercises);
        } else {
          startedAtRef.current = new Date();
          setExercises(routineToWorkoutBlocks(routine));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, routineId, navigation]);

  useEffect(() => {
    if (!user?.uid || loading) return;
    const t = setTimeout(() => {
      void saveWorkoutDraft(user.uid, {
        routineId,
        title,
        startedAtMs: startedAtRef.current.getTime(),
        exercises,
      }).catch(() => {});
    }, 8000);
    return () => clearTimeout(t);
  }, [user?.uid, loading, routineId, title, exercises]);

  const updateSet = useCallback(
    (exIndex: number, setIndex: number, patch: Partial<{ weightKg: number; reps: number; done: boolean }>) => {
      setExercises((prev) =>
        prev.map((ex, ei) =>
          ei !== exIndex
            ? ex
            : {
                ...ex,
                sets: ex.sets.map((st, si) => (si !== setIndex ? st : { ...st, ...patch })),
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

  const onSave = async () => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      const ended = new Date();
      await saveWorkoutSession(user.uid, {
        routineId,
        title,
        startedAt: startedAtRef.current,
        endedAt: ended,
        exercises,
      });
      const defs = defaultGoalsFromProfile(userDoc?.profile?.weightKg, userDoc?.profile?.goal);
      await setWorkoutCompleted(user.uid, localDateKey(), true, {
        proteinGoalG: defs.proteinG,
        waterGoalMl: defs.waterMl,
      });
      await clearWorkoutDraft(user.uid);
      navigation.popToTop();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      Alert.alert('Workout', msg);
    } finally {
      setSaving(false);
    }
  };

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
          {title}
        </Text>
        <TouchableOpacity hitSlop={12}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.timerRow}>
          <View>
            <Text style={styles.timer}>{formatElapsed(seconds)}</Text>
            <Text style={styles.timerLabel}>WORKOUT TIME</Text>
          </View>
          <View style={styles.timerActions}>
            <MiniBtn icon="time-outline" label="Rest" />
            <MiniBtn icon="stop-outline" label="End" />
          </View>
        </View>

        <View style={styles.summaryBar}>
          <SummaryItem icon="barbell-outline" text={`${exercises.length} Exercises`} />
          <SummaryItem icon="layers-outline" text={`${totalSets} Sets`} />
          <SummaryItem icon="trophy-outline" text={`${vol.toLocaleString()} kg vol.`} />
        </View>

        {exercises.map((block, bi) => (
          <View key={`${block.name}-${bi}`} style={styles.exCard}>
            <View style={styles.exHead}>
              <View style={styles.exThumb}>
                <Ionicons name="barbell" size={22} color={colors.primary} />
              </View>
              <Text style={styles.exTitle}>{block.name}</Text>
            </View>
            <View style={styles.tableHead}>
              <Text style={[styles.th, { width: 36 }]}>SET</Text>
              <Text style={[styles.th, { flex: 1 }]}>WEIGHT (KG)</Text>
              <Text style={[styles.th, { flex: 1 }]}>REPS</Text>
              <Text style={{ width: 28 }} />
            </View>
            {block.sets.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={[styles.td, { width: 36 }]}>{idx + 1}</Text>
                <TextInput
                  style={[styles.inputCell, { flex: 1 }]}
                  keyboardType="decimal-pad"
                  value={row.weightKg ? String(row.weightKg) : ''}
                  onChangeText={(t) =>
                    updateSet(bi, idx, { weightKg: parseFloat(t) || 0, done: row.done })
                  }
                  editable={!row.done}
                  placeholder="0"
                />
                <TextInput
                  style={[styles.inputCell, { flex: 1 }]}
                  keyboardType="number-pad"
                  value={row.reps ? String(row.reps) : ''}
                  onChangeText={(t) =>
                    updateSet(bi, idx, { reps: parseInt(t, 10) || 0, done: row.done })
                  }
                  editable={!row.done}
                  placeholder="0"
                />
                <View style={{ width: 28, alignItems: 'flex-end' }}>
                  {row.done ? (
                    <TouchableOpacity onPress={() => updateSet(bi, idx, { done: false })}>
                      <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      hitSlop={8}
                      onPress={() => updateSet(bi, idx, { done: true })}
                    >
                      <Ionicons name="ellipse-outline" size={22} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}

        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.9} onPress={onSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.saveText}>Save Workout</Text>}
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MiniBtn({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <TouchableOpacity style={styles.miniBtn} activeOpacity={0.85}>
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
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveText: { color: colors.white, fontSize: 17, fontWeight: '700' },
});
