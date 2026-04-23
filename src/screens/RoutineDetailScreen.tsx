import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { RoutinesScreenProps } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { deleteRoutine, getRoutine } from '../services/routinesRepo';
import type { RoutineDoc } from '../types/domain';

type Props = RoutinesScreenProps<'RoutineDetail'>;

export default function RoutineDetailScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { routineId } = route.params;
  const [routine, setRoutine] = useState<RoutineDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.uid) return;
      const r = await getRoutine(user.uid, routineId);
      if (!cancelled) {
        setRoutine(r);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, routineId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!routine) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Routine</Text>
          <View style={{ width: 26 }} />
        </View>
        <Text style={{ padding: spacing.xl, color: colors.textSecondary }}>Routine not found.</Text>
      </SafeAreaView>
    );
  }

  const title = routine.title;
  const muscles = routine.muscles;
  const minutes = routine.minutes;
  const exerciseCount = routine.exerciseCount;
  const desc =
    routine.description ||
    `Focus on ${muscles.toLowerCase()} with compound movements and isolation work.`;

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
        <View style={styles.metaRow}>
          <MetaPill icon="time-outline" label={`~${minutes} min`} />
          <MetaPill icon="list-outline" label={`${exerciseCount} exercises`} />
        </View>
        <Text style={styles.desc}>{desc}</Text>

        <TouchableOpacity
          style={styles.startBtn}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('WorkoutActive', { routineId, title })}
        >
          <Ionicons name="play" size={22} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.startText}>Start Workout</Text>
        </TouchableOpacity>

        <Text style={styles.listHeader}>Exercises</Text>
        {routine.exercises.map((ex, i) => (
          <View key={`${ex.name}-${i}`} style={styles.exRow}>
            <Text style={styles.exNum}>{i + 1}</Text>
            <View style={styles.exThumb}>
              <Ionicons name="fitness-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exName}>{ex.name}</Text>
              <Text style={styles.exMeta}>
                {ex.targetSets} sets • {ex.targetRepMin}-{ex.targetRepMax} reps
              </Text>
            </View>
            <Ionicons name="reorder-three" size={26} color={colors.textMuted} />
          </View>
        ))}

        {!routine.isPredefined && (
          <>
            <TouchableOpacity
              style={styles.editBtn}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('RoutineBuilder', { routineId })}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.editText}>Edit Routine</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dangerBtn}
              activeOpacity={0.9}
              onPress={() => {
                Alert.alert('Delete routine', 'This cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      if (!user?.uid) return;
                      await deleteRoutine(user.uid, routineId);
                      navigation.goBack();
                    },
                  },
                ]);
              }}
            >
              <Text style={styles.dangerText}>Delete routine</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={16} color={colors.primary} style={{ marginRight: 6 }} />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.text },
  desc: {
    marginTop: spacing.lg,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  startBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  listHeader: { marginTop: spacing.xxl, marginBottom: spacing.md, fontSize: 16, fontWeight: '700', color: colors.text },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  exNum: { width: 22, fontSize: 14, fontWeight: '700', color: colors.textMuted },
  exThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exName: { fontSize: 16, fontWeight: '700', color: colors.text },
  exMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  editBtn: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  editText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  dangerBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: 12,
  },
  dangerText: { color: '#DC2626', fontWeight: '700' },
});
