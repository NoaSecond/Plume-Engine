import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Language = 'en' | 'fr';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

import { translations, Translations } from './locales';

const translationsMap: Record<Language, Record<string, string>> = translations;

export function LanguageProvider({ children }: { children: ReactNode }) {
    // Try to read from localStorage or default to 'fr' since user speaks french
    const [language, setLanguageState] = useState<Language>(() => {
        try {
            const stored = localStorage.getItem('plume_language');
            return (stored === 'en' || stored === 'fr') ? stored : 'fr';
        } catch {
            return 'fr';
        }
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        try {
            localStorage.setItem('plume_language', lang);
            // Optional: Post to backend if we want to save it similarly to theme
            // window.chrome.webview.postMessage({ action: 'save-config', key: 'language', value: lang });
        } catch { }
    };

    const t = (key: string): string => {
        return translationsMap[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
