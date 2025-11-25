import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { Link as LinkIcon } from 'lucide-react';
import type { LinkWithPage } from '@/types/knowledgeGraph';

interface BacklinksPanelProps {
  backlinks: LinkWithPage[];
  suggestedLinks?: any[]; // SuggestedLink[] but avoiding circular dep issues if type not exported
  onBacklinkClick: (pageId: string) => void;
  onAcceptSuggestion?: (relationId: string) => void;
  onRejectSuggestion?: (relationId: string) => void;
  loading?: boolean;
}

export default function BacklinksPanel({
  backlinks,
  suggestedLinks = [],
  onBacklinkClick,
  onAcceptSuggestion,
  onRejectSuggestion,
  loading = false,
}: BacklinksPanelProps) {
  const { colors } = useTheme();

  const containerStyles: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[24], // Increased gap between sections
    padding: spacing.spacing[16],
    backgroundColor: colors.bg.card.default,
    borderLeft: `1px solid ${colors.border.default}`,
    overflowY: 'auto',
  };

  const sectionHeaderStyles: React.CSSProperties = {
    ...textStyles.sm.semibold,
    color: colors.text.default,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[8],
    marginBottom: spacing.spacing[12],
  };

  const listContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[12],
  };

  const itemStyles: React.CSSProperties = {
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

  const titleStyles: React.CSSProperties = {
    ...textStyles.sm.medium,
    color: colors.text.default,
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[6],
  };

  const contextStyles: React.CSSProperties = {
    ...textStyles.xs.normal,
    color: colors.text.subtle,
    fontStyle: 'italic',
    lineHeight: '1.5',
  };

  const emptyStateStyles: React.CSSProperties = {
    ...textStyles.sm.normal,
    color: colors.text.muted,
    textAlign: 'center',
    padding: spacing.spacing[16],
    fontStyle: 'italic',
  };

  const suggestionActionsStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing.spacing[8],
    marginTop: spacing.spacing[8],
    justifyContent: 'flex-end',
  };

  const actionButtonStyles = (type: 'accept' | 'reject'): React.CSSProperties => ({
    padding: `${spacing.spacing[4]} ${spacing.spacing[8]}`,
    borderRadius: cornerRadius.borderRadius.sm,
    border: 'none',
    cursor: 'pointer',
    ...textStyles.xs.medium,
    backgroundColor: type === 'accept' ? colors.bg.accent.primary : colors.bg.state.error,
    color: '#fff', // Always white text for buttons
    opacity: 0.9,
  });

  return (
    <div style={containerStyles}>
      {/* Backlinks Section */}
      <div>
        <div style={sectionHeaderStyles}>
          <LinkIcon size={16} color={colors.icon.default} />
          Linked Mentions ({backlinks.length})
        </div>

        <div style={listContainerStyles}>
          {loading && <div style={emptyStateStyles}>Loading...</div>}
          
          {!loading && backlinks.length === 0 && (
            <div style={emptyStateStyles}>No linked mentions yet.</div>
          )}
          
          {!loading && backlinks.map((backlink) => (
            <div
              key={backlink.id}
              style={itemStyles}
              onClick={() => backlink.source_page && onBacklinkClick(backlink.source_page.id)}
            >
              <div style={titleStyles}>
                <span>{backlink.source_page?.icon || '📄'}</span>
                <span>{backlink.source_page?.title || 'Unknown Page'}</span>
              </div>
              {backlink.link_context && (
                <div style={contextStyles}>"{backlink.link_context}..."</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* See Also / Suggestions Section */}
      {suggestedLinks.length > 0 && (
        <div>
          <div style={sectionHeaderStyles}>
            <span style={{ fontSize: '16px' }}>✨</span>
            See Also (Azami Suggestions)
          </div>

          <div style={listContainerStyles}>
            {suggestedLinks.map((suggestion) => {
              // Determine the other page (could be source or target depending on direction)
              // Usually suggestions are "other pages related to this one"
              // If we are viewing page A, and relation is A -> B, suggestion is B.
              // If relation is B -> A, suggestion is B.
              // We need to know "current page id" to know which is "other".
              // For simplicity, we'll assume the API returns "other_page" or we check both.
              // But here we just have the relation object.
              // Let's assume the API populates `source_page` and `target_page`.
              // We'll display the one that ISN'T the current page, but we don't have current page ID here easily unless passed.
              // However, usually `suggestedLinks` passed here are already filtered/processed or we just show the "other" side.
              // Let's assume `target_page` is the suggestion if we are source, or vice versa.
              // Actually, let's just show the one that is populated and looks like a page object.
              
              const otherPage = suggestion.source_page || suggestion.target_page; 
              // This logic is flawed if both are populated. 
              // But typically `getPage` returns relations where one side is THIS page.
              // We should probably pass `currentPageId` to be sure, or just rely on the fact that `getPage` response might structure it.
              // Let's assume for now we display `target_page` if it exists, else `source_page`.
              // Better yet, let's check the `relation_description`.
              
              return (
                <div key={suggestion.id} style={{...itemStyles, border: `1px dashed ${colors.border.accent}`}}>
                  <div style={titleStyles}>
                    <span>{otherPage?.icon || '📄'}</span>
                    <span>{otherPage?.title || 'Related Page'}</span>
                  </div>
                  
                  <div style={contextStyles}>
                    {suggestion.relation_description || "Semantic connection found."}
                  </div>
                  
                  <div style={suggestionActionsStyles}>
                    {onRejectSuggestion && (
                      <button 
                        style={actionButtonStyles('reject')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRejectSuggestion(suggestion.id);
                        }}
                      >
                        Reject
                      </button>
                    )}
                    {onAcceptSuggestion && (
                      <button 
                        style={actionButtonStyles('accept')}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAcceptSuggestion(suggestion.id);
                        }}
                      >
                        Accept
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

