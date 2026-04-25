import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { UserProfile } from '../types/firestoreUser';
import BodyMetricsFields from '../components/BodyMetricsFields';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/userDocument';
import { colors, radius, spacing } from '../theme';
import { clamp } from '../utils/math';
import {
  HEIGHT_MAX_CM,
  HEIGHT_MIN_CM,
  WEIGHT_MAX_KG,
  WEIGHT_MIN_KG,
} from '../constants/bodyMetrics';

type Props = NativeStackScreenProps<RootStackParamList, 'BodyMetrics'>;

export default function BodyMetricsScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const p = userDoc?.profile;
  const [weightKg, setWeightKg] = useState(() => clamp(p?.weightKg ?? 70, WEIGHT_MIN_KG, WEIGHT_MAX_KG));
  const [heightCm, setHeightCm] = useState(() => clamp(p?.heightCm ?? 175, HEIGHT_MIN_CM, HEIGHT_MAX_CM));
  const [goal, setGoal] = useState<UserProfile['goal']>(p?.goal ?? 'build');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (p) {
      setWeightKg(clamp(p.weightKg, WEIGHT_MIN_KG, WEIGHT_MAX_KG));
      setHeightCm(clamp(p.heightCm, HEIGHT_MIN_CM, HEIGHT_MAX_CM));
      setGoal(p.goal);
    } else {
      setWeightKg(70);
      setHeightCm(175);
      setGoal('build');
    }
  }, [p?.weightKg, p?.heightCm, p?.goal]);

  const onSave = async () => {
    if (!user?.uid) {
      Alert.alert('Body metrics', 'You must be signed in.');
      return;
    }
    setSaving(true);
    try {
      const next: UserProfile = {
        weightKg: clamp(weightKg, WEIGHT_MIN_KG, WEIGHT_MAX_KG),
        heightCm: clamp(heightCm, HEIGHT_MIN_CM, HEIGHT_MAX_CM),
        goal,
      };
      await updateUserProfile(user.uid, next);
      navigation.goBack();
    } catch (e: unknown) {
      Alert.alert('Body metrics', e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} disabled={saving}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Body metrics</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.outerScroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.subtitle}>
          Set your weight, height, and goal anytime. Habit targets use these values.
        </Text>
        <BodyMetricsFields
          weightKg={weightKg}
          heightCm={heightCm}
          goal={goal}
          onChangeWeight={setWeightKg}
          onChangeHeight={setHeightCm}
          onChangeGoal={setGoal}
          scrollable={false}
        />
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={onSave}
          activeOpacity={0.9}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: colors.text },
  outerScroll: { paddingHorizontal: spacing.xl, paddingBottom: 16 },
  subtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: spacing.lg },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveText: { color: colors.white, fontSize: 17, fontWeight: '600' },
});
