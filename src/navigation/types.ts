import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RoutinesStackParamList = {
  RoutinesHome: undefined;
  RoutineDetail: { routineId: string };
  WorkoutActive: { routineId: string; title: string };
  RoutineBuilder: { routineId?: string; pickedExerciseName?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Routines: NavigatorScreenParams<RoutinesStackParamList> | undefined;
  AddPlaceholder: undefined;
  History: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  SignUp: Partial<{
    weightKg: number;
    heightCm: number;
    goal: 'lose' | 'build' | 'maintain';
  }>;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  ExerciseLibrary: { mode?: 'browse' | 'pick'; returnRoutineId?: string } | undefined;
  ExerciseDetail: { exerciseId: string };
  Paywall: undefined;
  WorkoutSessionDetail: { workoutId: string };
  Settings: undefined;
  BodyMetrics: undefined;
};

export type RoutinesScreenProps<T extends keyof RoutinesStackParamList> = NativeStackScreenProps<
  RoutinesStackParamList,
  T
>;
