import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { RoutinesScreenProps } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import type { RoutineDoc } from '../types/domain';
import { useAuth } from '../context/AuthContext';
import { subscribePredefinedRoutines, subscribeRoutines } from '../services/routinesRepo';
import { useLocale } from '../context/LocaleContext';
import { getRoutineDisplayTitle, getMuscleDisplayName } from '../i18n/catalogDisplay';

type Row = { id: string; data: RoutineDoc };

type Props = RoutinesScreenProps<'RoutinesHome'>;

function formatUpdated(t: { toDate?: () => Date } | undefined, localeTag: string) {
  try {
    if (t && typeof (t as { toDate?: () => Date }).toDate === 'function') {
      return (t as { toDate: () => Date }).toDate().toLocaleDateString(localeTag);
    }
  } catch {
    // ignore
  }
  return '—';
}

export default function RoutinesScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { localeTag, language } = useLocale();
  const { user } = useAuth();
  const [tab, setTab] = useState<'pre' | 'my'>('pre');
  const [myRows, setMyRows] = useState<Row[]>([]);
  const [preRows, setPreRows] = useState<Row[]>([]);

  useFocusEffect(
    useCallback(() => {
      const unsubPre = subscribePredefinedRoutines((list) => {
        setPreRows(list.filter((r) => r.data.isPredefined));
      });
      if (!user?.uid) {
        setMyRows([]);
        return () => unsubPre();
      }
      const unsub = subscribeRoutines(user.uid, (list) => {
        setMyRows(list.filter((r) => !r.data.isPredefined));
      });
      return () => {
        unsubPre();
        unsub();
      };
    }, [user?.uid]),
  );

  const predefined = useMemo(() => preRows, [preRows]);

  const myRoutines = useMemo(() => myRows, [myRows]);

  const openRoutine = (id: string) => {
    navigation.navigate('RoutineDetail', { routineId: id });
  };

  const renderEmpty = (isMyTab: boolean) => (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name={isMyTab ? 'create-outline' : 'barbell-outline'}
          size={30}
          color={colors.primary}
        />
      </View>
      <Text style={styles.emptyTitle}>
        {isMyTab ? t('routines.emptyMyTitle') : t('routines.emptyPredefinedTitle')}
      </Text>
      <Text style={styles.emptyDesc}>
        {isMyTab ? t('routines.emptyMyDesc') : t('routines.emptyPredefinedDesc')}
      </Text>
      <TouchableOpacity
        style={styles.emptyBtn}
        activeOpacity={0.9}
        onPress={() => (isMyTab ? navigation.navigate('RoutineBuilder', {}) : undefined)}
      >
        <Text style={styles.emptyBtnText}>
          {isMyTab ? t('routines.createRoutine') : t('routines.refresh')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('routines.title')}</Text>
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
          <Text style={[styles.tabText, tab === 'pre' && styles.tabTextActive]}>
            {t('routines.tabPredefined')}
          </Text>
          {tab === 'pre' ? <View style={styles.tabUnderline} /> : <View style={{ height: 2 }} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('my')} style={styles.tabBtn}>
          <Text style={[styles.tabText, tab === 'my' && styles.tabTextActive]}>
            {t('routines.tabMy')}
          </Text>
          {tab === 'my' ? <View style={styles.tabUnderline} /> : <View style={{ height: 2 }} />}
        </TouchableOpacity>
      </View>

      {tab === 'pre' ? (
        <FlatList
          data={predefined}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100, flexGrow: 1 }}
          ListEmptyComponent={renderEmpty(false)}
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
                <Text style={styles.preTitle}>
                  {getRoutineDisplayTitle(item.id, item.data.title, language)}
                </Text>
                <Text style={styles.preSub}>{getMuscleDisplayName(item.data.muscles, language)}</Text>
                <Text style={styles.preMeta}>
                  {t('routines.exerciseMeta', {
                    count: item.data.exerciseCount,
                    minutes: item.data.minutes,
                  })}
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
          contentContainerStyle={{ padding: spacing.xl, paddingBottom: 100, flexGrow: 1 }}
          ListEmptyComponent={renderEmpty(true)}
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
                  {t('routines.exerciseMeta', {
                    count: item.data.exerciseCount,
                    minutes: item.data.minutes,
                  })}
                </Text>
                <Text style={styles.updated}>
                  {t('routines.updated', { date: formatUpdated(item.data.updatedAt, localeTag) })}
                </Text>
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
  emptyWrap: {
    flex: 1,
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.md,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  emptyDesc: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  emptyBtnText: { color: colors.white, fontWeight: '700' },
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
