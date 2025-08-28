# Internationalization Testing Guide

This guide provides comprehensive testing strategies and procedures for validating the internationalization implementation in the Pacelane Design System application.

## Testing Strategy Overview

### Testing Levels

1. **Unit Tests**: Individual component translation functionality
2. **Integration Tests**: Translation hooks and service integration
3. **E2E Tests**: Full application language switching scenarios
4. **Manual Testing**: User experience and visual validation
5. **Performance Tests**: Translation loading and switching performance

## Unit Testing

### Setting Up Test Environment

```javascript
// src/test-utils/i18nTestUtils.js
import { render } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Test translations
const testTranslations = {
  en: {
    common: {
      buttons: { save: 'Save', cancel: 'Cancel' },
      navigation: { home: 'Home', profile: 'Profile' },
    },
    pages: {
      profile: { title: 'Profile Settings' },
    },
  },
  'pt-BR': {
    common: {
      buttons: { save: 'Salvar', cancel: 'Cancelar' },
      navigation: { home: 'Início', profile: 'Perfil' },
    },
    pages: {
      profile: { title: 'Configurações do Perfil' },
    },
  },
};

// Initialize test i18n instance
const createTestI18n = (language = 'en') => {
  const testI18n = i18n.createInstance();
  
  testI18n
    .use(initReactI18next)
    .init({
      lng: language,
      fallbackLng: 'en',
      debug: false,
      resources: testTranslations,
      interpolation: { escapeValue: false },
      react: { useSuspense: false },
    });
    
  return testI18n;
};

// Custom render function with i18n
export const renderWithI18n = (component, language = 'en') => {
  const testI18n = createTestI18n(language);
  
  return render(
    <I18nextProvider i18n={testI18n}>
      {component}
    </I18nextProvider>
  );
};

export { testTranslations };
```

### Component Translation Tests

```javascript
// src/design-system/components/__tests__/Button.test.jsx
import { renderWithI18n } from '@/test-utils/i18nTestUtils';
import { screen } from '@testing-library/react';
import Button from '../Button';

describe('Button Component i18n', () => {
  test('displays loading text in English', () => {
    renderWithI18n(
      <Button label="Save" loading={true} />,
      'en'
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays loading text in Portuguese', () => {
    renderWithI18n(
      <Button label="Salvar" loading={true} />,
      'pt-BR'
    );
    
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  test('displays correct label text', () => {
    renderWithI18n(
      <Button label="Save Changes" />,
      'en'
    );
    
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });
});
```

### Page Translation Tests

```javascript
// src/pages/__tests__/Profile.test.jsx
import { renderWithI18n } from '@/test-utils/i18nTestUtils';
import { screen } from '@testing-library/react';
import Profile from '../Profile';

describe('Profile Page i18n', () => {
  test('displays page title in English', () => {
    renderWithI18n(<Profile />, 'en');
    
    expect(screen.getByRole('heading', { level: 1 }))
      .toHaveTextContent('Profile Settings');
  });

  test('displays page title in Portuguese', () => {
    renderWithI18n(<Profile />, 'pt-BR');
    
    expect(screen.getByRole('heading', { level: 1 }))
      .toHaveTextContent('Configurações do Perfil');
  });

  test('displays page subtitle correctly', () => {
    renderWithI18n(<Profile />, 'pt-BR');
    
    expect(screen.getByText(/Gerencie suas informações pessoais/))
      .toBeInTheDocument();
  });
});
```

### Hook Translation Tests

