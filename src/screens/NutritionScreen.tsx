import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  incrementCalories,
  incrementCarbs,
  incrementFat,
  incrementProtein,
  logMeal,
  removeMeal,
} from '../services/habitsRepo';
import { useTodayNutrition } from '../hooks/useTodayNutrition';
import { caloriesFromMacros } from '../services/nutritionTargets';
import type { MealEntry } from '../types/domain';
import { localDateKey } from '../utils/dateKey';
import { friendlyAppError } from '../utils/appError';
import MacroRing from '../components/MacroRing';

type Props = NativeStackScreenProps<RootStackParamList, 'Nutrition'>;

type MacroId = 'protein' | 'carbs' | 'fat';

const MACRO_QUICK_GRAMS = 10;

function formatTime(ms: number): string {
  try {
    return new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function NutritionScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const { habitDay, defaults, snapshot } = useTodayNutrition(user?.uid, userDoc?.profile ?? null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');

  const {
    caloriesCur,
    caloriesGoal,
    proteinCur,
    proteinGoal,
    carbsCur,
    carbsGoal,
    fatCur,
    fatGoal,
    caloriesRemaining,
    caloriesOver,
  } = snapshot;

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
    if (!user?.uid) return;
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
      const uid = user!.uid;
      const date = localDateKey();
      if (m === 'protein') return incrementProtein(uid, date, MACRO_QUICK_GRAMS, defaults);
      if (m === 'carbs') return incrementCarbs(uid, date, MACRO_QUICK_GRAMS, defaults);
      return incrementFat(uid, date, MACRO_QUICK_GRAMS, defaults);
    });

  const onQuickKcal = (delta: number) =>
    onQuick(async () => {
      await incrementCalories(user!.uid, localDateKey(), delta, defaults);
    });

  const onLogMeal = async () => {
    if (!user?.uid) return;
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
        user.uid,
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
    if (!user?.uid) return;
    Alert.alert('Remove meal', `Delete ${entry.name || 'this meal'} from today?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await removeMeal(user.uid!, localDateKey(), entry.id, defaults);
            } catch (e: unknown) {
              Alert.alert('Meal', friendlyAppError(e, 'Could not remove meal.'));
            }
          })();
        },
      },
    ]);
  };

  if (!user?.uid) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <Text style={styles.hint}>Sign in to track nutrition.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Log food</Text>
          <TouchableOpacity onPress={() => navigation.navigate('NutritionDashboard')} hitSlop={12}>
            <Ionicons name="pie-chart-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity
            style={styles.dashLink}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('NutritionDashboard')}
          >
            <Ionicons name="stats-chart-outline" size={18} color={colors.primary} />
            <Text style={styles.dashLinkText}>View nutrition dashboard</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <View style={styles.kcalCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kcalLabel}>Calories today</Text>
              <Text style={styles.kcalValue}>
                {Math.round(caloriesCur)}
                <Text style={styles.kcalGoal}>{` / ${Math.round(caloriesGoal)} kcal`}</Text>
              </Text>
              <Text style={styles.kcalRemaining}>
                {caloriesOver > 0 ? `${caloriesOver} over target` : `${caloriesRemaining} remaining`}
              </Text>
              <View style={styles.kcalBarBg}>
                <View
                  style={[
                    styles.kcalBarFill,
                    {
                      width: `${Math.min(100, caloriesGoal > 0 ? (caloriesCur / caloriesGoal) * 100 : 0)}%`,
                      backgroundColor: caloriesOver > 0 ? colors.orange : colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.ringsRow}>
            <View style={styles.ringCol}>
              <MacroRing
                value={proteinCur}
                goal={proteinGoal}
                color={colors.green}
                centerText={`${Math.round(proteinCur)}g`}
                centerSub={`of ${Math.round(proteinGoal)}g`}
              />
              <Text style={styles.ringLabel}>Protein</Text>
            </View>
            <View style={styles.ringCol}>
              <MacroRing
                value={carbsCur}
                goal={carbsGoal}
                color={colors.primary}
                centerText={`${Math.round(carbsCur)}g`}
                centerSub={`of ${Math.round(carbsGoal)}g`}
              />
              <Text style={styles.ringLabel}>Carbs</Text>
            </View>
            <View style={styles.ringCol}>
              <MacroRing
                value={fatCur}
                goal={fatGoal}
                color={colors.yellow}
                centerText={`${Math.round(fatCur)}g`}
                centerSub={`of ${Math.round(fatGoal)}g`}
              />
              <Text style={styles.ringLabel}>Fat</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Quick add</Text>
          <View style={styles.quickGrid}>
            <QuickPill
              icon="nutrition"
              label={`+${MACRO_QUICK_GRAMS}g protein`}
              color={colors.green}
              disabled={busy}
              onPress={() => onQuickMacro('protein')}
            />
            <QuickPill
              icon="leaf"
              label={`+${MACRO_QUICK_GRAMS}g carbs`}
              color={colors.primary}
              disabled={busy}
              onPress={() => onQuickMacro('carbs')}
            />
            <QuickPill
              icon="water"
              label={`+${MACRO_QUICK_GRAMS}g fat`}
              color={colors.yellow}
              disabled={busy}
              onPress={() => onQuickMacro('fat')}
            />
            <QuickPill
              icon="flame"
              label="+100 kcal"
              color={colors.orange}
              disabled={busy}
              onPress={() => onQuickKcal(100)}
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
            <Text style={styles.empty}>No meals logged yet. Quick add or log a meal above.</Text>
          ) : (
            meals.map((m, idx) => (
              <View key={m.id}>
                {idx > 0 ? <View style={{ height: spacing.sm }} /> : null}
                <View style={styles.mealCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.mealTitle}>{m.name || 'Meal'}</Text>
                    <Text style={styles.mealMeta}>
                      {Math.round(m.caloriesKcal)} kcal • {Math.round(m.proteinG)}P / {Math.round(m.carbsG)}C / {Math.round(m.fatG)}F
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

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  hint: { color: colors.textSecondary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 24 },
  dashLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  dashLinkText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  kcalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  kcalLabel: { fontSize: 12, fontWeight: '800', color: colors.textSecondary, letterSpacing: 0.6 },
  kcalValue: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: 2 },
  kcalGoal: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  kcalRemaining: { fontSize: 13, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  kcalBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  kcalBarFill: { height: '100%', borderRadius: 4 },
  ringsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  ringCol: { alignItems: 'center', flex: 1 },
  ringLabel: { marginTop: spacing.xs, fontSize: 12, fontWeight: '700', color: colors.textSecondary },
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
