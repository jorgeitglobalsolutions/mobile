import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing } from '../../theme';

export type NutritionTab = 'overview' | 'log';

type Props = {
  active: NutritionTab;
  onChange: (tab: NutritionTab) => void;
};

export default function NutritionTabBar({ active, onChange }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.wrap}>
      <TabButton
        label={t('nutritionTabBar.overview')}
        sub={t('nutritionTabBar.overviewSub')}
        active={active === 'overview'}
        onPress={() => onChange('overview')}
      />
      <TabButton
        label={t('nutritionTabBar.logFood')}
        sub={t('nutritionTabBar.logFoodSub')}
        active={active === 'log'}
        onPress={() => onChange('log')}
      />
    </View>
  );
}

function TabButton({
  label,
  sub,
  active,
  onPress,
}: {
  label: string;
  sub: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      <Text style={[styles.tabSub, active && styles.tabSubActive]}>{sub}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  tabSub: { fontSize: 11, color: colors.textMuted, marginTop: 2, fontWeight: '600' },
  tabLabelActive: { color: colors.white },
  tabSubActive: { color: colors.white + 'CC' },
});
