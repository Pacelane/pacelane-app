import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import LoadingSpinner from '@/design-system/components/LoadingSpinner';

const LoadingPage = () => {
  const { colors } = useTheme();

  // Container styles for full-screen centering
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: colors.bg.default,
    padding: spacing.spacing[24],
    gap: spacing.spacing[16],
  };

  const textStyle = {
    ...textStyles.md.medium,
    color: colors.text.subtle,
    margin: 0,
  };

  return (
    <div style={containerStyles}>
      <LoadingSpinner size={48} color={colors.icon.default} />
      <p style={textStyle}>Loading...</p>
    </div>
  );
};

export default LoadingPage;
