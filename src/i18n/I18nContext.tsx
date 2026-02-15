import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations, LOCALES } from './translations';
import type { Locale, TranslationKeys } from './translations';

interface I18nContextValue {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: keyof TranslationKeys) => string;
}

const LS_KEY = 'ketsuin_locale';

function detectLocale(): Locale {
    // 1. Check localStorage
    const saved = localStorage.getItem(LS_KEY);
    if (saved && LOCALES.includes(saved as Locale)) return saved as Locale;

    // 2. Check browser language
    const browserLang = navigator.language.slice(0, 2);
    const match = LOCALES.find(l => l === browserLang);
    if (match) return match;

    return 'en';
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [locale, setLocaleState] = useState<Locale>(detectLocale);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem(LS_KEY, newLocale);
    }, []);

    const t = useCallback(
        (key: keyof TranslationKeys): string => {
            return (translations[locale] as TranslationKeys)?.[key] ?? (translations.en as TranslationKeys)[key] ?? key;
        },
        [locale],
    );

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) throw new Error('useI18n must be used within I18nProvider');
    return ctx;
}
