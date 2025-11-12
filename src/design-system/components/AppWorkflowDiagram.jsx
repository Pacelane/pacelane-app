import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';

// Icons
import { 
  User, 
  Target, 
  FileText, 
  Calendar, 
  ChatSquare as MessageSquare, 
  TrendingUp,
  ArrowRight,
  Sparkle as Sparkles,
  Brain,
  ShareNetwork as Share2,
  ChartBar as BarChart3
} from '@phosphor-icons/react';

const AppWorkflowDiagram = ({ 
  className = '',
  showTitle = true,
  compact = false
}) => {
  const { colors } = useTheme();

  const workflowSteps = [
    {
      id: 1,
      title: 'Profile & Goals',
      description: 'We analyze your LinkedIn profile and understand your professional goals',
      icon: User,
      color: colors.bg.state.primary,
      iconColor: 'white'
    },
    {
      id: 2,
      title: 'Content Strategy',
      description: 'AI creates a personalized content strategy based on your industry and goals',
      icon: Brain,
      color: colors.bg.state.brand,
      iconColor: 'white'
    },
    {
      id: 3,
      title: 'Smart Scheduling',
      description: 'Set your posting frequency and get content suggestions at optimal times',
      icon: Calendar,
      color: colors.bg.state.secondary,
      iconColor: colors.icon.default
    },
    {
      id: 4,
      title: 'Content Creation',
      description: 'AI generates authentic posts that match your voice and expertise',
      icon: FileText,
      color: colors.bg.state.soft,
      iconColor: colors.icon.default
    },
    {
      id: 5,
      title: 'WhatsApp Delivery',
      description: 'Receive ready-to-post content directly on WhatsApp for easy sharing',
      icon: MessageSquare,
      color: colors.bg.state.primary,
      iconColor: 'white'
    },
    {
      id: 6,
      title: 'Performance Tracking',
      description: 'Monitor engagement and refine your content strategy over time',
      icon: TrendingUp,
      color: colors.bg.state.brand,
      iconColor: 'white'
    }
  ];

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[32],
    width: '100%',
    maxWidth: compact ? '600px' : '800px',
    margin: '0 auto',
  };

  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['3xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    color: colors.text.default,
    margin: 0,
    textAlign: 'center',
  };

  const subtitleStyle = {
    ...textStyles.lg.normal,
    color: colors.text.subtle,
    margin: 0,
    textAlign: 'center',
    marginTop: spacing.spacing[8],
  };

  const stepsContainerStyle = {
    display: 'grid',
    gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: spacing.spacing[24],
    position: 'relative',
  };

  const stepStyle = {
    backgroundColor: colors.bg.card.default,
    borderRadius: cornerRadius.borderRadius.lg,
    border: `1px solid ${colors.border.default}`,
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    padding: spacing.spacing[24],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[16],
    position: 'relative',
  };

  const iconContainerStyle = (bgColor, iconColor) => ({
    width: '48px',
    height: '48px',
    borderRadius: cornerRadius.borderRadius.md,
    backgroundColor: bgColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  });

  const stepTitleStyle = {
    ...textStyles.lg.semibold,
    color: colors.text.default,
    margin: 0,
  };

  const stepDescriptionStyle = {
    ...textStyles.sm.normal,
    color: colors.text.subtle,
    margin: 0,
    lineHeight: '1.5',
  };

  const stepNumberStyle = {
    position: 'absolute',
    top: spacing.spacing[12],
    right: spacing.spacing[12],
    width: '24px',
    height: '24px',
    borderRadius: cornerRadius.borderRadius.full,
    backgroundColor: colors.bg.muted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: typography.desktop.size.xs,
    fontWeight: typography.desktop.weight.semibold,
    color: colors.text.muted,
  };

  return (
    <div className={className} style={containerStyle}>
      {showTitle && (
        <div>
          <h2 style={titleStyle}>How Pacelane Works</h2>
          <p style={subtitleStyle}>
            Your AI-powered LinkedIn content strategy in 6 simple steps
          </p>
        </div>
      )}
      
      <div style={stepsContainerStyle}>
        {workflowSteps.map((step, index) => {
          const IconComponent = step.icon;
          
          return (
            <div key={step.id} style={stepStyle}>
              <div style={stepNumberStyle}>
                {step.id}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: spacing.spacing[16] }}>
                <div style={iconContainerStyle(step.color, step.iconColor)}>
                  <IconComponent 
                    size={24} 
                    color={step.iconColor}
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <h3 style={stepTitleStyle}>
                    {step.title}
                  </h3>
                  <p style={stepDescriptionStyle}>
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!compact && (
        <div
          style={{
            backgroundColor: colors.bg.card.subtle,
            borderRadius: cornerRadius.borderRadius.md,
            padding: spacing.spacing[24],
            border: `1px solid ${colors.border.default}`,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.spacing[16],
            marginTop: spacing.spacing[16],
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: cornerRadius.borderRadius.md,
              backgroundColor: colors.bg.state.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={20} color="white" />
          </div>
          
          <div>
            <p style={{
              ...textStyles.md.semibold,
              color: colors.text.default,
              margin: 0,
            }}>
              Ready to get started?
            </p>
            <p style={{
              ...textStyles.sm.normal,
              color: colors.text.subtle,
              margin: 0,
            }}>
              Let's set up your personalized LinkedIn content strategy in just a few minutes.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppWorkflowDiagram;
