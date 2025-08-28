import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enCommon from '@/locales/en/common.json';
import enPages from '@/locales/en/pages.json';
import enComponents from '@/locales/en/components.json';

import ptBRCommon from '@/locales/pt-BR/common.json';
import ptBRPages from '@/locales/pt-BR/pages.json';
import ptBRComponents from '@/locales/pt-BR/components.json';

// Translation resources
const resources = {
  en: {
    common: enCommon,
    pages: enPages,
    components: enComponents,
  },
  'pt-BR': {
    common: ptBRCommon,
    pages: ptBRPages,
    components: ptBRComponents,
  },
};

// Language detection options
const detection = {
  // Detection order and options
  order: [
    'localStorage',        // Check localStorage first for user preference
    'navigator',          // Then browser language
    'htmlTag',           // Then HTML lang attribute
    'path',              // Then URL path
    'subdomain',         // Then subdomain
  ],
  
  // Cache user language preference
  caches: ['localStorage'],
  
  // Exclude certain detection methods if needed
  excludeCacheFor: ['cimode'],
  
  // Convert country codes to our supported locales
  convertDetectedLanguage: (lng) => {
    // Handle Portuguese variants
    if (lng.startsWith('pt')) {
      return 'pt-BR'; // Default to Brazilian Portuguese
    }
    
    // Handle English variants
    if (lng.startsWith('en')) {
      return 'en';
    }
    
    // Return original or fallback
    return lng;
  },
};

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Resources
    resources,
    
    // Default language
    fallbackLng: 'en',
    
    // Default namespace
    defaultNS: 'common',
    
    // Available namespaces
    ns: ['common', 'pages', 'components'],
    
    // Language detection
    detection,
    
    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
      format: function(value, format, lng) {
        // Custom formatting for specific types
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value);
        }
        if (format === 'currency') {
          const currency = lng === 'pt-BR' ? 'BRL' : 'USD';
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency,
          }).format(value);
        }
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng).format(new Date(value));
        }
        if (format === 'relative') {
          return new Intl.RelativeTimeFormat(lng).format(value.value, value.unit);
        }
        return value;
      },
    },
    
    // Pluralization
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Development options
    debug: process.env.NODE_ENV === 'development',
    
    // React specific options
    react: {
      useSuspense: false, // Disable suspense to prevent loading issues
      bindI18n: 'languageChanged',
      bindI18nStore: '',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    },
    
    // Backend options for future API integration
    backend: {
      // Configure if using backend translation loading
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // Save missing keys to help with development
    saveMissing: process.env.NODE_ENV === 'development',
    missingKeyHandler: (lng, ns, key, fallbackValue) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${ns}:${key} for language: ${lng}`);
      }
    },
    
    // Key separator
    keySeparator: '.',
    nsSeparator: ':',
    
    // Return objects for complex translations
    returnObjects: true,
  });

// Export i18n instance
export default i18n;

// Export language utilities
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
];

export const getCurrentLanguage = () => i18n.language;
export const changeLanguage = (lang) => i18n.changeLanguage(lang);

// Language-specific utilities
export const isRTL = (lang = i18n.language) => {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(lang);
};

export const getLanguageDirection = (lang = i18n.language) => {
  return isRTL(lang) ? 'rtl' : 'ltr';
};

// Format utilities for consistent number/date formatting
export const formatters = {
  number: (value, lang = i18n.language) => {
    return new Intl.NumberFormat(lang).format(value);
  },
  
  currency: (value, currency = null, lang = i18n.language) => {
    const currencyCode = currency || (lang === 'pt-BR' ? 'BRL' : 'USD');
    return new Intl.NumberFormat(lang, {
      style: 'currency',
      currency: currencyCode,
    }).format(value);
  },
  
  date: (value, options = {}, lang = i18n.language) => {
    return new Intl.DateTimeFormat(lang, options).format(new Date(value));
  },
  
  relativeTime: (value, unit, lang = i18n.language) => {
    return new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(value, unit);
  },
};