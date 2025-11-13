import React from 'react';
import { useTheme } from '@/services/theme-context';
import { useTranslation } from '@/services/i18n-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';
import Button from '@/design-system/components/Button';
import { Gear as Settings, ArrowSquareOut as ExternalLink } from '@phosphor-icons/react';

/**
 * IntegrationCard - A reusable card component for displaying integration services
 * 
 * @param {Object} props - Component props
 * @param {string} props.name - Name of the integration service
 * @param {string} props.description - Description of what the integration does
 * @param {React.ReactNode} props.icon - Icon component for the service
 * @param {string} props.iconColor - Color for the icon (brand color)
 * @param {string[]} props.features - Array of feature descriptions

 * @param {function} props.onConfigure - Callback when configure button is clicked
 * @param {function} props.onSync - Callback when sync button is clicked (optional)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles (for flex layout)
 */
const IntegrationCard = ({
  name,
  description,
  icon,
  iconColor,
  features = [],

  onConfigure,
  onSync,
  className = '',
  style = {},
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();



  // Main card wrapper styles (with shadow)
  const cardWrapperStyles = {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.bg.card.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.card', colors),
    overflow: 'hidden', // Ensures border radius is maintained
    ...style, // Apply external styles (flex, width, etc.)
  };

  // Header section styles
  const cardHeaderStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: spacing.spacing[4], // Even smaller gap to description
    gap: spacing.spacing[12],
  };

  const cardTitleStyles = {
    ...textStyles.xl.semibold,
    color: colors.text.default,
    margin: 0,
  };

  // Icon container styles
  const iconContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: spacing.spacing[40], // 40px width (smaller)
    height: spacing.spacing[40], // 40px height (smaller)
    backgroundColor: colors.bg.card.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.card', colors),
  };



  // Description styles
  const cardDescriptionStyles = {
    ...textStyles.sm.normal,
    color: colors.text.subtle,
    margin: 0,
    lineHeight: 1.5,
  };



  // Main content container styles
  const mainContentStyles = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1, // Take all available height
    padding: spacing.spacing[24],
    backgroundColor: 'transparent', // No background - uses wrapper background
  };

  // Footer container styles (with top border)
  const footerContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0, // Prevent shrinking, hug content
    padding: spacing.spacing[16],
    backgroundColor: colors.bg.card.default,
    borderTop: `1px solid ${colors.border.default}`,
  };



  // Handle configure button click
  const handleConfigureClick = () => {
    if (onConfigure) {
      onConfigure();
    }
  };

  return (
    <div style={cardWrapperStyles} className={className}>
      {/* Main Content Container */}
      <div style={mainContentStyles}>
        {/* Card Header */}
        <div style={cardHeaderStyles}>
                  <div style={iconContainerStyles}>
          <div style={{ color: iconColor }}>
            {React.cloneElement(icon, { size: 20 })}
          </div>
        </div>
          <h3 style={cardTitleStyles}>{name}</h3>
        </div>

        {/* Card Description */}
        <p style={cardDescriptionStyles}>
          {description}
        </p>
      </div>

      {/* Footer Container */}
      <div style={footerContainerStyles}>
        <div style={{ display: 'flex', gap: spacing.spacing[8] }}>
          <Button 
            label={t('integrations.configure')}
            style="secondary"
            size="sm"
            leadIcon={<Settings size={12} />}
            onClick={handleConfigureClick}
          />
          {/* Optional Sync button when provided */}
          {onSync && (
            <Button 
              label={t('integrations.sync')}
              style="primary"
              size="sm"
              onClick={onSync}
            />
          )}
        </div>


      </div>
    </div>
  );
};

export default IntegrationCard;
