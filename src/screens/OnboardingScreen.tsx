import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ONBOARDING_WIZARD_KEY } from '../constants/storageKeys';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const WEIGHT_MIN = 30;
const WEIGHT_MAX = 200;
const HEIGHT_MIN = 120;
const HEIGHT_MAX = 220;

export default function OnboardingScreen({ navigation }: Props) {
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [goal, setGoal] = useState<'lose' | 'build' | 'maintain'>('build');

  const onContinue = async () => {
    await AsyncStorage.setItem(ONBOARDING_WIZARD_KEY, 'true');
    navigation.replace('SignUp', {
      weightKg: weight,
      heightCm: height,
      goal,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.progressRow}>
          <Text style={styles.stepText}>Step 1 of 1</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
        </View>

        <Text style={styles.title}>{"Let's get to know you"}</Text>
        <Text style={styles.subtitle}>This helps us personalize your experience.</Text>

        <SectionHeader icon="scale-outline" label={"What's your weight?"} unit="kg" />
        <RulerValue
          value={weight.toFixed(1)}
          onMinus={() => setWeight((w) => Math.max(WEIGHT_MIN, w - 0.5))}
          onPlus={() => setWeight((w) => Math.min(WEIGHT_MAX, w + 0.5))}
        />
        <RulerTicks min={WEIGHT_MIN} max={WEIGHT_MAX} value={weight} />

        <View style={{ height: spacing.xl }} />

        <SectionHeader icon="resize-outline" label={"What's your height?"} unit="cm" />
        <RulerValue
          value={String(height)}
          onMinus={() => setHeight((h) => Math.max(HEIGHT_MIN, h - 1))}
          onPlus={() => setHeight((h) => Math.min(HEIGHT_MAX, h + 1))}
        />
        <RulerTicks min={HEIGHT_MIN} max={HEIGHT_MAX} value={height} />

        <View style={{ height: spacing.xl }} />

        <View style={styles.goalHeaderRow}>
          <View style={styles.iconBox}>
            <Ionicons name="locate-outline" size={18} color={colors.primary} />
          </View>
          <Text style={styles.sectionLabel}>{"What's your goal?"}</Text>
        </View>
        <View style={styles.goalRow}>
          <GoalCard
            label="Lose Fat"
            icon="flame-outline"
            selected={goal === 'lose'}
            onPress={() => setGoal('lose')}
          />
          <GoalCard
            label="Build Muscle"
            icon="barbell-outline"
            selected={goal === 'build'}
            onPress={() => setGoal('build')}
          />
          <GoalCard
            label="Maintain"
            icon="analytics-outline"
            selected={goal === 'maintain'}
            onPress={() => setGoal('maintain')}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue} activeOpacity={0.9}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>You can change this anytime in settings.</Text>
      </View>
    </SafeAreaView>
  );
}

function SectionHeader({
  icon,
  label,
  unit,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  unit: string;
}) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Text style={styles.unit}>{unit}</Text>
    </View>
  );
}

function RulerValue({
  value,
  onMinus,
  onPlus,
}: {
  value: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.rulerValueRow}>
      <TouchableOpacity style={styles.circleBtn} onPress={onMinus}>
        <Ionicons name="remove" size={22} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.bigValue}>{value}</Text>
      <TouchableOpacity style={styles.circleBtn} onPress={onPlus}>
        <Ionicons name="add" size={22} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

function RulerTicks({ min, max, value }: { min: number; max: number; value: number }) {
  const ticks = 24;
  const ratio = (value - min) / (max - min);
  return (
    <View style={styles.rulerWrap}>
      <View style={styles.rulerTicks}>
        {Array.from({ length: ticks }).map((_, i) => {
          const active = i / (ticks - 1) <= ratio + 0.02;
          return <View key={i} style={[styles.tick, active && styles.tickActive]} />;
        })}
      </View>
      <View style={[styles.rulerCursor, { left: `${ratio * 100}%` }]} />
      <View style={styles.rulerLabels}>
        <Text style={styles.rulerLabel}>{min}</Text>
        <Text style={styles.rulerLabel}>{max}</Text>
      </View>
    </View>
  );
}

function GoalCard({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.goalCard, selected && styles.goalCardSelected]}
    >
      <Ionicons name={icon} size={22} color={selected ? colors.primary : colors.textSecondary} />
      <Text style={[styles.goalLabel, selected && styles.goalLabelSelected]} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  progressRow: { marginBottom: spacing.lg },
  stepText: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.xxl },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  goalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  sectionLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  unit: { fontSize: 14, color: colors.textSecondary, fontWeight: '500' },
  rulerValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  bigValue: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.primary,
    marginHorizontal: spacing.xxl,
    minWidth: 100,
    textAlign: 'center',
  },
  rulerWrap: { marginBottom: spacing.lg },
  rulerTicks: { flexDirection: 'row', justifyContent: 'space-between', height: 14 },
  tick: { width: 2, height: 10, backgroundColor: colors.border, borderRadius: 1 },
  tickActive: { backgroundColor: colors.primary },
  rulerCursor: {
    position: 'absolute',
    top: 0,
    width: 3,
    height: 16,
    backgroundColor: colors.primary,
    marginLeft: -1.5,
    borderRadius: 2,
  },
  rulerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  rulerLabel: { fontSize: 12, color: colors.textMuted },
  goalRow: { flexDirection: 'row', gap: spacing.sm },
  goalCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  goalCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  goalLabel: {
    marginTop: spacing.sm,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  goalLabelSelected: { color: colors.primary },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  continueBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueText: { color: colors.white, fontSize: 17, fontWeight: '600' },
  hint: {
    textAlign: 'center',
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
  },
});
