import { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

/** Legacy route — forwards to unified Nutrition hub. */
type Props = NativeStackScreenProps<RootStackParamList, 'NutritionDashboard'>;

export default function NutritionDashboardScreen({ navigation }: Props) {
  useEffect(() => {
    navigation.replace('Nutrition', { tab: 'overview' });
  }, [navigation]);
  return null;
}
