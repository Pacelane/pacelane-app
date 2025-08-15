import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '../tokens/spacing';
import { cornerRadius } from '../tokens/corner-radius';
import { textStyles } from '../styles/typography/typography-styles';
import { getShadow } from '../tokens/shadows';
import { CheckCircle, Circle } from 'lucide-react';

const OnboardingProgressCard = ({ 
  isCollapsed = false,
  className = '',
  onboardingData,
  onContinueClick,
  ...rest 
}) => {
  const { colors } = useTheme();

  // Use provided onboarding data or fall back to mock data
  const onboardingSteps = onboardingData || [
    { id: 'content-pillars', label: 'Content Pillars', completed: false },
    { id: 'guides', label: 'Guides', completed: false },
    { id: 'inspirations', label: 'Inspirations', completed: false },
  ];

  const completedSteps = onboardingSteps.filter(step => step.completed);
  const totalSteps = onboardingSteps.length;
  const progressPercentage = Math.round((completedSteps.length / totalSteps) * 100);

  // Don't render if collapsed
  if (isCollapsed) {
    return null;
  }

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    padding: `${spacing.spacing[8]} ${spacing.spacing[0]} ${spacing.spacing[16]}`,
    backgroundColor: colors.bg.sidebar.subtle,
    borderTop: `1px solid ${colors.border.default}`,
    transition: 'opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
  };

  const cardStyles = {
    backgroundColor: colors.bg.card.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.md,
    padding: spacing.spacing[16],
    margin: spacing.spacing[16],
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
  };

  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.spacing[12],
  };

  const titleStyles = {
    ...textStyles.sm.semibold,
    color: colors.text.default,
    margin: 0,
  };

  const progressTextStyles = {
    ...textStyles.xs.medium,
    color: colors.text.subtle,
    margin: 0,
  };

  const progressBarContainerStyles = {
    width: '100%',
    height: '4px',
    backgroundColor: colors.bg.input.disabled,
    borderRadius: cornerRadius.borderRadius.full,
    marginBottom: spacing.spacing[16],
    overflow: 'hidden',
  };

  const progressBarStyles = {
    height: '100%',
    backgroundColor: colors.bg.state.primary,
    borderRadius: cornerRadius.borderRadius.full,
    width: `${progressPercentage}%`,
    transition: 'width 0.3s ease-out',
  };

  const stepsContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[8],
  };

  const stepItemStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[8],
    padding: spacing.spacing[6],
    borderRadius: cornerRadius.borderRadius.sm,
    backgroundColor: 'transparent',
    transition: 'background-color 0.15s ease-out',
  };

  const stepLabelStyles = {
    ...textStyles.xs.medium,
    color: colors.text.subtle,
    margin: 0,
    flex: 1,
  };

  const completedStepLabelStyles = {
    ...textStyles.xs.medium,
    color: colors.text.default,
    margin: 0,
    flex: 1,
  };



  return (
    <div style={containerStyles} className={className} {...rest}>
      <div style={cardStyles}>
        {/* Header */}
        <div style={headerStyles}>
          <h3 style={titleStyles}>Onboarding Progress</h3>
          <span style={progressTextStyles}>
            {completedSteps.length}/{totalSteps}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={progressBarContainerStyles}>
          <div style={progressBarStyles} />
        </div>

        {/* Steps List */}
        <div style={stepsContainerStyles}>
          {onboardingSteps.map((step) => (
            <div
              key={step.id}
              style={{
                ...stepItemStyles,
                backgroundColor: step.completed ? colors.bg.state.soft : 'transparent',
              }}
            >
              {step.completed ? (
                <CheckCircle size={14} color={colors.icon.success} />
              ) : (
                <Circle size={14} color={colors.icon.muted} />
              )}
              <span style={step.completed ? completedStepLabelStyles : stepLabelStyles}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingProgressCard;
