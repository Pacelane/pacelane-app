import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { useAuth } from '@/hooks/api/useAuth';
import { useToast } from '@/design-system/components/Toast';
import { useTranslation } from '@/services/i18n-context';
import { supabase } from '@/integrations/supabase/client';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';
import { stroke } from '@/design-system/tokens/stroke';
import { colors as primitiveColors } from '@/design-system/tokens/primitive-colors';
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import PhoneInput from '@/design-system/components/PhoneInput';
import Badge from '@/design-system/components/Badge';
import { ArrowRight, Loader2, MessageSquare } from 'lucide-react';

// Configuration
const PACELANE_WHATSAPP_NUMBER = '551152360591'; // Business WhatsApp number

const WhatsAppInput = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('onboarding');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [cleanWhatsAppNumber, setCleanWhatsAppNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasOpenedWhatsApp, setHasOpenedWhatsApp] = useState(false);
  const [canContinueAfterSync, setCanContinueAfterSync] = useState(false);

  // Handle button clicks
  const handleGoBack = () => {
    navigate('/onboarding/first-things-first');
  };

  const handleSyncWhatsApp = () => {
    // Open WhatsApp in a new tab (NO redirect)
    const message = encodeURIComponent("Hi! I want to connect my WhatsApp to Pacelane for personalized content suggestions.");
    const whatsappUrl = `https://wa.me/${PACELANE_WHATSAPP_NUMBER}?text=${message}`;
    
    // Create a temporary anchor element and click it programmatically
    // This approach is more reliable for opening links in new tabs
    const link = document.createElement('a');
    link.href = whatsappUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Mark that WhatsApp was opened
    setHasOpenedWhatsApp(true);
    
    // Enable continue button after a delay (user can come back and click it)
    setTimeout(() => {
      setCanContinueAfterSync(true);
    }, 1000);
  };

  const handleContinue = async () => {
    if (!user) {
      toast.error(t('whatsappInput.messages.loginRequired'));
      return;
    }

    if (!cleanWhatsAppNumber.trim()) {
      toast.error(t('whatsappInput.messages.invalidNumber'));
      return;
    }

    setSaving(true);

    try {
      // Save clean phone number to backend (format: +5563984602704)
      const phoneNumberToSave = cleanWhatsAppNumber.trim();
      
      const { error } = await supabase
        .from('profiles')
        .update({ whatsapp_number: phoneNumberToSave } as any)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success(t('whatsappInput.messages.saveSuccess'));
      navigate('/onboarding/pacing');
    } catch (error: any) {
      console.error('Error saving WhatsApp number:', error);
      toast.error(t('whatsappInput.messages.saveError'));
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

  // WhatsApp section title styles
  const whatsappTitleStyles = {
    ...textStyles.sm.medium,
    color: colors.text.default,
    margin: 0,
  };

  // WhatsApp utility text styles
  const utilityTextStyles = {
    ...textStyles.xs.normal,
    color: colors.text.subtle,
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
    { label: t('whatsappInput.steps.linkedin'), active: true },
    { label: t('whatsappInput.steps.whatsapp'), active: false },
    { label: t('whatsappInput.steps.frequency'), active: false },
    { label: t('whatsappInput.steps.goals'), active: false },
    { label: t('whatsappInput.steps.pillars'), active: false },
    { label: t('whatsappInput.steps.format'), active: false },
    { label: t('whatsappInput.steps.knowledge'), active: false },
  ];

  const canContinue = cleanWhatsAppNumber.trim().length > 0;

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
                <h1 style={titleStyles}>{t('whatsappInput.title')}</h1>
                <p style={subtitleStyles}>
                  {t('whatsappInput.subtitle')}
                </p>
              </div>

              {/* WhatsApp input section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                <p style={whatsappTitleStyles}>{t('whatsappInput.whatsappLabel')}</p>
                <PhoneInput
                  value={whatsappNumber}
                  onChange={setWhatsappNumber}
                  onCleanNumberChange={setCleanWhatsAppNumber}
                  defaultCountry="BR"
                  size="lg"
                  label={t('whatsappInput.label')}
                  placeholder={t('whatsappInput.placeholder')}
                  required
                />
                <p style={utilityTextStyles}>
                  {t('whatsappInput.utilityText')}
                </p>
              </div>
            </div>

            {/* Button container */}
            <div style={buttonContainerStyles}>
              <div style={{ flex: 1 }}>
                <Button
                  style="secondary"
                  size="sm"
                  label={t('whatsappInput.backButton')}
                  onClick={handleGoBack}
                  disabled={saving}
                  fullWidth
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  style="primary"
                  size="sm"
                  label={saving ? t('whatsappInput.savingButton') : t('whatsappInput.continueButton')}
                  leadIcon={saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : undefined}
                  tailIcon={!saving ? <ArrowRight size={16} /> : undefined}
                  onClick={handleContinue}
                  disabled={!canContinue || !hasOpenedWhatsApp || !canContinueAfterSync || saving}
                  fullWidth
                />
              </div>
            </div>
            
            {/* Sync WhatsApp Button */}
            <div style={{ 
              paddingTop: spacing.spacing[12],
              paddingBottom: spacing.spacing[12],
              paddingLeft: spacing.spacing[36],
              paddingRight: spacing.spacing[36],
            }}>
              <Button
                label={hasOpenedWhatsApp ? t('whatsappInput.syncOpened') : t('whatsappInput.syncButton')}
                style={hasOpenedWhatsApp ? "soft" : "primary"}
                size="sm"
                leadIcon={hasOpenedWhatsApp ? undefined : <MessageSquare size={16} />}
                onClick={handleSyncWhatsApp}
                disabled={hasOpenedWhatsApp}
                fullWidth
              />
            </div>
          </div>

          {/* Accuracy bar (right side) */}
          <div style={accuracyBarStyles}>
            {/* Bar container */}
            <div style={barContainerStyles}>
              <p style={labelTextStyles}>{t('whatsappInput.accuracyLabel')}</p>
              <div style={{ marginTop: spacing.spacing[8] }}>
                <div style={linesBarContainerStyles}>
                  {[...Array(27)].map((_, index) => (
                    <div key={index} style={getLineBarStyles(index)} />
                  ))}
                </div>
              </div>
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[4] }}>{t('whatsappInput.completed')}</p>
              <div style={{ ...dividerStyles, marginTop: spacing.spacing[8] }} />
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[8] }}>
                {t('whatsappInput.infoText')}
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

export default WhatsAppInput;

