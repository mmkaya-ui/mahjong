'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Translations, Language } from '@/types';
import { tr } from '@/locales/tr';
import { en } from '@/locales/en';
import { de } from '@/locales/de';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = {
    tr,
    en,
    de,
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguage] = useState<Language>('tr');

    useEffect(() => {
        // Load from localStorage if available
        const saved = localStorage.getItem('zen_mahjong_lang') as Language;
        if (saved && (saved === 'tr' || saved === 'en' || saved === 'de')) {
            setLanguage(saved);
        }
    }, []);

    const handleSetLanguage = (lang: Language) => {
        setLanguage(lang);
        localStorage.setItem('zen_mahjong_lang', lang);
    };

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage: handleSetLanguage,
                t: translations[language],
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
