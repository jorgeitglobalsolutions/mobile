import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '../theme';

export default function MissingFirebaseScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.box}>
        <Text style={styles.title}>{t('missingFirebase.title')}</Text>
        <Text style={styles.body}>{t('missingFirebase.body')}</Text>
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
