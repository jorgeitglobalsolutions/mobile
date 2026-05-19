import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';
import type { NutritionSnapshot } from '../../hooks/useTodayNutrition';

type Props = {
  snapshot: NutritionSnapshot;
};

/** Compact progress strip — visible on both Overview and Log tabs. */
export default function NutritionTodayStrip({ snapshot }: Props) {
  const pct = Math.min(100, Math.round(snapshot.caloriesPct * 100));
  const over = snapshot.caloriesOver > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Today</Text>
          <Text style={styles.kcal}>
            {Math.round(snapshot.caloriesCur)}
            <Text style={styles.kcalGoal}>{` / ${Math.round(snapshot.caloriesGoal)} kcal`}</Text>
          </Text>
        </View>
        <Text style={[styles.remain, over && styles.over]}>
          {over ? `${snapshot.caloriesOver} over` : `${snapshot.caloriesRemaining} left`}
        </Text>
      </View>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${pct}%`, backgroundColor: over ? colors.orange : colors.primary },
          ]}
        />
      </View>
      <View style={styles.footer}>
        <Text style={styles.meals}>
          {snapshot.mealCount} meal{snapshot.mealCount === 1 ? '' : 's'} logged
        </Text>
        <View style={styles.macros}>
          <MiniMacro label="P" value={snapshot.proteinCur} goal={snapshot.proteinGoal} color={colors.green} />
          <MiniMacro label="C" value={snapshot.carbsCur} goal={snapshot.carbsGoal} color={colors.primary} />
          <MiniMacro label="F" value={snapshot.fatCur} goal={snapshot.fatGoal} color={colors.yellow} />
        </View>
      </View>
    </View>
  );
}

function MiniMacro({
  label,
  value,
  goal,
  color,
}: {
  label: string;
  value: number;
  goal: number;
  color: string;
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <View style={styles.mini}>
      <Text style={[styles.miniLabel, { color }]}>{label}</Text>
      <Text style={styles.miniVal}>
        {Math.round(value)}
        <Text style={styles.miniGoal}>{`/${Math.round(goal)}g`}</Text>
      </Text>
      <View style={styles.miniBarBg}>
        <View style={[styles.miniBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
  label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  kcal: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2 },
  kcalGoal: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  remain: { fontSize: 13, fontWeight: '700', color: colors.primary },
  over: { color: colors.orange },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  barFill: { height: '100%', borderRadius: 3 },
  footer: { marginTop: spacing.md },
  meals: { fontSize: 12, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm },
  macros: { flexDirection: 'row', gap: spacing.sm },
  mini: { flex: 1 },
  miniLabel: { fontSize: 11, fontWeight: '800' },
  miniVal: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 2 },
  miniGoal: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  miniBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: 4,
  },
  miniBarFill: { height: '100%', borderRadius: 2 },
});
