import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEV_SUBSCRIPTION_OVERRIDE_KEY } from '../constants/storageKeys';

/** Dev-only flag: treat subscription as active in the UI without a store purchase. */
export async function getDevSubscriptionOverride(): Promise<boolean> {
  if (!__DEV__) return false;
  try {
    return (await AsyncStorage.getItem(DEV_SUBSCRIPTION_OVERRIDE_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setDevSubscriptionOverride(enabled: boolean): Promise<void> {
  if (!__DEV__) return;
  try {
    if (enabled) {
      await AsyncStorage.setItem(DEV_SUBSCRIPTION_OVERRIDE_KEY, 'true');
    } else {
      await AsyncStorage.removeItem(DEV_SUBSCRIPTION_OVERRIDE_KEY);
    }
  } catch {
    // ignore
  }
}
