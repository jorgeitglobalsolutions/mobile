import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
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

export default function MainTabs() {
  return (
    <View style={styles.flex}>
      <SubscriptionPaywallEffect />
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
});
