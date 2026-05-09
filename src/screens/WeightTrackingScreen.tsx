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
  subscribeWeightEntries,
  addWeightEntry,
  deleteWeightEntry,
  type WeightEntryRow,
} from '../services/weightTrackingRepo';
import { updateUserProfile } from '../services/userDocument';
import WeightProgressChart from '../components/WeightProgressChart';
import { clamp } from '../utils/math';
import { WEIGHT_MAX_KG, WEIGHT_MIN_KG } from '../constants/bodyMetrics';
import { friendlyAppError } from '../utils/appError';

type Props = NativeStackScreenProps<RootStackParamList, 'WeightTracking'>;

function formatLoggedAt(row: WeightEntryRow): string {
  try {
    const d = row.data.loggedAt.toDate();
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

export default function WeightTrackingScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const [rows, setRows] = useState<WeightEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [weightText, setWeightText] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsub = subscribeWeightEntries(user.uid, (list) => {
      setRows(list);
      setLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  const chartPoints = useMemo(
    () =>
      rows.map((r) => ({
        atMs: r.data.loggedAt.toMillis(),
        weightKg: r.data.weightKg,
      })),
    [rows],
  );

  const onSave = async () => {
    if (!user?.uid) return;
    const parsed = parseFloat(weightText.replace(',', '.'));
    if (!Number.isFinite(parsed)) {
      Alert.alert('Weight', 'Enter a valid weight in kg.');
      return;
    }
    const kg = clamp(parsed, WEIGHT_MIN_KG, WEIGHT_MAX_KG);
    setSaving(true);
    try {
      await addWeightEntry(user.uid, {
        weightKg: kg,
        note: note.trim() || undefined,
      });
      if (userDoc?.profile) {
        await updateUserProfile(user.uid, {
          ...userDoc.profile,
          weightKg: kg,
        });
      }
      setWeightText('');
      setNote('');
    } catch (e: unknown) {
      Alert.alert('Weight', friendlyAppError(e, 'Could not save weight. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = (row: WeightEntryRow) => {
    if (!user?.uid) return;
    Alert.alert('Remove entry', 'Delete this weight log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await deleteWeightEntry(user.uid!, row.id);
            } catch (e: unknown) {
              Alert.alert('Weight', friendlyAppError(e, 'Could not delete entry.'));
            }
          })();
        },
      },
    ]);
  };

  if (!user?.uid) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <Text style={styles.hint}>Sign in to track weight.</Text>
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
          <Text style={styles.headerTitle}>Body weight</Text>
          <View style={{ width: 26 }} />
        </View>

        {loading ? (
          <View style={[styles.center, { flex: 1 }]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <WeightProgressChart entries={chartPoints} />

            <View style={styles.formCard}>
              <Text style={styles.sectionLabel}>Log weight</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.weightInput}
                  keyboardType="decimal-pad"
                  placeholder="Weight"
                  placeholderTextColor={colors.textMuted}
                  value={weightText}
                  onChangeText={setWeightText}
                />
                <Text style={styles.unit}>kg</Text>
              </View>
              <TextInput
                style={styles.noteInput}
                placeholder="Optional note"
                placeholderTextColor={colors.textMuted}
                value={note}
                onChangeText={setNote}
              />
              <TouchableOpacity
                style={[styles.primaryBtn, saving && { opacity: 0.75 }]}
                activeOpacity={0.9}
                onPress={() => void onSave()}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>Save entry</Text>
                )}
              </TouchableOpacity>
              <Text style={styles.formHint}>
                Uses your device time. Profile weight updates to match your latest log.
              </Text>
            </View>

            <Text style={styles.historyTitle}>History</Text>
            {rows.length === 0 ? (
              <Text style={styles.emptyHist}>No entries yet — add your current weight above.</Text>
            ) : (
              rows.map((item, idx) => (
                <View key={item.id}>
                  {idx > 0 ? <View style={{ height: spacing.sm }} /> : null}
                  <View style={styles.historyRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.historyKg}>{item.data.weightKg.toFixed(1)} kg</Text>
                      <Text style={styles.historyDate}>{formatLoggedAt(item)}</Text>
                      {item.data.note ? <Text style={styles.historyNote}>{item.data.note}</Text> : null}
                    </View>
                    <TouchableOpacity hitSlop={10} onPress={() => onDelete(item)}>
                      <Ionicons name="trash-outline" size={22} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 120 },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: colors.textSecondary, marginBottom: spacing.sm },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  weightInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    backgroundColor: colors.bg,
  },
  unit: { marginLeft: spacing.md, fontSize: 16, fontWeight: '700', color: colors.textSecondary },
  noteInput: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.bg,
  },
  primaryBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  formHint: { marginTop: spacing.md, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  historyTitle: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  historyKg: { fontSize: 18, fontWeight: '800', color: colors.text },
  historyDate: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  historyNote: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  emptyHist: { color: colors.textSecondary, paddingVertical: spacing.md },
});
