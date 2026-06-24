import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, RoutinesScreenProps } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { deleteRoutine, getRoutine } from '../services/routinesRepo';
import type { RoutineDoc } from '../types/domain';
import { getCatalogExerciseByName } from '../data/exercisesCatalog';
import { useLocale } from '../context/LocaleContext';
import { getRoutineDisplayTitle, getRoutineDisplayDescription } from '../i18n/catalogDisplay';
import { getExerciseDisplayName } from '../i18n/catalogDisplay';

type Props = RoutinesScreenProps<'RoutineDetail'>;

export default function RoutineDetailScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { language } = useLocale();
  const { user } = useAuth();
  const { routineId } = route.params;
  const [routine, setRoutine] = useState<RoutineDoc | null>(null);
  const [loading, setLoading] = useState(true);

  const exerciseLabel = (name: string) => {
    const hit = getCatalogExerciseByName(name);
    return hit ? getExerciseDisplayName(hit.id, hit.name, language) : name;
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.uid) {
        if (!cancelled) setLoading(false);
        return;
      }
      const r = await getRoutine(user.uid, routineId);
      if (!cancelled) {
        setRoutine(r);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid, routineId]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]} edges={['top']}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!routine) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>{t('routineDetail.title')}</Text>
          <View style={{ width: 26 }} />
        </View>
        <Text style={{ padding: spacing.xl, color: colors.textSecondary }}>{t('routineDetail.notFound')}</Text>
      </SafeAreaView>
    );
  }

  const title = getRoutineDisplayTitle(routineId, routine.title, language);
  const muscles = routine.muscles;
  const minutes = routine.minutes;
  const exerciseCount = routine.exerciseCount;
  const desc =
    getRoutineDisplayDescription(routineId, routine.description ?? '', language) ||
    t('routineDetail.defaultDescription', { muscles: muscles.toLowerCase() });

  const openExercise = (name: string) => {
    const hit = getCatalogExerciseByName(name);
    if (!hit) {
      Alert.alert(
        t('routineDetail.alerts.exerciseTitle'),
        t('routineDetail.alerts.exerciseUnavailable'),
      );
      return;
    }
    const root = navigation.getParent()?.getParent() as NativeStackNavigationProp<RootStackParamList> | undefined;
    root?.navigate('ExerciseDetail', { exerciseId: hit.id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle} numberOfLines={1}>
          {title}
        </Text>
        <TouchableOpacity hitSlop={12}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.metaRow}>
          <MetaPill icon="time-outline" label={t('routineDetail.minutes', { minutes })} />
          <MetaPill icon="list-outline" label={t('routineDetail.exerciseCount', { count: exerciseCount })} />
        </View>
        <Text style={styles.desc}>{desc}</Text>

        <TouchableOpacity
          style={styles.startBtn}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('WorkoutActive', { routineId, title })}
        >
          <Ionicons name="play" size={22} color={colors.white} style={{ marginRight: 8 }} />
          <Text style={styles.startText}>{t('routineDetail.startWorkout')}</Text>
        </TouchableOpacity>

        <Text style={styles.listHeader}>{t('routineDetail.exercisesHeader')}</Text>
        {routine.exercises.map((ex, i) => (
          <TouchableOpacity
            key={`${ex.name}-${i}`}
            style={styles.exRow}
            activeOpacity={0.85}
            onPress={() => openExercise(ex.name)}
          >
            <Text style={styles.exNum}>{i + 1}</Text>
            <View style={styles.exThumb}>
              <Ionicons name="fitness-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exName}>{exerciseLabel(ex.name)}</Text>
              <Text style={styles.exMeta}>
                {t('routineDetail.setsReps', {
                  sets: ex.targetSets,
                  min: ex.targetRepMin,
                  max: ex.targetRepMax,
                })}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {!routine.isPredefined && (
          <>
            <TouchableOpacity
              style={styles.editBtn}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('RoutineBuilder', { routineId })}
            >
              <Ionicons name="create-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              <Text style={styles.editText}>{t('routineDetail.editRoutine')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dangerBtn}
              activeOpacity={0.9}
              onPress={() => {
                Alert.alert(t('routineDetail.alerts.deleteTitle'), t('routineDetail.alerts.deleteMessage'), [
                  { text: t('common.cancel'), style: 'cancel' },
                  {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                      if (!user?.uid) return;
                      await deleteRoutine(user.uid, routineId);
                      navigation.goBack();
                    },
                  },
                ]);
              }}
            >
              <Text style={styles.dangerText}>{t('routineDetail.deleteRoutine')}</Text>
            </TouchableOpacity>
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function MetaPill({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.pill}>
      <Ionicons name={icon} size={16} color={colors.primary} style={{ marginRight: 6 }} />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pillText: { fontSize: 13, fontWeight: '600', color: colors.text },
  desc: {
    marginTop: spacing.lg,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  startBtn: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  listHeader: { marginTop: spacing.xxl, marginBottom: spacing.md, fontSize: 16, fontWeight: '700', color: colors.text },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  exNum: { width: 22, fontSize: 14, fontWeight: '700', color: colors.textMuted },
  exThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  exName: { fontSize: 16, fontWeight: '700', color: colors.text },
  exMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  editBtn: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  editText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  dangerBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: 12,
  },
  dangerText: { color: '#DC2626', fontWeight: '700' },
});
