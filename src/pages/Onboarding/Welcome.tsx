import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';

// Design System Components
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import Bichaurinho from '@/design-system/components/Bichaurinho';
import OnboardingProgressIndicator from '@/design-system/components/OnboardingProgressIndicator';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getResponsiveContainer, getResponsiveWidth } from '@/design-system/utils/responsive';

// Icons
import { ArrowRight } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const isMobile = useIsMobile();

  const handleContinue = () => {
    navigate('/onboarding/first-things-first');
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...getResponsiveContainer(isMobile, 'page'),
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
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.spacing[32],
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Progress Indicator */}
          <div style={{
            ...getResponsiveWidth(isMobile, 'card')
          }}>
            <OnboardingProgressIndicator 
              currentStep={1}
              compact={true}
            />
          </div>

          {/* Welcome Header Card */}
          <div
            style={{
              backgroundColor: colors.bg.card.default,
              borderRadius: cornerRadius.borderRadius.lg,
              border: `1px solid ${colors.border.default}`,
              boxShadow: getShadow('regular.card', colors, { withBorder: true }),
              overflow: 'hidden',
              ...getResponsiveWidth(isMobile, 'card'),
            }}
          >
            {/* Bichaurinho Section */}
            <div
              style={{
                paddingTop: spacing.spacing[32],
                paddingBottom: spacing.spacing[12],
                paddingLeft: spacing.spacing[32],
                paddingRight: spacing.spacing[32],
                display: 'flex',
                justifyContent: 'flex-start',
              }}
            >
              <Bichaurinho variant={15} size={48} />
            </div>

            {/* Header Section */}
            <div
              style={{
                paddingTop: spacing.spacing[12],
                paddingBottom: spacing.spacing[32],
                paddingLeft: spacing.spacing[32],
                paddingRight: spacing.spacing[32],
                borderBottom: `1px solid ${colors.border.default}`,
                textAlign: 'left',
              }}
            >
              <h1
                style={{
                  fontFamily: typography.fontFamily['awesome-serif'],
                  fontSize: typography.desktop.size['5xl'],
                  fontWeight: typography.desktop.weight.semibold,
                  lineHeight: typography.desktop.lineHeight.leading7,
                  color: colors.text.default,
                  margin: 0,
                }}
              >
                Welcome!
              </h1>
              <p
                style={{
                  ...textStyles.sm.normal,
                  color: colors.text.muted,
                  margin: 0,
                  marginTop: spacing.spacing[16],
                }}
              >
                We want to help you show up consistently on LinkedIn with content that feels like you.
              </p>
            </div>

            {/* Content Section */}
            <div
              style={{
                paddingTop: spacing.spacing[24],
                paddingBottom: spacing.spacing[24],
                paddingLeft: '36px',
                paddingRight: '36px',
                backgroundColor: colors.bg.card.subtle,
              }}
            >
              <p
                style={{
                  ...textStyles.sm.normal,
                  color: colors.text.muted,
                  margin: 0,
                  lineHeight: '1.6',
                }}
              >
                We'll ask a few questions to tailor your strategy.
              </p>
            </div>
          </div>

          {/* What to Expect */}
          <div
            style={{
              background: `linear-gradient(0deg, rgba(67, 125, 252, 0.08) 0%, rgba(67, 125, 252, 0) 100%), ${colors.bg.card.default}`,
              borderRadius: cornerRadius.borderRadius.lg,
              border: `1px solid ${colors.border.default}`,
              boxShadow: getShadow('regular.card', colors, { withBorder: true }),
              padding: spacing.spacing[24],
              ...getResponsiveWidth(isMobile, 'card'),
            }}
          >
            <h2
              style={{
                fontFamily: typography.fontFamily['awesome-serif'],
                fontSize: typography.desktop.size['2xl'],
                fontWeight: typography.desktop.weight.semibold,
                lineHeight: typography.desktop.lineHeight.leading7,
                letterSpacing: typography.desktop.letterSpacing.normal,
                color: colors.text.default,
                margin: 0,
                marginBottom: spacing.spacing[12],
              }}
            >
              What to Expect
            </h2>
            
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: spacing.spacing[16],
              }}
            >
              {/* Setup Time */}
              <div
                style={{
                  backgroundColor: colors.bg.card.default,
                  padding: spacing.spacing[16],
                  borderRadius: cornerRadius.borderRadius.md,
                  border: `1px solid ${colors.border.default}`,
                  boxShadow: getShadow('regular.card', colors, { withBorder: true }),
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.spacing[8],
                  transition: 'all 0.2s ease',
                }}
              >
                <h3 style={{ 
                  fontFamily: typography.fontFamily['awesome-serif'],
                  fontSize: typography.desktop.size.md,
                  fontWeight: typography.desktop.weight.semibold,
                  lineHeight: typography.desktop.lineHeight.leading6,
                  color: colors.text.default, 
                  margin: 0 
                }}>
                  Setup Time: ~5 minutes
                </h3>
                <p style={{ ...textStyles.sm.normal, color: colors.text.subtle, margin: 0, lineHeight: '1.5' }}>
                  Quick questions about your LinkedIn profile, goals, and content preferences
                </p>
              </div>
              
              {/* Content Delivery */}
              <div
                style={{
                  backgroundColor: colors.bg.card.default,
                  padding: spacing.spacing[16],
                  borderRadius: cornerRadius.borderRadius.md,
                  border: `1px solid ${colors.border.default}`,
                  boxShadow: getShadow('regular.card', colors, { withBorder: true }),
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.spacing[8],
                  transition: 'all 0.2s ease',
                }}
              >
                <h3 style={{ 
                  fontFamily: typography.fontFamily['awesome-serif'],
                  fontSize: typography.desktop.size.md,
                  fontWeight: typography.desktop.weight.semibold,
                  lineHeight: typography.desktop.lineHeight.leading6,
                  color: colors.text.default, 
                  margin: 0 
                }}>
                  Content Delivery
                </h3>
                <p style={{ ...textStyles.sm.normal, color: colors.text.subtle, margin: 0, lineHeight: '1.5' }}>
                  Personalized posts delivered to WhatsApp based on your schedule
                </p>
              </div>
              
              {/* Your Voice, Amplified */}
              <div
                style={{
                  backgroundColor: colors.bg.card.default,
                  padding: spacing.spacing[16],
                  borderRadius: cornerRadius.borderRadius.md,
                  border: `1px solid ${colors.border.default}`,
                  boxShadow: getShadow('regular.card', colors, { withBorder: true }),
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.spacing[8],
                  transition: 'all 0.2s ease',
                }}
              >
                <h3 style={{ 
                  fontFamily: typography.fontFamily['awesome-serif'],
                  fontSize: typography.desktop.size.md,
                  fontWeight: typography.desktop.weight.semibold,
                  lineHeight: typography.desktop.lineHeight.leading6,
                  color: colors.text.default, 
                  margin: 0 
                }}>
                  Your Voice, Amplified
                </h3>
                <p style={{ ...textStyles.sm.normal, color: colors.text.subtle, margin: 0, lineHeight: '1.5' }}>
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