```javascript
// src/hooks/__tests__/useTranslation.test.js
import { renderHook, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { useTranslation } from '../useTranslation';
import { createTestI18n } from '@/test-utils/i18nTestUtils';

const wrapper = ({ children, language = 'en' }) => (
  <I18nextProvider i18n={createTestI18n(language)}>
    {children}
  </I18nextProvider>
);

describe('useTranslation Hook', () => {
  test('returns correct translation for English', () => {
    const { result } = renderHook(
      () => useTranslation('common'),
      { wrapper }
    );
    
    expect(result.current.t('buttons.save')).toBe('Save');
  });

  test('returns correct translation for Portuguese', () => {
    const { result } = renderHook(
      () => useTranslation('common'),
      { wrapper: ({ children }) => wrapper({ children, language: 'pt-BR' }) }
    );
    
    expect(result.current.t('buttons.save')).toBe('Salvar');
  });

  test('handles missing keys with fallback', () => {
    const { result } = renderHook(
      () => useTranslation('common'),
      { wrapper }
    );
    
    expect(result.current.translateWithFallback('missing.key', 'Fallback'))
      .toBe('Fallback');
  });

  test('language switching works correctly', () => {
    const { result } = renderHook(
      () => useTranslation('common'),
      { wrapper }
    );
    
    act(() => {
      result.current.setLanguage('pt-BR');
    });
    
    expect(result.current.language).toBe('pt-BR');
  });
});
```

## Integration Testing

### Language Switcher Integration

```javascript
// src/design-system/components/__tests__/LanguageSwitcher.integration.test.jsx
import { renderWithI18n } from '@/test-utils/i18nTestUtils';
import { screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from '../LanguageSwitcher';

describe('LanguageSwitcher Integration', () => {
  test('changes language when button clicked', async () => {
    renderWithI18n(<LanguageSwitcher variant="button" />);
    
    const portugueseButton = screen.getByText('Português (Brasil)');
    fireEvent.click(portugueseButton);
    
    // Check if language changed (this would need access to global state)
    // You might need to mock or wrap this test differently
  });

  test('dropdown shows correct options', () => {
    renderWithI18n(<LanguageSwitcher variant="dropdown" />);
    
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Português (Brasil)')).toBeInTheDocument();
  });
});
```

### Date Service Integration

```javascript
// src/services/__tests__/dateService.integration.test.js
import { dateService } from '../dateService';

describe('Date Service Integration', () => {
  test('formats dates correctly for English', () => {
    const date = new Date('2023-12-25T14:30:00');
    
    expect(dateService.formatDate(date, null, 'en')).toBe('12/25/2023');
    expect(dateService.formatTime(date, 'en')).toBe('2:30 PM');
  });

  test('formats dates correctly for Portuguese', () => {
    const date = new Date('2023-12-25T14:30:00');
    
    expect(dateService.formatDate(date, null, 'pt-BR')).toBe('25/12/2023');
    expect(dateService.formatTime(date, 'pt-BR')).toBe('14:30');
  });

  test('handles relative time correctly', () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const englishRelative = dateService.formatRelativeTime(oneHourAgo, 'en');
    const portugueseRelative = dateService.formatRelativeTime(oneHourAgo, 'pt-BR');
    
    expect(englishRelative).toContain('hour');
    expect(portugueseRelative).toContain('hora');
  });
});
```

## E2E Testing (Cypress/Playwright)

### Language Switching E2E Tests

```javascript
// cypress/integration/i18n.spec.js
describe('Internationalization E2E', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('switches language from English to Portuguese', () => {
    // Verify initial English content
    cy.contains('Welcome to Pacelane!').should('be.visible');
    
    // Open language switcher
    cy.get('[data-testid="language-switcher"]').click();
    
    // Select Portuguese
    cy.contains('Português (Brasil)').click();
    
    // Verify Portuguese content
    cy.contains('Bem-vindo ao Pacelane!').should('be.visible');
    
    // Verify language persists after reload
    cy.reload();
    cy.contains('Bem-vindo ao Pacelane!').should('be.visible');
  });

  it('maintains language preference across navigation', () => {
    // Set language to Portuguese
    cy.get('[data-testid="language-switcher"]').click();
    cy.contains('Português (Brasil)').click();
    
    // Navigate to profile page
    cy.get('[data-testid="nav-profile"]').click();
    
    // Verify Portuguese content on profile page
    cy.contains('Configurações do Perfil').should('be.visible');
    
    // Navigate back to home
    cy.get('[data-testid="nav-home"]').click();
    
    // Verify still in Portuguese
    cy.contains('Bem-vindo ao Pacelane!').should('be.visible');
  });

  it('displays correct date formats for different languages', () => {
    // Check English date format
    cy.contains(/\d{1,2}\/\d{1,2}\/\d{4}/).should('be.visible'); // MM/DD/YYYY
    
    // Switch to Portuguese
    cy.get('[data-testid="language-switcher"]').click();
    cy.contains('Português (Brasil)').click();
    
    // Check Portuguese date format (this might need more specific selectors)
    cy.contains(/\d{1,2}\/\d{1,2}\/\d{4}/).should('be.visible'); // DD/MM/YYYY
  });
});
```

