import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useProfile } from '@/hooks/api/useProfile';
import { useTheme } from '@/services/theme-context';
import { useToast } from '@/design-system/components/Toast';
import { useTranslation } from '@/services/i18n-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// LinkedIn URL parsing utilities
import { parseLinkedInInput, isLinkedInUrl } from '@/utils/linkedinParser';

// Schema and type will be created inside component to access translations

// Design System Components
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import Badge from '@/design-system/components/Badge';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { stroke } from '@/design-system/tokens/stroke';
import { colors as primitiveColors } from '@/design-system/tokens/primitive-colors';

// Icons
import { ArrowRight, Loader2 } from 'lucide-react';

const FirstThingsFirst = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setupLinkedInProfile, saving } = useProfile();
  const { toast } = useToast();
  const { t } = useTranslation('onboarding');
  const [linkedInUrl, setLinkedInUrl] = useState('');

  // Create schema with translations
  const linkedInUsernameSchema = z.object({
    profileUrl: z.string()
      .min(1, t('firstThingsFirst.errors.required'))
      .refine((value) => {
        const parsed = parseLinkedInInput(value);
        return parsed.isValid;
      }, t('firstThingsFirst.errors.invalid'))
  });

  type LinkedInUsernameFormData = z.infer<typeof linkedInUsernameSchema>;

  const form = useForm<LinkedInUsernameFormData>({
    resolver: zodResolver(linkedInUsernameSchema),
    defaultValues: {
      profileUrl: '',
    },
  });

  // Handle input changes with automatic URL detection
  const handleInputChange = (value: string) => {
    setLinkedInUrl(value);
    
    // Check if input looks like a LinkedIn URL
    if (isLinkedInUrl(value)) {
      const parsed = parseLinkedInInput(value);
      if (parsed.isValid && parsed.username) {
        // Automatically set the extracted username
        form.setValue('profileUrl', parsed.username, { shouldValidate: true });
        toast.success(t('firstThingsFirst.messages.extracted', { username: parsed.username }));
        return;
      }
    }
    
    // For non-URL inputs or invalid URLs, set the value directly
    form.setValue('profileUrl', value, { shouldValidate: true });
  };

  // Handle button clicks
  const handleGoBack = () => {
    navigate('/onboarding/welcome');
  };

  const handleContinue = async () => {
    if (!user) {
      toast.error(t('firstThingsFirst.messages.loginRequired'));
      return;
    }

    const formData = form.getValues();
    if (!formData.profileUrl?.trim() || !form.formState.isValid) {
      form.trigger();
      return;
    }

    try {
      // Parse the input to extract the username
      const parsed = parseLinkedInInput(formData.profileUrl);
      
      if (!parsed.isValid) {
        throw new Error(t('firstThingsFirst.errors.invalid'));
      }

      // Construct the full LinkedIn URL from the extracted username
      const fullLinkedInUrl = `https://www.linkedin.com/in/${parsed.username.trim()}/`;
      
      // Use our clean LinkedIn setup API (includes scraper integration)
      const result = await setupLinkedInProfile({
        profileUrl: fullLinkedInUrl
      });

      // Check if there was a critical error that prevented profile URL from being saved
      if (result.error && (result.error.includes('required') || result.error.includes('User must be logged in'))) {
        throw new Error(result.error);
      }

      // Always proceed to next page if profile URL was processed (even if scraping failed)
      // The scraping can fail but the URL should still be saved in the database
      if (result.error) {
        // Scraping failed but URL was saved - show informative message
        toast.success(t('firstThingsFirst.messages.saveSuccess'));
      } else {
        // Complete success
        toast.success(t('firstThingsFirst.messages.setupSuccess'));
      }
      
      navigate('/onboarding/linkedin-summary');
    } catch (error: any) {
      toast.error(error.message || t('firstThingsFirst.messages.saveError'));
    }
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
    gap: spacing.spacing[16],
  };

  // Title styles using Awesome Serif (corrigido de instrument-serif)
  const titleStyles = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
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

  // Individual line bar styles
  const lineBarStyles = {
    flex: '1 1 0',
    minWidth: '2px',
    height: '18px',
    backgroundColor: primitiveColors.transparentDark[10],
    borderRadius: cornerRadius.borderRadius['2xs'],
  };

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
    t('firstThingsFirst.steps.linkedin'),
    t('firstThingsFirst.steps.whatsapp'),
    t('firstThingsFirst.steps.frequency'),
    t('firstThingsFirst.steps.goals'),
    t('firstThingsFirst.steps.pillars'),
    t('firstThingsFirst.steps.format'),
    t('firstThingsFirst.steps.knowledge'),
  ];

  // Check if form is valid
  const canContinue = form.watch('profileUrl')?.trim() && form.formState.isValid;

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
                <h1 style={titleStyles}>{t('firstThingsFirst.title')}</h1>
                <p style={subtitleStyles}>
                  {t('firstThingsFirst.subtitle')}
                </p>
              </div>

              {/* Input with add-on prefix */}
              <Input
                style="add-on"
                size="lg"
                label={t('firstThingsFirst.label')}
                addOnPrefix="https://"
                placeholder={t('firstThingsFirst.placeholder')}
                value={linkedInUrl}
                onChange={(e) => handleInputChange(e.target.value)}
                required
                disabled={saving}
                failed={!!form.formState.errors.profileUrl}
                caption={form.formState.errors.profileUrl?.message}
              />
            </div>

            {/* Button container */}
            <div style={buttonContainerStyles}>
              <div style={{ flex: 1 }}>
                <Button
                  style="secondary"
                  size="sm"
                  label={t('firstThingsFirst.backButton')}
                  onClick={handleGoBack}
                  disabled={saving}
                  fullWidth
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  style="primary"
                  size="sm"
                  label={saving ? t('firstThingsFirst.analyzingButton') : t('firstThingsFirst.continueButton')}
                  leadIcon={saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : undefined}
                  tailIcon={!saving ? <ArrowRight size={16} /> : undefined}
                  onClick={handleContinue}
                  disabled={!canContinue || saving}
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* Accuracy bar (right side) */}
          <div style={accuracyBarStyles}>
            {/* Bar container */}
            <div style={barContainerStyles}>
              <p style={labelTextStyles}>{t('firstThingsFirst.accuracyLabel')}</p>
              <div style={{ marginTop: spacing.spacing[8] }}>
                <div style={linesBarContainerStyles}>
                  {[...Array(27)].map((_, index) => (
                    <div key={index} style={lineBarStyles} />
                  ))}
                </div>
              </div>
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[4] }}>{t('firstThingsFirst.completed')}</p>
              <div style={{ ...dividerStyles, marginTop: spacing.spacing[8] }} />
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[8] }}>
                {t('firstThingsFirst.infoText')}
              </p>
            </div>

            {/* Steps container */}
            <div style={stepsContainerStyles}>
              <div style={dividerStyles} />
              {steps.map((step) => (
                <React.Fragment key={step}>
                  <div style={stepItemStyles}>
                    <Badge variant="dot" size="sm" color="neutral" />
                    <p style={stepTextStyles}>{step}</p>
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

export default FirstThingsFirst;
