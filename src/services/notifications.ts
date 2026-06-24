import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { updatePushToken } from './userDocument';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(uid: string | undefined): Promise<string | null> {
  if (!uid) return null;
  if (Platform.OS === 'web') return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync();
    const value = token.data;
    await updatePushToken(uid, value);
    return value;
  } catch {
    return null;
  }
}

export function setupNotificationResponseHandler(
  navigationRef: NavigationContainerRefWithCurrent<RootStackParamList>,
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(() => {
    if (!navigationRef.isReady()) return;
    navigationRef.navigate('Main', { screen: 'Home' });
  });
  return () => sub.remove();
}