### Form Validation E2E Tests

```javascript
describe('Form Validation i18n', () => {
  it('shows validation errors in correct language', () => {
    cy.visit('/profile');
    
    // Switch to Portuguese
    cy.get('[data-testid="language-switcher"]').click();
    cy.contains('Português (Brasil)').click();
    
    // Try to submit form with empty required field
    cy.get('[data-testid="name-input"]').clear();
    cy.get('[data-testid="save-button"]').click();
    
    // Verify Portuguese error message
    cy.contains('Este campo é obrigatório').should('be.visible');
  });
});
```

## Manual Testing Checklist

### Visual Testing

- [ ] **Layout Integrity**: Text doesn't overflow or break layout in either language
- [ ] **Text Expansion**: Portuguese text (typically 20-30% longer) fits in UI elements
- [ ] **Font Rendering**: Special characters (ç, ã, õ) display correctly
- [ ] **Button Sizing**: Buttons accommodate longer Portuguese text
- [ ] **Navigation**: Menu items display correctly in both languages
- [ ] **Modal Dialogs**: All modal content fits and displays properly

### Functional Testing

- [ ] **Language Switching**: Immediate UI update without page refresh
- [ ] **Persistence**: Language preference survives browser restart
- [ ] **Navigation**: All pages display in selected language
- [ ] **Forms**: Validation messages appear in correct language
- [ ] **Error Handling**: Error messages display in selected language
- [ ] **Date/Time**: Formats display according to locale (MM/DD vs DD/MM)

### Content Testing

- [ ] **Translation Quality**: All translations are accurate and natural
- [ ] **Context Appropriateness**: Translations fit the UI context
- [ ] **Consistency**: Same terms translated consistently across app
- [ ] **Completeness**: No missing translations or fallback text
- [ ] **Special Characters**: Portuguese accents and symbols display correctly

### Edge Cases

- [ ] **Mixed Content**: Pages with user-generated content in different languages
- [ ] **Long Text**: Very long translations don't break layout
- [ ] **Empty States**: Empty state messages display in correct language
- [ ] **Loading States**: Loading messages appear in selected language
- [ ] **Error States**: Error boundaries show localized error messages

## Performance Testing

### Translation Loading Performance

```javascript
// Performance test for translation loading
describe('Translation Performance', () => {
  test('translation loading time is acceptable', async () => {
    const startTime = performance.now();
    
    // Import and initialize i18n
    const { default: i18n } = await import('@/services/i18n');
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Should load within 100ms
    expect(loadTime).toBeLessThan(100);
  });

  test('language switching is fast', async () => {
    const { changeLanguage } = await import('@/services/i18n');
    
    const startTime = performance.now();
    await changeLanguage('pt-BR');
    const endTime = performance.now();
    
    const switchTime = endTime - startTime;
    
    // Language switch should be under 50ms
    expect(switchTime).toBeLessThan(50);
  });
});
```

### Bundle Size Impact

```bash
# Analyze bundle size impact of translations
npm run build
npx webpack-bundle-analyzer build/static/js/*.js

# Check translation file sizes
ls -la src/locales/**/*.json
```

## Automated Testing Scripts

### Translation Coverage Script

