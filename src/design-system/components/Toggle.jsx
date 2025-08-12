import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../services/theme-context.jsx';
import { spacing } from '../tokens/spacing.js';
import { cornerRadius } from '../tokens/corner-radius.js';
import { shadows, getShadow } from '../tokens/shadows.js';

const Toggle = ({
  // Core props
  checked = false,
  onCheckedChange,
  
  // Variants
  variant = 'default',        // 'default' | 'primary' | 'success' | 'warning' | 'destructive'
  size = 'md',                // 'sm' | 'md' | 'lg'
  
  // States
  disabled = false,
  
  // Standard props
  className = '',
  ...rest
}) => {
  const { colors } = useTheme();
  const [isPressed, setIsPressed] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      width: 32,
      height: 18,
      thumbSize: 14,
      thumbOffset: 2
    },
    md: {
      width: 44,
      height: 24,
      thumbSize: 18,
      thumbOffset: 3
    },
    lg: {
      width: 56,
      height: 30,
      thumbSize: 22,
      thumbOffset: 4
    }
  };

  const config = sizeConfig[size];

  // Variant configurations
  const variantConfig = {
    default: {
      track: {
        off: colors.bg.subtle,
        on: colors.bg.state.primary,
        offBorder: colors.border.default,
        onBorder: colors.border.strong
      },
      thumb: {
        off: colors.bg.card.default,
        on: colors.bg.card.inverted
      }
    },
    primary: {
      track: {
        off: colors.bg.subtle,
        on: colors.bg.state.primary,
        offBorder: colors.border.default,
        onBorder: colors.border.strong
      },
      thumb: {
        off: colors.bg.card.default,
        on: colors.bg.card.inverted
      }
    },
    success: {
      track: {
        off: colors.bg.subtle,
        on: colors.bg.state.success,
        offBorder: colors.border.default,
        onBorder: colors.border.success
      },
      thumb: {
        off: colors.bg.card.default,
        on: colors.bg.card.inverted
      }
    },
    warning: {
      track: {
        off: colors.bg.subtle,
        on: colors.bg.state.warning,
        offBorder: colors.border.default,
        onBorder: colors.border.warning
      },
      thumb: {
        off: colors.bg.card.default,
        on: colors.bg.card.inverted
      }
    },
    destructive: {
      track: {
        off: colors.bg.subtle,
        on: colors.bg.state.destructive,
        offBorder: colors.border.default,
        onBorder: colors.border.destructive
      },
      thumb: {
        off: colors.bg.card.default,
        on: colors.bg.card.inverted
      }
    }
  };

  const variantStyle = variantConfig[variant];

  const handleToggle = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  const handleMouseDown = () => {
    if (!disabled) {
      setIsPressed(true);
    }
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const trackStyles = {
    width: config.width,
    height: config.height,
    backgroundColor: checked ? variantStyle.track.on : variantStyle.track.off,
    border: `1px solid ${checked ? variantStyle.track.onBorder : variantStyle.track.offBorder}`,
    borderRadius: cornerRadius.borderRadius.full,
    position: 'relative' as const,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: checked 
      ? getShadow('component.default', colors)
      : shadows.component.default,
    opacity: disabled ? 0.5 : 1,
    ...rest.style
  };

  const thumbStyles = {
    width: config.thumbSize,
    height: config.thumbSize,
    backgroundColor: checked ? variantStyle.thumb.on : variantStyle.thumb.off,
    borderRadius: cornerRadius.borderRadius.full,
    position: 'absolute' as const,
    top: config.thumbOffset,
    left: checked ? config.width - config.thumbSize - config.thumbOffset : config.thumbOffset,
    transition: 'all 0.2s ease',
    boxShadow: checked 
      ? getShadow('component.switchHandle', colors)
      : shadows.component.default,
    transform: `scale(${isPressed ? 0.95 : 1})`
  };

  return (
    <motion.div
      className={className}
      style={trackStyles}
      onClick={handleToggle}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      {...rest}
    >
      <motion.div
        style={thumbStyles}
        animate={{
          x: checked ? config.width - config.thumbSize - config.thumbOffset * 2 : 0
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </motion.div>
  );
};

export default Toggle;
