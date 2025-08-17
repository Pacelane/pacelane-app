import React from 'react';
import { FileText, Sparkles, Info } from 'lucide-react';
import { useTheme } from '@/services/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { shadows, getShadow } from '@/design-system/tokens/shadows';
import Button from '@/design-system/components/Button';
import Bichaurinho from '@/design-system/components/Bichaurinho';
import ContentCard from '@/design-system/components/ContentCard';
import Divider from '@/design-system/components/Divider';
import InlineTip from '@/design-system/components/InlineTip';

const SuggestionCard = ({
  // Content
  title = 'Suggestion Title',
  description = 'Suggestion description goes here',
  contentCards = [],
  
  // Handlers
  onPostsClick,
  onGenerateClick,
  
  // Standard props
  className = '',
  style = {},
  ...rest
}) => {
  const { colors } = useTheme();
  const isMobile = useIsMobile();

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: isMobile ? 0 : spacing.spacing[20],
        padding: spacing.spacing[24],
        backgroundColor: colors.bg.default,
        borderRadius: cornerRadius.borderRadius.xl,
        border: `1px solid ${colors.border.default}`,
        boxShadow: getShadow('regular.card', colors, { withBorder: true }),
        width: isMobile ? '100%' : '840px',
        ...style
      }}
      {...rest}
    >
      {/* Bichaurinho - Hidden on mobile */}
      {!isMobile && <Bichaurinho variant={16} size={48} />}

      {/* Content Column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.spacing[14],
          flex: 1,
          minWidth: 0
        }}
      >
        {/* Title and Calendar Button */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.spacing[8]
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.spacing[8]
            }}
          >
            <span
              style={{
                ...textStyles['2xl'].semibold,
                fontFamily: 'Awesome Serif VAR',
                color: colors.text.default
              }}
            >
              {title}
            </span>
            <Button
              size="xs"
              style="dashed"
              label="See All Your Posts"
              leadIcon={<FileText size={12} />}
              onClick={onPostsClick}
            />
          </div>

          {/* Description Tip */}
          <InlineTip>
            {description}
          </InlineTip>
        </div>

        {/* Content Cards - Responsive Layout */}
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: spacing.spacing[20],
            width: '100%'
          }}
        >
          {contentCards.map((card, index) => (
            <div
              key={index}
              style={{
                flex: isMobile ? 'none' : 1,
                width: isMobile ? '100%' : 'auto',
                minWidth: 0
              }}
            >
              <ContentCard 
                {...card} 
                style={{ width: '100%' }}
              />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div
          style={{
            width: '100%',
            height: '1px',
            backgroundColor: colors.border.default
          }}
        />

        {/* Generate Button */}
        <Button
          style="dashed"
          size="md"
          label="Generate New Ideas"
          leadIcon={<Sparkles size={16} />}
          tailIcon={<Info size={16} />}
          onClick={onGenerateClick}
          fullWidth
        />
      </div>
    </div>
  );
};

export default SuggestionCard;