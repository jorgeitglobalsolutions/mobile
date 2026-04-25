import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { deleteUser } from 'firebase/auth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { getFirebaseAuth } from '../lib/firebase';
import { getLegalUrls, subscriptionManageUrl } from '../config/legalLinks';
import { colors, radius, spacing } from '../theme';

export default function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, userDoc, subscriptionStatus, signOutUser } = useAuth();
  const [busy, setBusy] = useState(false);

  const displayName =
    user?.displayName ||
    (user?.email && user.email.includes('@') ? user.email.split('@')[0] : null) ||
    'Athlete';
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
      'Delete account',
      'This removes your Firebase Authentication account. Firestore data may still exist until cleaned up by your backend policy.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const auth = getFirebaseAuth();
            const u = auth?.currentUser;
            if (!u) {
              Alert.alert('Delete account', 'No signed-in user.');
              return;
            }
            try {
              await deleteUser(u);
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Delete failed';
              Alert.alert(
                'Delete account',
                `${msg}\n\nIf you recently signed in, try signing out and signing in again, then delete.`,
              );
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
      const message = e instanceof Error ? e.message : 'Sign out failed';
      Alert.alert('Sign out', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color={colors.primary} />
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{email}</Text>
        <Text style={styles.subtle}>Subscription: {subscriptionStatus}</Text>
      </View>

      <TouchableOpacity
        style={[styles.row, { marginTop: spacing.lg }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('BodyMetrics')}
      >
        <Ionicons name="body-outline" size={22} color={colors.text} />
        <Text style={styles.rowLabel}>Body metrics</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('Settings')}
      >
        <Ionicons name="settings-outline" size={22} color={colors.text} />
        <Text style={styles.rowLabel}>Settings</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={onManageSubscription}>
        <Ionicons name="card-outline" size={22} color={colors.text} />
        <Text style={styles.rowLabel}>Manage subscription</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.row} activeOpacity={0.85} onPress={onOpenPrivacy}>
        <Ionicons name="document-text-outline" size={22} color={colors.text} />
        <Text style={styles.rowLabel}>Privacy & data</Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.rowDanger} activeOpacity={0.85} onPress={onDeleteAccount}>
        <Ionicons name="trash-outline" size={22} color="#B91C1C" />
        <Text style={[styles.rowLabel, { color: '#B91C1C' }]}>Delete account</Text>
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
          {busy ? 'Signing out…' : 'Sign out'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.premium}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Paywall')}
      >
        <Ionicons name="ribbon-outline" size={22} color={colors.paywallPurple} style={{ marginRight: spacing.md }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.premiumTitle}>Go Premium</Text>
          <Text style={styles.premiumSub}>7-day free trial, then $9.99/mo</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.paywallPurple} />
      </TouchableOpacity>

      <View style={{ height: 100 }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
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
