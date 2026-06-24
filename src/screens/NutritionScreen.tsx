import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';
import { useTodayNutrition } from '../hooks/useTodayNutrition';
import NutritionTodayStrip from '../components/nutrition/NutritionTodayStrip';
import NutritionTabBar, { type NutritionTab } from '../components/nutrition/NutritionTabBar';
import NutritionOverviewPanel from '../components/nutrition/NutritionOverviewPanel';
import NutritionLogPanel from '../components/nutrition/NutritionLogPanel';
import FoodSearchModal from '../components/nutrition/FoodSearchModal';
type Props = NativeStackScreenProps<RootStackParamList, 'Nutrition'>;

export default function NutritionScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { user, userDoc } = useAuth();
  const { habitDay, defaults, targets, snapshot } = useTodayNutrition(user?.uid, userDoc?.profile ?? null);
  const initialTab: NutritionTab = route.params?.tab === 'log' ? 'log' : 'overview';
  const [tab, setTab] = useState<NutritionTab>(initialTab);
  const [foodModalOpen, setFoodModalOpen] = useState(false);

  const openFoodSearch = () => setFoodModalOpen(true);

  useEffect(() => {
    if (route.params?.tab) {
      setTab(route.params.tab === 'log' ? 'log' : 'overview');
    }
  }, [route.params?.tab]);

  if (!user?.uid) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top']}>
        <Text style={styles.hint}>{t('nutrition.signInHint')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('nutrition.title')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('BodyMetrics')} hitSlop={12}>
            <Ionicons name="body-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <NutritionTodayStrip snapshot={snapshot} />
        <NutritionTabBar active={tab} onChange={setTab} />

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {tab === 'overview' ? (
            <>
              <NutritionOverviewPanel
                snapshot={snapshot}
                targets={targets}
                profile={userDoc?.profile ?? null}
                onLogFood={openFoodSearch}
                onEditMetrics={() => navigation.navigate('BodyMetrics')}
              />
            </>
          ) : (
            <NutritionLogPanel
              uid={user.uid}
              defaults={defaults}
              habitDay={habitDay}
              onOpenFoodSearch={openFoodSearch}
            />
          )}
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <FoodSearchModal
        visible={foodModalOpen}
        uid={user.uid}
        defaults={defaults}
        onClose={() => setFoodModalOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  hint: { color: colors.textSecondary, textAlign: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 24 },
});
