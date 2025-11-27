import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import { useToast } from '@/design-system/components/Toast';
import { useTranslation } from '@/services/i18n-context';
import { supabase } from '@/integrations/supabase/client';
import { PacingService } from '@/services/pacingService';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';
import { stroke } from '@/design-system/tokens/stroke';
import { colors as primitiveColors } from '@/design-system/tokens/primitive-colors';
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import Checkbox from '@/design-system/components/Checkbox';
import Badge from '@/design-system/components/Badge';
import { ArrowRight, Loader2 } from 'lucide-react';

const Pacing = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('onboarding');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Days of the week
  const daysOfWeek = [
    { id: 'mon', label: t('pacing.days.mon'), fullName: t('pacing.fullDays.mon') },
    { id: 'tue', label: t('pacing.days.tue'), fullName: t('pacing.fullDays.tue') },
    { id: 'wed', label: t('pacing.days.wed'), fullName: t('pacing.fullDays.wed') },
    { id: 'thu', label: t('pacing.days.thu'), fullName: t('pacing.fullDays.thu') },
    { id: 'fri', label: t('pacing.days.fri'), fullName: t('pacing.fullDays.fri') },
    { id: 'sat', label: t('pacing.days.sat'), fullName: t('pacing.fullDays.sat') },
    { id: 'sun', label: t('pacing.days.sun'), fullName: t('pacing.fullDays.sun') },
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

  const handleContinue = async () => {
    if (!user) {
      toast.error(t('pacing.messages.loginRequired'));
      return;
    }

    if (selectedDays.length === 0) {
      toast.error(t('pacing.messages.selectDay'));
      return;
    }

    setSaving(true);

    try {
      // Map day IDs to full day names for backend
      const dayMapping: { [key: string]: string } = {
        'mon': 'monday',
        'tue': 'tuesday',
        'wed': 'wednesday',
        'thu': 'thursday',
        'fri': 'friday',
        'sat': 'saturday',
        'sun': 'sunday'
      };

      const frequencyDays = selectedDays.map(dayId => dayMapping[dayId] || dayId);

      // Save pacing preferences to profile
      const pacingData = {
        pace: 'moderate', // Default pace
        frequency: frequencyDays,
        daily_summary_time: '6:00 PM', // Default time
        recommendations_time: 'Morning (8-10 AM)' // Default time
      };

      // Save pacing preferences to profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ pacing_preferences: pacingData })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Create pacing schedule for automated content generation
      const scheduleData = PacingService.convertOnboardingToSchedule(user.id, pacingData);
      const { error: scheduleError } = await PacingService.createPacingSchedule(user.id, scheduleData);
      
      if (scheduleError) {
        console.warn('Failed to create pacing schedule:', scheduleError);
        // Don't block onboarding if schedule creation fails
      } else {
        console.log('Pacing schedule created successfully');
      }

      toast.success(t('pacing.messages.saveSuccess'));
      navigate('/onboarding/goals');
    } catch (error: any) {
      console.error('Error saving pacing preferences:', error);
      toast.error(t('pacing.messages.saveError'));
    } finally {
      setSaving(false);
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
    gap: spacing.spacing[8],
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
    { label: t('pacing.steps.linkedin'), active: true },
    { label: t('pacing.steps.whatsapp'), active: true },
    { label: t('pacing.steps.frequency'), active: false },
    { label: t('pacing.steps.goals'), active: false },
    { label: t('pacing.steps.pillars'), active: false },
    { label: t('pacing.steps.format'), active: false },
    { label: t('pacing.steps.knowledge'), active: false },
  ];

  const canContinue = selectedDays.length > 0;

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
                <h1 style={titleStyles}>{t('pacing.title')}</h1>
                <p style={subtitleStyles}>
                  {t('pacing.subtitle')}
                </p>
              </div>

              {/* Frequency card */}
              <div style={frequencyCardStyles}>
                <div>
                  <p style={cardTitleStyles}>{t('pacing.frequencyTitle')}</p>
                  <p style={{ ...cardSubtitleStyles, marginTop: spacing.spacing[4] }}>
                    {t('pacing.frequencySubtitle')}
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
                        disabled={saving}
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
                  label={t('pacing.backButton')}
                  onClick={handleGoBack}
                  disabled={saving}
                  fullWidth
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  style="primary"
                  size="sm"
                  label={saving ? t('pacing.savingButton') : t('pacing.continueButton')}
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
              <p style={labelTextStyles}>{t('pacing.accuracyLabel')}</p>
              <div style={{ marginTop: spacing.spacing[8] }}>
                <div style={linesBarContainerStyles}>
                  {[...Array(27)].map((_, index) => (
                    <div key={index} style={getLineBarStyles(index)} />
                  ))}
                </div>
              </div>
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[4] }}>{t('pacing.completed')}</p>
              <div style={{ ...dividerStyles, marginTop: spacing.spacing[8] }} />
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[8] }}>
                {t('pacing.infoText')}
              </p>
            </div>

            {/* Steps container */}
            <div style={stepsContainerStyles}>
              <div style={dividerStyles} />
              {steps.map((step) => (
                <React.Fragment key={step.label}>
                  <div style={stepItemStyles}>
                    <Badge variant="dot" size="sm" color={step.active ? "green" : "neutral"} />
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

export default Pacing;
