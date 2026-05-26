import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { callGrantDevSubscription } from '../services/grantDevSubscription';
import { purchaseEmFitSubscription, restoreSubscriptionsAndVerify } from '../services/nativeSubscriptionPurchase';
import { isExpoGo, canUseNativeInAppPurchases } from '../config/expoRuntime';
import { getLegalUrls, subscriptionManageUrl } from '../config/legalLinks';
import { colors, radius, spacing } from '../theme';
import { friendlyAppError, friendlyPurchaseError } from '../utils/appError';

type Props = NativeStackScreenProps<RootStackParamList, 'Paywall'>;

const FEATURES = [
  {
    icon: 'infinite-outline' as const,
    title: 'Unlimited Workouts & Routines',
    desc: 'Create custom routines and track without limits.',
  },
  {
    icon: 'bar-chart-outline' as const,
    title: 'Advanced Progress Tracking',
    desc: 'Detailed stats, charts, and performance insights.',
  },
  {
    icon: 'book-outline' as const,
    title: 'Exercise Library',
    desc: 'Access 1000+ exercises with videos & instructions.',
  },
  {
    icon: 'cloud-upload-outline' as const,
    title: 'Cloud Sync & Backup',
    desc: 'Your data is always safe and accessible.',
  },
];

export default function PaywallScreen({ navigation }: Props) {
  const { user, useMockData, accessLevel, grantDevAccessLocally } = useAuth();
  const [plan, setPlan] = useState<'month' | 'year'>('month');
  const [busy, setBusy] = useState(false);
  const legal = getLegalUrls();
  const expoGo = isExpoGo();
  const nativeIap = canUseNativeInAppPurchases();
  const showDevUnlock = __DEV__ && !useMockData;

  const openUrl = async (url: string) => {
    try {
      const ok = await Linking.canOpenURL(url);
      if (ok) await Linking.openURL(url);
      else Alert.alert('Link', 'Could not open this link. Please try again later.');
    } catch {
      Alert.alert('Link', 'Could not open this link right now.');
    }
  };

  const onSubscribe = async () => {
    if (!user?.uid) {
      Alert.alert('Session expired', 'Please sign in again to continue.');
      return;
    }
    if (useMockData) {
      setBusy(true);
      try {
        await callGrantDevSubscription(user.uid);
        navigation.goBack();
      } catch (e: unknown) {
        Alert.alert('Subscription', friendlyAppError(e, 'Could not unlock subscription.'));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (expoGo && showDevUnlock) {
      await onQaGrantSubscription();
      return;
    }
    setBusy(true);
    try {
      await purchaseEmFitSubscription(plan);
      navigation.goBack();
    } catch (e: unknown) {
      Alert.alert('Subscription', friendlyPurchaseError(e));
    } finally {
      setBusy(false);
    }
  };

  const onLocalDevUnlock = async () => {
    setBusy(true);
    try {
      await grantDevAccessLocally();
      Alert.alert(
        'Dev unlock',
        'Premium access is enabled on this device for development. Sign out clears this override. Firestore subscription is unchanged.',
      );
      navigation.goBack();
    } finally {
      setBusy(false);
    }
  };

  const onQaGrantSubscription = async () => {
    if (!user?.uid) {
      Alert.alert('Session expired', 'Please sign in again to continue.');
      return;
    }
    setBusy(true);
    try {
      await callGrantDevSubscription(user.uid);
      navigation.goBack();
    } catch (e: unknown) {
      const msg = friendlyAppError(e, 'Could not unlock subscription for QA.');
      if (showDevUnlock) {
        Alert.alert('QA unlock', `${msg}\n\nYou can still unlock on this device for UI testing.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unlock on device', onPress: () => void onLocalDevUnlock() },
        ]);
      } else {
        Alert.alert('QA unlock', msg);
      }
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    if (!user?.uid) {
      Alert.alert('Session expired', 'Please sign in again to continue.');
      return;
    }
    setBusy(true);
    try {
      if (useMockData) {
        await callGrantDevSubscription(user.uid);
        Alert.alert('Restore', 'Demo mode: subscription unlocked locally.');
        navigation.goBack();
        return;
      }
      await restoreSubscriptionsAndVerify();
      Alert.alert('Restore', 'Purchases restored. Your subscription status will update shortly.');
      navigation.goBack();
    } catch (e: unknown) {
      Alert.alert('Restore', friendlyPurchaseError(e));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (accessLevel !== 'paywalled') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [accessLevel]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topRight}>
        {accessLevel !== 'paywalled' ? (
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="close" size={26} color={colors.text} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.crownWrap}>
          <Ionicons name="ribbon" size={48} color={colors.paywallPurple} />
        </View>
        <Text style={styles.headline}>Unlock Your Best Self</Text>
        <Text style={styles.sub}>
          Get unlimited access to everything you need to build healthy habits and see results.
        </Text>

        <View style={styles.trialBox}>
          <Ionicons name="gift-outline" size={22} color={colors.paywallPurple} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.trialTitle}>7-Day Free Trial</Text>
            <Text style={styles.trialSub}>Cancel anytime. No commitment.</Text>
          </View>
        </View>

        {expoGo && showDevUnlock ? (
          <View style={styles.expoBanner}>
            <Ionicons name="information-circle-outline" size={20} color={colors.paywallPurple} />
            <Text style={styles.expoBannerText}>
              You are in Expo Go. Real App Store purchases need a development or store build. Use the button below to
              unlock for testing.
            </Text>
          </View>
        ) : null}

        {FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon} size={20} color={colors.paywallPurple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.planCard, plan === 'month' && styles.planCardOn]}
          onPress={() => setPlan('month')}
          activeOpacity={0.9}
        >
          <View style={styles.popular}>
            <Text style={styles.popularText}>MOST POPULAR</Text>
          </View>
          <View style={styles.planRow}>
            <Ionicons
              name={plan === 'month' ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={plan === 'month' ? colors.paywallPurple : colors.textMuted}
            />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={styles.planTitle}>Monthly</Text>
              <Text style={styles.planPrice}>$9.99 / month</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.planCard, plan === 'year' && styles.planCardOn]}
          onPress={() => setPlan('year')}
          activeOpacity={0.9}
        >
          <View style={styles.planRow}>
            <Ionicons
              name={plan === 'year' ? 'radio-button-on' : 'radio-button-off'}
              size={22}
              color={plan === 'year' ? colors.paywallPurple : colors.textMuted}
            />
            <View style={{ marginLeft: spacing.md, flex: 1 }}>
              <Text style={styles.planTitle}>Yearly</Text>
              <Text style={styles.planPrice}>$79.99 / year</Text>
              <Text style={styles.save}>Save 33%</Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cta, busy && { opacity: 0.75 }]}
          activeOpacity={0.9}
          onPress={() => void onSubscribe()}
          disabled={busy}
        >
          <Text style={styles.ctaText}>
            {busy
              ? 'Processing…'
              : expoGo && showDevUnlock
                ? 'Unlock for testing'
                : 'Start 7-Day Free Trial'}
          </Text>
        </TouchableOpacity>
        <View style={styles.lockRow}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
          <Text style={styles.lockText}>Cancel anytime. No commitment.</Text>
        </View>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => void openUrl(subscriptionManageUrl())}>
          <Text style={styles.secondaryBtnText}>Manage subscription (App Store / Play)</Text>
        </TouchableOpacity>

        {nativeIap ? (
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => void onRestore()} disabled={busy}>
            <Text style={styles.secondaryBtnText}>Restore purchase</Text>
          </TouchableOpacity>
        ) : null}

        {showDevUnlock ? (
          <>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => void onQaGrantSubscription()}
              disabled={busy}
            >
              <Text style={styles.secondaryBtnText}>QA unlock via Firebase (backend)</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => void onLocalDevUnlock()}
              disabled={busy}
            >
              <Text style={[styles.secondaryBtnText, styles.qaHint]}>Unlock on this device only (no store)</Text>
            </TouchableOpacity>
          </>
        ) : null}

        <View style={styles.trustRow}>
          <Trust icon="shield-checkmark-outline" label="Secure Checkout" />
          <Trust icon="ribbon-outline" label="Trusted by 10,000+ users" />
          <Trust icon="shield-outline" label="Your data is always protected" />
        </View>

        <View style={styles.links}>
          <TouchableOpacity onPress={() => void openUrl(legal.termsUrl)}>
            <Text style={styles.link}>Terms of Service</Text>
          </TouchableOpacity>
          <Text style={styles.dot}> · </Text>
          <TouchableOpacity onPress={() => void openUrl(legal.privacyUrl)}>
            <Text style={styles.link}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Trust({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.trustCol}>
      <Ionicons name={icon} size={20} color={colors.paywallPurple} />
      <Text style={styles.trustText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  topRight: { alignItems: 'flex-end', paddingHorizontal: spacing.lg },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 40 },
  crownWrap: { alignItems: 'center', marginTop: spacing.sm },
  headline: {
    marginTop: spacing.md,
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  sub: {
    marginTop: spacing.sm,
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  trialBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paywallSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  trialTitle: { fontSize: 16, fontWeight: '800', color: colors.paywallPurple },
  trialSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  expoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.paywallSoft,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.paywallPurple + '44',
  },
  expoBannerText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  featureRow: { flexDirection: 'row', marginBottom: spacing.lg },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.paywallSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  featureDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  planCard: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  planCardOn: { borderColor: colors.paywallPurple, backgroundColor: '#FAF5FF' },
  popular: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.paywallPurple,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: radius.md,
  },
  popularText: { fontSize: 10, fontWeight: '800', color: colors.white },
  planRow: { flexDirection: 'row', alignItems: 'center' },
  planTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  planPrice: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 4 },
  save: { marginTop: 4, fontSize: 14, fontWeight: '700', color: colors.primary },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.paywallPurple,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  secondaryBtn: {
    marginTop: spacing.sm,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700', color: colors.paywallPurple },
  qaHint: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  lockRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  lockText: { fontSize: 12, color: colors.textMuted },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  trustCol: { flex: 1, alignItems: 'center' },
  trustText: { fontSize: 10, color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
  links: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  link: { fontSize: 12, color: colors.paywallPurple, fontWeight: '600' },
  dot: { fontSize: 12, color: colors.textMuted },
});
