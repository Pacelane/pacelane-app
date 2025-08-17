import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useProfile } from '@/hooks/api/useProfile';
import { useTheme } from '@/services/theme-context';
import { useToast } from '@/design-system/components/Toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// LinkedIn URL parsing utilities
import { parseLinkedInInput, isLinkedInUrl, isValidLinkedInUsername } from '@/utils/linkedinParser';

// Updated schema that accepts both URLs and usernames
const linkedInUsernameSchema = z.object({
  profileUrl: z.string()
    .min(1, 'LinkedIn profile is required')
    .refine((value) => {
      const parsed = parseLinkedInInput(value);
      return parsed.isValid;
    }, 'Please enter a valid LinkedIn username or profile URL')
});

type LinkedInUsernameFormData = z.infer<typeof linkedInUsernameSchema>;

// Design System Components
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import ProgressBar from '@/design-system/components/ProgressBar';
import OnboardingProgressIndicator from '@/design-system/components/OnboardingProgressIndicator';
import Bichaurinho from '@/design-system/components/Bichaurinho';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

// Icons
import { ArrowLeft, ArrowRight, Loader2, Check, X, Info, Lightbulb } from 'lucide-react';

const FirstThingsFirst = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setupLinkedInProfile, saving } = useProfile();
  const { colors } = useTheme();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // State for LinkedIn URL detection
  const [detectedUsername, setDetectedUsername] = useState('');
  const [wasUrlDetected, setWasUrlDetected] = useState(false);
  const [showUrlDetection, setShowUrlDetection] = useState(false);

  const form = useForm<LinkedInUsernameFormData>({
    resolver: zodResolver(linkedInUsernameSchema),
    defaultValues: {
      profileUrl: '',
    },
  });

  // Handle input changes with URL detection
  const handleInputChange = (value) => {
    form.setValue('profileUrl', value, { shouldValidate: true });
    
    // Check if input looks like a LinkedIn URL
    if (isLinkedInUrl(value)) {
      const parsed = parseLinkedInInput(value);
      if (parsed.isValid && parsed.username) {
        setDetectedUsername(parsed.username);
        setWasUrlDetected(true);
        setShowUrlDetection(true);
      } else {
        setShowUrlDetection(false);
        setWasUrlDetected(false);
      }
    } else {
      setShowUrlDetection(false);
      setWasUrlDetected(false);
    }
  };

  // Handle confirmation of detected username
  const handleConfirmDetection = () => {
    form.setValue('profileUrl', detectedUsername, { shouldValidate: true });
    setShowUrlDetection(false);
    toast.success(`LinkedIn username extracted: ${detectedUsername}`);
  };

  // Handle dismissing the detection
  const handleDismissDetection = () => {
    setShowUrlDetection(false);
    setWasUrlDetected(false);
  };

  const handleGoBack = () => {
    navigate('/onboarding/welcome');
  };

  const onSubmit = async (data: LinkedInUsernameFormData) => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    try {
      // Parse the input to extract the username
      const parsed = parseLinkedInInput(data.profileUrl);
      
      if (!parsed.isValid) {
        throw new Error('Please enter a valid LinkedIn username or profile URL');
      }

      // Construct the full LinkedIn URL from the extracted username
      const fullLinkedInUrl = `https://www.linkedin.com/in/${parsed.username.trim()}/`;
      
      // Use our clean LinkedIn setup API (includes scraper integration)
      const result = await setupLinkedInProfile({
        profileUrl: fullLinkedInUrl
      });

      if (result.error) {
        throw new Error(result.error);
      }

      toast.success('Profile setup completed!');
      navigate('/onboarding/inspirations');
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete setup');
    }
  };

  const handleContinue = () => {
    form.handleSubmit(onSubmit)();
  };

  // Check if form is valid
  const canContinue = form.watch('profileUrl')?.trim() && form.formState.isValid;

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg.default,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navigation */}
      <TopNav />

      {/* Content Container with gradient background */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: colors.bg.default,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: isMobile ? spacing.spacing[24] : spacing.spacing[40],
          paddingBottom: isMobile ? '140px' : '160px', // Account for button container height
        }}
      >
        {/* Gradient background with 5% opacity */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/src/assets/images/gradient-bg.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.05,
            zIndex: 0,
          }}
        />

        {/* Content Column */}
        <div style={{ 
          position: 'relative', 
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.spacing[24],
          alignItems: 'center',
        }}>
          {/* Back Button */}
          <div style={{ 
            alignSelf: 'flex-start', 
            width: isMobile ? '100%' : '400px',
            maxWidth: isMobile ? '320px' : '400px'
          }}>
            <Button
              label="Go Back"
              style="dashed"
              size="xs"
              leadIcon={<ArrowLeft size={12} />}
              onClick={handleGoBack}
            />
          </div>

          {/* Progress Indicator */}
          <div style={{ 
            width: isMobile ? '100%' : '400px',
            maxWidth: isMobile ? '320px' : '400px'
          }}>
            <OnboardingProgressIndicator 
              currentStep={2}
              compact={true}
            />
          </div>

          {/* Main Card */}
          <div
            style={{
              backgroundColor: colors.bg.card.default,
              borderRadius: cornerRadius.borderRadius.lg,
              border: `1px solid ${colors.border.darker}`,
              boxShadow: getShadow('regular.card', colors, { withBorder: true }),
              width: isMobile ? '100%' : '400px',
              maxWidth: isMobile ? '320px' : '400px',
              overflow: 'hidden',
            }}
          >
            {/* Main Container */}
            <div
              style={{
                padding: isMobile ? spacing.spacing[24] : spacing.spacing[36],
                backgroundColor: colors.bg.card.default,
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Heading Container - 16px gap between bichaurinho and title/subtitle */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: spacing.spacing[16],
                  marginBottom: spacing.spacing[32],
                }}
              >
                {/* Bichaurinho */}
                <div>
                  <Bichaurinho variant={12} size={48} />
                </div>

                {/* Title and Subtitle Container - 0px gap between title and subtitle */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.spacing[0],
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Title */}
                  <h1
                    style={{
                      fontFamily: typography.fontFamily['awesome-serif'],
                      fontSize: isMobile ? typography.desktop.size['3xl'] : typography.desktop.size['5xl'],
                      fontWeight: typography.desktop.weight.semibold,
                      lineHeight: isMobile ? typography.desktop.lineHeight['3xl'] : typography.desktop.lineHeight['5xl'],
                      color: colors.text.default,
                      margin: 0,
                      textAlign: 'left',
                    }}
                  >
                    First Things First
                  </h1>

                  {/* Subtitle */}
                  <p
                    style={{
                      ...textStyles.md.normal,
                      color: colors.text.subtle,
                      margin: 0,
                      textAlign: 'left',
                      marginTop: spacing.spacing[8],
                      lineHeight: '1.5',
                    }}
                  >
                    Let's connect your LinkedIn profile so our AI can learn your unique voice, analyze your content style, and understand your professional background.
                  </p>
                </div>
              </div>

              {/* Information Card */}
              <div
                style={{
                  backgroundColor: colors.bg.card.subtle,
                  borderRadius: cornerRadius.borderRadius.md,
                  border: `1px solid ${colors.border.default}`,
                  padding: spacing.spacing[16],
                  marginBottom: spacing.spacing[24],
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.spacing[12] }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: cornerRadius.borderRadius.sm,
                      backgroundColor: colors.bg.state.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Lightbulb size={16} color="white" />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      ...textStyles.sm.semibold, 
                      color: colors.text.default, 
                      margin: 0,
                      marginBottom: spacing.spacing[4]
                    }}>
                      What we'll analyze from your LinkedIn:
                    </h3>
                    <ul style={{ 
                      ...textStyles.xs.normal, 
                      color: colors.text.subtle, 
                      margin: 0,
                      paddingLeft: spacing.spacing[16],
                      lineHeight: '1.4'
                    }}>
                      <li>Your writing style and tone from existing posts</li>
                      <li>Professional background and expertise areas</li>
                      <li>Industry context and relevant topics</li>
                      <li>Content themes that perform well for you</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Form Inputs Container */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.spacing[12],
                }}
              >
                {/* LinkedIn Profile Input */}
                <Input
                  label="Your LinkedIn Profile"
                  placeholder={showUrlDetection ? "Paste LinkedIn URL or enter username..." : "your-linkedin-username"}
                  value={form.watch('profileUrl') || ''}
                  onChange={(e) => handleInputChange(e.target.value)}
                  style={showUrlDetection ? "default" : "add-on"}
                  addOnPrefix={showUrlDetection ? undefined : "linkedin.com/in/"}
                  size="lg"
                  required={true}
                  disabled={saving}
                  failed={!!form.formState.errors.profileUrl}
                  caption={form.formState.errors.profileUrl?.message}
                />

                {/* URL Detection Confirmation UI */}
                {showUrlDetection && (
                  <div
                    style={{
                      backgroundColor: colors.bg.state.soft,
                      border: `1px solid ${colors.border.highlight}`,
                      borderRadius: cornerRadius.borderRadius.md,
                      padding: spacing.spacing[16],
                      display: 'flex',
                      flexDirection: 'column',
                      gap: spacing.spacing[12],
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <p
                          style={{
                            fontFamily: typography.fontFamily.body,
                            fontSize: typography.desktop.size.sm,
                            fontWeight: typography.desktop.weight.medium,
                            color: colors.text.default,
                            margin: 0,
                          }}
                        >
                          LinkedIn URL detected!
                        </p>
                        <p
                          style={{
                            fontFamily: typography.fontFamily.body,
                            fontSize: typography.desktop.size.xs,
                            fontWeight: typography.desktop.weight.normal,
                            color: colors.text.subtle,
                            margin: 0,
                            marginTop: spacing.spacing[4],
                          }}
                        >
                          Extracted username: <strong>{detectedUsername}</strong>
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: spacing.spacing[8] }}>
                        <Button
                          label="Use this"
                          style="soft"
                          size="xs"
                          leadIcon={<Check size={12} />}
                          onClick={handleConfirmDetection}
                        />
                        <Button
                          label="Keep editing"
                          style="ghost"
                          size="xs"
                          leadIcon={<X size={12} />}
                          onClick={handleDismissDetection}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Helper text container with background */}
                <div
                  style={{
                    backgroundColor: colors.bg.card.subtle,
                    padding: `${spacing.spacing[12]} ${spacing.spacing[16]}`,
                    borderRadius: cornerRadius.borderRadius.sm,
                    marginTop: spacing.spacing[8],
                  }}
                >
                  <p
                    style={{
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.desktop.size.xs,
                      fontWeight: typography.desktop.weight.normal,
                      lineHeight: typography.desktop.lineHeight.xs,
                      color: colors.text.muted,
                      margin: 0,
                      textAlign: 'center',
                    }}
                  >
                    You can paste your full LinkedIn URL or just enter your username. We'll analyze your profile to understand your style and create personalized content suggestions
                  </p>
                </div>
              </div>
            </div>

            {/* Text Container */}
            <div
              style={{
                padding: isMobile 
                  ? `${spacing.spacing[20]} ${spacing.spacing[24]}` 
                  : `${spacing.spacing[24]} ${spacing.spacing[36]}`,
                backgroundColor: colors.bg.card.subtle,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.spacing[4],
              }}
            >
              <p
                style={{
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.desktop.size.sm,
                  fontWeight: typography.desktop.weight.normal,
                  lineHeight: typography.desktop.lineHeight.sm,
                  color: colors.text.muted,
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                We'll ask a few questions to tailor your strategy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Button Container - Fixed overlay at bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: isMobile ? '70px' : '80px',
          backgroundColor: colors.bg.default,
          borderTop: `1px solid ${colors.border.default}`,
          padding: isMobile ? spacing.spacing[24] : spacing.spacing[40],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <div style={{ 
          width: isMobile ? '100%' : '280px',
          maxWidth: isMobile ? '320px' : '280px'
        }}>
          <Button
            label={saving ? "Analyzing LinkedIn Profile..." : "Continue"}
            style="primary"
            size="lg"
            leadIcon={saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : undefined}
            tailIcon={!saving ? <ArrowRight size={16} /> : undefined}
            onClick={handleContinue}
            disabled={!canContinue || saving}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default FirstThingsFirst;