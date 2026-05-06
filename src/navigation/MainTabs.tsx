import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { MainTabParamList } from './types';
import BottomTabBar from '../components/BottomTabBar';
import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RoutinesStackNavigator from './RoutinesStackNavigator';
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator<MainTabParamList>();

function AddPlaceholder() {
  return <View style={{ flex: 1 }} />;
}

function SubscriptionPaywallEffect() {
  const navigation = useNavigation();
  const { accessLevel } = useAuth();
  const shown = useRef(false);

  useEffect(() => {
    if (accessLevel === 'paywalled') {
      if (!shown.current) {
        shown.current = true;
        // MainTabs is registered on the root stack; navigate to a sibling modal route.
        navigation.navigate('Paywall' as never);
      }
    } else {
      shown.current = false;
    }
  }, [accessLevel, navigation]);

  return null;
}

function SubscriptionLockOverlay() {
  const navigation = useNavigation();
  const { accessLevel } = useAuth();
  if (accessLevel !== 'paywalled') return null;

  return (
    <View style={styles.lockOverlay}>
      <Text style={styles.lockTitle}>Subscription Required</Text>
      <Text style={styles.lockSub}>Your trial has ended. Subscribe to continue using EM Fit.</Text>
      <TouchableOpacity style={styles.lockCta} onPress={() => navigation.navigate('Paywall' as never)}>
        <Text style={styles.lockCtaText}>Subscribe / Restore</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MainTabs() {
  return (
    <View style={styles.flex}>
      <SubscriptionPaywallEffect />
      <SubscriptionLockOverlay />
      <Tab.Navigator
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Home' }} />
        <Tab.Screen name="Routines" component={RoutinesStackNavigator} options={{ tabBarLabel: 'Routines' }} />
        <Tab.Screen name="AddPlaceholder" component={AddPlaceholder} options={{ tabBarLabel: '' }} />
        <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: 'History' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profile' }} />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lockTitle: { fontSize: 22, fontWeight: '800', marginBottom: 10, color: '#1F2937' },
  lockSub: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 20 },
  lockCta: {
    backgroundColor: '#6D28D9',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  lockCtaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
