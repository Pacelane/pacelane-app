import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { Link as LinkIcon } from '@phosphor-icons/react';
import type { LinkWithPage } from '@/types/knowledgeGraph';

interface BacklinksPanelProps {
  backlinks: LinkWithPage[];
  onBacklinkClick: (pageId: string) => void;
  loading?: boolean;
}

export default function BacklinksPanel({
  backlinks,
  onBacklinkClick,
  loading = false,
}: BacklinksPanelProps) {
  const { colors } = useTheme();

  const containerStyles: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[16],
    padding: spacing.spacing[16],
    backgroundColor: colors.bg.card.default,
    borderLeft: `1px solid ${colors.border.default}`,
  };

  const headerStyles: React.CSSProperties = {
    ...textStyles.sm.semibold,
    color: colors.text.default,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[8],
  };

  const listContainerStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[12],
  };

  const backlinkItemStyles: React.CSSProperties = {
    padding: spacing.spacing[12],
    borderRadius: cornerRadius.borderRadius.md,
    backgroundColor: colors.bg.subtle,
    border: `1px solid ${colors.border.default}`,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[8],
  };

  const backlinkTitleStyles: React.CSSProperties = {
    ...textStyles.sm.medium,
    color: colors.text.default,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[6],
  };

  const backlinkContextStyles: React.CSSProperties = {
    ...textStyles.xs.normal,
    color: colors.text.subtle,
    fontStyle: 'italic',
    lineHeight: '1.5',
  };

  const emptyStateStyles: React.CSSProperties = {
    ...textStyles.sm.normal,
    color: colors.text.muted,
    textAlign: 'center',
    padding: spacing.spacing[24],
  };

  const linkTextStyles: React.CSSProperties = {
    ...textStyles.xs.medium,
    color: colors.text.accent,
    display: 'inline-block',
    marginTop: spacing.spacing[4],
  };

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <LinkIcon size={16} color={colors.icon.default} />
        Backlinks ({backlinks.length})
      </div>

      {/* Backlinks List */}
      <div style={listContainerStyles}>
        {loading && (
          <div style={emptyStateStyles}>Loading backlinks...</div>
        )}
        
        {!loading && backlinks.length === 0 && (
          <div style={emptyStateStyles}>
            No pages link to this page yet.
          </div>
        )}
        
        {!loading && backlinks.map((backlink) => (
          <div
            key={backlink.id}
            style={backlinkItemStyles}
            onClick={() => backlink.source_page && onBacklinkClick(backlink.source_page.id)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.state.secondaryHover;
              e.currentTarget.style.borderColor = colors.border.highlight;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.bg.subtle;
              e.currentTarget.style.borderColor = colors.border.default;
            }}
          >
            <div style={backlinkTitleStyles}>
              <span>{backlink.source_page?.icon || '📄'}</span>
              <span>{backlink.source_page?.title || 'Unknown Page'}</span>
            </div>
            
            {backlink.link_context && (
              <div style={backlinkContextStyles}>
                "{backlink.link_context}..."
              </div>
            )}
            
            {backlink.link_text && (
              <div style={linkTextStyles}>
                Link text: [[{backlink.link_text}]]
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

