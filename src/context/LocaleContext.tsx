import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { AppLanguage } from '../types/firestoreUser';
import { useAuth } from './AuthContext';
import { updateUserSettings } from '../services/userDocument';
import { changeAppLanguage, initI18n, resolveInitialLanguage } from '../i18n';
import { formatLocaleTag } from '../i18n/catalogDisplay';
import { colors } from '../theme';

type LocaleContextValue = {
  language: AppLanguage;
  localeTag: string;
  setLanguage: (lang: AppLanguage) => Promise<void>;
  ready: boolean;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { user, userDoc } = useAuth();
  const [language, setLanguageState] = useState<AppLanguage | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const lang = await resolveInitialLanguage(userDoc?.settings?.language);
      if (cancelled) return;
      await initI18n(lang);
      if (cancelled) return;
      setLanguageState(lang);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready || !userDoc?.settings?.language) return;
    const remote = userDoc.settings.language;
    if (remote && remote !== language) {
      void changeAppLanguage(remote).then(() => setLanguageState(remote));
    }
  }, [userDoc?.settings?.language, ready, language]);

  const setLanguage = useCallback(
    async (lang: AppLanguage) => {
      await changeAppLanguage(lang);
      setLanguageState(lang);
      if (user?.uid) {
        await updateUserSettings(user.uid, { language: lang });
      }
    },
    [user?.uid],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      language: language ?? 'es',
      localeTag: formatLocaleTag(language ?? 'es'),
      setLanguage,
      ready,
    }),
    [language, setLanguage, ready],
  );

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

/** Re-render children when language changes (for non-hook contexts like tab labels). */
export function LocaleAware({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  return <React.Fragment key={i18n.language}>{children}</React.Fragment>;
}

const styles = StyleSheet.create({
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
});
