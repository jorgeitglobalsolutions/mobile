import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import type { NutritionTarget } from '../../services/nutritionTargets';
import type { UserProfile } from '../../types/firestoreUser';

type Props = {
  profile: UserProfile | null | undefined;
  targets: NutritionTarget;
};

function goalMeta(goal: UserProfile['goal'] | undefined) {
  if (goal === 'lose') {
    return {
      title: 'Lose fat',
      icon: 'flame-outline' as const,
      detail: 'Moderate calorie deficit (~500 kcal below estimated maintenance).',
    };
  }
  if (goal === 'build') {
    return {
      title: 'Build muscle',
      icon: 'barbell-outline' as const,
      detail: 'Calorie surplus (~300 kcal) with higher protein for recovery.',
    };
  }
  return {
    title: 'Maintain',
    icon: 'analytics-outline' as const,
    detail: 'Targets match estimated maintenance for steady progress.',
  };
}

export default function NutritionGoalVisualization({ profile, targets }: Props) {
  const meta = goalMeta(profile?.goal);
  const weight = profile?.weightKg ? `${Math.round(profile.weightKg)} kg` : '—';
  const height = profile?.heightCm ? `${Math.round(profile.heightCm)} cm` : '—';

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Daily goals</Text>
      <View style={styles.banner}>
        <View style={styles.bannerIcon}>
          <Ionicons name={meta.icon} size={22} color={colors.paywallPurple} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>{meta.title}</Text>
          <Text style={styles.bannerSub}>{meta.detail}</Text>
          <Text style={styles.bannerMeta}>
            Based on {weight} · {height} · estimated activity
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <GoalTile icon="flame" label="Calories" value={`${targets.caloriesKcal}`} unit="kcal" accent={colors.orange} />
        <GoalTile icon="nutrition" label="Protein" value={`${targets.proteinG}`} unit="g" accent={colors.green} />
        <GoalTile icon="leaf" label="Carbs" value={`${targets.carbsG}`} unit="g" accent={colors.primary} />
        <GoalTile icon="water" label="Fat" value={`${targets.fatG}`} unit="g" accent={colors.yellow} />
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
