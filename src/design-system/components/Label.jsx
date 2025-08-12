import React from 'react';
import { useTheme } from '../../services/theme-context.jsx';
import { spacing } from '../tokens/spacing.js';
import { textStyles } from '../styles/typography/typography-styles.js';

const Label = ({
  children,
  htmlFor,
  required = false,
  disabled = false,
  size = 'sm', // 'xs' | 'sm' | 'md'
  className = '',
  style,
  ...rest
}) => {
  const { colors } = useTheme();
  
  // Size configurations
  const sizeStyles = {
    xs: textStyles.xs.medium,
    sm: textStyles.sm.medium,
    md: textStyles.md.medium,
  };
  
  const labelStyles = {
    ...sizeStyles[size],
    color: disabled ? colors.text.hint : colors.text.default,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: spacing.spacing[4],
    ...style,
  };
  
  return (
    <label
      htmlFor={htmlFor}
      className={className}
      style={labelStyles}
      {...rest}
    >
      {children}
      {required && (
        <span style={{ color: colors.text.destructive }}>
          *
        </span>
      )}
    </label>
  );
};

export default Label;
