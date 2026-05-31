'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // Load language preference from localStorage if in client environment
  useEffect(() => {
    const saved = localStorage.getItem('farmora_lang') as Language;
    if (saved && ['en', 'te', 'hi', 'ta', 'kn'].includes(saved)) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('farmora_lang', lang);
    
    // Dispatch custom event to notify external listeners if any
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('farmora_lang_change', { detail: lang }));
    }
  };

  /**
   * Helper translation function mapping string keys to dictionary items.
   */
  const t = (key: string): string => {
    const langDict = translations[language] || translations['en'];
    // Solve nested keys if any (not needed currently but good for robust code)
    const val = (langDict as any)[key];
    if (val !== undefined) return val;
    
    // Fail-safe fallback to English translation
    const fallbackVal = (translations['en'] as any)[key];
    if (fallbackVal !== undefined) return fallbackVal;

    return key; // return key as final resort
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
