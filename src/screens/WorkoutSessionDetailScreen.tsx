import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { getWorkout } from '../services/workoutsRepo';
import type { WorkoutDoc } from '../types/domain';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutSessionDetail'>;

function fmtDate(ts: { toDate: () => Date }) {
  const d = ts.toDate();
  return d.toLocaleString();
}

export default function WorkoutSessionDetailScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const { workoutId } = route.params;
  const [doc, setDoc] = useState<WorkoutDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.uid) return;
      const w = await getWorkout(user.uid, workoutId);
      if (!cancelled) {
        setDoc(w);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, workoutId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!doc) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Workout</Text>
          <View style={{ width: 26 }} />
        </View>
        <Text style={styles.miss}>Workout not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          {doc.title}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.meta}>{fmtDate(doc.endedAt)}</Text>
        <View style={styles.statsRow}>
          <Stat label="Duration" value={`${Math.floor(doc.durationSeconds / 60)} min`} />
          <Stat label="Volume" value={`${doc.totalVolumeKg.toLocaleString()} kg`} />
          <Stat label="Sets" value={String(doc.totalSets)} />
          <Stat label="Best set" value={`${doc.bestSetVolumeKg} kg×reps`} />
        </View>

        {doc.exercises.map((ex, i) => (
          <View key={`${ex.name}-${i}`} style={styles.card}>
            <Text style={styles.exTitle}>{ex.name}</Text>
            {ex.sets.map((s, j) => (
              <View key={j} style={styles.setRow}>
                <Text style={styles.setIdx}>Set {j + 1}</Text>
                <Text style={styles.setVal}>
                  {s.weightKg} kg × {s.reps} reps{s.done ? '' : ' (incomplete)'}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  scroll: { padding: spacing.xl, paddingBottom: 40 },
  meta: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  stat: { width: '45%', backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.md },
  statVal: { fontSize: 16, fontWeight: '800', color: colors.text },
  statLbl: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  exTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  setIdx: { fontSize: 13, color: colors.textSecondary },
  setVal: { fontSize: 13, fontWeight: '600', color: colors.text },
  miss: { padding: spacing.xl, fontSize: 15, color: colors.textSecondary },
});
