import Constants from 'expo-constants';

/** True when the app runs inside the Expo Go client (no custom native modules like IAP). */
export function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

/** Native StoreKit / Play Billing is only available outside Expo Go. */
export function canUseNativeInAppPurchases(): boolean {
  return !isExpoGo();
}
