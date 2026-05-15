"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type AppLocale = 'fr' | 'en';
export type AppTheme = 'dark' | 'light';

const STORAGE_LOCALE = 'nexus_locale';
const STORAGE_THEME = 'nexus_theme';

type PreferencesContextType = {
  locale: AppLocale;
  theme: AppTheme;
  setLocale: (l: AppLocale) => void;
  setTheme: (t: AppTheme) => void;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined
);

function readStoredLocale(): AppLocale {
  if (typeof window === 'undefined') return 'fr';
  const v = localStorage.getItem(STORAGE_LOCALE);
  return v === 'en' ? 'en' : 'fr';
}

function readStoredTheme(): AppTheme {
  if (typeof window === 'undefined') return 'dark';
  const v = localStorage.getItem(STORAGE_THEME);
  return v === 'light' ? 'light' : 'dark';
}

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [locale, setLocaleState] = useState<AppLocale>('fr');
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setThemeState(readStoredTheme());
    setReady(true);
  }, []);

  const setLocale = useCallback((l: AppLocale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_LOCALE, l);
  }, []);

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_THEME, t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale === 'fr' ? 'fr' : 'en';
    document.documentElement.setAttribute('data-theme', theme);
  }, [locale, theme, ready]);

  const value = useMemo(
    () => ({ locale, theme, setLocale, setTheme }),
    [locale, theme, setLocale, setTheme]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return ctx;
}
