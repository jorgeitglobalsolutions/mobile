import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing } from '../../theme';
import { useLocale } from '../../context/LocaleContext';
import type { NutritionSnapshot } from '../../hooks/useTodayNutrition';
import MacroRing from '../MacroRing';

type Props = {
  snapshot: NutritionSnapshot;
};

export default function DailyNutritionSummary({ snapshot }: Props) {
  const { t } = useTranslation();
  const { localeTag } = useLocale();
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
          <Text style={styles.eyebrow}>{t('dailyNutritionSummary.eyebrow')}</Text>
          <Text style={styles.date}>{formatTodayLabel(snapshot.dateKey, localeTag, t)}</Text>
          <Text style={styles.headline}>
            {Math.round(caloriesCur)}
            <Text style={styles.goalText}>
              {t('dailyNutritionSummary.kcalGoal', { goal: Math.round(caloriesGoal) })}
            </Text>
          </Text>
          <Text style={[styles.sub, caloriesOver > 0 && { color: colors.orange }]}>
            {caloriesOver > 0
              ? t('dailyNutritionSummary.overTarget', { amount: caloriesOver })
              : t('dailyNutritionSummary.remaining', { amount: caloriesRemaining })}
          </Text>
        </View>
        <MacroRing
          size={108}
          strokeWidth={10}
          value={caloriesCur}
          goal={caloriesGoal}
          color={caloriesOver > 0 ? colors.orange : colors.primary}
          centerText={`${Math.round(caloriesPct * 100)}%`}
          centerSub={t('dailyNutritionSummary.ofGoal')}
        />
      </View>

      <View style={styles.statsRow}>
        <StatChip
          icon="nutrition"
          label={t('common.macros.protein')}
          value={`${Math.round(proteinCur)}${t('common.units.g')}`}
          color={colors.green}
        />
        <StatChip
          icon="leaf"
          label={t('common.macros.carbs')}
          value={`${Math.round(carbsCur)}${t('common.units.g')}`}
          color={colors.primary}
        />
        <StatChip
          icon="water"
          label={t('common.macros.fat')}
          value={`${Math.round(fatCur)}${t('common.units.g')}`}
          color={colors.yellow}
        />
        <StatChip
          icon="restaurant"
          label={t('dailyNutritionSummary.meals')}
          value={String(mealCount)}
          color={colors.textSecondary}
        />
      </View>
    </View>
  );
}

function formatTodayLabel(
  dateKey: string,
  localeTag: string,
  t: (key: string) => string,
): string {
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    return dt.toLocaleDateString(localeTag, { weekday: 'long', month: 'short', day: 'numeric' });
  } catch {
    return t('dailyNutritionSummary.todayFallback');
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
