import { Platform } from 'react-native';
import Constants from 'expo-constants';

export type LegalUrls = {
  termsUrl: string;
  privacyUrl: string;
  /** Optional support email for deletion requests */
  supportEmail?: string;
};

export function getLegalUrls(): LegalUrls {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
  return {
    termsUrl: extra.legalTermsUrl ?? 'https://example.com/terms',
    privacyUrl: extra.legalPrivacyUrl ?? 'https://example.com/privacy',
    supportEmail: extra.supportEmail,
  };
}

export function subscriptionManageUrl(): string {
  if (Platform.OS === 'ios') {
    return 'https://apps.apple.com/account/subscriptions';
  }
  return 'https://play.google.com/store/account/subscriptions';
}
