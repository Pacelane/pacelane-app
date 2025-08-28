import React, { useState } from 'react';
import { ChevronDown, Globe } from 'lucide-react';
import { useTheme } from '@/services/theme-context';
import { useLanguagePreference } from '@/hooks/useTranslation';
import { spacing } from '../tokens/spacing';
import { cornerRadius } from '../tokens/corner-radius';
import { textStyles } from '../styles/typography/typography-styles';
import { shadows, getShadow } from '../tokens/shadows';
import Button from './Button';

const LanguageSwitcher = ({ 
  variant = 'button', // 'button' | 'dropdown' | 'minimal'
  size = 'md',
  showLabel = true,
  className,
  ...rest 
}) => {
  const { colors } = useTheme();
  const { currentLanguage, supportedLanguages, setLanguage } = useLanguagePreference();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentLang = supportedLanguages.find(lang => lang.code === currentLanguage);
  
  // Handle language selection
  const handleLanguageSelect = (languageCode) => {
    setLanguage(languageCode);
    setIsOpen(false);
  };
  
  // Minimal variant - just shows flag/code
  if (variant === 'minimal') {
    return (
      <div 
        style={{ 
          position: 'relative',
          display: 'inline-block'
        }}
        className={className}
        {...rest}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.spacing[4],
            padding: spacing.spacing[4],
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: cornerRadius.borderRadius.sm,
            color: colors.text.subtle,
            cursor: 'pointer',
            fontSize: textStyles.sm.medium.fontSize,
            fontWeight: textStyles.sm.medium.fontWeight,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = colors.bg.state.ghostHover;
            e.target.style.color = colors.text.default;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = colors.text.subtle;
          }}
        >
          <Globe size={14} />
          <span>{currentLang?.code.toUpperCase()}</span>
        </button>
        
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: spacing.spacing[4],
              backgroundColor: colors.bg.card.default,
              border: `1px solid ${colors.border.default}`,
              borderRadius: cornerRadius.borderRadius.md,
              boxShadow: getShadow('regular.modalSm', colors, { withBorder: true }),
              zIndex: 1000,
              minWidth: '160px',
            }}
          >
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                style={{
                  width: '100%',
                  padding: spacing.spacing[12],
                  border: 'none',
                  backgroundColor: currentLanguage === lang.code 
                    ? colors.bg.state.primarySoft 
                    : 'transparent',
                  color: currentLanguage === lang.code 
                    ? colors.text.accent 
                    : colors.text.default,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: textStyles.sm.medium.fontSize,
                  fontWeight: textStyles.sm.medium.fontWeight,
                  transition: 'all 0.2s ease',
                  borderRadius: 
                    lang === supportedLanguages[0] 
                      ? `${cornerRadius.borderRadius.md} ${cornerRadius.borderRadius.md} 0 0`
                      : lang === supportedLanguages[supportedLanguages.length - 1]
                      ? `0 0 ${cornerRadius.borderRadius.md} ${cornerRadius.borderRadius.md}`
                      : '0',
                }}
                onMouseEnter={(e) => {
                  if (currentLanguage !== lang.code) {
                    e.target.style.backgroundColor = colors.bg.state.ghostHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentLanguage !== lang.code) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {lang.nativeName}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Dropdown variant
  if (variant === 'dropdown') {
    return (
      <div 
        style={{ 
          position: 'relative',
          display: 'inline-block'
        }}
        className={className}
        {...rest}
      >
        <Button
          variant="default"
          style="ghost"
          size={size}
          label={showLabel ? currentLang?.nativeName : currentLang?.code.toUpperCase()}
          leadIcon={<Globe size={16} />}
          tailIcon={<ChevronDown size={12} />}
          onClick={() => setIsOpen(!isOpen)}
        />
        
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: spacing.spacing[4],
              backgroundColor: colors.bg.card.default,
              border: `1px solid ${colors.border.default}`,
              borderRadius: cornerRadius.borderRadius.md,
              boxShadow: getShadow('regular.modalSm', colors, { withBorder: true }),
              zIndex: 1000,
              minWidth: '200px',
            }}
          >
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageSelect(lang.code)}
                style={{
                  width: '100%',
                  padding: spacing.spacing[12],
                  border: 'none',
                  backgroundColor: currentLanguage === lang.code 
                    ? colors.bg.state.primarySoft 
                    : 'transparent',
                  color: currentLanguage === lang.code 
                    ? colors.text.accent 
                    : colors.text.default,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: textStyles.sm.medium.fontSize,
                  fontWeight: textStyles.sm.medium.fontWeight,
                  transition: 'all 0.2s ease',
                  borderRadius: 
                    lang === supportedLanguages[0] 
                      ? `${cornerRadius.borderRadius.md} ${cornerRadius.borderRadius.md} 0 0`
                      : lang === supportedLanguages[supportedLanguages.length - 1]
                      ? `0 0 ${cornerRadius.borderRadius.md} ${cornerRadius.borderRadius.md}`
                      : '0',
                }}
                onMouseEnter={(e) => {
                  if (currentLanguage !== lang.code) {
                    e.target.style.backgroundColor = colors.bg.state.ghostHover;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentLanguage !== lang.code) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{lang.nativeName}</span>
                  <span style={{ 
                    fontSize: textStyles.xs.normal.fontSize,
                    color: colors.text.muted 
                  }}>
                    {lang.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
  
  // Button variant (default)
  return (
    <div style={{ display: 'flex', gap: spacing.spacing[8] }} className={className} {...rest}>
      {supportedLanguages.map((lang) => (
        <Button
          key={lang.code}
          variant="default"
          style={currentLanguage === lang.code ? 'primary' : 'ghost'}
          size={size}
          label={showLabel ? lang.nativeName : lang.code.toUpperCase()}
          onClick={() => handleLanguageSelect(lang.code)}
        />
      ))}
    </div>
  );
};

export default LanguageSwitcher;