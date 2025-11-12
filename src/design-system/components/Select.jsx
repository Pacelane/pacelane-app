import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CaretDown as ChevronDown, Check } from '@phosphor-icons/react';
import { useTheme } from '../../services/theme-context.jsx';
import { spacing } from '../tokens/spacing.js';
import { cornerRadius } from '../tokens/corner-radius.js';
import { textStyles } from '../styles/typography/typography-styles.js';
import { getShadow } from '../tokens/shadows.js';
import { stroke } from '../tokens/stroke.js';

const Select = ({
  // Core props
  value,
  placeholder = 'Select an option',
  options = [], // Array of { value, label } objects
  onValueChange,
  
  // Styling
  size = 'lg', // 'lg' | 'sm'
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
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const selectRef = useRef(null);
  const triggerRef = useRef(null);
  
  // Size configurations
  const sizeConfig = {
    lg: {
      height: 36,
      padding: { horizontal: spacing.spacing[8], vertical: spacing.spacing[8] },
      gap: spacing.spacing[6],
      iconSize: 18,
    },
    sm: {
      height: 32,
      padding: { horizontal: spacing.spacing[8], vertical: spacing.spacing[8] },
      gap: spacing.spacing[6],
      iconSize: 18,
    }
  };
  
  const config = sizeConfig[size];
  
  // Find selected option
  const selectedOption = options.find(option => option.value === value);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;
      
      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setIsFocused(false);
          triggerRef.current?.focus();
          break;
        case 'Enter':
        case ' ':
          if (event.target.getAttribute('data-option-value')) {
            const value = event.target.getAttribute('data-option-value');
            handleOptionSelect(value);
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);
  
  // Style functions
  const getBackgroundColor = () => {
    if (disabled) return colors.bg.input.disabled;
    return colors.bg.input.default;
  };
  
  const getTextColor = () => {
    if (disabled) return colors.text.hint;
    if (!selectedOption) return colors.text.muted; // placeholder state
    return colors.text.default;
  };
  
  const getBorderColor = () => {
    if (failed) return colors.border.destructive;
    if (isFocused || isOpen) return colors.border.highlight;
    return colors.border.default;
  };
  
  const getBoxShadow = () => {
    if ((isFocused || isOpen) && !disabled) {
      return getShadow('component.default', colors, { 
        focusType: failed ? 'destructive' : 'input'
      });
    }
    return getShadow('component.default', colors, { withBorder: true });
  };
  
  // Event handlers
  const handleTriggerClick = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    setIsFocused(true);
  };
  
  const handleOptionSelect = (optionValue) => {
    onValueChange?.(optionValue);
    setIsOpen(false);
    setIsFocused(false);
    triggerRef.current?.focus();
  };
  
  const handleTriggerFocus = () => {
    setIsFocused(true);
  };
  
  const handleTriggerBlur = () => {
    // Only blur if not opening the dropdown
    setTimeout(() => {
      if (!isOpen) {
        setIsFocused(false);
      }
    }, 100);
  };
  
  // Trigger styles
  const triggerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: config.height,
    padding: `${config.padding.vertical} ${config.padding.horizontal}`,
    backgroundColor: getBackgroundColor(),
    borderRadius: cornerRadius.borderRadius.md,
    border: `${stroke.DEFAULT} solid ${getBorderColor()}`,
    boxShadow: getBoxShadow(),
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease-in-out',
    ...textStyles.sm.normal,
    color: getTextColor(),
  };
  
  return (
    <div 
      ref={selectRef}
      className={className}
      style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}
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
      
      {/* Trigger */}
      <motion.button
        ref={triggerRef}
        type="button"
        style={triggerStyles}
        onClick={handleTriggerClick}
        onFocus={handleTriggerFocus}
        onBlur={handleTriggerBlur}
        whileTap={!disabled ? { scale: 0.995 } : {}}
        disabled={disabled}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        id={id}
        name={name}
      >
        <span style={{ flex: 1, textAlign: 'left' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <motion.div
          style={{
            display: 'flex',
            alignItems: 'center',
            color: disabled ? colors.icon.disabled : colors.icon.muted,
          }}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          <ChevronDown size={config.iconSize} />
        </motion.div>
      </motion.button>
      
      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 50,
              marginTop: spacing.spacing[4],
              backgroundColor: colors.bg.card.default,
              borderRadius: cornerRadius.borderRadius.md,
              border: `${stroke.DEFAULT} solid ${colors.border.default}`,
              boxShadow: getShadow('regular.modalMd', colors, { withBorder: true }),
              maxHeight: '200px',
              overflowY: 'auto',
              padding: spacing.spacing[4],
            }}
            role="listbox"
          >
            {options.map((option, index) => {
              const isSelected = option.value === value;
              
              return (
                <motion.div
                  key={option.value}
                  data-option-value={option.value}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: `${spacing.spacing[8]} ${spacing.spacing[12]}`,
                    borderRadius: cornerRadius.borderRadius.sm,
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease-in-out',
                    backgroundColor: isSelected ? colors.bg.state.soft : 'transparent',
                    ...textStyles.sm.normal,
                    color: isSelected ? colors.text.accent : colors.text.default,
                  }}
                  onClick={() => handleOptionSelect(option.value)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.target.style.backgroundColor = colors.bg.state.ghost;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={0}
                >
                  <span>{option.label}</span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      style={{ color: colors.icon.accent }}
                    >
                      <Check size={16} />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
      
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

export default Select;
