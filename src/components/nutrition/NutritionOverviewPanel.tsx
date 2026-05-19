import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import type { NutritionSnapshot } from '../../hooks/useTodayNutrition';
import type { NutritionTarget } from '../../services/nutritionTargets';
import type { UserProfile } from '../../types/firestoreUser';
import NutritionGoalVisualization from './NutritionGoalVisualization';
import MacroProgressTracking from './MacroProgressTracking';
import MacroRing from '../MacroRing';

type Props = {
  snapshot: NutritionSnapshot;
  targets: NutritionTarget;
  profile: UserProfile | null | undefined;
  onLogFood: () => void;
  onEditMetrics: () => void;
};

export default function NutritionOverviewPanel({
  snapshot,
  targets,
  profile,
  onLogFood,
  onEditMetrics,
}: Props) {
  return (
    <View>
      <View style={styles.ringsCard}>
        <Text style={styles.sectionTitle}>Macro balance</Text>
        <View style={styles.ringsRow}>
          <RingCol snapshot={snapshot} macro="protein" color={colors.green} />
          <RingCol snapshot={snapshot} macro="carbs" color={colors.primary} />
          <RingCol snapshot={snapshot} macro="fat" color={colors.yellow} />
        </View>
      </View>

      <MacroProgressTracking snapshot={snapshot} />

      <NutritionGoalVisualization profile={profile} targets={targets} />

      <TouchableOpacity style={styles.logCta} activeOpacity={0.9} onPress={onLogFood}>
        <Ionicons name="add-circle" size={22} color={colors.white} />
        <Text style={styles.logCtaText}>Log food or quick-add macros</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkRow} activeOpacity={0.85} onPress={onEditMetrics}>
        <Ionicons name="body-outline" size={18} color={colors.primary} />
        <Text style={styles.linkText}>Adjust body metrics to recalculate targets</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>
    </View>
  );
}

function RingCol({
  snapshot,
  macro,
  color,
}: {
  snapshot: NutritionSnapshot;
  macro: 'protein' | 'carbs' | 'fat';
  color: string;
}) {
  const map = {
    protein: { cur: snapshot.proteinCur, goal: snapshot.proteinGoal, label: 'Protein' },
    carbs: { cur: snapshot.carbsCur, goal: snapshot.carbsGoal, label: 'Carbs' },
    fat: { cur: snapshot.fatCur, goal: snapshot.fatGoal, label: 'Fat' },
  } as const;
  const m = map[macro];
  return (
    <View style={styles.ringCol}>
      <MacroRing
        size={92}
        strokeWidth={8}
        value={m.cur}
        goal={m.goal}
        color={color}
        centerText={`${Math.round(m.cur)}g`}
        centerSub={`of ${Math.round(m.goal)}g`}
      />
      <Text style={styles.ringLabel}>{m.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  ringsCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  ringsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ringCol: { alignItems: 'center', flex: 1 },
  ringLabel: { marginTop: spacing.xs, fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  logCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    marginBottom: spacing.md,
  },
  logCtaText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  linkText: { fontSize: 14, fontWeight: '600', color: colors.primary, flex: 1 },
});
