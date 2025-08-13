import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../services/theme-context.jsx';
import { spacing } from '../tokens/spacing.js';
import { cornerRadius } from '../tokens/corner-radius.js';
import { textStyles } from '../styles/typography/typography-styles.js';
import { getShadow } from '../tokens/shadows.js';

/**
 * Toggle component - theme-aware switch with smooth animations
 * 
 * @param {Object} props
 * @param {boolean} [props.checked] - Current toggle state
 * @param {boolean} [props.disabled] - Whether the toggle is disabled
 * @param {string} [props.size] - Size variant: 'sm' | 'md' | 'lg'
 * @param {function} [props.onChange] - Callback when toggle state changes
 * @param {string} [props.label] - Optional label text
 * @param {string} [props.description] - Optional description text
 * @param {string} [props.className] - Additional CSS classes
 */
const Toggle = ({
  checked = false,
  disabled = false,
  size = 'md',
  onChange,
  label,
  description,
  className = '',
  ...rest
}) => {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  // Size configurations - using a gap-based approach for reliable sizing
  const sizeConfig = {
    sm: {
      trackWidth: 36,
      trackHeight: 20,
      handleSize: 16,
      gap: spacing.spacing[8],
      textStyle: textStyles.sm.medium,
      descStyle: textStyles.xs.normal,
    },
    md: {
      trackWidth: 44,
      trackHeight: 24,
      handleSize: 20,
      gap: spacing.spacing[12],
      textStyle: textStyles.md.medium,
      descStyle: textStyles.sm.normal,
    },
    lg: {
      trackWidth: 52,
      trackHeight: 28,
      handleSize: 24,
      gap: spacing.spacing[12],
      textStyle: textStyles.lg.medium,
      descStyle: textStyles.md.normal,
    },
  };

  const config = sizeConfig[size];
  
  // Calculate handle positions - centered with proper margins
  const handleMargin = (config.trackHeight - config.handleSize) / 2;
  const handleVerticalMargin = handleMargin - 0.5; // Adjust vertical position slightly
  const handleOffPosition = config.trackWidth - config.handleSize - handleMargin;

  // Handle click
  const handleClick = () => {
    if (!disabled && onChange) {
      onChange(!checked);
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (disabled) return;
    
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  };

  // Container styles
  const containerStyles = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: config.gap,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'opacity 0.15s ease-out',
  };

  // Track styles
  const trackStyles = {
    position: 'relative',
    width: config.trackWidth,
    height: config.trackHeight,
    backgroundColor: checked 
      ? colors.bg.state.primary 
      : colors.bg.muted,
    border: `1px solid ${checked ? colors.border.highlight : colors.border.darker}`,
    borderRadius: cornerRadius.borderRadius.full,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
    outline: 'none',
    boxShadow: isFocused 
      ? getShadow('', colors, { focusType: 'default' })
      : 'none',
    flexShrink: 0,
    padding: 0,
    margin: 0,
  };

  // Handle styles
  const handleStyles = {
    position: 'absolute',
    top: handleVerticalMargin,
    left: handleMargin,
    width: config.handleSize,
    height: config.handleSize,
    backgroundColor: colors.bg.default,
    borderRadius: cornerRadius.borderRadius.full,
    boxShadow: `0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)`,
    transition: 'all 0.2s cubic-bezier(0.4, 0.0, 0.2, 1)',
  };

  // Text content styles
  const textContentStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[4],
    flex: 1,
  };

  const labelStyles = {
    ...config.textStyle,
    color: disabled ? colors.text.muted : colors.text.default,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'color 0.15s ease-out',
    margin: 0,
  };

  const descriptionStyles = {
    ...config.descStyle,
    color: disabled ? colors.text.muted : colors.text.subtle,
    lineHeight: 1.4,
    transition: 'color 0.15s ease-out',
    margin: 0,
  };

  return (
    <div
      style={containerStyles}
      className={className}
      onClick={handleClick}
      {...rest}
    >
      <button
        style={trackStyles}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Toggle'}
        type="button"
      >
        <motion.div
          style={handleStyles}
          initial={false}
          animate={{
            left: checked ? handleOffPosition : handleMargin,
          }}
          transition={{
            type: 'spring',
            stiffness: 700,
            damping: 30,
          }}
        />
      </button>

      {(label || description) && (
        <div style={textContentStyles}>
          {label && (
            <span style={labelStyles}>
              {label}
            </span>
          )}
          {description && (
            <span style={descriptionStyles}>
              {description}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Toggle;