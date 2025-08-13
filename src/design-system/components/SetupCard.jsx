import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';

// Design System Components
import Button from '@/design-system/components/Button';
import Bichaurinho from '@/design-system/components/Bichaurinho';

// Icons
import { ArrowRight, Check, ExternalLink } from 'lucide-react';

/**
 * SetupCard - Card component for showing setup steps for first-time users
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string} props.subtitle - Card subtitle/description
 * @param {string} props.status - Setup status: 'pending' | 'completed' | 'optional'
 * @param {number} props.bichaurinhoVariant - Bichaurinho variant number (1-32)
 * @param {string} props.buttonLabel - Action button label
 * @param {function} props.onButtonClick - Button click handler
 * @param {boolean} props.external - Whether action opens external link
 * @param {string} props.completedText - Text shown when completed
 * @param {Object} props.style - Additional container styles
 */
const SetupCard = ({
  title,
  subtitle,
  status = 'pending',
  bichaurinhoVariant = 1,
  buttonLabel,
  onButtonClick,
  external = false,
  completedText = 'Complete',
  style = {},
}) => {
  const { colors } = useTheme();

  // Card container styles
  const containerStyles = {
    backgroundColor: colors.bg.card.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    padding: spacing.spacing[24],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[20],
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    cursor: status === 'pending' ? 'pointer' : 'default',
    ...style,
  };

  // Header styles
  const headerStyles = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing.spacing[16],
  };

  // Content styles
  const contentStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[8],
    flex: 1,
  };

  // Title styles
  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size.lg,
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading6,
    color: colors.text.default,
    margin: 0,
  };

  // Subtitle styles
  const subtitleStyle = {
    ...textStyles.sm.normal,
    color: colors.text.subtle,
    margin: 0,
    lineHeight: '1.5',
  };

  // Status indicator styles
  const statusIndicatorStyles = {
    position: 'absolute',
    top: spacing.spacing[16],
    right: spacing.spacing[16],
    width: spacing.spacing[20],
    height: spacing.spacing[20],
    borderRadius: cornerRadius.borderRadius.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: status === 'completed' 
      ? colors.bg.state.success
      : status === 'optional'
      ? colors.bg.subtle
      : colors.bg.state.soft,
  };

  // Footer styles
  const footerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  };

  const handleCardClick = () => {
    if (status === 'pending' && onButtonClick) {
      onButtonClick();
    }
  };

  const handleButtonClick = (e) => {
    e.stopPropagation(); // Prevent card click when button is clicked
    if (onButtonClick) {
      onButtonClick();
    }
  };

  return (
    <div style={containerStyles} onClick={handleCardClick}>
      {/* Status Indicator */}
      <div style={statusIndicatorStyles}>
        {status === 'completed' ? (
          <Check size={12} color={colors.icon.success} />
        ) : status === 'optional' ? (
          <div style={{
            width: spacing.spacing[8],
            height: spacing.spacing[8],
            borderRadius: cornerRadius.borderRadius.full,
            backgroundColor: colors.icon.muted,
          }} />
        ) : (
          <div style={{
            width: spacing.spacing[8],
            height: spacing.spacing[8],
            borderRadius: cornerRadius.borderRadius.full,
            backgroundColor: colors.icon.highlight,
          }} />
        )}
      </div>

      {/* Header */}
      <div style={headerStyles}>
        {/* Bichaurinho */}
        <div style={{ flexShrink: 0 }}>
          <Bichaurinho variant={bichaurinhoVariant} size={48} />
        </div>

        {/* Content */}
        <div style={contentStyles}>
          <h3 style={titleStyle}>{title}</h3>
          <p style={subtitleStyle}>{subtitle}</p>
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyles}>
        {status === 'completed' ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.spacing[8],
          }}>
            <Check size={16} color={colors.icon.success} />
            <span style={{
              ...textStyles.sm.medium,
              color: colors.text.success,
            }}>
              {completedText}
            </span>
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <Button
              label={buttonLabel}
              style={status === 'optional' ? 'secondary' : 'primary'}
              size="sm"
              tailIcon={external ? <ExternalLink size={16} /> : <ArrowRight size={16} />}
              onClick={handleButtonClick}
              style={{ width: '100%' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupCard;
