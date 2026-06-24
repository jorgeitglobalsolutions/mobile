import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing } from '../../theme';
import type { NutritionSnapshot } from '../../hooks/useTodayNutrition';

type MacroRow = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  cur: number;
  goal: number;
  unit: string;
  pct: number;
};

type Props = {
  snapshot: NutritionSnapshot;
};

export default function MacroProgressTracking({ snapshot }: Props) {
  const { t } = useTranslation();

  const rows: MacroRow[] = useMemo(
    () => [
      {
        id: 'cal',
        label: t('common.macros.calories'),
        icon: 'flame',
        color: snapshot.caloriesOver > 0 ? colors.orange : colors.primary,
        cur: snapshot.caloriesCur,
        goal: snapshot.caloriesGoal,
        unit: t('common.units.kcal'),
        pct: snapshot.caloriesPct,
      },
      {
        id: 'p',
        label: t('common.macros.protein'),
        icon: 'nutrition',
        color: colors.green,
        cur: snapshot.proteinCur,
        goal: snapshot.proteinGoal,
        unit: t('common.units.g'),
        pct: snapshot.proteinPct,
      },
      {
        id: 'c',
        label: t('common.macros.carbs'),
        icon: 'leaf',
        color: colors.primary,
        cur: snapshot.carbsCur,
        goal: snapshot.carbsGoal,
        unit: t('common.units.g'),
        pct: snapshot.carbsPct,
      },
      {
        id: 'f',
        label: t('common.macros.fat'),
        icon: 'water',
        color: colors.yellow,
        cur: snapshot.fatCur,
        goal: snapshot.fatGoal,
        unit: t('common.units.g'),
        pct: snapshot.fatPct,
      },
    ],
    [snapshot, t],
  );

  const completed = rows.filter((r) => r.pct >= 1).length;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{t('macroProgressTracking.title')}</Text>
        <Text style={styles.meta}>
          {t('macroProgressTracking.goalsMet', { completed, total: rows.length })}
        </Text>
      </View>
      {rows.map((row, idx) => (
        <View key={row.id} style={idx > 0 ? { marginTop: spacing.md } : undefined}>
          <MacroProgressRow row={row} />
        </View>
      ))}
    </View>
  );
}

function MacroProgressRow({ row }: { row: MacroRow }) {
  const { t } = useTranslation();
  const done = row.pct >= 1;
  return (
    <View>
      <View style={styles.rowTop}>
        <View style={styles.rowLabelWrap}>
          <Ionicons name={row.icon} size={16} color={row.color} />
          <Text style={styles.rowLabel}>{row.label}</Text>
        </View>
        <Text style={styles.rowValue}>
          {Math.round(row.cur)}
          <Text style={styles.rowGoal}>{` / ${Math.round(row.goal)} ${row.unit}`}</Text>
        </Text>
      </View>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(100, row.pct * 100)}%`,
              backgroundColor: row.color,
            },
          ]}
        />
      </View>
      <Text style={[styles.pctText, done && { color: row.color }]}>
        {done
          ? t('macroProgressTracking.goalReached')
          : t('macroProgressTracking.percentOfTarget', { percent: Math.round(row.pct * 100) })}
      </Text>
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
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  rowValue: { fontSize: 14, fontWeight: '800', color: colors.text },
  rowGoal: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  barBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  barFill: { height: '100%', borderRadius: 5 },
  pctText: { fontSize: 11, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
});
