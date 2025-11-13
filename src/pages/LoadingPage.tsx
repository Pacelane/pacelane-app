import React from 'react';
import { useTheme } from '@/services/theme-context';
import { useTranslation } from '@/services/i18n-context';
import { spacing } from '@/design-system/tokens/spacing';
import SubtleLoadingSpinner from '@/design-system/components/SubtleLoadingSpinner';

const LoadingPage = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();

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
      <SubtleLoadingSpinner 
        title={t('loading.title')}
        size={16}
      />
    </div>
  );
};

export default LoadingPage;
