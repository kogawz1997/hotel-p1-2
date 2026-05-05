'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { type Locale, t as translations } from '@/lib/i18n/translations';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'th',
  setLocale: () => {},
  t: (k) => k,
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('th');

  useEffect(() => {
    const stored = localStorage.getItem('maitri-locale') as Locale | null;
    if (stored && translations[stored]) setLocaleState(stored);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem('maitri-locale', l);
  }

  function t(key: string): string {
    return translations[locale]?.[key] || translations['en']?.[key] || key;
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);
