import React, { createContext, useContext } from 'react';
import { translations } from '@/translations/pt-BR';

/**
 * I18n Context - Manages translations across the application
 * 
 * Currently supports Brazilian Portuguese (pt-BR)
 * 
 * Usage:
 * - Wrap your app with I18nProvider
 * - Use useTranslation() hook to access translations
 * - Access translations via t('key.path')
 */

const I18nContext = createContext();

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

export const I18nProvider = ({ children }) => {
  /**
   * Get translation by key path with optional parameter interpolation
   * @param {string} key - Dot-notation key path (e.g., 'auth.signIn.title')
   * @param {object} params - Optional parameters to interpolate (e.g., {date: '2025-01-01'})
   * @returns {string} - Translated string
   */
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key; // Return key as fallback
      }
    }
    
    // If value is a string and params are provided, replace placeholders
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }
    
    return value;
  };

  const value = {
    t,
    translations,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

