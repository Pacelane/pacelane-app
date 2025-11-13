import React from 'react';
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
import { User, MapPin, Buildings, LinkedinLogo } from '@phosphor-icons/react';

const ProfileReview = () => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Mock LinkedIn profile data
  const profileData = {
    name: 'João Silva',
    profession: 'UX Designer',
    location: 'São Paulo, Brasil',
    company: 'Tech Innovations Inc.',
    url: 'linkedin.com/in/joaosilva',
    bio: 'Designer de produtos apaixonado por criar experiências digitais que fazem a diferença. Especializado em design systems, pesquisa de usuários e design thinking. Sempre buscando aprender e compartilhar conhecimento com a comunidade.',
    topSkills: ['UX Design', 'UI Design', 'Design Systems', 'Figma', 'User Research', 'Prototyping'],
    recentExperience: [
      {
        title: 'Senior UX Designer',
        company: 'Tech Innovations Inc.',
        period: '2022 - Presente',
        description: 'Liderando o design de produtos digitais e mentoria de designers juniores.'
      },
      {
        title: 'UX Designer',
        company: 'Digital Solutions Ltd.',
        period: '2019 - 2022',
        description: 'Responsável pelo design de aplicativos mobile e web para diversos clientes.'
      }
    ]
  };

  // Handle button clicks
  const handleGoBack = () => {
    navigate('/onboarding/first-things-first');
  };

  const handleContinue = () => {
    navigate('/onboarding/whatsapp');
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

  // Section styles
  const sectionStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[8],
  };

  // Label styles
  const labelStyles = {
    ...textStyles.xs.semibold,
    color: colors.text.subtle,
    margin: 0,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  };

  // Value styles
  const valueStyles = {
    ...textStyles.sm.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Profile header card styles
  const profileHeaderCardStyles = {
    backgroundColor: colors.bg.subtle,
    border: `${stroke.DEFAULT} solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.md,
    padding: spacing.spacing[20],
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[16],
  };

  // Profile name styles
  const profileNameStyles = {
    ...textStyles.lg.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Profile profession styles
  const profileProfessionStyles = {
    ...textStyles.md.normal,
    color: colors.text.subtle,
    margin: 0,
  };

  // Profile info row styles
  const profileInfoRowStyles = {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: spacing.spacing[8],
  };

  // Profile info icon container
  const iconContainerStyles = {
    width: '16px',
    height: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  // Profile info text styles
  const profileInfoTextStyles = {
    ...textStyles.sm.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Skills container styles
  const skillsContainerStyles = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: spacing.spacing[8],
  };

  // Skill tag styles
  const skillTagStyles = {
    ...textStyles.xs.medium,
    color: colors.text.default,
    backgroundColor: colors.bg.state.soft,
    padding: `${spacing.spacing[4]} ${spacing.spacing[8]}`,
    borderRadius: cornerRadius.borderRadius.full,
    border: `${stroke.DEFAULT} solid ${colors.border.default}`,
  };

  // Experience item styles
  const experienceItemStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[4],
    paddingBottom: spacing.spacing[12],
    borderBottom: `${stroke.DEFAULT} solid ${colors.border.default}`,
  };

  // Experience title styles
  const experienceTitleStyles = {
    ...textStyles.sm.semibold,
    color: colors.text.default,
    margin: 0,
  };

  // Experience company styles
  const experienceCompanyStyles = {
    ...textStyles.sm.normal,
    color: colors.text.subtle,
    margin: 0,
  };

  // Experience period styles
  const experiencePeriodStyles = {
    ...textStyles.xs.normal,
    color: colors.text.muted,
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

  // Individual line bar styles (with red accent for first 4 lines)
  const getLineBarStyles = (index: number) => ({
    flex: '1 1 0',
    minWidth: '2px',
    height: '18px',
    backgroundColor: index < 4 ? primitiveColors.red[500] : primitiveColors.transparentDark[10],
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
    { label: t('onboarding.progress.steps.whatsapp'), active: false },
    { label: t('onboarding.progress.steps.pacing'), active: false },
    { label: t('onboarding.progress.steps.goals'), active: false },
    { label: t('onboarding.progress.steps.pillars'), active: false },
    { label: t('onboarding.progress.steps.format'), active: false },
    { label: t('onboarding.progress.steps.knowledge'), active: false },
  ];

  return (
    <div style={pageContainerStyles}>
      {/* Custom scrollbar styles */}
      <style>{`
        .profile-content-container::-webkit-scrollbar {
          width: 6px;
        }
        .profile-content-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .profile-content-container::-webkit-scrollbar-thumb {
          background-color: ${colors.border.default};
          border-radius: 3px;
        }
        .profile-content-container::-webkit-scrollbar-thumb:hover {
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
            <div className="profile-content-container" style={contentContainerStyles}>
              {/* Text container */}
              <div style={textContainerStyles}>
                <h1 style={titleStyles}>{t('onboarding.profileReview.title')}</h1>
                <p style={subtitleStyles}>
                  {t('onboarding.profileReview.subtitle')}
                </p>
              </div>

              {/* Profile Header Card */}
              <div style={profileHeaderCardStyles}>
                {/* Name and Profession */}
                <div>
                  <p style={profileNameStyles}>{profileData.name}</p>
                  <p style={profileProfessionStyles}>{profileData.profession}</p>
                </div>

                {/* Profile Info Grid */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                  {/* Location */}
                  <div style={profileInfoRowStyles}>
                    <div style={iconContainerStyles}>
                      <MapPin size={16} color={colors.icon.muted} weight="fill" />
                    </div>
                    <p style={profileInfoTextStyles}>{profileData.location}</p>
                  </div>

                  {/* Company */}
                  <div style={profileInfoRowStyles}>
                    <div style={iconContainerStyles}>
                      <Buildings size={16} color={colors.icon.muted} weight="fill" />
                    </div>
                    <p style={profileInfoTextStyles}>{profileData.company}</p>
                  </div>

                  {/* LinkedIn URL */}
                  <div style={profileInfoRowStyles}>
                    <div style={iconContainerStyles}>
                      <LinkedinLogo size={16} color={colors.icon.muted} weight="fill" />
                    </div>
                    <p style={{ ...profileInfoTextStyles, color: colors.text.informative }}>
                      {profileData.url}
                    </p>
                  </div>
                </div>
              </div>

              <div style={sectionStyles}>
                <p style={labelStyles}>{t('onboarding.profileReview.bioLabel')}</p>
                <p style={valueStyles}>{profileData.bio}</p>
              </div>

              <div style={sectionStyles}>
                <p style={labelStyles}>{t('onboarding.profileReview.topSkillsLabel')}</p>
                <div style={skillsContainerStyles}>
                  {profileData.topSkills.map((skill, index) => (
                    <span key={index} style={skillTagStyles}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div style={sectionStyles}>
                <p style={labelStyles}>{t('onboarding.profileReview.experienceLabel')}</p>
                {profileData.recentExperience.map((exp, index) => (
                  <div 
                    key={index} 
                    style={{
                      ...experienceItemStyles,
                      borderBottom: index === profileData.recentExperience.length - 1 ? 'none' : experienceItemStyles.borderBottom
                    }}
                  >
                    <p style={experienceTitleStyles}>{exp.title}</p>
                    <p style={experienceCompanyStyles}>{exp.company}</p>
                    <p style={experiencePeriodStyles}>{exp.period}</p>
                    <p style={valueStyles}>{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Button container */}
            <div style={buttonContainerStyles}>
              <div style={{ flex: 1 }}>
                <Button
                  style="secondary"
                  size="sm"
                  label={t('onboarding.profileReview.backButton')}
                  onClick={handleGoBack}
                  fullWidth
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  style="primary"
                  size="sm"
                  label={t('onboarding.profileReview.continueButton')}
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
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[4] }}>12% {t('onboarding.progress.completed')}</p>
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

export default ProfileReview;

