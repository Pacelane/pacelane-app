import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../services/theme-context.jsx';
import { spacing } from '../tokens/spacing.js';
import { cornerRadius } from '../tokens/corner-radius.js';
import { textStyles } from '../styles/typography/typography-styles.js';
import { shadows, getShadow } from '../tokens/shadows.js';
import DropdownMenu from './DropdownMenu.jsx';
import { CaretDown as ChevronDown } from '@phosphor-icons/react';

const DropdownButton = ({
  // Core props
  label = 'Select',         // Button text
  items = [],              // Dropdown menu items - same format as DropdownMenu
  size = 'lg',             // 'lg' | 'md' | 'sm' | 'xs' | '2xs' (matches Button sizes)
  
  // States
  disabled = false,
  
  // DropdownMenu props
  position = 'bottom-right',
  minWidth = '160px',
  
  // Standard props
  onClick,                 // Called when button is clicked (before dropdown opens)
  className,
  onMouseEnter,
  onMouseLeave,
  onMouseDown,
  onMouseUp,
  onFocus,
  onBlur,
  ...rest
}) => {
  const { colors } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Size configurations - matching Button component
  const sizeConfig = {
    lg: {
      padding: { horizontal: spacing.spacing[12], vertical: spacing.spacing[8] },
      gap: spacing.spacing[8],
      iconSize: 12,
      textStyle: textStyles.sm.normal,
      borderRadius: cornerRadius.borderRadius.sm
    },
    md: {
      padding: { horizontal: spacing.spacing[10], vertical: spacing.spacing[6] },
      gap: spacing.spacing[6],
      iconSize: 12,
      textStyle: textStyles.sm.normal,
      borderRadius: cornerRadius.borderRadius.sm
    },
    sm: {
      padding: { horizontal: spacing.spacing[8], vertical: spacing.spacing[4] },
      gap: spacing.spacing[4],
      iconSize: 10,
      textStyle: textStyles.sm.normal,
      borderRadius: cornerRadius.borderRadius.sm
    },
    xs: {
      padding: { horizontal: spacing.spacing[6], vertical: spacing.spacing[3] },
      gap: spacing.spacing[4],
      iconSize: 10,
      textStyle: textStyles.xs.normal,
      borderRadius: cornerRadius.borderRadius.xs
    },
    '2xs': {
      padding: { horizontal: spacing.spacing[4], vertical: spacing.spacing[2] },
      gap: spacing.spacing[2],
      iconSize: 8,
      textStyle: textStyles.xs.normal,
      borderRadius: cornerRadius.borderRadius.xs
    },
  };

  // Style configuration - using secondary button style as base
  const getStyleConfig = () => {
    return {
      default: {
        backgroundColor: colors.bg.card.default,
        color: colors.text.default,
        borderColor: colors.border.default,
        shadow: shadows.component.default
      },
      hover: {
        backgroundColor: colors.bg.state.secondaryHover,
        color: colors.text.default,
        borderColor: colors.border.default,
        shadow: shadows.component.default
      },
      press: {
        backgroundColor: colors.bg.state.secondaryPress,
        color: colors.text.default,
        borderColor: colors.border.default,
        shadow: shadows.component.default
      },
      focus: {
        backgroundColor: colors.bg.card.default,
        color: colors.text.default,
        borderColor: colors.border.default,
        shadow: getShadow('component.focus', colors, { focusType: 'default' })
      },
      disabled: {
        backgroundColor: colors.bg.state.disabled,
        color: colors.text.hint,
        borderColor: colors.border.default,
        shadow: 'none'
      },
      // Special state when dropdown is open
      open: {
        backgroundColor: colors.bg.state.secondaryPress,
        color: colors.text.default,
        borderColor: colors.border.default,
        shadow: getShadow('component.focus', colors, { focusType: 'default' })
      }
    };
  };

  // Determine current state
  const getCurrentState = () => {
    if (disabled) return 'disabled';
    if (isDropdownOpen) return 'open';
    if (isFocused) return 'focus';
    if (isPressed) return 'press';
    if (isHovered) return 'hover';
    return 'default';
  };

  const currentState = getCurrentState();
  const styleConfig = getStyleConfig();
  const currentStyles = styleConfig[currentState];
  const sizeStyles = sizeConfig[size];

  // Calculate final styles
  const buttonStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sizeStyles.gap,
    padding: `${sizeStyles.padding.vertical} ${sizeStyles.padding.horizontal}`,
    border: `1px solid ${currentStyles.borderColor}`,
    borderRadius: sizeStyles.borderRadius,
    backgroundColor: currentStyles.backgroundColor,
    color: currentStyles.color,
    boxShadow: currentStyles.shadow,
    cursor: disabled ? 'not-allowed' : 'pointer',
    outline: 'none',
    userSelect: 'none',
    transition: 'all 0.15s ease-in-out',
    textDecoration: 'none',
    boxSizing: 'border-box',
    position: 'relative',
    ...sizeStyles.textStyle,
    // Add text shadow for consistency with Button component
    textShadow: currentState !== 'disabled' ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none',
  };

  // Event handlers
  const handleMouseEnter = (e) => {
    if (!disabled) setIsHovered(true);
    onMouseEnter?.(e);
  };

  const handleMouseLeave = (e) => {
    setIsHovered(false);
    setIsPressed(false);
    onMouseLeave?.(e);
  };

  const handleMouseDown = (e) => {
    if (!disabled) setIsPressed(true);
    onMouseDown?.(e);
  };

  const handleMouseUp = (e) => {
    setIsPressed(false);
    onMouseUp?.(e);
  };

  const handleFocus = (e) => {
    if (!disabled) setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const handleClick = (e) => {
    if (disabled) return;
    
    // Call onClick prop if provided
    onClick?.(e);
    
    // Toggle dropdown
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleDropdownClose = () => {
    setIsDropdownOpen(false);
  };

  // Icon color - using muted color like secondary button style
  const iconColor = currentState === 'disabled' ? colors.icon.disabled : colors.icon.muted;

  // Simple transitions for colors only
  const transition = {
    backgroundColor: {
      duration: 0.15,
      ease: "easeOut",
    },
    borderColor: {
      duration: 0.15,
      ease: "easeOut",
    },
    boxShadow: {
      duration: 0.15,
      ease: "easeOut",
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <motion.button
        style={buttonStyles}
        className={className}
        transition={transition}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        aria-disabled={disabled}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
        {...rest}
      >
        <span>{label}</span>
        <ChevronDown 
          size={sizeStyles.iconSize} 
          color={iconColor}
          style={{
            transition: 'transform 0.15s ease-in-out',
            transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }}
        />
      </motion.button>
      
      <DropdownMenu
        isOpen={isDropdownOpen}
        onClose={handleDropdownClose}
        items={items}
        position={position}
        minWidth={minWidth}
      />
    </div>
  );
};

export default DropdownButton;
