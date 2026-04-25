import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { ONBOARDING_WIZARD_KEY } from '../constants/storageKeys';
import { colors, radius, spacing } from '../theme';
import BodyMetricsFields from '../components/BodyMetricsFields';
import { clamp } from '../utils/math';
import {
  HEIGHT_MAX_CM,
  HEIGHT_MIN_CM,
  WEIGHT_MAX_KG,
  WEIGHT_MIN_KG,
} from '../constants/bodyMetrics';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export default function OnboardingScreen({ navigation }: Props) {
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [goal, setGoal] = useState<'lose' | 'build' | 'maintain'>('build');

  const onContinue = async () => {
    await AsyncStorage.setItem(ONBOARDING_WIZARD_KEY, 'true');
    navigation.replace('SignUp', {
      weightKg: clamp(weight, WEIGHT_MIN_KG, WEIGHT_MAX_KG),
      heightCm: clamp(height, HEIGHT_MIN_CM, HEIGHT_MAX_CM),
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

        <BodyMetricsFields
          weightKg={weight}
          heightCm={height}
          goal={goal}
          onChangeWeight={setWeight}
          onChangeHeight={setHeight}
          onChangeGoal={setGoal}
          scrollable={false}
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={onContinue} activeOpacity={0.9}>
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>You can change this anytime in Settings → Body metrics.</Text>
      </View>
    </SafeAreaView>
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
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.lg },
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
