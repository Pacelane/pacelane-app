import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';
import { getResponsivePadding } from '@/design-system/utils/responsive';
import { useIsMobile } from '@/hooks/use-mobile';
import Logo from '@/design-system/components/Logo';
import Button from '@/design-system/components/Button';
import Bichaurinho from '@/design-system/components/Bichaurinho';
import { CheckCircle } from 'lucide-react';
import type { LeadSource } from '@/types/leads';

interface ThankYouContent {
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaSecondaryText: string;
}

const thankYouContent: Record<LeadSource | 'default', ThankYouContent> = {
  'linkedin_analyzer': {
    title: 'Analysis Complete!',
    subtitle: 'Your LinkedIn profile analysis is ready',
    description: 'We\'ve sent your personalized analysis to your email. Use these insights to optimize your LinkedIn profile and achieve your professional goals.',
    ctaText: 'Create a Free Account',
    ctaSecondaryText: 'Analyze Another Profile'
  },
  'linkedin_wrapped': {
    title: 'Your Wrapped is Ready!',
    subtitle: 'Your LinkedIn year in review is complete',
    description: 'We\'ve compiled your LinkedIn activity highlights. Discover your top posts, engagement trends, and insights from your content journey.',
    ctaText: 'Create a Free Account',
    ctaSecondaryText: 'Create Another Wrapped'
  },
  'default': {
    title: 'Thank You!',
    subtitle: 'Your request has been processed',
    description: 'We appreciate you using our tools. Check your email for more details.',
    ctaText: 'Create a Free Account',
    ctaSecondaryText: 'Go Back'
  }
};

const ThankYou: React.FC = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  
  // Get source from query params
  const sourceParam = searchParams.get('source');
  const source: LeadSource | 'default' = 
    sourceParam === 'linkedin-analyzer' ? 'linkedin_analyzer' :
    sourceParam === 'linkedin-wrapped' ? 'linkedin_wrapped' :
    'default';
  
  const content = thankYouContent[source];

  const handleCreateAccount = () => {
    navigate('/signin');
  };

  const handleSecondaryAction = () => {
    if (source === 'linkedin_analyzer') {
      navigate('/linkedin-analyzer');
    } else if (source === 'linkedin_wrapped') {
      navigate('/linkedin-wrapped');
    } else {
      navigate('/');
    }
  };

  // Styles
  const pageStyles: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: colors.bg.muted,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const contentWrapperStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: '560px',
    margin: '0 auto',
    paddingTop: spacing.spacing[40],
    paddingBottom: spacing.spacing[80],
    paddingLeft: spacing.spacing[24],
    paddingRight: spacing.spacing[24],
    boxSizing: 'border-box',
  };

  const cardStyles: React.CSSProperties = {
    backgroundColor: colors.bg.card.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.xl,
    boxShadow: getShadow('regular.modalMd', colors, { withBorder: true }),
    padding: getResponsivePadding(isMobile, 'card'),
    textAlign: 'center',
  };

  const iconContainerStyles: React.CSSProperties = {
    width: 80,
    height: 80,
    borderRadius: '50%',
    backgroundColor: colors.bg.success?.subtle || colors.bg.muted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
    marginBottom: spacing.spacing[24],
  };

  const titleStyle: React.CSSProperties = {
    fontFamily: Array.isArray(typography.fontFamily['awesome-serif']) 
      ? typography.fontFamily['awesome-serif'].join(', ') 
      : typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['3xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
    marginBottom: spacing.spacing[8],
  };

  const subtitleStyle: React.CSSProperties = {
    ...textStyles.lg.medium,
    color: colors.text.subtle,
    margin: 0,
    marginBottom: spacing.spacing[16],
  };

  const descriptionStyle: React.CSSProperties = {
    ...textStyles.md.normal,
    color: colors.text.muted,
    margin: 0,
    marginBottom: spacing.spacing[32],
    lineHeight: '1.6',
  };

  const dividerStyle: React.CSSProperties = {
    width: '100%',
    height: 1,
    backgroundColor: colors.border.default,
    margin: `${spacing.spacing[24]} 0`,
  };

  const promoSectionStyle: React.CSSProperties = {
    padding: spacing.spacing[20],
    backgroundColor: colors.bg.muted,
    borderRadius: cornerRadius.borderRadius.lg,
    marginBottom: spacing.spacing[24],
  };

  const promoTitleStyle: React.CSSProperties = {
    ...textStyles.md.semibold,
    color: colors.text.default,
    margin: 0,
    marginBottom: spacing.spacing[8],
  };

  const promoTextStyle: React.CSSProperties = {
    ...textStyles.sm.normal,
    color: colors.text.muted,
    margin: 0,
  };

  return (
    <div style={pageStyles}>
      <div style={contentWrapperStyles}>
        {/* Logo */}
        <div style={{ marginBottom: spacing.spacing[32], textAlign: 'center' }}>
          <Logo width={120} />
        </div>

        {/* Main Card */}
        <div style={cardStyles}>
          {/* Success Icon */}
          <div style={iconContainerStyles}>
            <CheckCircle size={40} color={colors.icon.success} />
          </div>

          {/* Content */}
          <h1 style={titleStyle}>{content.title}</h1>
          <p style={subtitleStyle}>{content.subtitle}</p>
          <p style={descriptionStyle}>{content.description}</p>

          {/* Divider */}
          <div style={dividerStyle} />

          {/* Promo Section */}
          <div style={promoSectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.spacing[12], marginBottom: spacing.spacing[12] }}>
              <Bichaurinho variant={1} size={48} />
            </div>
            <p style={promoTitleStyle}>Want more LinkedIn insights?</p>
            <p style={promoTextStyle}>
              Create a free Pacelane account to access AI-powered content creation, 
              posting schedules, and detailed analytics for your LinkedIn presence.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
            <Button
              label={content.ctaText}
              style="primary"
              size="lg"
              onClick={handleCreateAccount}
              fullWidth={true}
            />
            <Button
              label={content.ctaSecondaryText}
              style="ghost"
              size="md"
              onClick={handleSecondaryAction}
              fullWidth={true}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: spacing.spacing[24],
        }}>
          <p style={{
            ...textStyles.xs.normal,
            color: colors.text.hint,
          }}>
            Questions? Contact us at support@pacelane.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default ThankYou;

