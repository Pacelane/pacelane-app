# Internationalization (i18n) Guide

This document provides comprehensive guidelines for implementing and maintaining internationalization in the Pacelane Design System application.

## Overview

The application uses **i18next** framework with **react-i18next** for React integration, supporting English (default) and Portuguese (Brazil).

### Architecture

- **Framework**: i18next + react-i18next
- **Language Detection**: Browser language, localStorage preference
- **Supported Languages**: English (`en`), Portuguese Brazil (`pt-BR`)
- **Translation Structure**: Namespaced JSON files organized by feature area

## Directory Structure

```
src/
├── services/
│   ├── i18n.js              # i18n configuration and setup
│   └── dateService.js       # Date/time localization utilities
├── hooks/
│   ├── useTranslation.js    # Enhanced translation hooks
│   └── useLocale.js         # Locale-specific utilities
└── locales/
    ├── en/                  # English translations
    │   ├── common.json      # Common UI elements
    │   ├── pages.json       # Page-specific content
    │   └── components.json  # Component-specific content
    └── pt-BR/              # Portuguese (Brazil) translations
        ├── common.json
        ├── pages.json
        └── components.json
```

## Translation Namespaces

### 1. Common (`common.json`)
Universal UI elements used across the application:
- Buttons (save, cancel, delete, etc.)
- Navigation items
- Form validation messages
- State messages (loading, error, success)
- Time/date relative phrases

### 2. Pages (`pages.json`)
Page-specific content including:
- Page titles and subtitles
- Section headings
- Page-specific actions and content

### 3. Components (`components.json`)
Component-specific content:
- Input placeholders and labels
- Modal titles and messages
- Table headers and pagination
- File upload messages

## Usage Examples

### Basic Translation

```jsx
import { useTranslation } from '@/hooks/useTranslation';

const MyComponent = () => {
  const { t } = useTranslation('common'); // or 'pages', 'components'
  
  return (
    <div>
      <h1>{t('navigation.home')}</h1>
      <button>{t('buttons.save')}</button>
    </div>
  );
};
```

### Page-Specific Translations

```jsx
import { usePageTranslation } from '@/hooks/useTranslation';

const ProfilePage = () => {
  const { t } = usePageTranslation();
  
  return (
    <div>
      <h1>{t('profile.title')}</h1>
      <p>{t('profile.subtitle')}</p>
    </div>
  );
};
```

### Component Translations

```jsx
import { useComponentTranslation } from '@/hooks/useTranslation';

const SearchInput = () => {
  const { t } = useComponentTranslation();
  
  return (
    <Input 
      placeholder={t('search.placeholder')}
      aria-label={t('search.placeholder')}
    />
  );
};
```

### Cross-Namespace Translation

```jsx
const { t } = useTranslation('common');

// Access other namespaces using colon notation
const pageTitle = t('pages:profile.title');
const buttonLabel = t('components:modal.confirm');
```

### Interpolation and Pluralization

```jsx
const { translatePlural, translateWithFallback } = useTranslation();

// Pluralization
const message = translatePlural('time.minutes_ago', minutesCount);

// With interpolation
const greeting = t('welcome.message', { name: userName });

// With fallback
const label = translateWithFallback('custom.key', 'Default Label');
```

## Language Switching

### Using Language Switcher Component

```jsx
import LanguageSwitcher from '@/design-system/components/LanguageSwitcher';

// Button variant - shows buttons for each language
<LanguageSwitcher variant="button" size="md" />

// Dropdown variant - compact dropdown menu
<LanguageSwitcher variant="dropdown" size="sm" showLabel={true} />

// Minimal variant - just language code with globe icon
<LanguageSwitcher variant="minimal" />
```

### Programmatic Language Changes

```jsx
import { useLanguagePreference } from '@/hooks/useTranslation';

const MyComponent = () => {
  const { currentLanguage, supportedLanguages, setLanguage } = useLanguagePreference();
  
  const handleLanguageChange = (languageCode) => {
    setLanguage(languageCode); // Automatically persists to localStorage
  };
  
  return (
    <select value={currentLanguage} onChange={(e) => handleLanguageChange(e.target.value)}>
      {supportedLanguages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  );
};
```

## Date and Time Localization

### Using Date Service

```jsx
import { dateService } from '@/services/dateService';
import { useLocale } from '@/hooks/useLocale';

const DateDisplay = ({ date }) => {
  const { formatDate, formatRelativeTime } = useLocale();
  
  return (
    <div>
      <span>{formatDate(date)}</span>
      <span>{formatRelativeTime(date)}</span>
    </div>
  );
};
```

### Date Formatting Options

```jsx
import { dateService } from '@/services/dateService';

// Various formatting options
const formatted = {
  date: dateService.formatDate(date),           // 12/25/2023 or 25/12/2023
  time: dateService.formatTime(date),           // 2:30 PM or 14:30
  dateTime: dateService.formatDateTime(date),   // 12/25/2023 2:30 PM
  relative: dateService.formatRelativeTime(date), // 2 hours ago / há 2 horas
  long: dateService.formatLongDate(date),       // Monday, December 25, 2023
  smart: dateService.formatSmartDate(date),     // Smart relative/absolute
};
```

