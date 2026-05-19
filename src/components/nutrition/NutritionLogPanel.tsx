import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import {
  incrementCalories,
  incrementCarbs,
  incrementFat,
  incrementProtein,
  logMeal,
  removeMeal,
} from '../../services/habitsRepo';
import { caloriesFromMacros } from '../../services/nutritionTargets';
import type { HabitDayDoc, MealEntry } from '../../types/domain';
import type { HabitDefaults } from '../../services/habitsRepo';
import { localDateKey } from '../../utils/dateKey';
import { friendlyAppError } from '../../utils/appError';

type MacroId = 'protein' | 'carbs' | 'fat';

const MACRO_QUICK_GRAMS = 10;

type Props = {
  uid: string;
  defaults: HabitDefaults;
  habitDay: HabitDayDoc | null;
};

function formatTime(ms: number): string {
  try {
    return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function NutritionLogPanel({ uid, defaults, habitDay }: Props) {
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');

  const meals = useMemo(() => {
    const list = habitDay?.meals ?? [];
    return [...list].sort((a, b) => b.loggedAtMs - a.loggedAtMs);
  }, [habitDay?.meals]);

  const previewKcal = useMemo(() => {
    const p = parseInt(mealProtein, 10) || 0;
    const c = parseInt(mealCarbs, 10) || 0;
    const f = parseInt(mealFat, 10) || 0;
    return caloriesFromMacros(p, c, f);
  }, [mealProtein, mealCarbs, mealFat]);

  const onQuick = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e: unknown) {
      Alert.alert('Nutrition', friendlyAppError(e, 'Could not update nutrition. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const onQuickMacro = (m: MacroId) =>
    onQuick(async () => {
      const date = localDateKey();
      if (m === 'protein') return incrementProtein(uid, date, MACRO_QUICK_GRAMS, defaults);
      if (m === 'carbs') return incrementCarbs(uid, date, MACRO_QUICK_GRAMS, defaults);
      return incrementFat(uid, date, MACRO_QUICK_GRAMS, defaults);
    });

  const onQuickKcal = (delta: number) =>
    onQuick(async () => {
      await incrementCalories(uid, localDateKey(), delta, defaults);
    });

  const onLogMeal = async () => {
    const protein = parseInt(mealProtein, 10);
    const carbs = parseInt(mealCarbs, 10);
    const fat = parseInt(mealFat, 10);
    const all = [protein, carbs, fat];
    if (!all.some((n) => Number.isFinite(n) && n > 0)) {
      Alert.alert('Meal', 'Add at least one macro value (protein, carbs, or fat).');
      return;
    }
    setSaving(true);
    try {
      await logMeal(
        uid,
        localDateKey(),
        {
          name: mealName,
          proteinG: Number.isFinite(protein) ? protein : 0,
          carbsG: Number.isFinite(carbs) ? carbs : 0,
          fatG: Number.isFinite(fat) ? fat : 0,
        },
        defaults,
      );
      setMealName('');
      setMealProtein('');
      setMealCarbs('');
      setMealFat('');
    } catch (e: unknown) {
      Alert.alert('Meal', friendlyAppError(e, 'Could not log meal. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const onRemoveMeal = (entry: MealEntry) => {
    Alert.alert('Remove meal', `Delete ${entry.name || 'this meal'} from today?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await removeMeal(uid, localDateKey(), entry.id, defaults);
            } catch (e: unknown) {
              Alert.alert('Meal', friendlyAppError(e, 'Could not remove meal.'));
            }
          })();
        },
      },
    ]);
  };

  return (
    <View>
      <Text style={styles.hint}>Logging here updates your Overview progress immediately.</Text>

      <Text style={styles.sectionTitle}>Quick add</Text>
      <View style={styles.quickGrid}>
        <QuickPill
          icon="nutrition"
          label={`+${MACRO_QUICK_GRAMS}g protein`}
          color={colors.green}
          disabled={busy}
          onPress={() => void onQuickMacro('protein')}
        />
        <QuickPill
          icon="leaf"
          label={`+${MACRO_QUICK_GRAMS}g carbs`}
          color={colors.primary}
          disabled={busy}
          onPress={() => void onQuickMacro('carbs')}
        />
        <QuickPill
          icon="water"
          label={`+${MACRO_QUICK_GRAMS}g fat`}
          color={colors.yellow}
          disabled={busy}
          onPress={() => void onQuickMacro('fat')}
        />
        <QuickPill
          icon="flame"
          label="+100 kcal"
          color={colors.orange}
          disabled={busy}
          onPress={() => void onQuickKcal(100)}
        />
      </View>

      <Text style={styles.sectionTitle}>Log a meal</Text>
      <View style={styles.formCard}>
        <TextInput
          style={styles.nameInput}
          placeholder="Meal name (optional)"
          placeholderTextColor={colors.textMuted}
          value={mealName}
          onChangeText={setMealName}
        />
        <View style={styles.macroInputsRow}>
          <MacroInput label="Protein" suffix="g" value={mealProtein} onChange={setMealProtein} color={colors.green} />
          <MacroInput label="Carbs" suffix="g" value={mealCarbs} onChange={setMealCarbs} color={colors.primary} />
          <MacroInput label="Fat" suffix="g" value={mealFat} onChange={setMealFat} color={colors.yellow} />
        </View>
        <Text style={styles.kcalPreview}>≈ {previewKcal} kcal</Text>
        <TouchableOpacity
          style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
          activeOpacity={0.9}
          onPress={() => void onLogMeal()}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryBtnText}>Log meal</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Today's meals</Text>
      {meals.length === 0 ? (
        <Text style={styles.empty}>No meals yet — use quick add or log a meal above.</Text>
      ) : (
        meals.map((m, idx) => (
          <View key={m.id}>
            {idx > 0 ? <View style={{ height: spacing.sm }} /> : null}
            <View style={styles.mealCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.mealTitle}>{m.name || 'Meal'}</Text>
                <Text style={styles.mealMeta}>
                  {Math.round(m.caloriesKcal)} kcal • {Math.round(m.proteinG)}P / {Math.round(m.carbsG)}C /{' '}
                  {Math.round(m.fatG)}F
                </Text>
                <Text style={styles.mealTime}>{formatTime(m.loggedAtMs)}</Text>
              </View>
              <TouchableOpacity onPress={() => onRemoveMeal(m)} hitSlop={10}>
                <Ionicons name="trash-outline" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {busy ? (
        <View style={{ alignItems: 'center', marginTop: spacing.md }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
    </View>
  );
}

function QuickPill({
  icon,
  label,
  color,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickPill, disabled && { opacity: 0.6 }]}
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.quickPillIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={18} color={colors.white} />
      </View>
      <Text style={styles.quickPillLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function MacroInput({
  label,
  suffix,
  value,
  onChange,
  color,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  color: string;
}) {
  return (
    <View style={styles.macroInputCol}>
      <View style={styles.macroInputHead}>
        <View style={[styles.macroDot, { backgroundColor: color }]} />
        <Text style={styles.macroInputLabel}>{label}</Text>
      </View>
      <View style={styles.macroInputWrap}>
        <TextInput
          style={styles.macroInput}
          keyboardType="number-pad"
          value={value}
          onChangeText={onChange}
          placeholder="0"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.macroInputSuffix}>{suffix}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  quickPillIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  quickPillLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
    marginBottom: spacing.md,
  },
  macroInputsRow: { flexDirection: 'row', gap: spacing.sm },
  macroInputCol: { flex: 1 },
  macroInputHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  macroDot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  macroInputLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  macroInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.sm,
  },
  macroInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  macroInputSuffix: { fontSize: 12, color: colors.textMuted, fontWeight: '700' },
  kcalPreview: { marginTop: spacing.md, fontSize: 12, color: colors.textSecondary, fontWeight: '700' },
  primaryBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  empty: { color: colors.textSecondary, paddingVertical: spacing.md, fontSize: 13 },
  mealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  mealTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  mealMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  mealTime: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
