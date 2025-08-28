import { useMemo } from 'react';
import { useTranslation } from './useTranslation';
import { format as formatDate } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

/**
 * Hook for locale-specific functionality like date formatting
 */
export const useLocale = () => {
  const { language } = useTranslation();
  
  // Date-fns locale mapping
  const dateFnsLocale = useMemo(() => {
    switch (language) {
      case 'pt-BR':
        return ptBR;
      case 'en':
      default:
        return enUS;
    }
  }, [language]);
  
  // Locale-specific configuration
  const localeConfig = useMemo(() => {
    switch (language) {
      case 'pt-BR':
        return {
          currency: 'BRL',
          currencySymbol: 'R$',
          dateFormat: 'dd/MM/yyyy',
          timeFormat: 'HH:mm',
          dateTimeFormat: 'dd/MM/yyyy HH:mm',
          decimal: ',',
          thousands: '.',
          firstDayOfWeek: 0, // Sunday
        };
      case 'en':
      default:
        return {
          currency: 'USD',
          currencySymbol: '$',
          dateFormat: 'MM/dd/yyyy',
          timeFormat: 'h:mm a',
          dateTimeFormat: 'MM/dd/yyyy h:mm a',
          decimal: '.',
          thousands: ',',
          firstDayOfWeek: 0, // Sunday
        };
    }
  }, [language]);
  
  // Date formatting functions
  const formatDateLocale = (date, format = localeConfig.dateFormat) => {
    return formatDate(date, format, { locale: dateFnsLocale });
  };
  
  const formatTimeLocale = (date, format = localeConfig.timeFormat) => {
    return formatDate(date, format, { locale: dateFnsLocale });
  };
  
  const formatDateTimeLocale = (date, format = localeConfig.dateTimeFormat) => {
    return formatDate(date, format, { locale: dateFnsLocale });
  };
  
  // Relative time formatting
  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    
    if (diffInMinutes < 1) {
      return language === 'pt-BR' ? 'agora mesmo' : 'just now';
    } else if (diffInMinutes < 60) {
      const key = diffInMinutes === 1 ? 'time.minutes_ago' : 'time.minutes_ago_plural';
      return useTranslation().t(key, { count: diffInMinutes });
    } else if (diffInHours < 24) {
      const key = diffInHours === 1 ? 'time.hours_ago' : 'time.hours_ago_plural';
      return useTranslation().t(key, { count: diffInHours });
    } else if (diffInDays < 7) {
      const key = diffInDays === 1 ? 'time.days_ago' : 'time.days_ago_plural';
      return useTranslation().t(key, { count: diffInDays });
    } else {
      const key = diffInWeeks === 1 ? 'time.weeks_ago' : 'time.weeks_ago_plural';
      return useTranslation().t(key, { count: diffInWeeks });
    }
  };
  
  // Number formatting
  const formatNumber = (number, options = {}) => {
    return new Intl.NumberFormat(language, {
      ...options,
    }).format(number);
  };
  
  // Currency formatting
  const formatCurrency = (amount, currency = localeConfig.currency) => {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency,
    }).format(amount);
  };
  
  // Percentage formatting
  const formatPercentage = (value, decimals = 1) => {
    return new Intl.NumberFormat(language, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value / 100);
  };
  
  return {
    language,
    dateFnsLocale,
    localeConfig,
    
    // Date/time formatting
    formatDate: formatDateLocale,
    formatTime: formatTimeLocale,
    formatDateTime: formatDateTimeLocale,
    formatRelativeTime,
    
    // Number formatting
    formatNumber,
    formatCurrency,
    formatPercentage,
  };
};

export default useLocale;