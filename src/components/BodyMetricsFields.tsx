import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Pressable, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  HEIGHT_MAX_CM,
  HEIGHT_MIN_CM,
  HEIGHT_STEP_CM,
  WEIGHT_MAX_KG,
  WEIGHT_MIN_KG,
  WEIGHT_STEP_KG,
} from '../constants/bodyMetrics';
import { clamp } from '../utils/math';
import { colors, radius, spacing } from '../theme';
import type { UserProfile } from '../types/firestoreUser';

export type BodyGoal = UserProfile['goal'];

export type BodyMetricsFieldsProps = {
  weightKg: number;
  heightCm: number;
  goal: BodyGoal;
  onChangeWeight: (v: number) => void;
  onChangeHeight: (v: number) => void;
  onChangeGoal: (g: BodyGoal) => void;
  /** When false, only steppers (no free-form fields). Default true. */
  allowDirectEntry?: boolean;
  scrollable?: boolean;
  contentContainerStyle?: object;
};

function formatWeightForDisplay(kg: number) {
  return Math.abs(kg - Math.round(kg)) < 0.01 ? String(Math.round(kg)) : kg.toFixed(1);
}

export default function BodyMetricsFields({
  weightKg,
  heightCm,
  goal,
  onChangeWeight,
  onChangeHeight,
  onChangeGoal,
  allowDirectEntry = true,
  scrollable = true,
  contentContainerStyle,
}: BodyMetricsFieldsProps) {
  const [weightText, setWeightText] = useState(() => formatWeightForDisplay(weightKg));
  const [heightText, setHeightText] = useState(() => String(Math.round(heightCm)));
  const [weightFocused, setWeightFocused] = useState(false);
  const [heightFocused, setHeightFocused] = useState(false);

  useEffect(() => {
    if (weightFocused) return;
    setWeightText(formatWeightForDisplay(weightKg));
  }, [weightKg, weightFocused]);

  useEffect(() => {
    if (heightFocused) return;
    setHeightText(String(Math.round(heightCm)));
  }, [heightCm, heightFocused]);

  const onWeightType = (raw: string) => {
    setWeightText(raw);
    const n = parseFloat(raw.replace(',', '.'));
    if (Number.isFinite(n)) {
      onChangeWeight(clamp(n, WEIGHT_MIN_KG, WEIGHT_MAX_KG));
    }
  };

  const onHeightType = (raw: string) => {
    setHeightText(raw);
    const n = parseInt(raw, 10);
    if (Number.isFinite(n)) {
      onChangeHeight(clamp(n, HEIGHT_MIN_CM, HEIGHT_MAX_CM));
    }
  };

  const inner = (
    <>
      <SectionHeader icon="scale-outline" label={"What's your weight?"} unit="kg" />
      <RulerValue
        value={formatWeightForDisplay(weightKg)}
        onMinus={() =>
          onChangeWeight(clamp(weightKg - WEIGHT_STEP_KG, WEIGHT_MIN_KG, WEIGHT_MAX_KG))
        }
        onPlus={() =>
          onChangeWeight(clamp(weightKg + WEIGHT_STEP_KG, WEIGHT_MIN_KG, WEIGHT_MAX_KG))
        }
      />
      {allowDirectEntry ? (
        <View style={styles.directRow}>
          <Text style={styles.directLabel}>Value (kg)</Text>
          <TextInput
            style={styles.directInput}
            value={weightText}
            onChangeText={onWeightType}
            onFocus={() => setWeightFocused(true)}
            onBlur={() => {
              setWeightFocused(false);
              const n = parseFloat(weightText.replace(',', '.'));
              if (!Number.isFinite(n)) {
                setWeightText(formatWeightForDisplay(weightKg));
                return;
              }
              const c = clamp(n, WEIGHT_MIN_KG, WEIGHT_MAX_KG);
              onChangeWeight(c);
              setWeightText(formatWeightForDisplay(c));
            }}
            keyboardType="decimal-pad"
            placeholder={`${WEIGHT_MIN_KG}–${WEIGHT_MAX_KG}`}
            placeholderTextColor={colors.textMuted}
          />
        </View>
      ) : null}
      <RulerTicks
        min={WEIGHT_MIN_KG}
        max={WEIGHT_MAX_KG}
        value={weightKg}
      />

      <View style={{ height: spacing.xl }} />

      <SectionHeader icon="resize-outline" label={"What's your height?"} unit="cm" />
      <RulerValue
        value={String(heightCm)}
        onMinus={() =>
          onChangeHeight(clamp(heightCm - HEIGHT_STEP_CM, HEIGHT_MIN_CM, HEIGHT_MAX_CM))
        }
        onPlus={() =>
          onChangeHeight(clamp(heightCm + HEIGHT_STEP_CM, HEIGHT_MIN_CM, HEIGHT_MAX_CM))
        }
      />
      {allowDirectEntry ? (
        <View style={styles.directRow}>
          <Text style={styles.directLabel}>Value (cm)</Text>
          <TextInput
            style={styles.directInput}
            value={heightText}
            onChangeText={onHeightType}
            onFocus={() => setHeightFocused(true)}
            onBlur={() => {
              setHeightFocused(false);
              const n = parseInt(heightText, 10);
              if (!Number.isFinite(n)) {
                setHeightText(String(Math.round(heightCm)));
                return;
              }
              const c = clamp(n, HEIGHT_MIN_CM, HEIGHT_MAX_CM);
              onChangeHeight(c);
              setHeightText(String(c));
            }}
            keyboardType="number-pad"
            placeholder={`${HEIGHT_MIN_CM}–${HEIGHT_MAX_CM}`}
            placeholderTextColor={colors.textMuted}
          />
        </View>
      ) : null}
      <RulerTicks
        min={HEIGHT_MIN_CM}
        max={HEIGHT_MAX_CM}
        value={heightCm}
      />

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
          onPress={() => onChangeGoal('lose')}
        />
        <GoalCard
          label="Build Muscle"
          icon="barbell-outline"
          selected={goal === 'build'}
          onPress={() => onChangeGoal('build')}
        />
        <GoalCard
          label="Maintain"
          icon="analytics-outline"
          selected={goal === 'maintain'}
          onPress={() => onChangeGoal('maintain')}
        />
      </View>
    </>
  );

  if (scrollable) {
    return (
      <ScrollView
        contentContainerStyle={[styles.scroll, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {inner}
      </ScrollView>
    );
  }

  return <View style={contentContainerStyle}>{inner}</View>;
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
  const span = max - min;
  const ratio = span > 0 ? (value - min) / span : 0.5;
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
  scroll: { paddingBottom: 24 },
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
  directRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  directLabel: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  directInput: {
    minWidth: 100,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
    paddingVertical: spacing.sm,
  },
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
});
