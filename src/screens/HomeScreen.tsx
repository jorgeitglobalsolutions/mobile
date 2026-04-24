import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '../navigation/types';
import {
  defaultGoalsFromProfile,
  subscribeHabitDay,
  incrementProtein,
  incrementWater,
  setMood,
} from '../services/habitsRepo';
import type { HabitDayDoc, MoodValue } from '../types/domain';
import { localDateKey } from '../utils/dateKey';
import { colors, radius, spacing } from '../theme';

const MOODS: MoodValue[] = ['great', 'good', 'low', 'tired', 'stressed'];

function moodLabel(m: MoodValue | null | undefined): string {
  if (!m) return 'Tap to set';
  const map: Record<MoodValue, string> = {
    great: 'Great',
    good: 'Good',
    low: 'Low',
    tired: 'Tired',
    stressed: 'Stressed',
  };
  return map[m];
}

function nextMood(cur: MoodValue | null | undefined): MoodValue {
  if (!cur) return 'great';
  const i = MOODS.indexOf(cur);
  return MOODS[(i + 1) % MOODS.length];
}

function moodIcon(m: MoodValue | null | undefined): keyof typeof Ionicons.glyphMap {
  if (!m) return 'happy-outline';
  const icons: Record<MoodValue, keyof typeof Ionicons.glyphMap> = {
    great: 'happy',
    good: 'happy-outline',
    low: 'sad-outline',
    tired: 'moon-outline',
    stressed: 'flash-outline',
  };
  return icons[m];
}

function moodIconColor(m: MoodValue | null | undefined): string {
  if (!m) return colors.textMuted;
  const map: Record<MoodValue, string> = {
    great: colors.yellow,
    good: colors.green,
    low: colors.textSecondary,
    tired: colors.primaryMuted,
    stressed: colors.orange,
  };
  return map[m];
}

function moodValueColor(m: MoodValue | null | undefined): string {
  if (!m) return colors.textSecondary;
  return moodIconColor(m);
}

