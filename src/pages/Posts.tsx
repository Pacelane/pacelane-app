import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useContent } from '@/hooks/api/useContent';
import { useTheme } from '@/services/theme-context';
import { SavedDraft, ContentSuggestion } from '@/types/content';
import { useToast } from '@/design-system/components/Toast';

// Design System Components (sidebar provided by MainAppChrome)
import ContentCard from '@/design-system/components/ContentCard';
import Input from '@/design-system/components/Input';
import DropdownButton from '@/design-system/components/DropdownButton';
import Button from '@/design-system/components/Button';
import EmptyState from '@/design-system/components/EmptyState';
import Tabs from '@/design-system/components/Tabs';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';

// Icons
import { Search, Plus, FileText } from 'lucide-react';

const Posts = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { colors } = useTheme();
  const { toast } = useToast();
  
  // ========== CLEAN CONTENT STATE MANAGEMENT ==========
  const {
    savedDrafts,
    contentSuggestions,
    loadingDrafts: isLoading,
    deleteDraft,
    error,
    clearError
  } = useContent();

  // ========== LOCAL COMPONENT STATE ==========
  // Sidebar handled by layout
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [sortBy, setSortBy] = useState('lastEdited');

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

  // Title style using awesome serif font, 4xl semi bold
  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Subtitle style - sm medium, text subtle
  const subtitleStyle = {
    ...textStyles.sm.medium,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[8],
  };

  // Filter tabs configuration
  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'draft', label: 'Drafts' },
    { id: 'published', label: 'Published' },
    { id: 'archived', label: 'Archived' },
  ];

  // Sort dropdown options
  const sortOptions = [
    { label: 'Last Edited', onClick: () => setSortBy('lastEdited') },
    { label: 'Newest First', onClick: () => setSortBy('newest') },
    { label: 'Oldest First', onClick: () => setSortBy('oldest') },
    { label: 'A-Z', onClick: () => setSortBy('nameAsc') },
    { label: 'Z-A', onClick: () => setSortBy('nameDesc') },
  ];

  // Get current sort label
  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => 
      (sortBy === 'lastEdited' && opt.label === 'Last Edited') ||
      (sortBy === 'newest' && opt.label === 'Newest First') ||
      (sortBy === 'oldest' && opt.label === 'Oldest First') ||
      (sortBy === 'nameAsc' && opt.label === 'A-Z') ||
      (sortBy === 'nameDesc' && opt.label === 'Z-A')
    );
    return option?.label || 'Last Edited';
  };

  // Get all content items (drafts + suggestions)
  const getAllContentItems = () => {
    const draftItems = savedDrafts.map(draft => ({
      id: draft.id,
      title: draft.title || 'Untitled',
      subtitle: `Last edited ${new Date(draft.updated_at).toLocaleDateString()}`,
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
      subtitle: 'Content suggestion',
      content: suggestion.description || suggestion.suggested_outline?.substring(0, 200) || 'No description available',
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
      
      toast.success('Draft deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete draft');
    }
  };

  const handleCreateFromSuggestion = (suggestion: ContentSuggestion) => {
    navigate('/content-editor', {
      state: {
        suggestion
      }
    });
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
    return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face';
  };

  // Controls row styles for search and sort
  const controlRowStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spacing[24],
    width: '100%',
  };

  // Right section styles for search and dropdown
  const rightSectionStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[12],
  };

  // Content grid styles (2 columns)
  const contentGridStyles = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: spacing.spacing[24],
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
            <h1 style={titleStyle}>Posts</h1>
            <p style={subtitleStyle}>
              Manage your saved drafts and content suggestions
            </p>
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
              <div style={{ width: '280px' }}>
                <Input
                  size="lg"
                  style="default"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leadIcon={<Search size={16} />}
                />
              </div>

              {/* Sort Dropdown */}
              <DropdownButton
                label={getCurrentSortLabel()}
                items={sortOptions}
                size="lg"
                position="bottom-right"
                minWidth="160px"
              />
                                  </div>
                                </div>

          {/* Loading State */}
          {isLoading && (
            <div style={{
              textAlign: 'center',
              padding: spacing.spacing[48],
              color: colors.text.muted,
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                border: `2px solid ${colors.border.default}`,
                borderTop: `2px solid ${colors.border.highlight}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto',
                marginBottom: spacing.spacing[16],
              }} />
              <p style={textStyles.sm.medium}>Loading your posts...</p>
                                </div>
          )}

          {/* Content Display */}
          {!isLoading && (
            <>
              {contentItems.length === 0 ? (
                <EmptyState
                  title="No content found"
                  subtitle={selectedFilter === 'all' 
                    ? "Start writing to create your first post or wait for content suggestions!"
                    : `No ${selectedFilter} content found. Try changing the filter or search terms.`
                  }
                  buttonLabel="Create New Post"
                  onButtonClick={handleCreateNewClick}
                />
              ) : (
                <div style={contentGridStyles}>
                  {contentItems.map((item) => (
                    <ContentCard
                      key={item.id}
                      variant={item.variant}
                      title={item.title}
                      subtitle={item.subtitle}
                      content={item.content}
                      onClick={() => {
                        if (item.type === 'draft') {
                          handleEditDraft(item.originalData);
                        } else if (item.type === 'suggestion') {
                          handleCreateFromSuggestion(item.originalData);
                        }
                      }}
                      onMenuAction={(action) => handleContentAction(action, item.id)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
    </div>
  );
};

export default Posts;