import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';

// Design System Components
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import Bichaurinho from '@/design-system/components/Bichaurinho';
import AppWorkflowDiagram from '@/design-system/components/AppWorkflowDiagram';
import OnboardingProgressIndicator from '@/design-system/components/OnboardingProgressIndicator';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

// Icons
import { ArrowRight, Info, Clock, Target, Sparkles } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const [showWorkflow, setShowWorkflow] = useState(false);

  const handleContinue = () => {
    navigate('/onboarding/first-things-first');
  };

  const toggleWorkflow = () => {
    setShowWorkflow(!showWorkflow);
  };

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

      {/* Content Container */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: colors.bg.default,
          padding: spacing.spacing[24],
          paddingBottom: '100px', // Account for button container height
          overflow: 'auto',
        }}
      >
        {/* Gradient background with low opacity */}
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
            opacity: 0.03,
            zIndex: 0,
          }}
        />
        
        {/* Main Content Container */}
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.spacing[32],
            paddingTop: spacing.spacing[40],
          }}
        >
          {/* Progress Indicator */}
          <OnboardingProgressIndicator 
            currentStep={1}
            compact={true}
          />

          {/* Welcome Header Card */}
          <div
            style={{
              backgroundColor: colors.bg.card.default,
              borderRadius: cornerRadius.borderRadius.lg,
              border: `1px solid ${colors.border.default}`,
              boxShadow: getShadow('regular.card', colors, { withBorder: true }),
              overflow: 'hidden',
            }}
          >
            {/* Header Section */}
            <div
              style={{
                padding: spacing.spacing[32],
                display: 'flex',
                alignItems: 'center',
                gap: spacing.spacing[24],
                borderBottom: `1px solid ${colors.border.default}`,
              }}
            >
              <Bichaurinho variant={15} size={64} />
              
              <div style={{ flex: 1 }}>
                <h1
                  style={{
                    fontFamily: typography.fontFamily['awesome-serif'],
                    fontSize: typography.desktop.size['4xl'],
                    fontWeight: typography.desktop.weight.semibold,
                    lineHeight: typography.desktop.lineHeight.leading7,
                    color: colors.text.default,
                    margin: 0,
                  }}
                >
                  Welcome to Pacelane!
                </h1>
                <p
                  style={{
                    ...textStyles.lg.normal,
                    color: colors.text.subtle,
                    margin: 0,
                    marginTop: spacing.spacing[8],
                  }}
                >
                  Your AI-powered LinkedIn content strategy starts here
                </p>
              </div>
            </div>

            {/* Content Section */}
            <div
              style={{
                padding: spacing.spacing[32],
                backgroundColor: colors.bg.card.subtle,
              }}
            >
              <p
                style={{
                  ...textStyles.md.normal,
                  color: colors.text.default,
                  margin: 0,
                  marginBottom: spacing.spacing[16],
                  lineHeight: '1.6',
                }}
              >
                We're here to help you show up consistently on LinkedIn with authentic content that feels like you. 
                Our AI learns your voice, understands your goals, and creates personalized content suggestions delivered 
                right to your WhatsApp.
              </p>
              
              {/* Key Benefits */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: spacing.spacing[16],
                  marginTop: spacing.spacing[24],
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[12] }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: cornerRadius.borderRadius.sm,
                      backgroundColor: colors.bg.state.primary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Clock size={16} color="white" />
                  </div>
                  <span style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                    Save 5+ hours per week
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[12] }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: cornerRadius.borderRadius.sm,
                      backgroundColor: colors.bg.state.brand,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Target size={16} color="white" />
                  </div>
                  <span style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                    Authentic, personalized content
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[12] }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: cornerRadius.borderRadius.sm,
                      backgroundColor: colors.bg.state.secondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Sparkles size={16} color={colors.icon.default} />
                  </div>
                  <span style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                    Consistent posting schedule
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div
            style={{
              backgroundColor: colors.bg.card.default,
              borderRadius: cornerRadius.borderRadius.lg,
              border: `1px solid ${colors.border.default}`,
              boxShadow: getShadow('regular.card', colors, { withBorder: true }),
              padding: spacing.spacing[32],
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: spacing.spacing[24],
              }}
            >
              <div>
                <h2
                  style={{
                    ...textStyles['2xl'].semibold,
                    color: colors.text.default,
                    margin: 0,
                  }}
                >
                  How Pacelane Works
                </h2>
                <p
                  style={{
                    ...textStyles.md.normal,
                    color: colors.text.subtle,
                    margin: 0,
                    marginTop: spacing.spacing[4],
                  }}
                >
                  Your complete LinkedIn content workflow in 6 simple steps
                </p>
              </div>
              
              <Button
                label={showWorkflow ? "Hide Details" : "Show Details"}
                style="ghost"
                size="sm"
                leadIcon={<Info size={14} />}
                onClick={toggleWorkflow}
              />
            </div>

            {showWorkflow && (
              <div style={{ marginTop: spacing.spacing[24] }}>
                <AppWorkflowDiagram 
                  showTitle={false}
                  compact={false}
                />
              </div>
            )}
          </div>

          {/* What to Expect */}
          <div
            style={{
              backgroundColor: colors.bg.card.default,
              borderRadius: cornerRadius.borderRadius.lg,
              border: `1px solid ${colors.border.default}`,
              boxShadow: getShadow('regular.card', colors, { withBorder: true }),
              padding: spacing.spacing[32],
            }}
          >
            <h2
              style={{
                ...textStyles['2xl'].semibold,
                color: colors.text.default,
                margin: 0,
                marginBottom: spacing.spacing[16],
              }}
            >
              What to Expect
            </h2>
            
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: spacing.spacing[20],
              }}
            >
              <div>
                <h3 style={{ ...textStyles.md.semibold, color: colors.text.default, margin: 0 }}>
                  Setup Time: ~5 minutes
                </h3>
                <p style={{ ...textStyles.sm.normal, color: colors.text.subtle, margin: 0, marginTop: spacing.spacing[4] }}>
                  Quick questions about your LinkedIn profile, goals, and content preferences
                </p>
              </div>
              
              <div>
                <h3 style={{ ...textStyles.md.semibold, color: colors.text.default, margin: 0 }}>
                  Content Delivery
                </h3>
                <p style={{ ...textStyles.sm.normal, color: colors.text.subtle, margin: 0, marginTop: spacing.spacing[4] }}>
                  Personalized posts delivered to WhatsApp based on your schedule
                </p>
              </div>
              
              <div>
                <h3 style={{ ...textStyles.md.semibold, color: colors.text.default, margin: 0 }}>
                  Your Voice, Amplified
                </h3>
                <p style={{ ...textStyles.sm.normal, color: colors.text.subtle, margin: 0, marginTop: spacing.spacing[4] }}>
                  AI learns from your existing content to match your unique style
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Button Container - Fixed at bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.bg.default,
          borderTop: `1px solid ${colors.border.default}`,
          padding: spacing.spacing[24],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <div style={{ width: '320px' }}>
          <Button
            label="Let's Get Started"
            style="primary"
            size="lg"
            tailIcon={<ArrowRight size={16} />}
            onClick={handleContinue}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Welcome;