export default function HomeScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { user, userDoc } = useAuth();
  const [habitDay, setHabitDay] = useState<HabitDayDoc | null>(null);
  const [busy, setBusy] = useState(false);

  const first =
    user?.displayName ||
    (user?.email && user.email.includes('@') ? user.email.split('@')[0] : null) ||
    'Alex';

  const habitDefaults = useMemo(() => {
    const d = defaultGoalsFromProfile(userDoc?.profile?.weightKg, userDoc?.profile?.goal);
    return { proteinGoalG: d.proteinG, waterGoalMl: d.waterMl };
  }, [userDoc?.profile?.goal, userDoc?.profile?.weightKg]);

  const metric = userDoc?.settings?.unitsMetric !== false;

  useEffect(() => {
    if (!user?.uid) {
      setHabitDay(null);
      return;
    }
    const date = localDateKey();
    const unsub = subscribeHabitDay(user.uid, date, habitDefaults, setHabitDay);
    return () => unsub();
  }, [user?.uid, habitDefaults.proteinGoalG, habitDefaults.waterGoalMl]);

  const proteinGoal = habitDay?.proteinGoalG ?? habitDefaults.proteinGoalG;
  const waterGoalMl = habitDay?.waterGoalMl ?? habitDefaults.waterGoalMl;
  const proteinCur = habitDay?.proteinG ?? 0;
  const waterCur = habitDay?.waterMl ?? 0;

  const proteinDone = proteinCur >= proteinGoal;
  const waterDone = waterCur >= waterGoalMl;
  const moodDone = !!habitDay?.mood;
  const workoutDone = !!habitDay?.workoutCompleted;
  const completedCount = [workoutDone, proteinDone, waterDone, moodDone].filter(Boolean).length;

  const proteinPct = proteinGoal > 0 ? Math.min(1, proteinCur / proteinGoal) : 0;
  const waterPct = waterGoalMl > 0 ? Math.min(1, waterCur / waterGoalMl) : 0;

  const proteinDisplay = metric
    ? `${Math.round(proteinCur)} / ${Math.round(proteinGoal)} g`
    : `${(proteinCur * 0.035274).toFixed(1)} / ${(proteinGoal * 0.035274).toFixed(1)} oz`;

  const waterDisplay = metric
    ? `${Math.round(waterCur)} / ${Math.round(waterGoalMl)} ml`
    : `${(waterCur * 0.033814).toFixed(1)} / ${(waterGoalMl * 0.033814).toFixed(1)} fl oz`;

  const waterCupsGoal = Math.max(1, Math.round(waterGoalMl / 250));
  const waterCupsLabel = `${Math.floor(waterCur / 250)} / ${waterCupsGoal} cups`;

  const onQuick = async (fn: () => Promise<void>) => {
    if (!user?.uid) return;
    setBusy(true);
    try {
      await fn();
    } catch (e: unknown) {
      Alert.alert('Home', e instanceof Error ? e.message : 'Could not update');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{`Good morning, ${first}! 👋`}</Text>
            <Text style={styles.subGreeting}>{"Let's keep the streak going."}</Text>
          </View>
          <View style={styles.streakBox}>
            <Ionicons name="calendar-outline" size={22} color={colors.primary} />
            <Text style={styles.streakNum}>{localDateKey().slice(5)}</Text>
            <Text style={styles.streakLabel}>today</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{"Today's Status"}</Text>
            <Text style={styles.cardMeta}>
              {completedCount} / 4 Completed
            </Text>
          </View>
          <View style={styles.statusBarBg}>
            <View style={[styles.statusBarFill, { width: `${Math.min(100, (completedCount / 4) * 100)}%` }]} />
          </View>
          <View style={styles.tileRow}>
            <StatusTile
              icon="barbell"
              iconColor={colors.primary}
              label="Workout"
              value={workoutDone ? 'Completed' : 'Pending'}
              valueColor={workoutDone ? colors.primary : colors.textSecondary}
              done={workoutDone}
            />
            <StatusTile
              icon="nutrition"
              iconColor={colors.green}
              label="Protein"
              value={proteinDisplay}
              valueColor={proteinDone ? colors.green : colors.textSecondary}
              done={proteinDone}
            />
            <StatusTile
              icon="water"
              iconColor={colors.primary}
              label="Water"
              value={metric ? `${Math.round(waterCur)} ml` : waterCupsLabel}
              valueColor={waterDone ? colors.primary : colors.textSecondary}
              done={waterDone}
            />
            <StatusTile
              icon={moodIcon(habitDay?.mood)}
              iconColor={moodIconColor(habitDay?.mood)}
              label="Mood"
              value={moodLabel(habitDay?.mood)}
              valueColor={moodValueColor(habitDay?.mood)}
              done={moodDone}
              disabled={busy || !user?.uid}
              onPress={() =>
                onQuick(async () => {
                  await setMood(user!.uid, localDateKey(), nextMood(habitDay?.mood), habitDefaults);
                })
              }
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          <QuickAction
            icon="barbell"
            label="Log Workout"
            color={colors.primary}
            disabled={busy}
            onPress={() => navigation.navigate('Routines')}
          />
          <QuickAction
            icon="nutrition"
            label="+10g protein"
            color={colors.green}
            disabled={busy || !user?.uid}
            onPress={() =>
              onQuick(async () => {
                await incrementProtein(user!.uid, localDateKey(), 10, habitDefaults);
              })
            }
          />
          <QuickAction
            icon="water"
            label={metric ? '+250 ml' : '+8 fl oz'}
            color={colors.primary}
            disabled={busy || !user?.uid}
            onPress={() =>
              onQuick(async () => {
                const delta = metric ? 250 : 237;
                await incrementWater(user!.uid, localDateKey(), delta, habitDefaults);
              })
            }
          />
        </View>

        <Text style={styles.sectionTitle}>Daily Progress</Text>
        <View style={styles.progressCard}>
          <ProgressRow icon="nutrition" label="Protein" value={proteinDisplay} pct={proteinPct} />
          <View style={{ height: spacing.lg }} />
          <ProgressRow icon="water" label="Water" value={waterDisplay} pct={waterPct} />
        </View>

        {busy ? (
          <View style={{ alignItems: 'center', marginVertical: spacing.md }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.banner}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('History')}
          accessibilityRole="button"
          accessibilityLabel="Open history and stats"
        >
          <View style={styles.bannerIcon}>
            <Ionicons name="trophy" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Great job staying consistent!</Text>
            <Text style={styles.bannerSub}>See your workouts and weekly stats in History.</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusTile({
  icon,
  iconColor,
  label,
  value,
  valueColor,
  done,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string;
  valueColor: string;
  done: boolean;
  onPress?: () => void;
  disabled?: boolean;
}) {
  const inner = (
    <>
      <View style={[styles.badge, done ? styles.badgeOn : styles.badgeOff]}>
        {done ? (
          <Ionicons name="checkmark" size={12} color={colors.white} />
        ) : (
          <View style={styles.badgeEmpty} />
        )}
      </View>
      <Ionicons name={icon} size={22} color={iconColor} style={{ marginBottom: 4 }} />
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={[styles.tileValue, { color: valueColor }]} numberOfLines={2}>
        {value}
      </Text>
    </>
  );
  if (onPress) {
    return (
      <TouchableOpacity style={styles.tile} activeOpacity={0.85} onPress={onPress} disabled={disabled}>
        {inner}
      </TouchableOpacity>
    );
  }
  return <View style={styles.tile}>{inner}</View>;
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress?: () => void;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.quickCard} activeOpacity={0.9} onPress={onPress} disabled={disabled}>
      <View style={[styles.quickCircle, { backgroundColor: color }]}>
        <Ionicons name={icon} size={22} color={colors.white} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ProgressRow({
  icon,
  label,
  value,
  pct,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  pct: number;
}) {
  return (
    <View>
      <View style={styles.progressRowTop}>
        <Ionicons name={icon} size={18} color={colors.primary} />
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{value}</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  headerRow: { flexDirection: 'row', marginBottom: spacing.lg },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.text },
  subGreeting: { marginTop: 4, fontSize: 14, color: colors.textSecondary },
  streakBox: { alignItems: 'center' },
  streakNum: { fontSize: 18, fontWeight: '700', color: colors.text },
  streakLabel: { fontSize: 11, color: colors.textSecondary },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  statusBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  statusBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  tileRow: { flexDirection: 'row', justifyContent: 'space-between' },
  tile: {
    width: '23%',
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeOn: { backgroundColor: colors.primary },
  badgeOff: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  badgeEmpty: { width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: colors.textMuted },
  tileLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  tileValue: { fontSize: 11, fontWeight: '700', textAlign: 'center', marginTop: 2 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
  quickCard: {
    width: '31%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  quickCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickLabel: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  progressRowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  progressLabel: { flex: 1, marginLeft: spacing.sm, fontSize: 15, fontWeight: '600', color: colors.text },
  progressValue: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  barBg: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paywallSoft,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  bannerTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  bannerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
