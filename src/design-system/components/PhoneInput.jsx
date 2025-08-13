import React, { useState, useEffect } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';
import { stroke } from '@/design-system/tokens/stroke';
import Select from './Select';

// Flag component for better emoji rendering
const FlagEmoji = ({ countryCode }) => {
  const flagMap = {
    'BR': '🇧🇷',
    'US': '🇺🇸',
    'AR': '🇦🇷',
    'MX': '🇲🇽',
    'GB': '🇬🇧',
    'DE': '🇩🇪',
    'FR': '🇫🇷',
    'IT': '🇮🇹',
    'ES': '🇪🇸',
    'PT': '🇵🇹',
    'CA': '🇨🇦',
    'AU': '🇦🇺',
    'JP': '🇯🇵',
    'CN': '🇨🇳',
    'IN': '🇮🇳'
  };
  
  return (
    <span 
      style={{ 
        fontSize: '16px',
        fontFamily: 'Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif',
        marginRight: '6px',
        display: 'inline-block',
        minWidth: '20px'
      }}
    >
      {flagMap[countryCode] || '🏳️'}
    </span>
  );
};

// Country data with flags and phone masks
const COUNTRIES = [
  {
    code: 'BR',
    name: 'Brazil',
    dialCode: '+55',
    mask: '(##) #####-####',
    placeholder: '(11) 99999-9999'
  },
  {
    code: 'US',
    name: 'United States',
    dialCode: '+1',
    mask: '(###) ###-####',
    placeholder: '(555) 123-4567'
  },
  {
    code: 'AR',
    name: 'Argentina',
    dialCode: '+54',
    mask: '### ###-####',
    placeholder: '11 1234-5678'
  },
  {
    code: 'MX',
    name: 'Mexico',
    dialCode: '+52',
    mask: '### ###-####',
    placeholder: '55 1234-5678'
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    dialCode: '+44',
    mask: '#### ### ####',
    placeholder: '7700 900123'
  },
  {
    code: 'DE',
    name: 'Germany',
    dialCode: '+49',
    mask: '### ########',
    placeholder: '30 12345678'
  },
  {
    code: 'FR',
    name: 'France',
    dialCode: '+33',
    mask: '# ## ## ## ##',
    placeholder: '1 23 45 67 89'
  },
  {
    code: 'IT',
    name: 'Italy',
    dialCode: '+39',
    mask: '### ### ####',
    placeholder: '320 123 4567'
  },
  {
    code: 'ES',
    name: 'Spain',
    dialCode: '+34',
    mask: '### ## ## ##',
    placeholder: '612 34 56 78'
  },
  {
    code: 'PT',
    name: 'Portugal',
    dialCode: '+351',
    mask: '### ### ###',
    placeholder: '912 345 678'
  },
  {
    code: 'CA',
    name: 'Canada',
    dialCode: '+1',
    mask: '(###) ###-####',
    placeholder: '(416) 123-4567'
  },
  {
    code: 'AU',
    name: 'Australia',
    dialCode: '+61',
    mask: '### ### ###',
    placeholder: '412 345 678'
  },
  {
    code: 'JP',
    name: 'Japan',
    dialCode: '+81',
    mask: '###-####-####',
    placeholder: '90-1234-5678'
  },
  {
    code: 'CN',
    name: 'China',
    dialCode: '+86',
    mask: '### #### ####',
    placeholder: '138 0013 8000'
  },
  {
    code: 'IN',
    name: 'India',
    dialCode: '+91',
    mask: '##### #####',
    placeholder: '98765 43210'
  }
];

