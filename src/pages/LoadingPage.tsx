import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import SpinningBichaurinho from '@/design-system/components/SpinningBichaurinho';

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
  };

  return (
    <div style={containerStyles}>
      <SpinningBichaurinho 
        variant={16}
        size={64}
        title="Loading..."
        titleSize="md"
        titleWeight="semibold"
        duration={2}
      />
    </div>
  );
};

export default LoadingPage;
