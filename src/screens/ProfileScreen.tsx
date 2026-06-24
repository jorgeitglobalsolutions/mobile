import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { getLegalUrls, subscriptionManageUrl } from '../config/legalLinks';
import { callDeleteAccount } from '../services/deleteAccount';
import { colors, radius, spacing } from '../theme';
import { friendlyAppError } from '../utils/appError';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, userDoc, subscriptionStatus, signOutUser } = useAuth();
  const [busy, setBusy] = useState(false);

  const displayName =
    user?.displayName ||
    (user?.email && user.email.includes('@') ? user.email.split('@')[0] : null) ||
    t('profile.defaultName');
  const email = user?.email ?? '—';

  const legal = getLegalUrls();

  const onManageSubscription = () => {
    void Linking.openURL(subscriptionManageUrl());
  };

  const onOpenPrivacy = () => {
    void Linking.openURL(legal.privacyUrl);
  };

  const onDeleteAccount = () => {
    Alert.alert(
      t('profile.alerts.deleteTitle'),
      t('profile.alerts.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              await callDeleteAccount(user?.uid);
              await signOutUser();
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (e: unknown) {
              Alert.alert(t('profile.alerts.deleteTitle'), friendlyAppError(e, 'profile.alerts.deleteError'));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const onSignOut = async () => {
    setBusy(true);
    try {
      await signOutUser();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e: unknown) {
      Alert.alert(t('profile.alerts.signOutTitle'), friendlyAppError(e, 'profile.alerts.signOutError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('profile.title')}</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={colors.primary} />
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
          <Text style={styles.subtle}>
            {t('common.subscriptionLabel', {
              status: t(`common.subscriptionStatus.${subscriptionStatus}`, {
                defaultValue: subscriptionStatus,
              }),
            })}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.row, { marginTop: spacing.lg }]}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('BodyMetrics')}
        >
          <Ionicons name="body-outline" size={22} color={colors.text} />
          <Text style={styles.rowLabel}>{t('profile.bodyMetrics')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('WeightTracking')}
        >
          <Ionicons name="trending-up-outline" size={22} color={colors.text} />
          <Text style={styles.rowLabel}>{t('profile.bodyWeight')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Nutrition')}
        >
          <Ionicons name="nutrition-outline" size={22} color={colors.text} />
          <Text style={styles.rowLabel}>{t('nutrition.title')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Settings')}
        >
          <Ionicons name="settings-outline" size={22} color={colors.text} />
          <Text style={styles.rowLabel}>{t('profile.settings')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={onManageSubscription}>
          <Ionicons name="card-outline" size={22} color={colors.text} />
          <Text style={styles.rowLabel}>{t('profile.manageSubscription')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={onOpenPrivacy}>
          <Ionicons name="document-text-outline" size={22} color={colors.text} />
          <Text style={styles.rowLabel}>{t('profile.privacyData')}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.rowDanger, busy && { opacity: 0.7 }]}
          activeOpacity={0.85}
          onPress={onDeleteAccount}
          disabled={busy}
        >
          <Ionicons name="trash-outline" size={22} color="#B91C1C" />
          <Text style={[styles.rowLabel, { color: '#B91C1C' }]}>{t('profile.deleteAccount')}</Text>
          <Ionicons name="chevron-forward" size={20} color="#B91C1C" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signOut, busy && { opacity: 0.7 }]}
          activeOpacity={0.9}
          onPress={onSignOut}
          disabled={busy}
        >
          <Ionicons name="log-out-outline" size={22} color={colors.text} />
          <Text style={[styles.rowLabel, { marginLeft: spacing.md }]}>
            {busy ? t('profile.signingOut') : t('profile.signOut')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.premium}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Paywall')}
        >
          <Ionicons name="ribbon-outline" size={22} color={colors.paywallPurple} style={{ marginRight: spacing.md }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.premiumTitle}>{t('profile.goPremium')}</Text>
            <Text style={styles.premiumSub}>{t('profile.premiumSub')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.paywallPurple} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingBottom: 100 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  title: { fontSize: 28, fontWeight: '700', color: colors.text },
  card: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { marginTop: spacing.md, fontSize: 22, fontWeight: '800', color: colors.text },
  email: { marginTop: 4, fontSize: 14, color: colors.textSecondary },
  subtle: { marginTop: 8, fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: '#FEF2F2',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  rowLabel: { marginLeft: spacing.md, fontSize: 16, fontWeight: '600', color: colors.text },
  premium: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.xl,
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.paywallSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.paywallPurple + '55',
  },
  premiumTitle: { fontSize: 16, fontWeight: '800', color: colors.paywallPurple },
  premiumSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
