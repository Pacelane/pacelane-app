import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { useTranslation } from '@/services/i18n-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { shadows, getShadow } from '@/design-system/tokens/shadows';
import { stroke } from '@/design-system/tokens/stroke';
import { colors as primitiveColors } from '@/design-system/tokens/primitive-colors';
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import StatusBadge from '@/design-system/components/StatusBadge';
import Checkbox from '@/design-system/components/Checkbox';

const PacingInput = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  // Days of the week
  const daysOfWeek = [
    { id: 'mon', label: t('onboarding.pacing.days.mondayShort'), fullName: t('onboarding.pacing.days.monday') },
    { id: 'tue', label: t('onboarding.pacing.days.tuesdayShort'), fullName: t('onboarding.pacing.days.tuesday') },
    { id: 'wed', label: t('onboarding.pacing.days.wednesdayShort'), fullName: t('onboarding.pacing.days.wednesday') },
    { id: 'thu', label: t('onboarding.pacing.days.thursdayShort'), fullName: t('onboarding.pacing.days.thursday') },
    { id: 'fri', label: t('onboarding.pacing.days.fridayShort'), fullName: t('onboarding.pacing.days.friday') },
    { id: 'sat', label: t('onboarding.pacing.days.saturdayShort'), fullName: t('onboarding.pacing.days.saturday') },
    { id: 'sun', label: t('onboarding.pacing.days.sundayShort'), fullName: t('onboarding.pacing.days.sunday') },
  ];

  // Handle day selection
  const toggleDay = (dayId: string) => {
    setSelectedDays((prev) =>
      prev.includes(dayId)
        ? prev.filter((id) => id !== dayId)
        : [...prev, dayId]
    );
  };

  // Handle button clicks
  const handleGoBack = () => {
    navigate('/onboarding/whatsapp');
  };

  const handleContinue = () => {
    // Navigate to Goals input page
    console.log('Selected Days:', selectedDays);
    navigate('/onboarding/goals');
  };

  // Page container styles
  const pageContainerStyles = {
    minHeight: '100vh',
    backgroundColor: colors.bg.muted,
    display: 'flex',
    flexDirection: 'column' as const,
  };

  // Main content container styles (below TopNav)
  const mainContentStyles = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.spacing[24],
  };

  // Main card container styles
  const mainCardStyles = {
    width: '580px',
    height: '480px',
    backgroundColor: 'transparent',
    borderRadius: cornerRadius.borderRadius.lg,
    border: `${stroke.DEFAULT} solid ${colors.border.default}`,
    boxShadow: getShadow('regular.card', colors, { withBorder: false }),
    display: 'flex',
    flexDirection: 'row' as const,
    overflow: 'hidden',
  };

  // Main container (left side) styles
  const mainContainerStyles = {
    flex: 1,
    backgroundColor: colors.bg.card.default,
    borderRight: `${stroke.DEFAULT} solid ${colors.border.default}`,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  };

  // Content container styles (top part of main container)
  const contentContainerStyles = {
    flex: 1,
    borderBottom: `${stroke.DEFAULT} solid ${colors.border.default}`,
    paddingTop: spacing.spacing[36],
    paddingBottom: spacing.spacing[24],
    paddingLeft: spacing.spacing[36],
    paddingRight: spacing.spacing[36],
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[16],
  };

  // Text container styles
  const textContainerStyles = {
    flex: 1,
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[8],
  };

  // Title styles using Instrument Serif
  const titleStyles = {
    fontFamily: typography.fontFamily['instrument-serif'],
    fontSize: typography.desktop.size['3xl'],
    fontWeight: typography.desktop.weight.normal,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Subtitle styles
  const subtitleStyles = {
    ...textStyles.sm.normal,
    color: colors.text.muted,
    margin: 0,
  };

  // Frequency card styles
  const frequencyCardStyles = {
    border: `${stroke.DEFAULT} solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    padding: spacing.spacing[20],
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[16],
  };

  // Card title styles
  const cardTitleStyles = {
    ...textStyles.sm.medium,
    color: colors.text.default,
    margin: 0,
  };

  // Card subtitle styles
  const cardSubtitleStyles = {
    ...textStyles.xs.normal,
    color: colors.text.subtle,
    margin: 0,
  };

  // Days row container styles
  const daysRowStyles = {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: spacing.spacing[8],
    justifyContent: 'space-between',
  };

  // Day checkbox container styles
  const dayCheckboxContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: spacing.spacing[6],
  };

  // Day label styles
  const dayLabelStyles = {
    ...textStyles.xs.medium,
    color: colors.text.default,
    margin: 0,
  };

  // Button container styles (bottom part of main container)
  const buttonContainerStyles = {
    paddingTop: spacing.spacing[20],
    paddingBottom: spacing.spacing[20],
    paddingLeft: spacing.spacing[36],
    paddingRight: spacing.spacing[36],
    display: 'flex',
    flexDirection: 'row' as const,
    gap: spacing.spacing[4],
  };

  // Accuracy bar (right side) styles
  const accuracyBarStyles = {
    width: '200px',
    backgroundColor: colors.bg.subtle,
    paddingTop: spacing.spacing[16],
    paddingBottom: spacing.spacing[16],
    paddingLeft: spacing.spacing[16],
    paddingRight: spacing.spacing[16],
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  };

  // Bar container styles
  const barContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'stretch',
    width: '100%',
  };

  // Lines bar container styles
  const linesBarContainerStyles = {
    width: '100%',
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '2px',
  };

  // Individual line bar styles (with red accent for first 4 lines, orange for next 4)
  const getLineBarStyles = (index: number) => ({
    flex: '1 1 0',
    minWidth: '2px',
    height: '18px',
    backgroundColor: 
      index < 4 
        ? primitiveColors.red[500] 
        : index < 8 
        ? primitiveColors.orange[500] 
        : primitiveColors.transparentDark[10],
    borderRadius: cornerRadius.borderRadius['2xs'],
  });

  // Divider styles
  const dividerStyles = {
    width: '100%',
    height: '1px',
    backgroundColor: colors.border.default,
  };

  // Steps container styles
  const stepsContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[6],
  };

  // Step item styles
  const stepItemStyles = {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: spacing.spacing[8],
  };

  // Step text styles
  const stepTextStyles = {
    ...textStyles.xs.normal,
    color: colors.text.muted,
    margin: 0,
    flex: 1,
  };

  // Label text styles
  const labelTextStyles = {
    ...textStyles.xs.semibold,
    color: colors.text.muted,
    margin: 0,
  };

  // Info text styles
  const infoTextStyles = {
    ...textStyles.xs.normal,
    color: colors.text.muted,
    margin: 0,
  };

  // Steps list
  const steps = [
    { label: t('onboarding.progress.steps.linkedIn'), active: true },
    { label: t('onboarding.progress.steps.whatsapp'), active: true },
    { label: t('onboarding.progress.steps.pacing'), active: false },
    { label: t('onboarding.progress.steps.goals'), active: false },
    { label: t('onboarding.progress.steps.pillars'), active: false },
    { label: t('onboarding.progress.steps.format'), active: false },
    { label: t('onboarding.progress.steps.knowledge'), active: false },
  ];

  return (
    <div style={pageContainerStyles}>
      {/* TopNav Bar - Stuck to the top */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <TopNav />
      </div>

      {/* Main content container */}
      <div style={mainContentStyles}>
        {/* Main card container */}
        <div style={mainCardStyles}>
          {/* Main container (left side) */}
          <div style={mainContainerStyles}>
            {/* Content container */}
            <div style={contentContainerStyles}>
              {/* Text container */}
              <div style={textContainerStyles}>
                <h1 style={titleStyles}>{t('onboarding.pacing.title')}</h1>
                <p style={subtitleStyles}>
                  {t('onboarding.pacing.subtitle')}
                </p>
              </div>

              {/* Frequency card */}
              <div style={frequencyCardStyles}>
                <div>
                  <p style={cardTitleStyles}>{t('onboarding.pacing.frequencyTitle')}</p>
                  <p style={{ ...cardSubtitleStyles, marginTop: spacing.spacing[4] }}>
                    {t('onboarding.pacing.frequencySubtitle')}
                  </p>
                </div>

                {/* Days of the week row */}
                <div style={daysRowStyles}>
                  {daysOfWeek.map((day) => (
                    <div
                      key={day.id}
                      style={dayCheckboxContainerStyles}
                    >
                      <Checkbox
                        checked={selectedDays.includes(day.id)}
                        onChange={() => toggleDay(day.id)}
                      />
                      <p style={dayLabelStyles}>{day.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Button container */}
            <div style={buttonContainerStyles}>
              <div style={{ flex: 1 }}>
                <Button
                  style="secondary"
                  size="sm"
                  label={t('onboarding.pacing.backButton')}
                  onClick={handleGoBack}
                  fullWidth
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  style="primary"
                  size="sm"
                  label={t('onboarding.pacing.continueButton')}
                  onClick={handleContinue}
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* Accuracy bar (right side) */}
          <div style={accuracyBarStyles}>
            {/* Bar container */}
            <div style={barContainerStyles}>
              <p style={labelTextStyles}>{t('onboarding.progress.accuracyLabel')}</p>
              <div style={{ marginTop: spacing.spacing[8] }}>
                <div style={linesBarContainerStyles}>
                  {[...Array(27)].map((_, index) => (
                    <div key={index} style={getLineBarStyles(index)} />
                  ))}
                </div>
              </div>
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[4] }}>20% {t('onboarding.progress.completed')}</p>
              <div style={{ ...dividerStyles, marginTop: spacing.spacing[8] }} />
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[8] }}>
                {t('onboarding.progress.infoText')}
              </p>
            </div>

            {/* Steps container */}
            <div style={stepsContainerStyles}>
              <div style={dividerStyles} />
              {steps.map((step) => (
                <React.Fragment key={step.label}>
                  <div style={stepItemStyles}>
                    <StatusBadge active={step.active} />
                    <p style={stepTextStyles}>{step.label}</p>
                  </div>
                  <div style={dividerStyles} />
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PacingInput;

