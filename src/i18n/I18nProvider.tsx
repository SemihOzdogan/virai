import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { translations, type TranslationKey } from './translations';

export type AppLanguage = 'tr' | 'en';
export type LanguagePreference = 'system' | AppLanguage;

type I18nContextValue = {
  language: AppLanguage;
  preference: LanguagePreference;
  setLanguage: (preference: LanguagePreference) => Promise<void>;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const storageKey = 'virai-language-preference';
const I18nContext = createContext<I18nContextValue | null>(null);

function getSystemLanguage(): AppLanguage {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  return locale.startsWith('tr') ? 'tr' : 'en';
}

export function I18nProvider({ children }: React.PropsWithChildren) {
  const [preference, setPreference] = useState<LanguagePreference>('system');
  const hasChangedPreference = useRef(false);
  const language = preference === 'system' ? getSystemLanguage() : preference;

  useEffect(() => {
    let isActive = true;
    AsyncStorage.getItem(storageKey)
      .then(value => {
        if (
          isActive &&
          !hasChangedPreference.current &&
          (value === 'system' || value === 'tr' || value === 'en')
        ) {
          setPreference(value);
        }
      })
      .catch(error => console.warn('Dil tercihi yüklenemedi.', error));

    return () => {
      isActive = false;
    };
  }, []);

  const setLanguage = useCallback(async (nextPreference: LanguagePreference) => {
    hasChangedPreference.current = true;
    setPreference(nextPreference);
    await AsyncStorage.setItem(storageKey, nextPreference);
  }, []);

  const t = useCallback(
    (key: TranslationKey, values: Record<string, string | number> = {}) =>
      Object.entries(values).reduce<string>(
        (text, [name, value]) => text.replaceAll(`{{${name}}}`, String(value)),
        String(translations[language][key]),
      ),
    [language],
  );

  const value = useMemo(
    () => ({ language, preference, setLanguage, t }),
    [language, preference, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const i18n = useContext(I18nContext);
  if (!i18n) {
    throw new Error('useI18n must be used within I18nProvider.');
  }
  return i18n;
}
