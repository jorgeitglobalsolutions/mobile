import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
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
import BodyMetricsScreen from './src/screens/BodyMetricsScreen';
import WeightTrackingScreen from './src/screens/WeightTrackingScreen';
import MissingFirebaseScreen from './src/screens/MissingFirebaseScreen';
import { ONBOARDING_WIZARD_KEY } from './src/constants/storageKeys';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationRef = createNavigationContainerRef<RootStackParamList>();

function AppNavigation() {
  const { firebaseReady, firebaseConfigured, user, userDoc, userDocHydrated, accessLevel } = useAuth();
  const [wizardDone, setWizardDone] = useState<boolean | null>(null);
  const [navReady, setNavReady] = useState(false);

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

  useEffect(() => {
    if (user?.uid && !userDocHydrated) {
      setNavReady(false);
    }
  }, [user?.uid, userDocHydrated]);

  useEffect(() => {
    if (!navReady || !firebaseReady || wizardDone === null) return;
    if (!user?.uid || !userDocHydrated) return;
    if (userDoc?.profile) return;
    if (!navigationRef.isReady()) return;
    const root = navigationRef.getRootState();
    const idx = root?.index ?? 0;
    const routeName = root?.routes[idx]?.name;
    if (routeName === 'BodyMetrics') return;
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'BodyMetrics', params: { required: true } }],
    });
  }, [navReady, firebaseReady, wizardDone, user?.uid, userDocHydrated, userDoc]);

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

  // First Firestore snapshot for this uid — avoids wrong route (Main vs Body metrics) during load.
  if (user?.uid && !userDocHydrated) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const needsProfile = Boolean(user && (!userDoc || !userDoc.profile));
  const initialRouteName: keyof RootStackParamList = user
    ? needsProfile
      ? 'BodyMetrics'
      : 'Main'
    : wizardDone
      ? 'Login'
      : 'Onboarding';

  return (
    <NavigationContainer ref={navigationRef} onReady={() => setNavReady(true)}>
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
          options={{
            presentation: 'modal',
            animation: 'slide_from_bottom',
            gestureEnabled: accessLevel !== 'paywalled',
          }}
        />
        <Stack.Screen name="WorkoutSessionDetail" component={WorkoutSessionDetailScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen
          name="BodyMetrics"
          component={BodyMetricsScreen}
          initialParams={{ required: needsProfile }}
          options={({ route }) => ({ gestureEnabled: !route.params?.required })}
        />
        <Stack.Screen name="WeightTracking" component={WeightTrackingScreen} />
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