const PhoneInput = ({
  // Core props
  value = '',
  onChange,
  placeholder,
  
  // Country selection
  defaultCountry = 'BR',
  onCountryChange,
  
  // Styling
  size = 'lg',
  disabled = false,
  failed = false,
  
  // Content
  label,
  caption,
  required = false,
  
  // Standard props
  id,
  name,
  className = '',
  ...rest
}) => {
  const { colors } = useTheme();
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Find country data
  const countryData = COUNTRIES.find(c => c.code === selectedCountry) || COUNTRIES[0];
  
  // Initialize country and phone number from value
  useEffect(() => {
    if (value && value.includes(' ')) {
      const [dialCode, ...numberParts] = value.split(' ');
      const country = COUNTRIES.find(c => c.dialCode === dialCode);
      if (country) {
        setSelectedCountry(country.code);
        setPhoneNumber(numberParts.join(' '));
      }
    } else if (value) {
      setPhoneNumber(value);
    }
  }, []);
  
  // Apply phone number mask
  const applyMask = (input, mask) => {
    const cleanInput = input.replace(/\D/g, '');
    let maskedValue = '';
    let inputIndex = 0;
    
    for (let i = 0; i < mask.length && inputIndex < cleanInput.length; i++) {
      if (mask[i] === '#') {
        maskedValue += cleanInput[inputIndex];
        inputIndex++;
      } else {
        maskedValue += mask[i];
      }
    }
    
    return maskedValue;
  };
  
  // Remove mask from phone number
  const removeMask = (maskedValue) => {
    return maskedValue.replace(/\D/g, '');
  };
  
  // Handle phone number input change
  const handlePhoneChange = (e) => {
    const inputValue = e.target.value;
    const cleanValue = removeMask(inputValue);
    const maskedValue = applyMask(cleanValue, countryData.mask);
    
    setPhoneNumber(maskedValue);
    
    // Build full international phone number
    const fullNumber = maskedValue ? `${countryData.dialCode} ${maskedValue}` : '';
    onChange?.(fullNumber);
  };
  
  // Handle country selection change
  const handleCountryChange = (countryCode) => {
    const newCountryData = COUNTRIES.find(c => c.code === countryCode);
    setSelectedCountry(countryCode);
    
    // Clear phone number when changing country
    setPhoneNumber('');
    onChange?.('');
    
    onCountryChange?.(newCountryData);
  };
  
  // Size configurations
  const sizeConfig = {
    lg: {
      height: 36,
      padding: { horizontal: spacing.spacing[8], vertical: spacing.spacing[8] },
      gap: spacing.spacing[8],
    },
    sm: {
      height: 32,
      padding: { horizontal: spacing.spacing[8], vertical: spacing.spacing[8] },
      gap: spacing.spacing[8],
    }
  };
  
  const config = sizeConfig[size];
  
  // Get flag emoji with fallback
  const getFlagEmoji = (countryCode) => {
    const flagMap = {
      'BR': '🇧🇷',
      'US': '🇺🇸', 
      'AR': '🇦🇷',
      'MX': '🇲🇽',
      'GB': '🇬🇧',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'PT': '🇵🇹',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'JP': '🇯🇵',
      'CN': '🇨🇳',
      'IN': '🇮🇳'
    };
    return flagMap[countryCode] || '🏳️';
  };

  // Create country options for Select component
  const countryOptions = COUNTRIES.map(country => ({
    value: country.code,
    label: `${getFlagEmoji(country.code)} ${country.dialCode}`,
    country: country
  }));
  
  // Style functions
  const getBackgroundColor = () => {
    if (disabled) return colors.bg.input.disabled;
    return colors.bg.input.default;
  };
  
  const getTextColor = () => {
    if (disabled) return colors.text.hint;
    return colors.text.default;
  };
  
  const getBorderColor = () => {
    if (failed) return colors.border.destructive;
    return colors.border.default;
  };
  
  const getFocusBorderColor = () => {
    if (failed) return colors.border.destructive;
    return colors.border.highlight;
  };
  
  const getBoxShadow = () => {
    return getShadow('component.default', colors, { withBorder: true });
  };
  
  return (
    <div 
      className={className}
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: spacing.spacing[4],
        width: '100%'
      }}
      {...rest}
    >
      {label && (
        <label 
          htmlFor={id}
          style={{
            ...textStyles.sm.medium,
            color: colors.text.default,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
        >
          {label}
          {required && (
            <span style={{ color: colors.text.destructive, marginLeft: spacing.spacing[4] }}>
              *
            </span>
          )}
        </label>
      )}
      
      {/* Phone Input Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: spacing.spacing[8],
          width: '100%'
        }}
      >
        {/* Country Selector */}
        <div style={{ minWidth: '120px' }}>
          <Select
            value={selectedCountry}
            onValueChange={handleCountryChange}
            options={countryOptions}
            size={size}
            disabled={disabled}
            placeholder="Country"
          />
        </div>
        
        {/* Phone Number Input */}
        <div style={{ flex: 1 }}>
          <input
            type="tel"
            id={id}
            name={name}
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder || countryData.placeholder}
            disabled={disabled}
            style={{
              width: '100%',
              height: config.height,
              padding: `${config.padding.vertical} ${config.padding.horizontal}`,
              backgroundColor: getBackgroundColor(),
              borderRadius: cornerRadius.borderRadius.md,
              border: `${stroke.DEFAULT} solid ${getBorderColor()}`,
              boxShadow: getBoxShadow(),
              ...textStyles.sm.normal,
              color: getTextColor(),
              fontSize: textStyles.sm.normal.fontSize,
              fontFamily: textStyles.sm.normal.fontFamily,
              fontWeight: textStyles.sm.normal.fontWeight,
              lineHeight: textStyles.sm.normal.lineHeight,
              outline: 'none',
              transition: 'all 0.15s ease-in-out',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = getFocusBorderColor();
              e.target.style.boxShadow = getShadow('component.default', colors, { 
                focusType: failed ? 'destructive' : 'input'
              });
            }}
            onBlur={(e) => {
              e.target.style.borderColor = getBorderColor();
              e.target.style.boxShadow = getBoxShadow();
            }}
          />
        </div>
      </div>
      
      {caption && (
        <div 
          style={{
            ...textStyles.xs.normal,
            color: failed ? colors.text.destructive : colors.text.muted,
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
};

export default PhoneInput;
