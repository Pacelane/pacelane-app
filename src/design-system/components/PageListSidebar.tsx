import React, { useState } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import Input from '@/design-system/components/Input';
import Button from '@/design-system/components/Button';
import { MagnifyingGlass as Search, Plus, FileText } from '@phosphor-icons/react';
import type { KnowledgePage } from '@/types/knowledgeGraph';

interface PageListSidebarProps {
  pages: KnowledgePage[];
  selectedPageId?: string;
  onPageSelect: (page: KnowledgePage) => void;
  onNewPage: () => void;
  loading?: boolean;
}

export default function PageListSidebar({
  pages,
  selectedPageId,
  onPageSelect,
  onNewPage,
  loading = false,
}: PageListSidebarProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter pages by search query
  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerStyles: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[16],
    padding: spacing.spacing[16],
    backgroundColor: colors.bg.card.default,
    borderRight: `1px solid ${colors.border.default}`,
  };

  const headerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[12],
  };

  const listContainerStyles: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[4],
  };

  const pageItemStyles = (isSelected: boolean): React.CSSProperties => ({
    padding: spacing.spacing[12],
    borderRadius: cornerRadius.borderRadius.md,
    cursor: 'pointer',
    backgroundColor: isSelected ? colors.bg.state.primaryHover : 'transparent',
    border: isSelected ? `1px solid ${colors.border.highlight}` : `1px solid transparent`,
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing.spacing[8],
  });

  const pageIconStyles: React.CSSProperties = {
    fontSize: '20px',
    lineHeight: '20px',
    flexShrink: 0,
  };

  const pageContentStyles: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[4],
  };

  const pageTitleStyles: React.CSSProperties = {
    ...textStyles.sm.medium,
    color: colors.text.default,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const pageMetaStyles: React.CSSProperties = {
    ...textStyles.xs.normal,
    color: colors.text.subtle,
    display: 'flex',
    gap: spacing.spacing[8],
  };

  const emptyStateStyles: React.CSSProperties = {
    ...textStyles.sm.normal,
    color: colors.text.muted,
    textAlign: 'center',
    padding: spacing.spacing[24],
  };

  const getSourceEmoji = (source: string) => {
    switch (source) {
      case 'whatsapp':
        return '💬';
      case 'upload':
        return '📎';
      default:
        return '📝';
    }
  };

  return (
    <div style={containerStyles}>
      {/* Header */}
      <div style={headerStyles}>
        <Button
          label="New Page"
          style="primary"
          size="sm"
          leadIcon={<Plus size={16} />}
          onClick={onNewPage}
          fullWidth
        />
        
        <Input
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leadIcon={<Search size={16} />}
        />
      </div>

      {/* Pages List */}
      <div style={listContainerStyles}>
        {loading && (
          <div style={emptyStateStyles}>Loading pages...</div>
        )}
        
        {!loading && filteredPages.length === 0 && searchQuery && (
          <div style={emptyStateStyles}>No pages found for "{searchQuery}"</div>
        )}
        
        {!loading && filteredPages.length === 0 && !searchQuery && (
          <div style={emptyStateStyles}>
            No pages yet. Create your first page!
          </div>
        )}
        
        {!loading && filteredPages.map((page) => (
          <div
            key={page.id}
            style={pageItemStyles(page.id === selectedPageId)}
            onClick={() => onPageSelect(page)}
            onMouseEnter={(e) => {
              if (page.id !== selectedPageId) {
                e.currentTarget.style.backgroundColor = colors.bg.state.secondaryHover;
              }
            }}
            onMouseLeave={(e) => {
              if (page.id !== selectedPageId) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div style={pageIconStyles}>
              {page.icon || getSourceEmoji(page.source)}
            </div>
            
            <div style={pageContentStyles}>
              <div style={pageTitleStyles}>{page.title}</div>
              <div style={pageMetaStyles}>
                <span>{new Date(page.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>{page.source}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