```javascript
// scripts/checkTranslationCoverage.js
const fs = require('fs');
const path = require('path');

const checkTranslationCoverage = () => {
  const enTranslations = require('../src/locales/en/common.json');
  const ptTranslations = require('../src/locales/pt-BR/common.json');
  
  const enKeys = getAllKeys(enTranslations);
  const ptKeys = getAllKeys(ptTranslations);
  
  const missingInPt = enKeys.filter(key => !ptKeys.includes(key));
  const extraInPt = ptKeys.filter(key => !enKeys.includes(key));
  
  console.log('Translation Coverage Report:');
  console.log(`English keys: ${enKeys.length}`);
  console.log(`Portuguese keys: ${ptKeys.length}`);
  
  if (missingInPt.length > 0) {
    console.log(`\\nMissing in Portuguese: ${missingInPt.length}`);
    missingInPt.forEach(key => console.log(`  - ${key}`));
  }
  
  if (extraInPt.length > 0) {
    console.log(`\\nExtra in Portuguese: ${extraInPt.length}`);
    extraInPt.forEach(key => console.log(`  - ${key}`));
  }
  
  return missingInPt.length === 0 && extraInPt.length === 0;
};

const getAllKeys = (obj, prefix = '') => {
  let keys = [];
  
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  
  return keys;
};

// Run the check
const isComplete = checkTranslationCoverage();
process.exit(isComplete ? 0 : 1);
```

### Hardcoded String Detection

```javascript
// scripts/findHardcodedStrings.js
const fs = require('fs');
const path = require('path');

const findHardcodedStrings = (dir) => {
  const files = fs.readdirSync(dir);
  const hardcodedStrings = [];
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('.')) {
      hardcodedStrings.push(...findHardcodedStrings(filePath));
    } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Look for potential hardcoded strings (basic pattern)
      const stringPattern = /["']([A-Z][a-zA-Z\s]{3,})['"]/g;
      let match;
      
      while ((match = stringPattern.exec(content)) !== null) {
        // Skip if it looks like a translation key or import
        if (!match[1].includes('.') && !match[1].includes('/')) {
          hardcodedStrings.push({
            file: filePath,
            line: content.substring(0, match.index).split('\\n').length,
            string: match[1]
          });
        }
      }
    }
  });
  
  return hardcodedStrings;
};

// Run the detection
const hardcoded = findHardcodedStrings('./src');
if (hardcoded.length > 0) {
  console.log('Potential hardcoded strings found:');
  hardcoded.forEach(item => {
    console.log(`${item.file}:${item.line} - "${item.string}"`);
  });
  process.exit(1);
} else {
  console.log('No hardcoded strings detected!');
  process.exit(0);
}
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/i18n-tests.yml
name: Internationalization Tests

on:
  pull_request:
    paths:
      - 'src/locales/**'
      - 'src/**/*.jsx'
      - 'src/**/*.tsx'

jobs:
  i18n-tests:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Check translation coverage
        run: node scripts/checkTranslationCoverage.js
      
      - name: Find hardcoded strings
        run: node scripts/findHardcodedStrings.js
      
      - name: Run i18n unit tests
        run: npm test -- --testPathPattern=i18n
      
      - name: Run E2E i18n tests
        run: npm run e2e:i18n
```

## Best Practices for Testing

### Test Data Management

1. **Use Realistic Data**: Test with actual Portuguese content
2. **Test Edge Cases**: Very long translations, special characters
3. **Mock External Services**: Don't depend on translation APIs in tests
4. **Consistent Test Data**: Use the same test translations across tests

### Test Organization

1. **Separate i18n Tests**: Group translation-specific tests
2. **Test Each Namespace**: Ensure all namespaces are tested
3. **Test All Components**: Every user-facing component should have i18n tests
4. **Document Test Cases**: Explain why each test case is important

### Maintenance

1. **Update Tests with New Features**: Add i18n tests for new components
2. **Review Translation Changes**: Test when translations are updated
3. **Monitor Performance**: Track translation loading performance over time
4. **Regular Audits**: Periodically check for untranslated content

---

This testing guide ensures comprehensive validation of the internationalization implementation. Regular execution of these tests will maintain translation quality and prevent i18n regressions.