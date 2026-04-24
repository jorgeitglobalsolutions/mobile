import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { updateUserSettings } from '../services/userDocument';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { user, userDoc } = useAuth();
  const [notifications, setNotifications] = useState(userDoc?.settings?.notificationsEnabled ?? true);
  const [metric, setMetric] = useState(userDoc?.settings?.unitsMetric ?? true);
  const [reminderDefault, setReminderDefault] = useState(userDoc?.settings?.reminderHourUtc == null);
  const [reminderHour, setReminderHour] = useState(userDoc?.settings?.reminderHourUtc ?? 13);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNotifications(userDoc?.settings?.notificationsEnabled ?? true);
    setMetric(userDoc?.settings?.unitsMetric ?? true);
    const rh = userDoc?.settings?.reminderHourUtc;
    setReminderDefault(rh === undefined || rh === null);
    setReminderHour(typeof rh === 'number' ? rh : 13);
  }, [userDoc?.settings]);

  const persist = async (next: {
    notifications?: boolean;
    metric?: boolean;
    reminderHourUtc?: number | null;
    reminderDefault?: boolean;
  }) => {
    if (!user?.uid) return;
    setBusy(true);
    try {
      const useDef =
        next.reminderDefault !== undefined ? next.reminderDefault : reminderDefault;
      const hour = next.reminderHourUtc !== undefined ? next.reminderHourUtc : reminderHour;
      await updateUserSettings(user.uid, {
        notificationsEnabled: next.notifications ?? notifications,
        unitsMetric: next.metric ?? metric,
        reminderHourUtc: useDef ? null : hour,
      });
    } catch (e: unknown) {
      Alert.alert('Settings', e instanceof Error ? e.message : 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>Notifications</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Push reminders</Text>
          <Switch
            value={notifications}
            onValueChange={async (v) => {
              setNotifications(v);
              await persist({ notifications: v });
              if (v) await registerForPushNotificationsAsync(user?.uid);
            }}
            disabled={busy}
          />
        </View>
        <Text style={styles.hint}>
          Uses Expo push token + Firebase; reminders are sent when your device token is stored.
        </Text>

        <View style={[styles.row, { marginTop: spacing.md }]}>
          <Text style={styles.rowLabel}>Default reminder hour (13 UTC)</Text>
          <Switch
            value={reminderDefault}
            onValueChange={async (v) => {
              setReminderDefault(v);
              await persist({ reminderDefault: v, reminderHourUtc: v ? null : reminderHour });
            }}
            disabled={busy}
          />
        </View>
        {!reminderDefault ? (
          <View style={styles.hourRow}>
            <Text style={styles.rowLabel}>Hour (UTC)</Text>
            <View style={styles.hourStepper}>
              <TouchableOpacity
                style={{ marginRight: spacing.md }}
                onPress={() => {
                  const n = (reminderHour + 23) % 24;
                  setReminderHour(n);
                  void persist({ reminderHourUtc: n });
                }}
                disabled={busy}
                hitSlop={8}
              >
                <Ionicons name="remove-circle-outline" size={28} color={colors.primary} />
              </TouchableOpacity>
              <Text style={styles.hourVal}>{reminderHour}</Text>
              <TouchableOpacity
                style={{ marginLeft: spacing.md }}
                onPress={() => {
                  const n = (reminderHour + 1) % 24;
                  setReminderHour(n);
                  void persist({ reminderHourUtc: n });
                }}
                disabled={busy}
                hitSlop={8}
              >
                <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
        <Text style={styles.hint}>
          Server sends at most one nudge per day in your chosen UTC hour (default 13:00 UTC).
        </Text>

        <Text style={styles.section}>Units</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Use metric (kg, ml)</Text>
          <Switch
            value={metric}
            onValueChange={async (v) => {
              setMetric(v);
              await persist({ metric: v });
            }}
            disabled={busy}
          />
        </View>

        <Text style={styles.section}>Language</Text>
        <Text style={styles.hint}>More languages can be added later; strings are structured for i18n.</Text>
      </ScrollView>
    </SafeAreaView>
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
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: colors.text },
  scroll: { padding: spacing.xl, paddingBottom: 40 },
  section: { fontSize: 14, fontWeight: '800', color: colors.textSecondary, marginTop: spacing.lg, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowLabel: { fontSize: 16, fontWeight: '600', color: colors.text, flex: 1, marginRight: spacing.md },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 18 },
  hourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  hourStepper: { flexDirection: 'row', alignItems: 'center' },
  hourVal: { fontSize: 18, fontWeight: '800', color: colors.text, minWidth: 28, textAlign: 'center' },
});
