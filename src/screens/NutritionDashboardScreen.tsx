import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useTodayNutrition } from '../hooks/useTodayNutrition';
import DailyNutritionSummary from '../components/nutrition/DailyNutritionSummary';
import NutritionGoalVisualization from '../components/nutrition/NutritionGoalVisualization';
import MacroProgressTracking from '../components/nutrition/MacroProgressTracking';
import MacroRing from '../components/MacroRing';

type Props = NativeStackScreenProps<RootStackParamList, 'NutritionDashboard'>;

export default function NutritionDashboardScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const { snapshot, targets } = useTodayNutrition(user?.uid, userDoc?.profile ?? null);

  if (!user?.uid) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <Text style={styles.hint}>Sign in to view your nutrition dashboard.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition dashboard</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <DailyNutritionSummary snapshot={snapshot} />

        <NutritionGoalVisualization profile={userDoc?.profile ?? null} targets={targets} />

        <MacroProgressTracking snapshot={snapshot} />

        <Text style={styles.sectionTitle}>Macro rings</Text>
        <View style={styles.ringsCard}>
          <View style={styles.ringsRow}>
            <View style={styles.ringCol}>
              <MacroRing
                value={snapshot.proteinCur}
                goal={snapshot.proteinGoal}
                color={colors.green}
                centerText={`${Math.round(snapshot.proteinCur)}g`}
                centerSub={`of ${Math.round(snapshot.proteinGoal)}g`}
              />
              <Text style={styles.ringLabel}>Protein</Text>
            </View>
            <View style={styles.ringCol}>
              <MacroRing
                value={snapshot.carbsCur}
                goal={snapshot.carbsGoal}
                color={colors.primary}
                centerText={`${Math.round(snapshot.carbsCur)}g`}
                centerSub={`of ${Math.round(snapshot.carbsGoal)}g`}
              />
              <Text style={styles.ringLabel}>Carbs</Text>
            </View>
            <View style={styles.ringCol}>
              <MacroRing
                value={snapshot.fatCur}
                goal={snapshot.fatGoal}
                color={colors.yellow}
                centerText={`${Math.round(snapshot.fatCur)}g`}
                centerSub={`of ${Math.round(snapshot.fatGoal)}g`}
              />
              <Text style={styles.ringLabel}>Fat</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.cta}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Nutrition')}
        >
          <Ionicons name="add-circle" size={22} color={colors.white} style={{ marginRight: spacing.sm }} />
          <Text style={styles.ctaText}>Log food & quick add</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.white} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryLink}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('BodyMetrics')}
        >
          <Ionicons name="body-outline" size={18} color={colors.primary} />
          <Text style={styles.secondaryLinkText}>Update body metrics to refresh targets</Text>
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  hint: { color: colors.textSecondary, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
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
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  ctaText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  secondaryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  secondaryLinkText: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
