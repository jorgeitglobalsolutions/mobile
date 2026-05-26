import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import type { HabitDefaults } from '../../services/habitsRepo';
import FoodDatabasePanel from './FoodDatabasePanel';

type Props = {
  visible: boolean;
  uid: string;
  defaults: HabitDefaults;
  onClose: () => void;
};

export default function FoodSearchModal({ visible, uid, defaults, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 4 : 0}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Food database</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12} accessibilityLabel="Close">
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Search foods or create a custom entry. Values are per 100g.</Text>
          <FoodDatabasePanel uid={uid} defaults={defaults} variant="modal" onClose={onClose} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
});
