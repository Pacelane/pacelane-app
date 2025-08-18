import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { useAuth } from '@/hooks/api/useAuth';
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
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Check if user has data for each onboarding step
  const hasGoals = profile?.goals && Array.isArray(profile.goals) && profile.goals.length > 0;
  const hasGuides = profile?.guides && Array.isArray(profile.guides) && profile.guides.length > 0;
  const hasPillars = profile?.content_pillars && Array.isArray(profile.content_pillars) && profile.content_pillars.length > 0;

  // Create onboarding steps based on actual user data
  const onboardingSteps = onboardingData || [
    { id: 'goals', label: 'Goals', completed: hasGoals },
    { id: 'guides', label: 'Guides', completed: hasGuides },
    { id: 'content-pillars', label: 'Content Pillars', completed: hasPillars },
  ];

  const completedSteps = onboardingSteps.filter(step => step.completed);
  const totalSteps = onboardingSteps.length;
  const progressPercentage = Math.round((completedSteps.length / totalSteps) * 100);

  // Handle click on incomplete items to navigate to profile
  const handleStepClick = (step) => {
    if (!step.completed) {
      navigate('/profile');
    }
  };

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

  const clickableStepItemStyles = {
    ...stepItemStyles,
    cursor: 'pointer',
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
    textDecoration: 'line-through',
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
                ...(step.completed ? stepItemStyles : clickableStepItemStyles),
                backgroundColor: step.completed ? colors.bg.state.soft : 'transparent',
              }}
              onClick={() => handleStepClick(step)}
              role={step.completed ? undefined : "button"}
              tabIndex={step.completed ? undefined : 0}
              onKeyDown={(e) => {
                if (!step.completed && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleStepClick(step);
                }
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
