import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppLanguage } from '../types/firestoreUser';
import { LOCALE_STORAGE_KEY } from '../constants/storageKeys';
import enCommon from '../locales/en/common.json';
import esCommon from '../locales/es/common.json';

export const SUPPORTED_LANGUAGES: AppLanguage[] = ['es', 'en'];
export const DEFAULT_LANGUAGE: AppLanguage = 'es';

function deviceLanguage(): AppLanguage {
  const tag = Localization.getLocales()[0]?.languageCode ?? 'es';
  return tag.startsWith('es') ? 'es' : 'en';
}

export async function resolveInitialLanguage(
  firestoreLanguage?: AppLanguage | null,
): Promise<AppLanguage> {
  if (firestoreLanguage && SUPPORTED_LANGUAGES.includes(firestoreLanguage)) {
    return firestoreLanguage;
  }
  const stored = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === 'en' || stored === 'es') return stored;
  return deviceLanguage();
}

let initPromise: Promise<void> | null = null;

export function initI18n(language: AppLanguage): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v4',
      lng: language,
      fallbackLng: 'en',
      resources: {
        en: { common: enCommon },
        es: { common: esCommon },
      },
      defaultNS: 'common',
      ns: ['common'],
      interpolation: { escapeValue: false },
    })
    .then(() => undefined);
  return initPromise;
}

export async function changeAppLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem(LOCALE_STORAGE_KEY, language);
}

export default i18n;
