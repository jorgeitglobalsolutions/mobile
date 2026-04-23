import React, { useState } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { signIn, firebaseConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async () => {
    if (!firebaseConfigured) {
      Alert.alert('Firebase', 'Add EXPO_PUBLIC_FIREBASE_* keys to your .env file.');
      return;
    }
    setBusy(true);
    try {
      await signIn(email, password);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Sign in failed';
      Alert.alert('Sign in', message);
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
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to continue your streak.</Text>

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
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
          />

          <TouchableOpacity
            style={[styles.primary, busy && { opacity: 0.7 }]}
            onPress={onSubmit}
            disabled={busy}
            activeOpacity={0.9}
          >
            <Text style={styles.primaryText}>{busy ? 'Signing in…' : 'Sign in'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate('SignUp', {})}>
            <Text style={styles.link}>{"No account? "}</Text>
            <Text style={styles.linkBold}>Create one</Text>
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
  linkRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
  link: { fontSize: 15, color: colors.textSecondary },
  linkBold: { fontSize: 15, fontWeight: '800', color: colors.primary },
});
