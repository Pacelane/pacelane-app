import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation as useI18nextTranslation } from 'react-i18next';

const I18nContext = createContext();

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

export const useTranslation = (namespace) => {
  const { i18n } = useI18nextTranslation();
  const { changeLanguage } = useI18n();
  
  const translation = useI18nextTranslation(namespace);
  
  return {
    ...translation,
    changeLanguage,
  };
};

export const I18nProvider = ({ children }) => {
  const { i18n } = useI18nextTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'pt-BR');

  // Initialize language from localStorage or default to pt-BR
  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage && (savedLanguage === 'pt-BR' || savedLanguage === 'en')) {
      i18n.changeLanguage(savedLanguage);
      setCurrentLanguage(savedLanguage);
    } else {
      // Set default to pt-BR if no saved language
      i18n.changeLanguage('pt-BR');
      localStorage.setItem('i18nextLng', 'pt-BR');
      setCurrentLanguage('pt-BR');
    }
  }, []);

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setCurrentLanguage(lng);
    };

    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const changeLanguage = async (lng) => {
    if (lng === 'pt-BR' || lng === 'en') {
      await i18n.changeLanguage(lng);
      localStorage.setItem('i18nextLng', lng);
      setCurrentLanguage(lng);
    }
  };

  const value = {
    currentLanguage,
    changeLanguage,
    availableLanguages: [
      { code: 'pt-BR', name: 'Português (Brasil)' },
      { code: 'en', name: 'English' },
    ],
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

