import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList } from './src/navigation/types';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { isMockDataMode } from './src/config/mockMode';
import { getFirebasePublicConfig, isFirebaseConfigured } from './src/config/firebaseConfig';
import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import MainTabs from './src/navigation/MainTabs';
import ExerciseLibraryScreen from './src/screens/ExerciseLibraryScreen';
import ExerciseDetailScreen from './src/screens/ExerciseDetailScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import WorkoutSessionDetailScreen from './src/screens/WorkoutSessionDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import MissingFirebaseScreen from './src/screens/MissingFirebaseScreen';
import { ONBOARDING_WIZARD_KEY } from './src/constants/storageKeys';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigation() {
  const { firebaseReady, firebaseConfigured, user } = useAuth();
  const [wizardDone, setWizardDone] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const v = await AsyncStorage.getItem(ONBOARDING_WIZARD_KEY);
      const legacy = await AsyncStorage.getItem('onboarding_complete');
      if (!cancelled) setWizardDone(v === 'true' || legacy === 'true');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!firebaseReady || wizardDone === null) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const hasFirebase = isFirebaseConfigured(getFirebasePublicConfig());
  if (!hasFirebase && !isMockDataMode()) {
    return <MissingFirebaseScreen />;
  }

  const initialRouteName: keyof RootStackParamList = user
    ? 'Main'
    : wizardDone
      ? 'Login'
      : 'Onboarding';

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRouteName}
        key={`${user?.uid ?? 'guest'}-${wizardDone ? 'w' : 'nw'}`}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="ExerciseLibrary"
          component={ExerciseLibraryScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
        <Stack.Screen
          name="Paywall"
          component={PaywallScreen}
          options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="WorkoutSessionDetail" component={WorkoutSessionDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <AppNavigation />
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
});
