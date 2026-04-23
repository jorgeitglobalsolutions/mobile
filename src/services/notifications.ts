import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
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
