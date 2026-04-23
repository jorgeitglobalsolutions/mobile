import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getCatalogExercise } from '../data/exercisesCatalog';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ExerciseDetail'>;

export default function ExerciseDetailScreen({ navigation, route }: Props) {
  const ex = getCatalogExercise(route.params.exerciseId);

  if (!ex) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Exercise</Text>
          <View style={{ width: 26 }} />
        </View>
        <Text style={styles.miss}>Exercise not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {ex.name}
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{ex.muscle}</Text>
          </View>
        </View>
        <Text style={styles.section}>How to do it</Text>
        <Text style={styles.body}>{ex.instructions}</Text>
        <Text style={styles.hint}>
          Video and image cues can be added later from your CMS or Firestore without changing this screen layout.
        </Text>
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
  pillRow: { marginBottom: spacing.lg },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  pillText: { fontSize: 13, fontWeight: '800', color: colors.primary },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  body: { fontSize: 16, lineHeight: 24, color: colors.textSecondary },
  hint: { marginTop: spacing.xl, fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  miss: { padding: spacing.xl, color: colors.textSecondary },
});
