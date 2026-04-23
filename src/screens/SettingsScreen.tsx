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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setNotifications(userDoc?.settings?.notificationsEnabled ?? true);
    setMetric(userDoc?.settings?.unitsMetric ?? true);
  }, [userDoc?.settings?.notificationsEnabled, userDoc?.settings?.unitsMetric]);

  const persist = async (next: { notifications?: boolean; metric?: boolean }) => {
    if (!user?.uid) return;
    setBusy(true);
    try {
      await updateUserSettings(user.uid, {
        notificationsEnabled: next.notifications ?? notifications,
        unitsMetric: next.metric ?? metric,
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
        <Text style={styles.hint}>Turn on to register this device for workout and habit reminders (FCM).</Text>

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
});
