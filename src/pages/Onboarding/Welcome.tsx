import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { useAuth } from '@/hooks/api/useAuth';

// Design System Components
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import Bichaurinho from '@/design-system/components/Bichaurinho';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { stroke } from '@/design-system/tokens/stroke';

// Icons
import { ArrowRight } from 'lucide-react';

const Welcome = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  // Check onboarding status and redirect accordingly
  useEffect(() => {
    if (user && profile && !loading) {
      console.log('Welcome: Checking onboarding status', {
        userId: user.id,
        isOnboarded: (profile as any).is_onboarded,
        profile: profile
      });

      // If user has completed onboarding, redirect to product home
      if ((profile as any).is_onboarded === true) {
        console.log('Welcome: User has completed onboarding, redirecting to product-home');
        navigate('/product-home');
        return;
      }

      // If user hasn't completed onboarding, stay on welcome page
      console.log('Welcome: User has not completed onboarding, staying on welcome page');
    }
  }, [user, profile, loading, navigate]);

  // Show loading state while checking authentication
  if (loading || !user || !profile) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bg.default,
        flexDirection: 'column',
        gap: spacing.spacing[24]
      }}>
        <Bichaurinho variant={1} size={64} />
        <p style={{
          ...textStyles.md.normal,
          color: colors.text.muted,
          margin: 0
        }}>
          Loading...
        </p>
      </div>
    );
  }

  // Handle the "Começar" button click
  const handleStartClick = () => {
    // Navigate to the next onboarding step
    navigate('/onboarding/first-things-first');
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
    width: '400px',
    height: '480px',
    backgroundColor: colors.bg.card.subtle,
    borderRadius: cornerRadius.borderRadius.md,
    border: `${stroke.DEFAULT} solid ${colors.border.default}`,
    boxShadow: getShadow('regular.card', colors, { withBorder: false }),
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
  };

  // Top container styles (with border bottom)
  const topContainerStyles = {
    flex: 1,
    backgroundColor: colors.bg.card.default,
    borderBottom: `${stroke.DEFAULT} solid ${colors.border.default}`,
    paddingTop: spacing.spacing[36],
    paddingLeft: spacing.spacing[36],
    paddingRight: spacing.spacing[36],
    paddingBottom: spacing.spacing[24],
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[24],
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
    width: '100%',
  };

  // Subtitle styles
  const subtitleStyles = {
    ...textStyles.sm.normal,
    color: colors.text.muted,
    margin: 0,
    width: '100%',
  };

  // Bottom container styles
  const bottomContainerStyles = {
    paddingLeft: spacing.spacing[36],
    paddingRight: spacing.spacing[36],
    paddingTop: spacing.spacing[24],
    paddingBottom: spacing.spacing[24],
    display: 'flex',
    alignItems: 'center',
  };

  // Bottom text styles
  const bottomTextStyles = {
    ...textStyles.sm.normal,
    color: colors.text.muted,
    margin: 0,
  };

  return (
    <div style={pageContainerStyles}>
      {/* TopNav Bar - Stuck to the top */}
      <TopNav />

      {/* Main content container */}
      <div style={mainContentStyles}>
        {/* Main card container */}
        <div style={mainCardStyles}>
          {/* Top container */}
          <div style={topContainerStyles}>
            {/* Text container */}
            <div style={textContainerStyles}>
              <h1 style={titleStyles}>Bem-Vindo!</h1>
              <p style={subtitleStyles}>
                Queremos te ajudar a aparecer de forma consistente no LinkedIn com conteúdos que tenham a sua cara.
              </p>
            </div>

            {/* Button - Full width */}
            <Button
              style="primary"
              size="lg"
              label="Começar"
              tailIcon={<ArrowRight size={16} />}
              onClick={handleStartClick}
              fullWidth
            />
          </div>

          {/* Bottom container */}
          <div style={bottomContainerStyles}>
            <p style={bottomTextStyles}>
              Faremos algumas perguntas para personalizar a sua estratégia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;