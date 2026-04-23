import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { RoutinesScreenProps } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { subscribeRoutines } from '../services/routinesRepo';
import type { RoutineDoc } from '../types/domain';

const FILTERS = ['All', 'Push', 'Pull', 'Legs', 'Full Body', 'Upper'] as const;

type Row = { id: string; data: RoutineDoc };

type Props = RoutinesScreenProps<'RoutinesHome'>;

function formatUpdated(t: { toDate?: () => Date } | undefined) {
  try {
    if (t && typeof (t as { toDate?: () => Date }).toDate === 'function') {
      return (t as { toDate: () => Date }).toDate().toLocaleDateString();
    }
  } catch {
    // ignore
  }
  return '—';
}

export default function RoutinesScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [tab, setTab] = useState<'pre' | 'my'>('pre');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) {
        setRows([]);
        setLoading(false);
        return undefined;
      }
      setLoading(true);
      const unsub = subscribeRoutines(user.uid, (list) => {
        setRows(list);
        setLoading(false);
      });
      return unsub;
    }, [user?.uid]),
  );

  const predefined = useMemo(() => {
    return rows.filter((r) => {
      if (!r.data.isPredefined) return false;
      if (filter === 'All') return true;
      return r.data.category?.toLowerCase() === filter.toLowerCase();
    });
  }, [rows, filter]);

  const myRoutines = useMemo(() => rows.filter((r) => !r.data.isPredefined), [rows]);

  const openRoutine = (id: string) => {
    navigation.navigate('RoutineDetail', { routineId: id });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Routines</Text>
        {tab === 'my' ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('RoutineBuilder', {})}
          >
            <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 28 }} />
        )}
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity onPress={() => setTab('pre')} style={styles.tabBtn}>
          <Text style={[styles.tabText, tab === 'pre' && styles.tabTextActive]}>Predefined</Text>
          {tab === 'pre' ? <View style={styles.tabUnderline} /> : <View style={{ height: 2 }} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('my')} style={styles.tabBtn}>
          <Text style={[styles.tabText, tab === 'my' && styles.tabTextActive]}>My Routines</Text>
          {tab === 'my' ? <View style={styles.tabUnderline} /> : <View style={{ height: 2 }} />}
        </TouchableOpacity>
      </View>

      {tab === 'pre' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.chip, filter === f && styles.chipActive]}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : tab === 'pre' ? (
        <FlatList
          data={predefined}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No routines yet. Check your connection and Firestore rules.</Text>
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.preCard}
              activeOpacity={0.9}
              onPress={() => openRoutine(item.id)}
            >
              <View style={styles.thumb}>
                <Ionicons name="barbell-outline" size={28} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.preTitle}>{item.data.title}</Text>
                <Text style={styles.preSub}>{item.data.muscles}</Text>
                <Text style={styles.preMeta}>
                  {item.data.exerciseCount} exercises • ~{item.data.minutes} min
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={myRoutines}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No custom routines yet. Tap + to create one.</Text>
          }
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.myCard}
              activeOpacity={0.9}
              onPress={() => openRoutine(item.id)}
            >
              <View style={[styles.myIcon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name="star" size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.preTitle}>{item.data.title}</Text>
                <Text style={styles.preMeta}>
                  {item.data.exerciseCount} exercises • ~{item.data.minutes} min
                </Text>
                <Text style={styles.updated}>Updated {formatUpdated(item.data.updatedAt)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 24, paddingHorizontal: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
  },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  tabs: { flexDirection: 'row', paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  tabBtn: { flex: 1, alignItems: 'center' },
  tabText: { fontSize: 16, color: colors.textSecondary, fontWeight: '600', marginBottom: spacing.sm },
  tabTextActive: { color: colors.text },
  tabUnderline: { height: 3, width: '60%', backgroundColor: colors.primary, borderRadius: 2 },
  chipsRow: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.text },
  chipTextActive: { color: colors.white },
  preCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  preTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  preSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  preMeta: { fontSize: 12, color: colors.textMuted, marginTop: 4, fontWeight: '500' },
  myCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  myIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  updated: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