## Design System Integration

### Updated Button Component

The Button component automatically translates loading states:

```jsx
<Button 
  label="Save Changes"
  loading={isLoading}  // Shows "Loading..." or "Carregando..."
  onClick={handleSave}
/>
```

### Language-Aware Components

All design system components support translation through:
- Automatic loading state translation
- Placeholder text translation
- Validation message translation

## Adding New Languages

### 1. Create Translation Files

```bash
mkdir src/locales/[language-code]
cp src/locales/en/* src/locales/[language-code]/
```

### 2. Update i18n Configuration

```javascript
// src/services/i18n.js
const resources = {
  en: { /* existing */ },
  'pt-BR': { /* existing */ },
  '[language-code]': {
    common: require('@/locales/[language-code]/common.json'),
    pages: require('@/locales/[language-code]/pages.json'),
    components: require('@/locales/[language-code]/components.json'),
  },
};

export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
  { code: '[language-code]', name: '[Language Name]', nativeName: '[Native Name]' },
];
```

### 3. Add Date-fns Locale Support

```javascript
// src/services/dateService.js
import { [languageLocale] } from 'date-fns/locale';

export const getDateFnsLocale = (language) => {
  switch (language) {
    case '[language-code]':
      return [languageLocale];
    // ... existing cases
  }
};
```

## Best Practices

### Translation Keys

1. **Use Descriptive Keys**: `buttons.save` instead of `btn1`
2. **Namespace Properly**: Group related translations
3. **Use Dot Notation**: `profile.sections.personal` for hierarchy
4. **Be Consistent**: Follow established patterns

### Content Guidelines

1. **Context Matters**: Provide context for translators
2. **Avoid Concatenation**: Use interpolation instead
3. **Consider Text Length**: Allow for text expansion/contraction
4. **Use Native Pluralization**: Let i18next handle plural rules

### Component Development

1. **Default to Translations**: Never hardcode user-facing text
2. **Provide Fallbacks**: Use `translateWithFallback` for optional content
3. **Test Both Languages**: Always verify layout in both languages
4. **Consider RTL**: Plan for future RTL language support

## Common Patterns

### Form Validation

```jsx
const { t } = useTranslation('common');

const validationRules = {
  required: t('forms.required'),
  email: t('forms.email'),
  minLength: (min) => t('forms.minLength', { count: min }),
};
```

### Error Handling

```jsx
const { t } = useTranslation('common');

const errorMessage = error.code 
  ? t(`errors.${error.code}`, { fallback: t('states.error') })
  : t('states.error');
```

### Dynamic Content

```jsx
const { t, format } = useTranslation();

const message = t('billing.usage', {
  used: format.number(usedCount),
  total: format.number(totalCount),
  percentage: format.percentage(usedCount / totalCount),
});
```

## Testing Translation Implementation

### Unit Testing

```jsx
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/services/i18n';

// Test component with translations
const renderWithI18n = (component, language = 'en') => {
  i18n.changeLanguage(language);
  
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  );
};

test('displays content in Portuguese', () => {
  renderWithI18n(<MyComponent />, 'pt-BR');
  expect(screen.getByText('Configurações do Perfil')).toBeInTheDocument();
});
```

### Translation Coverage

Ensure all user-facing text is translated by:

1. **Code Review Checklist**: Check for hardcoded strings
2. **Browser Testing**: Test the full application in both languages  
3. **Translation Auditing**: Use i18n debugging to find missing keys

### Performance Testing

Monitor performance impact of i18n:

1. **Bundle Size**: Check translation file sizes
2. **Loading Time**: Measure language switching performance
3. **Memory Usage**: Test with multiple language loads

## Troubleshooting

### Common Issues

1. **Missing Translation Keys**: Check browser console for warnings
2. **Fallback Not Working**: Verify namespace configuration
3. **Date Formatting Errors**: Ensure date-fns locale is imported
4. **Language Not Persisting**: Check localStorage permissions

### Debug Mode

Enable debug mode in development:

```javascript
// src/services/i18n.js
debug: process.env.NODE_ENV === 'development',
```

This logs missing keys and translation operations to the console.

## Future Enhancements

### Planned Features

1. **Translation Management**: Integration with translation management platforms
2. **Automatic Translation**: AI-powered translation suggestions
3. **More Languages**: Spanish, French, German support
4. **RTL Support**: Right-to-left language support
5. **Dynamic Loading**: Load translations on-demand

### Migration Guide

When upgrading the i18n implementation:

1. **Backup Existing Translations**: Always backup before changes
2. **Test Thoroughly**: Verify all translations work correctly
3. **Update Documentation**: Keep this guide current
4. **Communicate Changes**: Inform the team of any breaking changes

---

For questions or issues with internationalization, refer to the [i18next documentation](https://www.i18next.com/) or contact the development team.