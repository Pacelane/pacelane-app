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
import { TextAlignLeft, ListBullets, Article, Smiley } from '@phosphor-icons/react';

const WritingFormatInput = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedFormat, setSelectedFormat] = useState<string>('');

  // Format options with icons
  const formatOptions = [
    { id: 'standard', label: t('onboarding.writingFormat.formats.standard'), icon: TextAlignLeft },
    { id: 'formatted', label: t('onboarding.writingFormat.formats.formatted'), icon: ListBullets },
    { id: 'short', label: t('onboarding.writingFormat.formats.short'), icon: Article },
    { id: 'emojis', label: t('onboarding.writingFormat.formats.emojis'), icon: Smiley },
  ];

  // Get utility text based on selected format
  const getUtilityText = () => {
    switch (selectedFormat) {
      case 'standard':
        return t('onboarding.writingFormat.formats.standardDesc');
      case 'formatted':
        return t('onboarding.writingFormat.formats.formattedDesc');
      case 'short':
        return t('onboarding.writingFormat.formats.shortDesc');
      case 'emojis':
        return t('onboarding.writingFormat.formats.emojisDesc');
      default:
        return t('onboarding.writingFormat.formats.defaultDesc');
    }
  };

  // Get post content based on selected format
  const getPostContent = () => {
    switch (selectedFormat) {
      case 'standard':
        return t('onboarding.writingFormat.samplePost.standard');
      case 'formatted':
        return t('onboarding.writingFormat.samplePost.formatted');
      case 'short':
        return t('onboarding.writingFormat.samplePost.short');
      case 'emojis':
        return t('onboarding.writingFormat.samplePost.emojis');
      default:
        return t('onboarding.writingFormat.samplePost.default');
    }
  };

  // Handle button clicks
  const handleGoBack = () => {
    navigate('/onboarding/pillars');
  };

  const handleContinue = () => {
    // Navigate to Knowledge input page
    console.log('Selected Format:', selectedFormat);
    navigate('/onboarding/knowledge');
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
    overflowY: 'auto' as const,
    scrollbarWidth: 'thin' as const,
    scrollbarColor: `${colors.border.default} transparent`,
  };

  // Text container styles
  const textContainerStyles = {
    width: '100%',
    height: '140px',
    flexShrink: 0,
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

  // Section title styles
  const sectionTitleStyles = {
    ...textStyles.sm.medium,
    color: colors.text.default,
    margin: 0,
  };

  // Format cards row styles
  const formatCardsRowStyles = {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: spacing.spacing[8],
    marginTop: spacing.spacing[12],
  };

  // Format card styles
  const getFormatCardStyles = (isSelected: boolean) => ({
    flex: 1,
    padding: spacing.spacing[8],
    border: `${stroke.DEFAULT} solid ${isSelected ? colors.border.teal : colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.md,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: spacing.spacing[4],
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: isSelected ? colors.bg.badge.teal : 'transparent',
  });

  // Format card icon container styles
  const formatCardIconStyles = {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  // Format card label styles
  const formatCardLabelStyles = {
    ...textStyles.xs.medium,
    color: colors.text.default,
    margin: 0,
  };

  // Utility text styles
  const utilityTextStyles = {
    ...textStyles.xs.normal,
    color: colors.text.subtle,
    margin: 0,
  };

  // LinkedIn post card styles
  const linkedInPostCardStyles = {
    backgroundColor: colors.bg.default,
    border: `${stroke.DEFAULT} solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.md,
    paddingTop: spacing.spacing[16],
    paddingBottom: spacing.spacing[16],
    paddingLeft: spacing.spacing[20],
    paddingRight: spacing.spacing[20],
    boxShadow: getShadow('regular.card', colors, { withBorder: false }),
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[12],
  };

  // Profile row styles
  const profileRowStyles = {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: spacing.spacing[12],
    alignItems: 'center',
  };

  // Avatar styles
  const avatarStyles = {
    width: '48px',
    height: '48px',
    borderRadius: cornerRadius.borderRadius.full,
    backgroundColor: primitiveColors.gray[200],
    flexShrink: 0,
  };

  // Profile info styles
  const profileInfoStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[2],
  };

  // Profile name styles
  const profileNameStyles = {
    ...textStyles.sm.semibold,
    color: colors.text.default,
    margin: 0,
  };

  // Profile title styles
  const profileTitleStyles = {
    ...textStyles.xs.normal,
    color: colors.text.subtle,
    margin: 0,
  };

  // Post content styles
  const postContentStyles = {
    ...textStyles.sm.normal,
    color: colors.text.default,
    margin: 0,
    lineHeight: '1.5',
    whiteSpace: 'pre-line' as const,
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

  // Individual line bar styles (with red accent for first 4 lines, orange for next 12, emerald for next 3)
  const getLineBarStyles = (index: number) => ({
    flex: '1 1 0',
    minWidth: '2px',
    height: '18px',
    backgroundColor: 
      index < 4 
        ? primitiveColors.red[500] 
        : index < 16 
        ? primitiveColors.orange[500]
        : index < 19
        ? primitiveColors.emerald[500]
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
    { label: t('onboarding.progress.steps.pacing'), active: true },
    { label: t('onboarding.progress.steps.goals'), active: true },
    { label: t('onboarding.progress.steps.pillars'), active: true },
    { label: t('onboarding.progress.steps.format'), active: false },
    { label: t('onboarding.progress.steps.knowledge'), active: false },
  ];

  return (
    <div style={pageContainerStyles}>
      {/* Custom scrollbar styles */}
      <style>{`
        .format-content-container::-webkit-scrollbar {
          width: 6px;
        }
        .format-content-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .format-content-container::-webkit-scrollbar-thumb {
          background-color: ${colors.border.default};
          border-radius: 3px;
        }
        .format-content-container::-webkit-scrollbar-thumb:hover {
          background-color: ${colors.border.darker};
        }
      `}</style>

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
            <div className="format-content-container" style={contentContainerStyles}>
              {/* Text container */}
              <div style={textContainerStyles}>
                <h1 style={titleStyles}>{t('onboarding.writingFormat.title')}</h1>
                <p style={subtitleStyles}>
                  {t('onboarding.writingFormat.subtitle')}
                </p>
              </div>

              {/* Format selection cards */}
              <div style={formatCardsRowStyles}>
                {formatOptions.map((format) => {
                  const IconComponent = format.icon;
                  const isSelected = selectedFormat === format.id;
                  
                  return (
                    <div
                      key={format.id}
                      style={getFormatCardStyles(isSelected)}
                      onClick={() => setSelectedFormat(format.id)}
                    >
                      <div style={formatCardIconStyles}>
                        <IconComponent 
                          size={24} 
                          color={isSelected ? colors.bg.basic.teal.strong : colors.icon.default}
                          weight="regular"
                        />
                      </div>
                      <p style={formatCardLabelStyles}>{format.label}</p>
                    </div>
                  );
                })}
              </div>

              {/* Utility text */}
              <p style={utilityTextStyles}>
                {getUtilityText()}
              </p>

              {/* LinkedIn post example */}
              <div style={linkedInPostCardStyles}>
                {/* Profile row */}
                <div style={profileRowStyles}>
                  <div style={avatarStyles} />
                  <div style={profileInfoStyles}>
                    <p style={profileNameStyles}>{t('onboarding.writingFormat.samplePost.name')}</p>
                    <p style={profileTitleStyles}>{t('onboarding.writingFormat.samplePost.profession')}</p>
                  </div>
                </div>

                {/* Post content */}
                <p style={postContentStyles}>
                  {getPostContent()}
                </p>
              </div>
            </div>

            {/* Button container */}
            <div style={buttonContainerStyles}>
              <div style={{ flex: 1 }}>
                <Button
                  style="secondary"
                  size="sm"
                  label={t('onboarding.writingFormat.backButton')}
                  onClick={handleGoBack}
                  fullWidth
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  style="primary"
                  size="sm"
                  label={t('onboarding.writingFormat.continueButton')}
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
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[4] }}>60% {t('onboarding.progress.completed')}</p>
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

export default WritingFormatInput;

