import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { colors, radius, spacing } from '../../theme';

export type PortionPreview = {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
};

type Props = {
  visible: boolean;
  title: string;
  grams: string;
  onGramsChange: (value: string) => void;
  preview: PortionPreview | null;
  saving: boolean;
  onAdd: () => void;
  onClose: () => void;
};

const GRAM_PRESETS = [50, 100, 150, 200] as const;

function formatMacros(p: number, c: number, f: number, kcal: number): string {
  return `${Math.round(kcal)} kcal · ${Math.round(p)}P / ${Math.round(c)}C / ${Math.round(f)}F`;
}

export default function FoodPortionModal({
  visible,
  title,
  grams,
  onGramsChange,
  preview,
  saving,
  onAdd,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboard}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Amount (grams)</Text>

            <View style={styles.gramsRow}>
              {GRAM_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[styles.gramPreset, grams === String(preset) && styles.gramPresetActive]}
                  onPress={() => onGramsChange(String(preset))}
                >
                  <Text
                    style={[
                      styles.gramPresetText,
                      grams === String(preset) && styles.gramPresetTextActive,
                    ]}
                  >
                    {preset}g
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.gramsInputWrap}>
              <TextInput
                style={styles.gramsInput}
                keyboardType="decimal-pad"
                value={grams}
                onChangeText={onGramsChange}
                placeholder="100"
                placeholderTextColor={colors.textMuted}
              />
              <Text style={styles.gramsSuffix}>g</Text>
            </View>

            {preview ? (
              <Text style={styles.previewMacros}>
                {formatMacros(preview.protein, preview.carbs, preview.fat, preview.calories)}
              </Text>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryBtn, saving && { opacity: 0.7 }]}
              onPress={onAdd}
              disabled={saving}
              activeOpacity={0.9}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.primaryBtnText}>Add to today's meal</Text>
              )}
            </TouchableOpacity>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  keyboard: { width: '100%' },
  sheet: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '700',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  gramsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  gramPreset: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gramPresetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  gramPresetText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  gramPresetTextActive: { color: colors.white },
  gramsInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  gramsInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  gramsSuffix: { fontSize: 15, fontWeight: '700', color: colors.textMuted },
  previewMacros: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
