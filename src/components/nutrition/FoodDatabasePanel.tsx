import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../theme';
import { FOOD_CATEGORIES, type FoodCategoryFilter } from '../../data/foodsCatalog';
import type { CustomFoodRow } from '../../types/food';
import { searchCatalogFoods, type SearchableFood } from '../../utils/foodSearch';
import { macrosForGrams } from '../../utils/foodMacros';
import { logMeal } from '../../services/habitsRepo';
import { saveCustomFood, subscribeCustomFoods } from '../../services/customFoodsRepo';
import type { HabitDefaults } from '../../services/habitsRepo';
import { localDateKey } from '../../utils/dateKey';
import { friendlyAppError } from '../../utils/appError';

type LogMode = 'search' | 'custom';

type Props = {
  uid: string;
  defaults: HabitDefaults;
  /** `modal` = full-screen list with scroll; `inline` = embedded in log panel (legacy). */
  variant?: 'inline' | 'modal';
  onClose?: () => void;
};

const DEFAULT_GRAMS = '100';

function formatMacros(p: number, c: number, f: number, kcal: number): string {
  return `${Math.round(kcal)} kcal · ${p}P / ${c}C / ${f}F`;
}

export default function FoodDatabasePanel({
  uid,
  defaults,
  variant = 'inline',
  onClose,
}: Props) {
  const isModal = variant === 'modal';
  const [mode, setMode] = useState<LogMode>('search');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<FoodCategoryFilter>('all');
  const [customFoods, setCustomFoods] = useState<CustomFoodRow[]>([]);
  const [selected, setSelected] = useState<SearchableFood | null>(null);
  const [grams, setGrams] = useState(DEFAULT_GRAMS);
  const [saving, setSaving] = useState(false);

  const [customName, setCustomName] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [saveToHistory, setSaveToHistory] = useState(true);

  useEffect(() => {
    return subscribeCustomFoods(uid, setCustomFoods);
  }, [uid]);

  const catalogResults = useMemo(
    () => searchCatalogFoods(query, category),
    [query, category],
  );

  const listData = useMemo((): SearchableFood[] => {
    const catalog = catalogResults.map((item) => ({ source: 'catalog' as const, item }));
    const nq = query.trim().toLowerCase();
    const custom = customFoods
      .filter((row) => !nq || row.data.name.toLowerCase().includes(nq))
      .map((item) => ({ source: 'custom' as const, item }));
    return [...custom, ...catalog];
  }, [catalogResults, customFoods, query]);

  const portionPreview = useMemo(() => {
    if (!selected) return null;
    const g = parseFloat(grams) || 0;
    if (g <= 0) return null;
    if (selected.source === 'catalog') {
      return macrosForGrams(selected.item.macrosPer100g, g);
    }
    const d = selected.item.data;
    return macrosForGrams(
      {
        protein: d.proteinPer100g,
        carbs: d.carbsPer100g,
        fat: d.fatPer100g,
        calories: d.caloriesPer100g,
      },
      g,
    );
  }, [selected, grams]);

  const foodName = (f: SearchableFood) =>
    f.source === 'catalog' ? f.item.name : f.item.data.name;

  const onAddToMeal = async () => {
    if (!selected || !portionPreview) {
      Alert.alert('Portion', 'Select a food and enter the amount in grams.');
      return;
    }
    const g = parseFloat(grams);
    if (!Number.isFinite(g) || g <= 0) {
      Alert.alert('Portion', 'Enter a valid amount in grams.');
      return;
    }
    setSaving(true);
    try {
      const name = foodName(selected);
      await logMeal(
        uid,
        localDateKey(),
        {
          name: g !== 100 ? `${name} (${g}g)` : name,
          proteinG: portionPreview.protein,
          carbsG: portionPreview.carbs,
          fatG: portionPreview.fat,
          caloriesKcal: portionPreview.calories,
          grams: g,
          ...(selected.source === 'catalog'
            ? { catalogFoodId: selected.item.id }
            : { customFoodId: selected.item.id }),
        },
        defaults,
      );
      setSelected(null);
      setGrams(DEFAULT_GRAMS);
      setQuery('');
      if (isModal) onClose?.();
    } catch (e: unknown) {
      Alert.alert('Meal', friendlyAppError(e, 'Could not log meal.'));
    } finally {
      setSaving(false);
    }
  };

  const onSaveCustomAndLog = async () => {
    const protein = parseFloat(customProtein) || 0;
    const carbs = parseFloat(customCarbs) || 0;
    const fat = parseFloat(customFat) || 0;
    const calories = customCalories.trim() ? parseFloat(customCalories) : undefined;
    if (!customName.trim()) {
      Alert.alert('Food', 'Enter a food name.');
      return;
    }
    if (![protein, carbs, fat].some((n) => n > 0) && !(calories && calories > 0)) {
      Alert.alert('Food', 'Add at least one macro or calories.');
      return;
    }
    setSaving(true);
    try {
      let customFoodId: string | undefined;
      if (saveToHistory) {
        customFoodId = await saveCustomFood(uid, {
          name: customName,
          proteinG: protein,
          carbsG: carbs,
          fatG: fat,
          caloriesKcal: calories,
        });
      }
      const macros = macrosForGrams(
        {
          protein,
          carbs,
          fat,
          calories: calories ?? protein * 4 + carbs * 4 + fat * 9,
        },
        parseFloat(grams) || 100,
      );
      await logMeal(
        uid,
        localDateKey(),
        {
          name: customName.trim(),
          proteinG: macros.protein,
          carbsG: macros.carbs,
          fatG: macros.fat,
          caloriesKcal: macros.calories,
          grams: parseFloat(grams) || 100,
          ...(customFoodId ? { customFoodId } : {}),
        },
        defaults,
      );
      setCustomName('');
      setCustomProtein('');
      setCustomCarbs('');
      setCustomFat('');
      setCustomCalories('');
      setMode('search');
      if (isModal) onClose?.();
    } catch (e: unknown) {
      Alert.alert('Food', friendlyAppError(e, 'Could not save food.'));
    } finally {
      setSaving(false);
    }
  };

  const onQuickReuse = (row: CustomFoodRow) => {
    setSelected({ source: 'custom', item: row });
    setMode('search');
    setQuery(row.data.name);
    setGrams(DEFAULT_GRAMS);
  };

  const renderFoodRow = ({ item }: { item: SearchableFood }) => {
    const name = foodName(item);
    const macros =
      item.source === 'catalog'
        ? item.item.macrosPer100g
        : {
            protein: item.item.data.proteinPer100g,
            carbs: item.item.data.carbsPer100g,
            fat: item.item.data.fatPer100g,
            calories: item.item.data.caloriesPer100g,
          };
    const isSelected =
      selected &&
      ((selected.source === 'catalog' &&
        item.source === 'catalog' &&
        selected.item.id === item.item.id) ||
        (selected.source === 'custom' &&
          item.source === 'custom' &&
          selected.item.id === item.item.id));

    return (
      <TouchableOpacity
        style={[styles.foodRow, isSelected && styles.foodRowSelected]}
        activeOpacity={0.85}
        onPress={() => {
          setSelected(item);
          setGrams(DEFAULT_GRAMS);
        }}
      >
        <View style={styles.foodRowIcon}>
          <Ionicons
            name={item.source === 'custom' ? 'bookmark' : 'nutrition'}
            size={18}
            color={item.source === 'custom' ? colors.orange : colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.foodName}>{name}</Text>
          <Text style={styles.foodMeta}>
            {formatMacros(macros.protein, macros.carbs, macros.fat, macros.calories)} / 100g
          </Text>
          {item.source === 'custom' ? (
            <Text style={styles.foodTag}>Custom</Text>
          ) : null}
        </View>
        {isSelected ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
        ) : (
          <Ionicons name="add-circle-outline" size={22} color={colors.textMuted} />
        )}
      </TouchableOpacity>
    );
  };

  const listLimit = isModal ? listData.length : 40;
  const visibleList = listData.slice(0, listLimit);

  const modeRow = (
    <View style={[styles.modeRow, isModal && styles.modeRowModal]}>
      <ModePill label="Search" active={mode === 'search'} onPress={() => setMode('search')} />
      <ModePill label="Create custom" active={mode === 'custom'} onPress={() => setMode('custom')} />
    </View>
  );

  const portionCard = selected ? (
    <View style={styles.portionCard}>
      <Text style={styles.portionTitle}>{foodName(selected)}</Text>
      <Text style={styles.portionSub}>Amount (grams)</Text>
      <View style={styles.gramsRow}>
        {[50, 100, 150, 200].map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[styles.gramPreset, grams === String(preset) && styles.gramPresetActive]}
            onPress={() => setGrams(String(preset))}
          >
            <Text
              style={[styles.gramPresetText, grams === String(preset) && styles.gramPresetTextActive]}
            >
              {preset}g
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.gramsInputWrap}>
        <TextInput
          style={styles.gramsInput}
          keyboardType="decimal-pad"
          value={grams}
          onChangeText={setGrams}
          placeholder="100"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.gramsSuffix}>g</Text>
      </View>
      {portionPreview ? (
        <Text style={styles.previewMacros}>
          {formatMacros(
            portionPreview.protein,
            portionPreview.carbs,
            portionPreview.fat,
            portionPreview.calories,
          )}
        </Text>
      ) : null}
      <TouchableOpacity
        style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
        onPress={() => void onAddToMeal()}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.primaryBtnText}>Add to today's meal</Text>
        )}
      </TouchableOpacity>
    </View>
  ) : null;

  const customForm = (
    <View style={styles.formCard}>
      <Text style={styles.sectionTitle}>Custom food</Text>
      <Text style={styles.formHint}>Macros per 100g. Saved to your history for reuse.</Text>
      <TextInput
        style={styles.nameInput}
        placeholder="Food name"
        placeholderTextColor={colors.textMuted}
        value={customName}
        onChangeText={setCustomName}
      />
      <View style={styles.macroInputsRow}>
        <MacroField label="Protein" suffix="g" value={customProtein} onChange={setCustomProtein} color={colors.green} />
        <MacroField label="Carbs" suffix="g" value={customCarbs} onChange={setCustomCarbs} color={colors.primary} />
        <MacroField label="Fat" suffix="g" value={customFat} onChange={setCustomFat} color={colors.yellow} />
      </View>
      <MacroField
        label="Calories (optional)"
        suffix="kcal"
        value={customCalories}
        onChange={setCustomCalories}
        color={colors.orange}
        fullWidth
      />
      <Text style={styles.portionSub}>Portion to log today</Text>
      <View style={styles.gramsInputWrap}>
        <TextInput
          style={styles.gramsInput}
          keyboardType="decimal-pad"
          value={grams}
          onChangeText={setGrams}
          placeholder="100"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.gramsSuffix}>g</Text>
      </View>
      <TouchableOpacity
        style={styles.saveToggle}
        onPress={() => setSaveToHistory((v) => !v)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={saveToHistory ? 'checkbox' : 'square-outline'}
          size={22}
          color={colors.primary}
        />
        <Text style={styles.saveToggleText}>Save to my history</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
        onPress={() => void onSaveCustomAndLog()}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.primaryBtnText}>Save and log meal</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const searchFilters = (
    <>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search food (chicken, rice, egg...)"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            if (!t.trim()) setSelected(null);
          }}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {FOOD_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.id}
            onPress={() => setCategory(c.id)}
            style={[styles.chip, category === c.id && styles.chipActive]}
          >
            <Text style={[styles.chipText, category === c.id && styles.chipTextActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {customFoods.length > 0 && !query.trim() ? (
        <>
          <Text style={styles.sectionTitle}>Your saved foods</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {customFoods.slice(0, 8).map((row) => (
                <TouchableOpacity key={row.id} style={styles.savedPill} onPress={() => onQuickReuse(row)}>
                  <Ionicons name="bookmark" size={14} color={colors.orange} />
                  <Text style={styles.savedPillText} numberOfLines={1}>
                    {row.data.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </>
      ) : null}
    </>
  );

  if (mode === 'custom') {
    return (
      <ScrollView
        style={isModal ? styles.modalRoot : undefined}
        contentContainerStyle={isModal ? styles.modalScrollContent : undefined}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!isModal ? (
          <Text style={styles.hint}>Search the food database or create custom foods. Values are per 100g.</Text>
        ) : null}
        {modeRow}
        {customForm}
      </ScrollView>
    );
  }

  if (isModal) {
    return (
      <View style={styles.modalRoot}>
        {modeRow}
        <FlatList
          style={styles.modalList}
          data={visibleList}
          keyExtractor={(item) =>
            item.source === 'catalog' ? `c-${item.item.id}` : `u-${item.item.id}`
          }
          renderItem={renderFoodRow}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={searchFilters}
          ListFooterComponent={
            <>
              {listData.length > 40 && visibleList.length >= 40 ? (
                <Text style={styles.moreHint}>Refine your search to narrow results.</Text>
              ) : null}
              {portionCard}
              <View style={{ height: spacing.xl }} />
            </>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No results. Try another term or category.</Text>
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        />
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.hint}>Search the food database or create custom foods. Values are per 100g.</Text>
      {modeRow}
      {searchFilters}
      <FlatList
        data={visibleList}
        keyExtractor={(item) =>
          item.source === 'catalog' ? `c-${item.item.id}` : `u-${item.item.id}`
        }
        renderItem={renderFoodRow}
        scrollEnabled={false}
        ListEmptyComponent={
          <Text style={styles.empty}>No results. Try another term or category.</Text>
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
      />
      {listData.length > 40 ? (
        <Text style={styles.moreHint}>Showing 40 of {listData.length} — refine your search.</Text>
      ) : null}
      {portionCard}
    </View>
  );
}

function ModePill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.modePill, active && styles.modePillActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.modePillText, active && styles.modePillTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MacroField({
  label,
  suffix,
  value,
  onChange,
  color,
  fullWidth,
}: {
  label: string;
  suffix: string;
  value: string;
  onChange: (v: string) => void;
  color: string;
  fullWidth?: boolean;
}) {
  return (
    <View style={[styles.macroInputCol, fullWidth && { flex: undefined, width: '100%', marginTop: spacing.sm }]}>
      <View style={styles.macroInputHead}>
        <View style={[styles.macroDot, { backgroundColor: color }]} />
        <Text style={styles.macroInputLabel}>{label}</Text>
      </View>
      <View style={styles.macroInputWrap}>
        <TextInput
          style={styles.macroInput}
          keyboardType="decimal-pad"
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
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  modalRoot: { flex: 1, paddingHorizontal: spacing.xl },
  modalScrollContent: { paddingBottom: spacing.xl },
  modalList: { flex: 1 },
  modeRowModal: { marginBottom: spacing.sm },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modePillActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  modePillText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  modePillTextActive: { color: colors.primary },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '600' },
  chipsScroll: { marginBottom: spacing.md, maxHeight: 44 },
  chipsRow: { gap: spacing.sm, paddingRight: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  savedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    maxWidth: 140,
  },
  savedPillText: { fontSize: 12, fontWeight: '700', color: colors.text, flexShrink: 1 },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  foodRowSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  foodRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  foodName: { fontSize: 15, fontWeight: '800', color: colors.text },
  foodMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontWeight: '600' },
  foodTag: { fontSize: 11, color: colors.orange, fontWeight: '700', marginTop: 2 },
  empty: { color: colors.textSecondary, paddingVertical: spacing.lg, fontSize: 13, textAlign: 'center' },
  moreHint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm, fontWeight: '600' },
  portionCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primary,
  },
  portionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  portionSub: { fontSize: 13, color: colors.textSecondary, fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.sm },
  gramsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  gramPreset: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gramPresetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  gramPresetText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  gramPresetTextActive: { color: colors.white },
  gramsInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  gramsInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  gramsSuffix: { fontSize: 14, fontWeight: '700', color: colors.textMuted },
  previewMacros: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  formHint: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md, fontWeight: '600' },
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
  saveToggle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.md },
  saveToggleText: { fontSize: 14, fontWeight: '700', color: colors.text },
});
