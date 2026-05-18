import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import type { NutritionSnapshot } from '../../hooks/useTodayNutrition';
import MacroRing from '../MacroRing';

type Props = {
  snapshot: NutritionSnapshot;
};

export default function DailyNutritionSummary({ snapshot }: Props) {
  const {
    caloriesCur,
    caloriesGoal,
    caloriesRemaining,
    caloriesOver,
    caloriesPct,
    proteinCur,
    carbsCur,
    fatCur,
    mealCount,
  } = snapshot;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>DAILY NUTRITION SUMMARY</Text>
          <Text style={styles.date}>{formatTodayLabel(snapshot.dateKey)}</Text>
          <Text style={styles.headline}>
            {Math.round(caloriesCur)}
            <Text style={styles.goalText}>{` / ${Math.round(caloriesGoal)} kcal`}</Text>
          </Text>
          <Text style={[styles.sub, caloriesOver > 0 && { color: colors.orange }]}>
            {caloriesOver > 0
              ? `${caloriesOver} kcal over your daily target`
              : `${caloriesRemaining} kcal remaining`}
          </Text>
        </View>
        <MacroRing
          size={108}
          strokeWidth={10}
          value={caloriesCur}
          goal={caloriesGoal}
          color={caloriesOver > 0 ? colors.orange : colors.primary}
          centerText={`${Math.round(caloriesPct * 100)}%`}
          centerSub="of goal"
        />
      </View>

      <View style={styles.statsRow}>
        <StatChip icon="nutrition" label="Protein" value={`${Math.round(proteinCur)}g`} color={colors.green} />
        <StatChip icon="leaf" label="Carbs" value={`${Math.round(carbsCur)}g`} color={colors.primary} />
        <StatChip icon="water" label="Fat" value={`${Math.round(fatCur)}g`} color={colors.yellow} />
        <StatChip icon="restaurant" label="Meals" value={String(mealCount)} color={colors.textSecondary} />
      </View>
    </View>
  );
}

function formatTodayLabel(dateKey: string): string {
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    return dt.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  } catch {
    return 'Today';
  }
}

function StatChip({
  icon,
  label,
  value,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.chip}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={styles.chipValue}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  eyebrow: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 0.8 },
  date: { fontSize: 13, color: colors.textSecondary, fontWeight: '600', marginTop: 2 },
  headline: { fontSize: 32, fontWeight: '800', color: colors.text, marginTop: spacing.sm },
  goalText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  sub: { fontSize: 14, color: colors.textSecondary, marginTop: 4, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  chip: {
    width: '47%',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  chipValue: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 4 },
  chipLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginTop: 2 },
});
