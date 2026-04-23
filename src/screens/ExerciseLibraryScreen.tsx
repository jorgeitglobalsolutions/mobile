import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { EXERCISES_CATALOG, MUSCLE_CATEGORIES, type CatalogExercise } from '../data/exercisesCatalog';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseLibrary'>;

export default function ExerciseLibraryScreen({ navigation, route }: Props) {
  const mode = route.params?.mode ?? 'browse';
  const returnRoutineId = route.params?.returnRoutineId;
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<(typeof MUSCLE_CATEGORIES)[number]>('All');

  const filtered = useMemo(() => {
    return EXERCISES_CATALOG.filter((e) => {
      const okCat = cat === 'All' || e.muscle === cat;
      const okQ = !q.trim() || e.name.toLowerCase().includes(q.toLowerCase());
      return okCat && okQ;
    });
  }, [cat, q]);

  const onSelectExercise = useCallback(
    (item: CatalogExercise) => {
      if (mode === 'pick') {
        navigation.navigate('Main', {
          screen: 'Routines',
          params: {
            screen: 'RoutineBuilder',
            params: {
              routineId: returnRoutineId,
              pickedExerciseName: item.name,
            },
          },
        });
        navigation.goBack();
        return;
      }
      navigation.navigate('ExerciseDetail', { exerciseId: item.id });
    },
    [mode, navigation, returnRoutineId],
  );

  const renderItem = useCallback(
    ({ item }: { item: CatalogExercise }) => (
      <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={() => onSelectExercise(item)}>
        <View style={styles.thumb}>
          <Ionicons name="body-outline" size={24} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.muscle}>{item.muscle}</Text>
        </View>
        <Ionicons name={mode === 'pick' ? 'add-circle-outline' : 'chevron-forward'} size={22} color={colors.textMuted} />
      </TouchableOpacity>
    ),
    [mode, onSelectExercise],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{mode === 'pick' ? 'Pick exercise' : 'Exercise Library'}</Text>
        <TouchableOpacity style={styles.searchIconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {mode === 'pick' ? (
        <Text style={styles.pickHint}>Tap an exercise to add it to your routine.</Text>
      ) : null}

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          placeholder="Search exercises..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={q}
          onChangeText={setQ}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsRow}
      >
        {MUSCLE_CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setCat(c)}
            style={[styles.chip, cat === c && styles.chipActive]}
          >
            <Text style={[styles.chipText, cat === c && styles.chipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={(item) => item.id}
        initialNumToRender={14}
        windowSize={5}
        removeClippedSubviews
        contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40, flexGrow: 1 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No exercises match your filters.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  pickHint: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
    fontSize: 14,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  title: { fontSize: 26, fontWeight: '700', color: colors.text, flex: 1, marginRight: spacing.sm },
  searchIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: colors.text },
  /** Prevents horizontal ScrollView from stretching to fill column (bug: tall thin chips). */
  chipsScroll: { flexGrow: 0, flexShrink: 0 },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
    alignSelf: 'center',
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipTextActive: { color: colors.white },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  muscle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: 40, color: colors.textSecondary },
});
