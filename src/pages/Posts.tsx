import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useContent } from '@/hooks/api/useContent';
import { useTheme } from '@/services/theme-context';
import { useTranslation } from '@/services/i18n-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { SavedDraft, ContentSuggestion } from '@/types/content';
import { useToast } from '@/design-system/components/Toast';

// Design System Components (sidebar provided by MainAppChrome)
import ContentCard from '@/design-system/components/ContentCard';
import ContentListItem from '@/design-system/components/ContentListItem';
import Input from '@/design-system/components/Input';
import DropdownButton from '@/design-system/components/DropdownButton';
import Button from '@/design-system/components/Button';
import EmptyState from '@/design-system/components/EmptyState';
import SubtleLoadingSpinner from '@/design-system/components/SubtleLoadingSpinner';
import Tabs from '@/design-system/components/Tabs';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';
import { cornerRadius } from '@/design-system/tokens/corner-radius';

// Icons
import { MagnifyingGlass as Search, Plus, FileText, SquaresFour as LayoutGrid, List as AlignJustify } from '@phosphor-icons/react';

// Avatar utilities
import { getUserAvatarUrl } from '@/utils/avatarUtils';

const Posts = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // ========== CLEAN CONTENT STATE MANAGEMENT ==========
  const {
    savedDrafts,
    contentSuggestions,
    loadingDrafts: isLoading,
    deleteDraft,
    updateDraft,
    error,
    clearError
  } = useContent();

  // ========== LOCAL COMPONENT STATE ==========
  // Sidebar handled by layout
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [sortBy, setSortBy] = useState('lastEdited');
  const [viewMode, setViewMode] = useState<'grid' | 'line'>('grid');

  // Content container is wrapped by MainAppChrome

  // Content container styles
  const containerStyles: React.CSSProperties = {
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[24],
  };

  // Title style - using Instrument Serif font, 3xl normal weight
  const titleStyle = {
    fontFamily: typography.fontFamily['instrument-serif'],
    fontSize: typography.desktop.size['3xl'],
    fontWeight: typography.desktop.weight.normal,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };


  // Filter tabs configuration
  const filterTabs = [
    { id: 'all', label: t('posts.filters.all') },
    { id: 'draft', label: t('posts.filters.draft') },
    { id: 'published', label: t('posts.filters.published') },
    { id: 'archived', label: t('posts.filters.archived') },
  ];

  // Sort dropdown options
  const sortOptions = [
    { label: t('posts.sort.lastEdited'), onClick: () => setSortBy('lastEdited') },
    { label: t('posts.sort.newest'), onClick: () => setSortBy('newest') },
    { label: t('posts.sort.oldest'), onClick: () => setSortBy('oldest') },
    { label: t('posts.sort.nameAsc'), onClick: () => setSortBy('nameAsc') },
    { label: t('posts.sort.nameDesc'), onClick: () => setSortBy('nameDesc') },
  ];

  // Get current sort label
  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => 
      (sortBy === 'lastEdited' && opt.label === t('posts.sort.lastEdited')) ||
      (sortBy === 'newest' && opt.label === t('posts.sort.newest')) ||
      (sortBy === 'oldest' && opt.label === t('posts.sort.oldest')) ||
      (sortBy === 'nameAsc' && opt.label === t('posts.sort.nameAsc')) ||
      (sortBy === 'nameDesc' && opt.label === t('posts.sort.nameDesc'))
    );
    return option?.label || t('posts.sort.lastEdited');
  };

  // Get all content items (drafts + suggestions)
  const getAllContentItems = () => {
    const draftItems = savedDrafts.map(draft => ({
      id: draft.id,
      title: draft.title || t('posts.content.untitled'),
      subtitle: t('posts.content.lastEdited', { date: new Date(draft.updated_at).toLocaleDateString() }),
      content: draft.content.substring(0, 200) + (draft.content.length > 200 ? '...' : ''),
      variant: 'gradient',
      status: draft.status,
      type: 'draft',
      originalData: draft,
      updatedAt: new Date(draft.updated_at),
    }));

    const suggestionItems = contentSuggestions.map(suggestion => ({
      id: suggestion.id,
      title: suggestion.title,
      subtitle: t('posts.content.contentSuggestion'),
      content: suggestion.description || suggestion.suggested_outline?.substring(0, 200) || t('posts.content.noDescription'),
      variant: 'image',
      status: 'suggestion',
      type: 'suggestion',
      originalData: suggestion,
      updatedAt: new Date(suggestion.created_at || Date.now()),
    }));

    return [...draftItems, ...suggestionItems];
  };

  // Filter content based on search and filter
  const getFilteredContent = () => {
    const allItems = getAllContentItems();
    
    return allItems.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = false;
      switch (selectedFilter) {
        case 'all':
          matchesFilter = true;
          break;
        case 'draft':
          matchesFilter = item.type === 'draft' && item.status === 'draft';
          break;
        case 'published':
          matchesFilter = item.type === 'draft' && item.status === 'published';
          break;
        case 'archived':
          matchesFilter = item.type === 'draft' && item.status === 'archived';
          break;
        default:
          matchesFilter = true;
      }
      
      return matchesSearch && matchesFilter;
    });
  };

  // Sort content based on sortBy
  const getSortedContent = (items) => {
    switch (sortBy) {
      case 'nameAsc':
        return [...items].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'nameDesc':
        return [...items].sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      case 'newest':
        return [...items].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      case 'oldest':
        return [...items].sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime());
      case 'lastEdited':
      default:
        return [...items].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }
  };

  // Event handlers
  const handleEditDraft = (draft: SavedDraft) => {
    navigate('/content-editor', {
      state: {
        draftId: draft.id,
        title: draft.title,
        content: draft.content
      }
    });
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      const result = await deleteDraft(draftId);
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      toast.success(t('posts.messages.deleteSuccess'));
    } catch (error: any) {
      toast.error(error.message || t('posts.messages.deleteError'));
    }
  };

  const handleCreateFromSuggestion = (suggestion: ContentSuggestion) => {
    navigate('/content-editor', {
      state: {
        suggestion
      }
    });
  };

  const handleStatusChange = async (draftId: string, newStatus: 'draft' | 'published' | 'archived') => {
    try {
      const result = await updateDraft(draftId, { status: newStatus });
      
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      const statusLabel = t(`posts.status.${newStatus}`);
      toast.success(t('posts.messages.statusUpdated', { status: statusLabel }));
    } catch (error: any) {
      toast.error(error.message || t('posts.messages.statusUpdateError'));
    }
  };

  const handleContentAction = (action, itemId) => {
    const allItems = getAllContentItems();
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;

    if (item.type === 'draft') {
      switch (action) {
        case 'edit':
          handleEditDraft(item.originalData);
          break;
        case 'delete':
          handleDeleteDraft(itemId);
          break;
        case 'mark-draft':
          handleStatusChange(itemId, 'draft');
          break;
        case 'mark-published':
          handleStatusChange(itemId, 'published');
          break;
        case 'mark-archived':
          handleStatusChange(itemId, 'archived');
          break;
      }
    } else if (item.type === 'suggestion') {
      switch (action) {
        case 'create':
          handleCreateFromSuggestion(item.originalData);
          break;
      }
    }
  };

  // Sidebar event handlers
  const handleMenuItemClick = (menuId: string) => {
    switch (menuId) {
      case 'home':
        navigate('/product-home');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'knowledge':
        navigate('/knowledge');
        break;
      case 'history':
        // Already on posts/history
        break;
      default:
        console.log('Navigation for:', menuId);
    }
  };

  const handleCreateNewClick = () => {
    navigate('/content-editor');
  };

  const handleAvatarClick = () => {
    navigate('/profile');
  };

  // Get user display info
  const getUserName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.linkedin_name) return profile.linkedin_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getUserAvatar = () => {
    return getUserAvatarUrl(profile, user);
  };

  // Controls row styles for search and sort - responsive
  const controlRowStyles = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: isMobile ? 'stretch' : 'center',
    justifyContent: isMobile ? 'flex-start' : 'space-between',
    gap: isMobile ? spacing.spacing[16] : spacing.spacing[24],
    width: '100%',
  };

  // Right section styles for search and dropdown - responsive
  const rightSectionStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[12],
    width: isMobile ? '100%' : 'auto',
  };

  // View toggle row styles
  const viewToggleRowStyles = {
    display: 'flex',
    justifyContent: 'flex-start',
    width: '100%',
  };

  // Content grid styles - responsive and view-mode aware
  const contentGridStyles = {
    display: 'grid',
    gridTemplateColumns: viewMode === 'line' ? '1fr' : (isMobile ? '1fr' : 'repeat(3, 1fr)'),
    gap: spacing.spacing[12],
  };

  // Section styles
  const sectionStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[16],
  };

  const sectionTitleStyle = {
    ...textStyles.lg.semibold,
    color: colors.text.default,
    margin: 0,
  };

  const contentItems = getSortedContent(getFilteredContent());

  return (
    <div style={containerStyles}>
          {/* Header Section */}
          <div>
            <h1 style={titleStyle}>{t('posts.title')}</h1>
          </div>

          {/* Controls Row - Filter Tabs, Search and Sort */}
          <div style={controlRowStyles}>
            {/* Left: Filter Tabs */}
            <Tabs
              style="segmented"
              type="default"
              tabs={filterTabs}
              activeTab={selectedFilter}
              onTabChange={setSelectedFilter}
            />

            {/* Right: Search and Sort */}
            <div style={rightSectionStyles}>
              {/* Search Input */}
              <div style={{ flex: isMobile ? 1 : 'none', width: isMobile ? 'auto' : '280px' }}>
                <Input
                  size="lg"
                  style="default"
                  placeholder={t('posts.search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leadIcon={<Search size={16} />}
                />
              </div>

              {/* Sort Dropdown */}
              <div style={{ flexShrink: 0 }}>
                <DropdownButton
                  label={getCurrentSortLabel()}
                  items={sortOptions}
                  size="lg"
                  position="bottom-right"
                  minWidth="160px"
                />
              </div>
            </div>
          </div>

          {/* View Toggle Row */}
          <div style={viewToggleRowStyles}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              border: `1px solid ${colors.border.default}`,
              borderRadius: cornerRadius.borderRadius.md,
              overflow: 'hidden'
            }}>
                             <Button
                 variant="default"
                 style={viewMode === 'grid' ? 'soft' : 'ghost'}
                 size="sm"
                 leadIcon={<LayoutGrid size={16} />}
                 label={t('posts.viewModes.grid')}
                 onClick={() => setViewMode('grid')}
                 onFocus={(e) => e.target.blur()}
               />
               <Button
                 variant="default"
                 style={viewMode === 'line' ? 'soft' : 'ghost'}
                 size="sm"
                 leadIcon={<AlignJustify size={16} />}
                 label={t('posts.viewModes.list')}
                 onClick={() => setViewMode('line')}
                 onFocus={(e) => e.target.blur()}
               />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: spacing.spacing[48],
            }}>
              <SubtleLoadingSpinner 
                title={t('posts.loading.posts')}
                size={16}
              />
            </div>
          )}

          {/* Content Display */}
          {!isLoading && (
            <>
              {contentItems.length === 0 ? (
                <EmptyState
                  title={t('posts.empty.title')}
                  subtitle={selectedFilter === 'all' 
                    ? t('posts.empty.subtitleAll')
                    : t('posts.empty.subtitleFiltered', { filter: selectedFilter })
                  }
                  buttonLabel={t('posts.empty.cta')}
                  onButtonClick={handleCreateNewClick}
                />
              ) : (
                <div style={contentGridStyles}>
                  {contentItems.map((item) => {
                    const ContentComponent = viewMode === 'grid' ? ContentCard : ContentListItem;
                    return (
                      <ContentComponent
                        key={item.id}
                        variant={item.variant}
                        title={item.title}
                        subtitle={item.subtitle}
                        content={item.content}
                        status={item.status}
                        onClick={() => {
                          if (item.type === 'draft') {
                            handleEditDraft(item.originalData);
                          } else if (item.type === 'suggestion') {
                            handleCreateFromSuggestion(item.originalData);
                          }
                        }}
                        onMenuAction={(action) => handleContentAction(action, item.id)}
                      />
                    );
                  })}
                </div>
              )}
            </>
          )}
    </div>
  );
};

export default Posts;