import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

export default function MissingFirebaseScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.box}>
        <Text style={styles.title}>Firebase configuration required</Text>
        <Text style={styles.body}>
          Create a Firebase project, enable Email/Password authentication and Cloud Firestore, then add
          EXPO_PUBLIC_FIREBASE_* variables to a .env file in the mobile folder (see .env.example). Restart Expo
          after saving.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  box: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  body: { fontSize: 15, lineHeight: 22, color: colors.textSecondary },
});
