import React from 'react';
import { useTheme } from '@/services/theme-context';
import { useTranslation } from '@/services/i18n-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';
import Button from '@/design-system/components/Button';

// Icons
import { 
  FileText, 
  VideoCamera as Video, 
  Globe, 
  Plus,
  ArrowRight 
} from '@phosphor-icons/react';

/**
 * KnowledgeBasePromptCard - Card component that prompts users to add more context to their knowledge base
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {string} props.subtitle - Card subtitle/description
 * @param {function} props.onAddFiles - Callback when user clicks to add files
 * @param {function} props.onAddVideos - Callback when user clicks to add videos
 * @param {function} props.onAddUrls - Callback when user clicks to add URLs
 * @param {Object} props.style - Additional container styles
 */
const KnowledgeBasePromptCard = ({
  title = "Give Us Context",
  subtitle = "With more files, videos, and URLs, your content will be better and more personalized",
  onAddFiles,
  onAddVideos,
  onAddUrls,
  style = {},
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

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
    ...style,
  };

  // Header styles
  const headerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[2],
  };

  // Title styles
  const titleStyle = {
    fontFamily: typography.fontFamily['instrument-serif'].join(', '),
    fontSize: typography.desktop.size['3xl'],
    fontWeight: typography.desktop.weight.normal,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Subtitle styles
  const subtitleStyle = {
    ...textStyles.sm.normal,
    color: colors.text.subtle,
    margin: 0,
  };

  // Content types grid styles
  const contentTypesStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing.spacing[16],
  };

  // Content type item styles
  const contentTypeItemStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: spacing.spacing[16],
    backgroundColor: colors.bg.subtle,
    border: `1px dashed ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.md,
    gap: spacing.spacing[12],
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  // Icon container styles
  const iconContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: spacing.spacing[40],
    height: spacing.spacing[40],
    backgroundColor: colors.bg.card.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.md,
    color: colors.icon.default,
  };

  // Content type title styles
  const contentTypeTitleStyle = {
    ...textStyles.sm.semibold,
    color: colors.text.default,
    margin: 0,
    textAlign: 'center',
  };

  // Content type description styles
  const contentTypeDescriptionStyle = {
    ...textStyles.xs.normal,
    color: colors.text.subtle,
    margin: 0,
    textAlign: 'center',
    lineHeight: '1.4',
  };

  const handleContentTypeClick = (type) => {
    switch (type) {
      case 'files':
        if (onAddFiles) onAddFiles();
        break;
      case 'videos':
        if (onAddVideos) onAddVideos();
        break;
      case 'urls':
        if (onAddUrls) onAddUrls();
        break;
      default:
        break;
    }
  };

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <h3 style={titleStyle}>{title}</h3>
        <p style={subtitleStyle}>{subtitle}</p>
      </div>

      {/* Content Types Grid */}
      <div style={contentTypesStyles}>
        {/* Files */}
        <div 
          style={contentTypeItemStyles}
          onClick={() => handleContentTypeClick('files')}
        >
          <div style={iconContainerStyles}>
            <FileText size={20} />
          </div>
          <div>
            <h4 style={contentTypeTitleStyle}>{t('common.knowledgePrompt.documentsTitle')}</h4>
            <p style={contentTypeDescriptionStyle}>
              {t('common.knowledgePrompt.documentsDesc')}
            </p>
          </div>
        </div>

        {/* Videos */}
        <div 
          style={contentTypeItemStyles}
          onClick={() => handleContentTypeClick('videos')}
        >
          <div style={iconContainerStyles}>
            <Video size={20} />
          </div>
          <div>
            <h4 style={contentTypeTitleStyle}>{t('common.knowledgePrompt.videosTitle')}</h4>
            <p style={contentTypeDescriptionStyle}>
              {t('common.knowledgePrompt.videosDesc')}
            </p>
          </div>
        </div>

        {/* URLs */}
        <div 
          style={contentTypeItemStyles}
          onClick={() => handleContentTypeClick('urls')}
        >
          <div style={iconContainerStyles}>
            <Globe size={20} />
          </div>
          <div>
            <h4 style={contentTypeTitleStyle}>{t('common.knowledgePrompt.websitesTitle')}</h4>
            <p style={contentTypeDescriptionStyle}>
              {t('common.knowledgePrompt.websitesDesc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBasePromptCard;
