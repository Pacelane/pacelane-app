import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import commonPtBR from '../locales/pt-BR/common.json';
import onboardingPtBR from '../locales/pt-BR/onboarding.json';
import pagesPtBR from '../locales/pt-BR/pages.json';
import componentsPtBR from '../locales/pt-BR/components.json';

import commonEn from '../locales/en/common.json';
import onboardingEn from '../locales/en/onboarding.json';
import pagesEn from '../locales/en/pages.json';
import componentsEn from '../locales/en/components.json';

const resources = {
  'pt-BR': {
    common: commonPtBR,
    onboarding: onboardingPtBR,
    pages: pagesPtBR,
    components: componentsPtBR,
  },
  en: {
    common: commonEn,
    onboarding: onboardingEn,
    pages: pagesEn,
    components: componentsEn,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'pt-BR', // Português do Brasil como padrão
    defaultNS: 'common',
    ns: ['common', 'onboarding', 'pages', 'components'],
    
    // Detecção de idioma
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    
    // Interpolação
    interpolation: {
      escapeValue: false, // React já faz escape
    },
    
    // Configurações de pluralização
    pluralSeparator: '_',
    contextSeparator: '_',
    
    // Debug (desabilitar em produção)
    debug: false,
    
    // React options
    react: {
      useSuspense: false,
    },
  });

export default i18n;

