import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RoutinesStackParamList } from './types';
import RoutinesScreen from '../screens/RoutinesScreen';
import RoutineDetailScreen from '../screens/RoutineDetailScreen';
import WorkoutActiveScreen from '../screens/WorkoutActiveScreen';
import RoutineBuilderScreen from '../screens/RoutineBuilderScreen';

const Stack = createNativeStackNavigator<RoutinesStackParamList>();

export default function RoutinesStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoutinesHome" component={RoutinesScreen} />
      <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
      <Stack.Screen name="WorkoutActive" component={WorkoutActiveScreen} />
      <Stack.Screen name="RoutineBuilder" component={RoutineBuilderScreen} />
    </Stack.Navigator>
  );
}
