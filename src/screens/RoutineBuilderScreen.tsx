import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, RoutinesScreenProps } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getRoutine, saveUserRoutine } from '../services/routinesRepo';
import type { RoutineDoc, RoutineExerciseTemplate } from '../types/domain';

type Props = RoutinesScreenProps<'RoutineBuilder'>;

export default function RoutineBuilderScreen({ navigation, route }: Props) {
  const { user } = useAuth();
  const editId = route.params?.routineId;
  const [title, setTitle] = useState('');
  const [muscles, setMuscles] = useState('');
  const [exName, setExName] = useState('');
  const [sets, setSets] = useState('3');
  const [repMin, setRepMin] = useState('8');
  const [repMax, setRepMax] = useState('12');
  const [exercises, setExercises] = useState<RoutineExerciseTemplate[]>([]);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!editId || !user?.uid) {
        setLoading(false);
        return;
      }
      const r = await getRoutine(user.uid, editId);
      if (cancelled) return;
      if (r) {
        setTitle(r.title);
        setMuscles(r.muscles);
        setExercises(r.exercises ?? []);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, user?.uid]);

  const pickedName = route.params?.pickedExerciseName;
  useEffect(() => {
    if (!pickedName?.trim()) return;
    setExName(pickedName.trim());
    navigation.setParams({ pickedExerciseName: undefined });
  }, [pickedName, navigation]);

  const openExercisePicker = () => {
    const root = navigation.getParent()?.getParent() as NativeStackNavigationProp<RootStackParamList> | undefined;
    root?.navigate('ExerciseLibrary', { mode: 'pick', returnRoutineId: editId });
  };

  const addExercise = () => {
    const name = exName.trim();
    if (!name) {
      Alert.alert('Exercise', 'Enter a name.');
      return;
    }
    const ts = Math.max(1, parseInt(sets, 10) || 3);
    const rmin = Math.max(1, parseInt(repMin, 10) || 8);
    const rmax = Math.max(rmin, parseInt(repMax, 10) || 12);
    setExercises((prev) => [...prev, { name, targetSets: ts, targetRepMin: rmin, targetRepMax: rmax }]);
    setExName('');
  };

  const removeAt = (idx: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== idx));
  };

  const onSave = async () => {
    if (!user?.uid) return;
    const t = title.trim();
    if (!t) {
      Alert.alert('Routine', 'Enter a title.');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('Routine', 'Add at least one exercise.');
      return;
    }
    setSaving(true);
    try {
      const minutes = Math.max(15, exercises.length * 10);
      await saveUserRoutine(user.uid, editId, {
        title: t,
        muscles: muscles.trim() || 'Custom',
        minutes,
        exerciseCount: exercises.length,
        category: 'Custom',
        isPredefined: false,
        exercises,
        description: '',
      });
      navigation.goBack();
    } catch (e: unknown) {
      Alert.alert('Save', e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>{editId ? 'Edit routine' : 'New routine'}</Text>
        <TouchableOpacity onPress={onSave} disabled={saving}>
          <Text style={styles.saveTop}>{saving ? '…' : 'Save'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Upper strength"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.label}>Target muscles</Text>
        <TextInput
          style={styles.input}
          value={muscles}
          onChangeText={setMuscles}
          placeholder="Chest, shoulders…"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.section}>Add exercise</Text>
        <TouchableOpacity style={styles.libBtn} onPress={openExercisePicker} activeOpacity={0.9}>
          <Ionicons name="library-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.libBtnText}>Pick from library</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={exName}
          onChangeText={setExName}
          placeholder="Exercise name"
          placeholderTextColor={colors.textMuted}
        />
        <View style={styles.row3}>
          <Field label="Sets" value={sets} onChangeText={setSets} />
          <Field label="Rep min" value={repMin} onChangeText={setRepMin} />
          <Field label="Rep max" value={repMax} onChangeText={setRepMax} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={addExercise} activeOpacity={0.9}>
          <Ionicons name="add" size={20} color={colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>Add to routine</Text>
        </TouchableOpacity>

        <Text style={styles.section}>Routine exercises ({exercises.length})</Text>
        {exercises.map((ex, idx) => (
          <View key={`${ex.name}-${idx}`} style={styles.exCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.exTitle}>{ex.name}</Text>
              <Text style={styles.exSub}>
                {ex.targetSets} sets • {ex.targetRepMin}-{ex.targetRepMax} reps
              </Text>
            </View>
            <TouchableOpacity onPress={() => removeAt(idx)} hitSlop={12}>
              <Ionicons name="trash-outline" size={20} color="#DC2626" />
            </TouchableOpacity>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
}) {
  return (
    <View style={{ flex: 1, marginRight: spacing.sm }}>
      <Text style={styles.miniLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  saveTop: { fontSize: 16, fontWeight: '800', color: colors.primary },
  scroll: { padding: spacing.xl, paddingBottom: 48 },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
  miniLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  section: { marginTop: spacing.lg, marginBottom: spacing.sm, fontSize: 16, fontWeight: '800', color: colors.text },
  libBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
  },
  libBtnText: { fontSize: 15, fontWeight: '800', color: colors.primary },
  row3: { flexDirection: 'row', marginBottom: spacing.md },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    marginBottom: spacing.xl,
  },
  addBtnText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  exCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  exTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  exSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
