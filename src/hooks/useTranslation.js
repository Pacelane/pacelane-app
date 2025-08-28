import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { useMemo, useCallback } from 'react';
import { formatters, getCurrentLanguage, changeLanguage, supportedLanguages } from '@/services/i18n';

/**
 * Enhanced translation hook that provides additional utilities
 * @param {string} namespace - The translation namespace to use
 * @returns {object} Translation utilities and functions
 */
export const useTranslation = (namespace = 'common') => {
  const { t, i18n, ready } = useI18nextTranslation(namespace);
  
  // Memoized current language info
  const currentLanguage = useMemo(() => {
    const code = getCurrentLanguage();
    return supportedLanguages.find(lang => lang.code === code) || supportedLanguages[0];
  }, [i18n.language]);
  
  // Language switching function
  const setLanguage = useCallback((languageCode) => {
    changeLanguage(languageCode);
  }, []);
  
  // Enhanced translation function with namespace support
  const translate = useCallback((key, options = {}) => {
    // Support cross-namespace translations
    if (key.includes(':')) {
      return t(key, options);
    }
    
    // Default to current namespace
    return t(key, options);
  }, [t]);
  
  // Plural-aware translation
  const translatePlural = useCallback((key, count, options = {}) => {
    return t(key, { 
      count, 
      ...options 
    });
  }, [t]);
  
  // Format utilities bound to current language
  const format = useMemo(() => ({
    number: (value) => formatters.number(value, i18n.language),
    currency: (value, currency) => formatters.currency(value, currency, i18n.language),
    date: (value, options) => formatters.date(value, options, i18n.language),
    relativeTime: (value, unit) => formatters.relativeTime(value, unit, i18n.language),
  }), [i18n.language]);
  
  // Check if translation exists
  const hasTranslation = useCallback((key) => {
    return i18n.exists(key);
  }, [i18n]);
  
  // Get translation with fallback
  const translateWithFallback = useCallback((key, fallback, options = {}) => {
    if (hasTranslation(key)) {
      return translate(key, options);
    }
    return fallback;
  }, [translate, hasTranslation]);
  
  return {
    // Core translation functions
    t: translate,
    translate,
    translatePlural,
    translateWithFallback,
    
    // Language management
    language: currentLanguage.code,
    languageInfo: currentLanguage,
    supportedLanguages,
    setLanguage,
    
    // Utilities
    format,
    hasTranslation,
    ready,
    
    // i18n instance for advanced usage
    i18n,
  };
};

/**
 * Hook for common translations (buttons, navigation, etc.)
 */
export const useCommonTranslation = () => {
  return useTranslation('common');
};

/**
 * Hook for page-specific translations
 */
export const usePageTranslation = () => {
  return useTranslation('pages');
};

/**
 * Hook for component translations
 */
export const useComponentTranslation = () => {
  return useTranslation('components');
};

/**
 * Hook for managing language preferences with localStorage persistence
 */
export const useLanguagePreference = () => {
  const { language, setLanguage, supportedLanguages } = useTranslation();
  
  const updateLanguagePreference = useCallback((languageCode) => {
    // Update i18n
    setLanguage(languageCode);
    
    // Persist to localStorage
    localStorage.setItem('i18nextLng', languageCode);
    
    // Update document lang attribute for accessibility
    document.documentElement.lang = languageCode;
  }, [setLanguage]);
  
  return {
    currentLanguage: language,
    supportedLanguages,
    setLanguage: updateLanguagePreference,
  };
};

/**
 * Hook for formatted text with interpolation
 */
export const useFormattedTranslation = (namespace = 'common') => {
  const { translate, format } = useTranslation(namespace);
  
  const formatText = useCallback((key, values = {}, options = {}) => {
    // Handle numeric formatting
    const formattedValues = Object.keys(values).reduce((acc, valueKey) => {
      const value = values[valueKey];
      
      // Auto-format numbers and currencies
      if (typeof value === 'number') {
        if (valueKey.includes('currency') || valueKey.includes('price')) {
          acc[valueKey] = format.currency(value);
        } else if (valueKey.includes('count') || valueKey.includes('number')) {
          acc[valueKey] = format.number(value);
        } else {
          acc[valueKey] = value;
        }
      } else if (value instanceof Date) {
        acc[valueKey] = format.date(value);
      } else {
        acc[valueKey] = value;
      }
      
      return acc;
    }, {});
    
    return translate(key, { ...formattedValues, ...options });
  }, [translate, format]);
  
  return {
    formatText,
    format,
  };
};

// Export the base hook as default
export default useTranslation;