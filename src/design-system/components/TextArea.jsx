import React, { useState, useRef, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../services/theme-context.jsx';
import { spacing } from '../tokens/spacing.js';
import { cornerRadius } from '../tokens/corner-radius.js';
import { textStyles } from '../styles/typography/typography-styles.js';
import { getShadow } from '../tokens/shadows.js';
import { stroke } from '../tokens/stroke.js';

const TextArea = forwardRef(({
  // Core props
  value,
  placeholder,
  label,
  caption,
  required = false,
  
  // Sizing
  rows = 4,
  minRows = 2,
  maxRows = 10,
  autoResize = false,
  
  // States
  disabled = false,
  failed = false,
  
  // Standard props
  onChange,
  onFocus,
  onBlur,
  className = '',
  id,
  name,
  ...rest
}, ref) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef(null);
  
  // Use forwarded ref or fallback to internal ref
  const finalRef = ref || textareaRef;
  
  // Auto-resize functionality
  const adjustHeight = () => {
    if (!autoResize || !finalRef.current) return;
    
    const textarea = finalRef.current;
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const minHeight = lineHeight * minRows;
    const maxHeight = lineHeight * maxRows;
    
    // Reset height to calculate scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  };
  
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
    if (isFocused) return colors.border.highlight;
    return colors.border.default;
  };
  
  const getBoxShadow = () => {
    if (isFocused && !disabled) {
      return getShadow('component.default', colors, { 
        focusType: failed ? 'destructive' : 'input'
      });
    }
    return getShadow('component.default', colors, { withBorder: true });
  };
  
  // Event handlers
  const handleFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };
  
  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };
  
  const handleChange = (e) => {
    onChange?.(e);
    
    // Auto-resize after content change
    if (autoResize) {
      // Use setTimeout to ensure the change is applied before measuring
      setTimeout(adjustHeight, 0);
    }
  };
  
  const handleContainerClick = () => {
    if (!disabled && finalRef.current) {
      finalRef.current.focus();
    }
  };
  
  // Base textarea styles
  const textareaStyles = {
    ...textStyles.sm.normal,
    width: '100%',
    minHeight: autoResize ? `${parseInt(getComputedStyle(document.body).fontSize) * 1.5 * minRows}px` : 'auto',
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: getTextColor(),
    resize: autoResize ? 'none' : 'vertical',
    fontFamily: 'inherit',
    '::placeholder': {
      color: colors.text.muted,
    }
  };
  
  // Container styles
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    padding: spacing.spacing[8],
    backgroundColor: getBackgroundColor(),
    borderRadius: cornerRadius.borderRadius.md,
    border: `${stroke.DEFAULT} solid ${getBorderColor()}`,
    boxShadow: getBoxShadow(),
    cursor: disabled ? 'not-allowed' : 'text',
    transition: 'all 0.15s ease-in-out',
  };
  
  return (
    <div 
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}
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
      
      <motion.div
        style={containerStyles}
        onClick={handleContainerClick}
        whileTap={!disabled ? { scale: 0.995 } : {}}
      >
        <textarea
          ref={finalRef}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          rows={autoResize ? undefined : rows}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={textareaStyles}
          id={id}
          name={name}
          {...rest}
        />
      </motion.div>
      
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
});

TextArea.displayName = 'TextArea';

export default TextArea;
