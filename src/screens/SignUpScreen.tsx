import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { UserProfile } from '../types/firestoreUser';
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation, route }: Props) {
  const { signUp, firebaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const profile: UserProfile | null = useMemo(() => {
    const p = route.params ?? {};
    const g = p.goal;
    if (
      typeof p.weightKg === 'number' &&
      typeof p.heightCm === 'number' &&
      (g === 'lose' || g === 'build' || g === 'maintain')
    ) {
      return { weightKg: p.weightKg, heightCm: p.heightCm, goal: g };
    }
    return null;
  }, [route.params]);

  const onSubmit = async () => {
    if (!firebaseConfigured) {
      Alert.alert('Firebase', 'Add EXPO_PUBLIC_FIREBASE_* keys to your .env file.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Password', 'Use at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      await signUp(email, password, profile);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Sign up failed';
      Alert.alert('Sign up', message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.inner}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.sub}>
            {profile
              ? 'Your profile from onboarding will be saved to your account.'
              : 'Finish registration to start your free trial.'}
          </Text>

          {!profile ? (
            <TouchableOpacity
              style={styles.onboardingLink}
              onPress={() => navigation.navigate('Onboarding')}
              activeOpacity={0.85}
            >
              <Text style={styles.onboardingLinkText}>
                Set weight, height & goal first (recommended)
              </Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity
            style={[styles.primary, busy && { opacity: 0.7 }]}
            onPress={onSubmit}
            disabled={busy}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryText}>{busy ? 'Creating…' : 'Create account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? </Text>
            <Text style={styles.linkBold}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xxl },
  title: { fontSize: 28, fontWeight: '800', color: colors.text },
  sub: { marginTop: spacing.sm, fontSize: 15, color: colors.textSecondary, marginBottom: spacing.xxl },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: colors.white, fontSize: 17, fontWeight: '700' },
  onboardingLink: { marginBottom: spacing.lg, alignItems: 'center' },
  onboardingLinkText: { fontSize: 15, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  link: { fontSize: 15, color: colors.textSecondary },
  linkBold: { fontSize: 15, fontWeight: '800', color: colors.primary },
});
