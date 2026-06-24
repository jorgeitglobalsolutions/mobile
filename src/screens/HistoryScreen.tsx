import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { listRecentWorkouts } from '../services/workoutsRepo';
import type { WorkoutDoc } from '../types/domain';

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = x.getDate() - day + (day === 0 ? -6 : 1);
  x.setDate(diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function formatVol(kg: number, metric: boolean, unitKg: string, unitLb: string) {
  if (!metric) return `${Math.round(kg * 2.20462)} ${unitLb}`;
  return `${Math.round(kg)} ${unitKg}`;
}

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { localeTag } = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, userDoc } = useAuth();
  const [tab, setTab] = useState<'workouts' | 'stats' | 'progress'>('workouts');
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<{ id: string; data: WorkoutDoc }[]>([]);
  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);

  const metric = userDoc?.settings?.unitsMetric !== false;

  const weekDays = useMemo(() => {
    const s = startOfWeek(weekAnchor);
    return Array.from({ length: 7 }).map((_, i) => addDays(s, i));
  }, [weekAnchor]);

  const load = useCallback(async () => {
    if (!user?.uid) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await listRecentWorkouts(user.uid, 80);
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  const onRefresh = useCallback(async () => {
    if (!user?.uid) return;
    setRefreshing(true);
    try {
      const list = await listRecentWorkouts(user.uid, 80);
      setItems(list);
    } finally {
      setRefreshing(false);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const workoutDayKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const w of items) {
      keys.add(dayKey(w.data.endedAt.toDate()));
    }
    return keys;
  }, [items]);

  const selectedWorkouts = useMemo(() => {
    return items.filter((w) => sameDay(w.data.endedAt.toDate(), selected));
  }, [items, selected]);

  const otherWorkouts = useMemo(
    () => items.filter((w) => !sameDay(w.data.endedAt.toDate(), selected)),
    [items, selected],
  );

  const statsSummary = useMemo(() => {
    const sessions = items.length;
    const volumeKg = items.reduce((s, w) => s + (w.data.totalVolumeKg ?? 0), 0);
    const minutes = Math.round(items.reduce((s, w) => s + w.data.durationSeconds / 60, 0));
    const sets = items.reduce((s, w) => s + (w.data.totalSets ?? 0), 0);
    return { sessions, volumeKg, minutes, sets };
  }, [items]);

  const weekStats = useMemo(() => {
    const start = startOfWeek(weekAnchor);
    const end = addDays(start, 7);
    const inWeek = items.filter((w) => {
      const t = w.data.endedAt.toDate().getTime();
      return t >= start.getTime() && t < end.getTime();
    });
    const sessions = inWeek.length;
    const volumeKg = inWeek.reduce((s, w) => s + (w.data.totalVolumeKg ?? 0), 0);
    const minutes = Math.round(inWeek.reduce((s, w) => s + w.data.durationSeconds / 60, 0));
    return { sessions, volumeKg, minutes };
  }, [items, weekAnchor]);

  const weeklyBars = useMemo(() => {
    const s = startOfWeek(weekAnchor);
    const days: { label: string; vol: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(s, i);
      const vol = items
        .filter((w) => sameDay(w.data.endedAt.toDate(), d))
        .reduce((acc, w) => acc + (w.data.totalVolumeKg ?? 0), 0);
      days.push({
        label: d.toLocaleDateString(localeTag, { weekday: 'short' }),
        vol,
      });
    }
    const maxVol = Math.max(1, ...days.map((x) => x.vol));
    return { days, maxVol };
  }, [items, weekAnchor, localeTag]);

  const goWeek = (deltaDays: number) => {
    const n = new Date(weekAnchor);
    n.setDate(n.getDate() + deltaDays);
    setWeekAnchor(n);
  };

  const goToday = () => {
    const t = new Date();
    setWeekAnchor(t);
    setSelected(t);
  };

  const openDetail = (id: string) => {
    navigation.navigate('WorkoutSessionDetail', { workoutId: id });
  };

  const primary = (w: WorkoutDoc) => {
    const mins = Math.max(1, Math.round(w.durationSeconds / 60));
    return t('history.exercisesMin', { count: w.exercises.length, minutes: mins });
  };

  const unitKg = t('common.units.kg');
  const unitLb = t('common.units.lb');
  const formatVolume = (kg: number) => formatVol(kg, metric, unitKg, unitLb);

  const weekOfDate = startOfWeek(weekAnchor).toLocaleDateString(localeTag, {
    month: 'short',
    day: 'numeric',
  });

  const tabLabels: Record<'workouts' | 'stats' | 'progress', string> = {
    workouts: t('history.tabWorkouts'),
    stats: t('history.tabStats'),
    progress: t('history.tabProgress'),
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('history.title')}</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={goToday} accessibilityLabel={t('history.accessibilityJumpToday')}>
            <Ionicons name="today-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          {(['workouts', 'stats', 'progress'] as const).map((tabKey) => (
            <TouchableOpacity key={tabKey} style={styles.tabItem} onPress={() => setTab(tabKey)}>
              <Text style={[styles.tabText, tab === tabKey && styles.tabTextActive]}>
                {tabLabels[tabKey]}
              </Text>
              {tab === tabKey ? <View style={styles.tabLine} /> : <View style={{ height: 2 }} />}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.weekNav}>
          <TouchableOpacity style={styles.weekNavBtn} onPress={() => goWeek(-7)} accessibilityLabel={t('history.accessibilityPrevWeek')}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.weekNavLabel} numberOfLines={1}>
            {t('history.weekOf', { date: weekOfDate })}
          </Text>
          <TouchableOpacity style={styles.weekNavBtn} onPress={() => goWeek(7)} accessibilityLabel={t('history.accessibilityNextWeek')}>
            <Ionicons name="chevron-forward" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calRow}>
          {weekDays.map((d) => {
            const on = sameDay(d, selected);
            const label = d.toLocaleDateString(localeTag, { weekday: 'short' });
            const num = d.getDate();
            const hasWorkout = workoutDayKeys.has(dayKey(d));
            const a11yLabel = hasWorkout
              ? t('history.accessibilityDayHasWorkout', { weekday: label, day: num })
              : `${label} ${num}`;
            return (
              <TouchableOpacity
                key={d.toISOString()}
                onPress={() => setSelected(d)}
                style={[styles.calCell, on && styles.calCellOn]}
                accessibilityLabel={a11yLabel}
              >
                <Text style={[styles.calD, on && styles.calDOn]}>{label}</Text>
                <Text style={[styles.calN, on && styles.calNOn]}>{num}</Text>
                <View style={[styles.calDot, hasWorkout && styles.calDotOn, on && styles.calDotOnSelected]} />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {tab === 'workouts' ? (
          loading ? (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>{t('history.selectedDay')}</Text>
                <Text style={styles.sectionMeta}>{t('history.workoutCount', { count: selectedWorkouts.length })}</Text>
              </View>

              {selectedWorkouts.length === 0 ? (
                <Text style={styles.empty}>{t('history.noWorkoutsDay')}</Text>
              ) : (
                selectedWorkouts.map((w) => (
                  <TouchableOpacity
                    key={w.id}
                    style={styles.bigCard}
                    activeOpacity={0.9}
                    onPress={() => openDetail(w.id)}
                  >
                    <View style={styles.cardTop}>
                      <View style={styles.blueIcon}>
                        <Ionicons name="barbell" size={22} color={colors.white} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{w.data.title}</Text>
                        <Text style={styles.cardSub}>{primary(w.data)}</Text>
                        <Text style={styles.cardTime}>
                          {t('history.completedAt', {
                            time: w.data.endedAt.toDate().toLocaleTimeString(localeTag, {
                              hour: '2-digit',
                              minute: '2-digit',
                            }),
                          })}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statsRow}>
                      <Stat
                        icon="time-outline"
                        value={`${Math.floor(w.data.durationSeconds / 60)}:${String(w.data.durationSeconds % 60).padStart(2, '0')}`}
                        label={t('history.duration')}
                      />
                      <Stat icon="scale-outline" value={formatVolume(w.data.totalVolumeKg)} label={t('history.volume')} />
                      <Stat icon="trophy-outline" value={String(w.data.totalSets)} label={t('history.sets')} />
                      <Stat
                        icon="ribbon-outline"
                        value={formatVolume(w.data.bestSetVolumeKg)}
                        label={t('history.bestSet')}
                      />
                    </View>
                  </TouchableOpacity>
                ))
              )}

              <Text style={[styles.sectionTitle, { marginHorizontal: spacing.xl, marginTop: spacing.lg }]}>
                {t('history.otherDays')}
              </Text>
              <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
                {otherWorkouts.length === 0 ? (
                  <Text style={styles.empty}>{t('history.noOtherSessions')}</Text>
                ) : (
                  otherWorkouts.slice(0, 20).map((w) => (
                    <TouchableOpacity
                      key={w.id}
                      style={[styles.pastRow, { marginBottom: spacing.sm }]}
                      activeOpacity={0.85}
                      onPress={() => openDetail(w.id)}
                    >
                      <View style={[styles.dot, { backgroundColor: colors.primary }]}>
                        <Ionicons name="barbell" size={16} color={colors.white} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pastTitle}>{w.data.title}</Text>
                        <Text style={styles.pastSub}>{primary(w.data)}</Text>
                        <Text style={styles.pastWhen}>{w.data.endedAt.toDate().toLocaleString(localeTag)}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </>
          )
        ) : null}

        {tab === 'stats' ? (
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
            ) : items.length === 0 ? (
              <Text style={styles.empty}>{t('history.logWorkoutsStats')}</Text>
            ) : (
              <>
                <Text style={styles.statsHead}>{t('history.allSessions', { count: items.length })}</Text>
                <View style={styles.statGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statsSummary.sessions}</Text>
                    <Text style={styles.statBoxLbl}>{t('history.tabWorkouts')}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>
                      {metric ? statsSummary.volumeKg.toLocaleString(localeTag) : Math.round(statsSummary.volumeKg * 2.20462).toLocaleString(localeTag)}
                    </Text>
                    <Text style={styles.statBoxLbl}>{metric ? t('history.volumeKg') : t('history.volumeLb')}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statsSummary.minutes}</Text>
                    <Text style={styles.statBoxLbl}>{t('common.units.minutes')}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statBoxVal}>{statsSummary.sets}</Text>
                    <Text style={styles.statBoxLbl}>{t('history.setsLogged')}</Text>
                  </View>
                </View>

                <Text style={[styles.statsHead, { marginTop: spacing.lg }]}>{t('history.thisCalendarWeek')}</Text>
                <View style={styles.weekSummaryCard}>
                  <View style={styles.weekSummaryRow}>
                    <Text style={styles.weekSummaryLbl}>{t('history.tabWorkouts')}</Text>
                    <Text style={styles.weekSummaryVal}>{weekStats.sessions}</Text>
                  </View>
                  <View style={styles.weekSummaryRow}>
                    <Text style={styles.weekSummaryLbl}>{t('history.volume')}</Text>
                    <Text style={styles.weekSummaryVal}>{formatVolume(weekStats.volumeKg)}</Text>
                  </View>
                  <View style={[styles.weekSummaryRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.weekSummaryLbl}>{t('history.activeMinutes')}</Text>
                    <Text style={styles.weekSummaryVal}>{weekStats.minutes}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        ) : null}

        {tab === 'progress' ? (
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 24 }} />
            ) : (
              <>
                <Text style={styles.statsHead}>{t('history.volumeByDay')}</Text>
                <View style={styles.barChart}>
                  {weeklyBars.days.map((d, i) => (
                    <View key={`${d.label}-${i}`} style={styles.barCol}>
                      <View style={styles.barTrack}>
                        <View
                          style={[
                            styles.barFillVert,
                            {
                              height: Math.max(d.vol > 0 ? 6 : 2, Math.round((d.vol / weeklyBars.maxVol) * 96)),
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLbl}>{d.label}</Text>
                      <Text style={styles.barVol}>{d.vol > 0 ? formatVolume(d.vol) : '—'}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.progressHint}>{t('history.progressHint')}</Text>
              </>
            )}
          </View>
        ) : null}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Ionicons name={icon} size={18} color={colors.primary} />
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingBottom: 24 },
  loader: { paddingVertical: 40, alignItems: 'center' },
  empty: { paddingHorizontal: spacing.xl, color: colors.textSecondary, marginBottom: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  tabItem: { flex: 1, alignItems: 'center' },
  tabText: { fontSize: 15, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.sm },
  tabTextActive: { color: colors.primary },
  tabLine: { height: 3, width: '50%', backgroundColor: colors.primary, borderRadius: 2 },
  calRow: { paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, gap: spacing.sm },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  weekNavBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekNavLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
  },
  calCell: {
    width: 52,
    minHeight: 72,
    paddingBottom: 6,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  calDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    backgroundColor: 'transparent',
  },
  calDotOn: { backgroundColor: colors.green },
  calDotOnSelected: { backgroundColor: colors.white },
  calCellOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  calD: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  calDOn: { color: colors.white },
  calN: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 4 },
  calNOn: { color: colors.white },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  sectionMeta: { fontSize: 14, fontWeight: '700', color: colors.primary },
  bigCard: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  blueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardTime: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  statsRow: { flexDirection: 'row' },
  statVal: { fontSize: 13, fontWeight: '800', color: colors.text, marginTop: 4 },
  statLabel: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  pastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  pastTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  pastSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  pastWhen: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  placeholder: { padding: spacing.xxl, alignItems: 'center', marginTop: 40 },
  phTitle: { marginTop: spacing.lg, fontSize: 18, fontWeight: '700', color: colors.text },
  phSub: { marginTop: spacing.sm, fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  statsHead: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  statBox: {
    width: '47%',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statBoxVal: { fontSize: 22, fontWeight: '800', color: colors.primary },
  statBoxLbl: { fontSize: 13, color: colors.textSecondary, marginTop: 4, fontWeight: '600' },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.md },
  barCol: { flex: 1, alignItems: 'center', maxWidth: 48 },
  barTrack: {
    width: 28,
    height: 100,
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFillVert: { width: '100%', backgroundColor: colors.primary, borderRadius: radius.sm },
  barLbl: { fontSize: 10, color: colors.textMuted, marginTop: 6, fontWeight: '600' },
  barVol: { fontSize: 11, color: colors.textSecondary, marginTop: 2, fontWeight: '700' },
  progressHint: { marginTop: spacing.lg, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  weekSummaryCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  weekSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  weekSummaryLbl: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  weekSummaryVal: { fontSize: 16, fontWeight: '800', color: colors.text },
});
