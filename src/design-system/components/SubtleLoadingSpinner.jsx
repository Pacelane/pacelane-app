import React from 'react';
import { useTheme } from '@/services/theme-context';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { spacing } from '@/design-system/tokens/spacing';
import LoadingSpinner from '@/design-system/components/LoadingSpinner';

const SubtleLoadingSpinner = ({
  title = "Loading...",
  size = 16,
  gap = spacing.spacing[12],
  className,
  ...rest
}) => {
  const { colors } = useTheme();

  // Container styles
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  };

  // Spinner container styles
  const spinnerContainerStyles = {
    marginBottom: gap,
  };

  // Title styles - using small medium text with muted color
  const titleStyles = {
    ...textStyles.sm.medium,
    color: colors.text.muted,
    margin: 0,
  };

  return (
    <div style={containerStyles} className={className} {...rest}>
      <div style={spinnerContainerStyles}>
        <LoadingSpinner 
          size={size} 
          color={colors.text.muted}
        />
      </div>
      
      {title && (
        <p style={titleStyles}>
          {title}
        </p>
      )}
    </div>
  );
};

export default SubtleLoadingSpinner;
