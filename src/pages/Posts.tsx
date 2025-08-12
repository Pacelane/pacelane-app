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
import DropdownMenu from '@/design-system/components/DropdownMenu';
import Button from '@/design-system/components/Button';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';

// Icons
import { Search, ChevronDown, Plus, FileText } from 'lucide-react';

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
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Content container is wrapped by MainAppChrome

  // Content container styles
  const containerStyles = {
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

  // Filter drafts based on search and filter
  const getFilteredDrafts = () => {
    return savedDrafts.filter(draft => {
      const matchesSearch = draft.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           draft.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || draft.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });
  };

  // Sort drafts based on sortBy
  const getSortedDrafts = (drafts) => {
    switch (sortBy) {
      case 'nameAsc':
        return [...drafts].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'nameDesc':
        return [...drafts].sort((a, b) => (b.title || '').localeCompare(a.title || ''));
      case 'newest':
        return [...drafts].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      case 'oldest':
        return [...drafts].sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
      case 'lastEdited':
      default:
        return drafts; // Already sorted by updated_at from backend
    }
  };

  // Transform drafts to ContentCard format
  const getDraftCards = () => {
    return getSortedDrafts(getFilteredDrafts()).map(draft => ({
      id: draft.id,
      title: draft.title || 'Untitled',
      subtitle: `Last edited ${new Date(draft.updated_at).toLocaleDateString()}`,
      content: draft.content.substring(0, 200) + (draft.content.length > 200 ? '...' : ''),
      variant: 'gradient',
      status: draft.status,
    }));
  };

  // Transform suggestions to ContentCard format
  const getSuggestionCards = () => {
    return contentSuggestions.map(suggestion => ({
      id: suggestion.id,
      title: suggestion.title,
      subtitle: 'Content suggestion',
      content: suggestion.description || suggestion.suggested_outline?.substring(0, 200) || 'No description available',
      variant: 'image',
      status: 'suggestion',
    }));
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

  const handleDraftAction = (action, draftId) => {
    const draft = savedDrafts.find(d => d.id === draftId);
    if (!draft) return;

    switch (action) {
      case 'edit':
        handleEditDraft(draft);
        break;
      case 'delete':
        handleDeleteDraft(draftId);
        break;
    }
  };

  const handleSuggestionAction = (action, suggestionId) => {
    const suggestion = contentSuggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    switch (action) {
      case 'create':
        handleCreateFromSuggestion(suggestion);
        break;
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
  const sectionStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[16],
  };

  const sectionTitleStyle = {
    ...textStyles.lg.semibold,
    color: colors.text.default,
    margin: 0,
  };

  const draftCards = getDraftCards();
  const suggestionCards = getSuggestionCards();

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
            <div style={{ display: 'flex', gap: spacing.spacing[8] }}>
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  style={{
                    padding: `${spacing.spacing[8]} ${spacing.spacing[12]}`,
                    backgroundColor: selectedFilter === tab.id ? colors.bg.state.ghostHover : colors.bg.card.default,
                    border: `1px solid ${selectedFilter === tab.id ? colors.border.highlight : colors.border.default}`,
                    borderRadius: cornerRadius.borderRadius.sm,
                    color: selectedFilter === tab.id ? colors.text.default : colors.text.subtle,
                    fontSize: textStyles.sm.normal.fontSize,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                    textTransform: 'capitalize',
                  }}
                  onClick={() => setSelectedFilter(tab.id as any)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

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
              <div style={{ position: 'relative' }}>
                <button
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.spacing[8],
                    padding: `${spacing.spacing[8]} ${spacing.spacing[12]}`,
                    backgroundColor: colors.bg.card.default,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: cornerRadius.borderRadius.sm,
                    color: colors.text.default,
                    fontSize: textStyles.sm.normal.fontSize,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease-in-out',
                  }}
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                >
                  {sortOptions.find(opt => 
                    (sortBy === 'lastEdited' && opt.label === 'Last Edited') ||
                    (sortBy === 'newest' && opt.label === 'Newest First') ||
                    (sortBy === 'oldest' && opt.label === 'Oldest First') ||
                    (sortBy === 'nameAsc' && opt.label === 'A-Z') ||
                    (sortBy === 'nameDesc' && opt.label === 'Z-A')
                  )?.label || 'Last Edited'}
                  <ChevronDown size={12} />
                </button>
                
                <DropdownMenu
                  isOpen={showSortDropdown}
                  onClose={() => setShowSortDropdown(false)}
                  items={sortOptions}
                  position="bottom-right"
                  minWidth="160px"
                />
              </div>
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

          {/* Content Sections */}
          {!isLoading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[32] }}>
              {/* Saved Drafts Section */}
              <div style={sectionStyles}>
                <h2 style={sectionTitleStyle}>Saved Drafts</h2>
                
                {draftCards.length === 0 ? (
                  <div style={{
                    backgroundColor: colors.bg.card.default,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: cornerRadius.borderRadius.lg,
                    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
                    padding: spacing.spacing[32],
                    textAlign: 'center',
                  }}>
                    <FileText style={{ 
                      width: '48px', 
                      height: '48px', 
                      color: colors.text.muted,
                      margin: '0 auto',
                      marginBottom: spacing.spacing[16],
                    }} />
                    <p style={{ ...textStyles.sm.medium, color: colors.text.subtle, margin: 0, marginBottom: spacing.spacing[16] }}>
                      No drafts found. Start writing to create your first draft!
                    </p>
                    <Button
                      label="Create New Post"
                      style="primary"
                      size="sm"
                      leadIcon={<Plus size={16} />}
                      onClick={handleCreateNewClick}
                    />
                              </div>
                ) : (
                  <div style={contentGridStyles}>
                    {draftCards.map((draft) => (
                      <ContentCard
                        key={draft.id}
                        variant={draft.variant}
                        title={draft.title}
                        subtitle={draft.subtitle}
                        content={draft.content}
                        onClick={() => {
                          const originalDraft = savedDrafts.find(d => d.id === draft.id);
                          if (originalDraft) handleEditDraft(originalDraft);
                        }}
                        onMenuAction={(action) => handleDraftAction(action, draft.id)}
                      />
                    ))}
                  </div>
                )}
                  </div>

                  {/* Content Suggestions Section */}
              <div style={sectionStyles}>
                <h2 style={sectionTitleStyle}>Unused Content Suggestions</h2>
                
                {suggestionCards.length === 0 ? (
                  <div style={{
                    backgroundColor: colors.bg.card.default,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: cornerRadius.borderRadius.lg,
                    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
                    padding: spacing.spacing[32],
                    textAlign: 'center',
                  }}>
                    <p style={{ ...textStyles.sm.medium, color: colors.text.subtle, margin: 0 }}>
                      No unused suggestions available.
                    </p>
                                </div>
                ) : (
                  <div style={contentGridStyles}>
                    {suggestionCards.map((suggestion) => (
                      <ContentCard
                        key={suggestion.id}
                        variant={suggestion.variant}
                        title={suggestion.title}
                        subtitle={suggestion.subtitle}
                        content={suggestion.content}
                        onClick={() => {
                          const originalSuggestion = contentSuggestions.find(s => s.id === suggestion.id);
                          if (originalSuggestion) handleCreateFromSuggestion(originalSuggestion);
                        }}
                        onMenuAction={(action) => handleSuggestionAction(action, suggestion.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
    </div>
  );
};

export default Posts;