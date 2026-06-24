import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing } from '../../theme';
import type { NutritionTarget } from '../../services/nutritionTargets';
import type { UserProfile } from '../../types/firestoreUser';

type Props = {
  profile: UserProfile | null | undefined;
  targets: NutritionTarget;
};

export default function NutritionGoalVisualization({ profile, targets }: Props) {
  const { t } = useTranslation();
  const goal = profile?.goal;
  const meta =
    goal === 'lose'
      ? {
          title: t('nutritionGoalVisualization.loseFatTitle'),
          icon: 'flame-outline' as const,
          detail: t('nutritionGoalVisualization.loseFatDetail'),
        }
      : goal === 'build'
        ? {
            title: t('nutritionGoalVisualization.buildMuscleTitle'),
            icon: 'barbell-outline' as const,
            detail: t('nutritionGoalVisualization.buildMuscleDetail'),
          }
        : {
            title: t('nutritionGoalVisualization.maintainTitle'),
            icon: 'analytics-outline' as const,
            detail: t('nutritionGoalVisualization.maintainDetail'),
          };

  const weight = profile?.weightKg
    ? `${Math.round(profile.weightKg)} ${t('common.units.kg')}`
    : '—';
  const height = profile?.heightCm
    ? `${Math.round(profile.heightCm)} ${t('common.units.cm')}`
    : '—';

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>{t('nutritionGoalVisualization.dailyGoals')}</Text>
      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <Ionicons name={meta.icon} size={22} color={colors.paywallPurple} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>{meta.title}</Text>
          <Text style={styles.bannerSub}>{meta.detail}</Text>
          <Text style={styles.bannerMeta}>
            {t('nutritionGoalVisualization.basedOn', { weight, height })}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <GoalTile
          icon="flame"
          label={t('common.macros.calories')}
          value={`${targets.caloriesKcal}`}
          unit={t('common.units.kcal')}
          accent={colors.orange}
        />
        <GoalTile
          icon="nutrition"
          label={t('common.macros.protein')}
          value={`${targets.proteinG}`}
          unit={t('common.units.g')}
          accent={colors.green}
        />
        <GoalTile
          icon="leaf"
          label={t('common.macros.carbs')}
          value={`${targets.carbsG}`}
          unit={t('common.units.g')}
          accent={colors.primary}
        />
        <GoalTile
          icon="water"
          label={t('common.macros.fat')}
          value={`${targets.fatG}`}
          unit={t('common.units.g')}
          accent={colors.yellow}
        />
      </View>
    </View>
  );
}

function GoalTile({
  icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  unit: string;
  accent: string;
}) {
  return (
    <View style={styles.tile}>
      <View style={[styles.tileIcon, { backgroundColor: accent + '22' }]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>
        {value}
        <Text style={styles.tileUnit}> {unit}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  banner: {
    flexDirection: 'row',
    backgroundColor: colors.paywallSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.paywallPurple + '33',
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bannerTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  bannerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  bannerMeta: { fontSize: 11, color: colors.textMuted, marginTop: 6, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  tileIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  tileLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  tileValue: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 2 },
  tileUnit: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
});
