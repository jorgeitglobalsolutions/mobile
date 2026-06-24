import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LocaleContext';
import { updatePushToken, updateUserSettings } from '../services/userDocument';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { colors, radius, spacing } from '../theme';
import { friendlyAppError } from '../utils/appError';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { language, setLanguage } = useLocale();
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
      Alert.alert(t('settings.alerts.title'), friendlyAppError(e, 'settings.alerts.saveError'));
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
        <Text style={styles.title}>{t('settings.title')}</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.section}>{t('settings.sectionProfile')}</Text>
        <TouchableOpacity
          style={styles.navRow}
          onPress={() => navigation.navigate('BodyMetrics')}
          activeOpacity={0.85}
        >
          <Ionicons name="body-outline" size={22} color={colors.text} />
          <Text style={styles.navRowLabel}>{t('settings.bodyMetricsNav')}</Text>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.textMuted}
            style={{ marginLeft: 'auto' }}
          />
        </TouchableOpacity>
        <Text style={styles.hintSmall}>{t('settings.bodyMetricsHint')}</Text>

        <Text style={styles.section}>{t('settings.sectionNotifications')}</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('settings.pushReminders')}</Text>
          <Switch
            value={notifications}
            onValueChange={async (v) => {
              setNotifications(v);
              await persist({ notifications: v });
              if (v) {
                await registerForPushNotificationsAsync(user?.uid);
              } else if (user?.uid) {
                await updatePushToken(user.uid, null);
              }
            }}
            disabled={busy}
          />
        </View>
        <Text style={styles.hint}>{t('settings.pushHint')}</Text>

        <View style={[styles.row, { marginTop: spacing.md }]}>
          <Text style={styles.rowLabel}>{t('settings.defaultReminderHour')}</Text>
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
            <Text style={styles.rowLabel}>{t('settings.hourUtc')}</Text>
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
        <Text style={styles.hint}>{t('settings.reminderHint')}</Text>

        <Text style={styles.section}>{t('settings.sectionUnits')}</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t('settings.useMetric')}</Text>
          <Switch
            value={metric}
            onValueChange={async (v) => {
              setMetric(v);
              await persist({ metric: v });
            }}
            disabled={busy}
          />
        </View>

        <Text style={styles.section}>{t('settings.sectionLanguage')}</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => void setLanguage('en')}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>
              {t('settings.languageEnglish')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'es' && styles.langBtnActive]}
            onPress={() => void setLanguage('es')}
            disabled={busy}
            activeOpacity={0.85}
          >
            <Text style={[styles.langBtnText, language === 'es' && styles.langBtnTextActive]}>
              {t('settings.languageSpanish')}
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.hint}>{t('settings.languageHint')}</Text>
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
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  navRowLabel: { marginLeft: spacing.md, fontSize: 16, fontWeight: '600', color: colors.text, flex: 1 },
  hintSmall: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.sm, lineHeight: 16 },
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
  langRow: { flexDirection: 'row', gap: spacing.sm },
  langBtn: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
  },
  langBtnActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  langBtnText: { fontSize: 16, fontWeight: '600', color: colors.textSecondary },
  langBtnTextActive: { color: colors.primary, fontWeight: '800' },
});
