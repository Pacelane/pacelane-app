import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { getCurrentLanguage } from './i18n';

// Get the appropriate date-fns locale
export const getDateFnsLocale = (language = getCurrentLanguage()) => {
  switch (language) {
    case 'pt-BR':
      return ptBR;
    case 'en':
    default:
      return enUS;
  }
};

// Get locale-specific date format patterns
export const getDateFormats = (language = getCurrentLanguage()) => {
  switch (language) {
    case 'pt-BR':
      return {
        date: 'dd/MM/yyyy',
        time: 'HH:mm',
        dateTime: 'dd/MM/yyyy HH:mm',
        monthYear: 'MMMM yyyy',
        dayMonth: 'dd/MM',
        shortDate: 'dd/MM/yy',
        longDate: 'EEEE, dd MMMM yyyy',
        weekday: 'EEEE',
        month: 'MMMM',
      };
    case 'en':
    default:
      return {
        date: 'MM/dd/yyyy',
        time: 'h:mm a',
        dateTime: 'MM/dd/yyyy h:mm a',
        monthYear: 'MMMM yyyy',
        dayMonth: 'MM/dd',
        shortDate: 'MM/dd/yy',
        longDate: 'EEEE, MMMM dd, yyyy',
        weekday: 'EEEE',
        month: 'MMMM',
      };
  }
};

// Safe date parsing
export const parseDate = (dateString) => {
  if (!dateString) return null;
  
  try {
    // Handle ISO strings
    if (typeof dateString === 'string' && dateString.includes('T')) {
      return parseISO(dateString);
    }
    
    // Handle Date objects
    if (dateString instanceof Date) {
      return isValid(dateString) ? dateString : null;
    }
    
    // Handle timestamp numbers
    if (typeof dateString === 'number') {
      return new Date(dateString);
    }
    
    // Try to parse as ISO
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch (error) {
    console.warn('Failed to parse date:', dateString, error);
    return null;
  }
};

// Format date with locale support
export const formatDate = (date, formatString = null, language = getCurrentLanguage()) => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  
  const locale = getDateFnsLocale(language);
  const formats = getDateFormats(language);
  const finalFormat = formatString || formats.date;
  
  try {
    return format(parsedDate, finalFormat, { locale });
  } catch (error) {
    console.warn('Failed to format date:', date, error);
    return '';
  }
};

// Format time with locale support
export const formatTime = (date, language = getCurrentLanguage()) => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  
  const locale = getDateFnsLocale(language);
  const formats = getDateFormats(language);
  
  try {
    return format(parsedDate, formats.time, { locale });
  } catch (error) {
    console.warn('Failed to format time:', date, error);
    return '';
  }
};

// Format date and time with locale support
export const formatDateTime = (date, language = getCurrentLanguage()) => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  
  const locale = getDateFnsLocale(language);
  const formats = getDateFormats(language);
  
  try {
    return format(parsedDate, formats.dateTime, { locale });
  } catch (error) {
    console.warn('Failed to format datetime:', date, error);
    return '';
  }
};

// Format relative time (e.g., "2 hours ago", "há 2 horas")
export const formatRelativeTime = (date, language = getCurrentLanguage()) => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  
  const locale = getDateFnsLocale(language);
  
  try {
    return formatDistanceToNow(parsedDate, {
      addSuffix: true,
      locale,
    });
  } catch (error) {
    console.warn('Failed to format relative time:', date, error);
    return '';
  }
};

// Format month and year
export const formatMonthYear = (date, language = getCurrentLanguage()) => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  
  const locale = getDateFnsLocale(language);
  const formats = getDateFormats(language);
  
  try {
    return format(parsedDate, formats.monthYear, { locale });
  } catch (error) {
    console.warn('Failed to format month/year:', date, error);
    return '';
  }
};

// Format long date (e.g., "Monday, January 1, 2024" or "Segunda-feira, 1 de janeiro de 2024")
export const formatLongDate = (date, language = getCurrentLanguage()) => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  
  const locale = getDateFnsLocale(language);
  const formats = getDateFormats(language);
  
  try {
    return format(parsedDate, formats.longDate, { locale });
  } catch (error) {
    console.warn('Failed to format long date:', date, error);
    return '';
  }
};

// Format weekday name
export const formatWeekday = (date, language = getCurrentLanguage()) => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  
  const locale = getDateFnsLocale(language);
  const formats = getDateFormats(language);
  
  try {
    return format(parsedDate, formats.weekday, { locale });
  } catch (error) {
    console.warn('Failed to format weekday:', date, error);
    return '';
  }
};

// Format month name
export const formatMonth = (date, language = getCurrentLanguage()) => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  
  const locale = getDateFnsLocale(language);
  const formats = getDateFormats(language);
  
  try {
    return format(parsedDate, formats.month, { locale });
  } catch (error) {
    console.warn('Failed to format month:', date, error);
    return '';
  }
};

// Get today's date formatted
export const formatToday = (language = getCurrentLanguage()) => {
  return formatDate(new Date(), null, language);
};

// Get current time formatted
export const formatNow = (language = getCurrentLanguage()) => {
  return formatTime(new Date(), language);
};

// Utility to get smart relative time (shows relative for recent dates, absolute for older ones)
export const formatSmartDate = (date, language = getCurrentLanguage()) => {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  
  const now = new Date();
  const diffInHours = (now - parsedDate) / (1000 * 60 * 60);
  
  // If less than 24 hours ago, show relative time
  if (diffInHours < 24) {
    return formatRelativeTime(parsedDate, language);
  }
  
  // If less than 7 days ago, show day and time
  if (diffInHours < 168) { // 7 days
    const formats = getDateFormats(language);
    const locale = getDateFnsLocale(language);
    const dayTimeFormat = language === 'pt-BR' ? 'EEEE HH:mm' : 'EEEE h:mm a';
    
    try {
      return format(parsedDate, dayTimeFormat, { locale });
    } catch (error) {
      return formatDate(parsedDate, null, language);
    }
  }
  
  // For older dates, show full date
  return formatDate(parsedDate, null, language);
};

// Export all functions as a service object
export const dateService = {
  parseDate,
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  formatMonthYear,
  formatLongDate,
  formatWeekday,
  formatMonth,
  formatToday,
  formatNow,
  formatSmartDate,
  getDateFnsLocale,
  getDateFormats,
};

// Export individual functions for convenience
export {
  formatDate as format,
  formatRelativeTime as relative,
  formatDateTime as datetime,
};