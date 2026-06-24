import React, { useEffect, useRef, useState } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, RoutinesScreenProps } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { getRoutine, saveUserRoutine } from '../services/routinesRepo';
import type { RoutineDoc, RoutineExerciseTemplate } from '../types/domain';
import { friendlyAppError } from '../utils/appError';
import { consumePickedExercises } from '../services/exercisePickerBridge';
import { getCatalogExerciseByName } from '../data/exercisesCatalog';
import { useLocale } from '../context/LocaleContext';
import { getExerciseDisplayName } from '../i18n/catalogDisplay';

type Props = RoutinesScreenProps<'RoutineBuilder'>;

export default function RoutineBuilderScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { language } = useLocale();
  const { user } = useAuth();
  const pickerSessionIdRef = useRef(`rb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
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

  const exerciseLabel = (name: string) => {
    const hit = getCatalogExerciseByName(name);
    return hit ? getExerciseDisplayName(hit.id, hit.name, language) : name;
  };

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
  const appendPicked = (name: string) => {
    const n = name.trim();
    if (!n) return;
    const ts = Math.max(1, parseInt(sets, 10) || 3);
    const rmin = Math.max(1, parseInt(repMin, 10) || 8);
    const rmax = Math.max(rmin, parseInt(repMax, 10) || 12);
    setExercises((prev) => [...prev, { name: n, targetSets: ts, targetRepMin: rmin, targetRepMax: rmax }]);
  };

  useFocusEffect(
    React.useCallback(() => {
      const picked = consumePickedExercises(pickerSessionIdRef.current);
      if (!picked.length) return;
      picked.forEach((n) => appendPicked(n));
      setExName('');
    }, [sets, repMin, repMax]),
  );

  useEffect(() => {
    if (!pickedName?.trim()) return;
    appendPicked(pickedName);
    setExName('');
    navigation.setParams({ pickedExerciseName: undefined });
  }, [pickedName, navigation, sets, repMin, repMax]);

  const openExercisePicker = () => {
    const root = navigation.getParent()?.getParent() as NativeStackNavigationProp<RootStackParamList> | undefined;
    root?.navigate('ExerciseLibrary', {
      mode: 'pick',
      returnRoutineId: editId,
      pickerSessionId: pickerSessionIdRef.current,
    });
  };

  const addExercise = () => {
    const name = exName.trim();
    if (!name) {
      Alert.alert(
        t('routineBuilder.alerts.exerciseTitle'),
        t('routineBuilder.alerts.exerciseNameRequired'),
      );
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
    const routineTitle = title.trim();
    if (!routineTitle) {
      Alert.alert(
        t('routineBuilder.alerts.routineTitle'),
        t('routineBuilder.alerts.titleRequired'),
      );
      return;
    }
    if (exercises.length === 0) {
      Alert.alert(
        t('routineBuilder.alerts.routineTitle'),
        t('routineBuilder.alerts.exerciseRequired'),
      );
      return;
    }
    setSaving(true);
    try {
      const minutes = Math.max(15, exercises.length * 10);
      await saveUserRoutine(user.uid, editId, {
        title: routineTitle,
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
      Alert.alert(
        t('routineBuilder.alerts.saveTitle'),
        friendlyAppError(e, 'routineBuilder.alerts.saveError'),
      );
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
        <Text style={styles.topTitle}>
          {editId ? t('routineBuilder.editTitle') : t('routineBuilder.newTitle')}
        </Text>
        <TouchableOpacity onPress={onSave} disabled={saving}>
          <Text style={styles.saveTop}>{saving ? t('routineBuilder.saving') : t('common.save')}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>{t('routineBuilder.titleLabel')}</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder={t('routineBuilder.titlePlaceholder')}
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.label}>{t('routineBuilder.musclesLabel')}</Text>
        <TextInput
          style={styles.input}
          value={muscles}
          onChangeText={setMuscles}
          placeholder={t('routineBuilder.musclesPlaceholder')}
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.section}>{t('routineBuilder.addExercise')}</Text>
        <TouchableOpacity style={styles.libBtn} onPress={openExercisePicker} activeOpacity={0.9}>
          <Ionicons name="library-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.libBtnText}>{t('routineBuilder.pickFromLibrary')}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={exName}
          onChangeText={setExName}
          placeholder={t('routineBuilder.exercisePlaceholder')}
          placeholderTextColor={colors.textMuted}
        />
        <View style={styles.row3}>
          <Field label={t('routineBuilder.sets')} value={sets} onChangeText={setSets} />
          <Field label={t('routineBuilder.repMin')} value={repMin} onChangeText={setRepMin} />
          <Field label={t('routineBuilder.repMax')} value={repMax} onChangeText={setRepMax} />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={addExercise} activeOpacity={0.9}>
          <Ionicons name="add" size={20} color={colors.white} style={{ marginRight: 6 }} />
          <Text style={styles.addBtnText}>{t('routineBuilder.addToRoutine')}</Text>
        </TouchableOpacity>

        <Text style={styles.section}>
          {t('routineBuilder.routineExercises', { count: exercises.length })}
        </Text>
        {exercises.map((ex, idx) => (
          <View key={`${ex.name}-${idx}`} style={styles.exCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.exTitle}>{exerciseLabel(ex.name)}</Text>
              <Text style={styles.exSub}>
                {t('routineBuilder.exerciseSetsReps', {
                  sets: ex.targetSets,
                  min: ex.targetRepMin,
                  max: ex.targetRepMax,
                })}
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
