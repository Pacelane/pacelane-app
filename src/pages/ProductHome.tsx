import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useContent } from '@/hooks/api/useContent';
import { useAnalytics } from '@/hooks/api/useAnalytics';
import { useTheme } from '@/services/theme-context';
import * as templatesApi from '@/api/templates';
import type { Template } from '@/api/templates';
import { supabase } from '@/integrations/supabase/client';

// Design System Components
import HomeSidebar from '@/design-system/components/HomeSidebar';
import StreakCard from '@/design-system/components/StreakCard';
import StatsSummaryCard from '@/design-system/components/StatsSummaryCard';
import SuggestionCard from '@/design-system/components/SuggestionCard';
import TemplateCard from '@/design-system/components/TemplateCard';
import ContentCard from '@/design-system/components/ContentCard';
import Input from '@/design-system/components/Input';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';

// Icons
import { ChevronRight, Search } from 'lucide-react';

const ProductHome = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { savedDrafts, contentSuggestions, loadSavedDrafts, loadContentSuggestions, loadingDrafts, loadingSuggestions, error } = useContent();
  const { streak, stats, weekActivity, loading: analyticsLoading, trackActivity } = useAnalytics();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    if (user && !hasLoadedInitialData) {
      const loadData = async () => {
        try {
          await Promise.allSettled([
            loadSavedDrafts(),
            loadContentSuggestions(),
            loadTemplates()
          ]);
        } catch (err) {
          console.log('Some data failed to load, but continuing...');
        } finally {
          setHasLoadedInitialData(true);
        }
      };
      
      loadData();
    }
  }, [user, hasLoadedInitialData, loadSavedDrafts, loadContentSuggestions]);

  // Load templates from database
  const loadTemplates = async () => {
    if (!user) return;
    
    setLoadingTemplates(true);
    try {
      const result = await templatesApi.fetchSystemTemplates();
      if (result.data) {
        setTemplates(result.data.slice(0, 2)); // Show first 2 templates in home page
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Generate new content suggestions using the edge function
  const generateContentSuggestions = async () => {
    if (!user) return;
    
    try {
      console.log('Generating new content suggestions...');
      
      // Get the current session token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        throw new Error('No auth token available');
      }

      // Call the edge function
      const { data, error } = await supabase.functions.invoke('generate-content-suggestions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.suggestions) {
        console.log('Generated suggestions:', data.suggestions);
        // Reload content suggestions to get the new ones
        await loadContentSuggestions();
      }
    } catch (err) {
      console.error('Failed to generate content suggestions:', err);
      // Don't throw - just log the error so UI doesn't break
    }
  };

  // Get user display name
  const getUserName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.linkedin_name) return profile.linkedin_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  // Get user avatar
  const getUserAvatar = () => {
    // Use a default avatar for now
    return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face';
  };

  // Get current month name
  const getCurrentMonthName = () => {
    return new Date().toLocaleString('default', { month: 'long' });
  };

  // Get days in current month
  const getDaysInCurrentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  };

  // Convert analytics data to component props
  const getStreakCardProps = () => {
    if (!streak) {
      return {
        streakDays: 0,
        currentMonthDays: getDaysInCurrentMonth(),
        activeDays: 0,
        monthName: getCurrentMonthName(),
        weekdays: weekActivity.length > 0 ? weekActivity : [
          { letter: 'M', active: false },
          { letter: 'T', active: false },
          { letter: 'W', active: false },
          { letter: 'T', active: false },
          { letter: 'F', active: false },
          { letter: 'S', active: false },
          { letter: 'S', active: false }
        ]
      };
    }

    return {
      streakDays: streak.current_streak,
      currentMonthDays: getDaysInCurrentMonth(),
      activeDays: streak.active_days_this_month,
      monthName: getCurrentMonthName(),
      weekdays: weekActivity.length > 0 ? weekActivity : [
        { letter: 'M', active: false },
        { letter: 'T', active: false },
        { letter: 'W', active: false },
        { letter: 'T', active: false },
        { letter: 'F', active: false },
        { letter: 'S', active: false },
        { letter: 'S', active: false }
      ]
    };
  };

  // Convert analytics data to stats summary props
  const getStatsSummaryProps = () => {
    if (!stats) {
      return {
        title: "Your Stats",
        stats: [
          { label: "Projects", value: "0" },
          { label: "Knowledge", value: "0" },
          { label: "Ideas", value: "0" }
        ]
      };
    }

    return {
      title: "Your Stats",
      stats: [
        { label: "Projects", value: stats.projects.toString() },
        { label: "Knowledge", value: stats.knowledge_files.toString() },
        { label: "Ideas", value: stats.ideas.toString() }
      ]
    };
  };

  // Main container styles (accounting for sidebar)
  const mainContainerStyles = {
    marginLeft: isSidebarCollapsed ? '72px' : '240px',
    transition: 'margin-left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    minHeight: '100vh',
    backgroundColor: colors?.bg?.default || '#ffffff',
    width: `calc(100vw - ${isSidebarCollapsed ? '72px' : '240px'})`,
    position: 'relative',
  };

  // Content container styles
  const contentContainerStyles = {
    padding: `${spacing.spacing[32]} ${spacing.spacing[32]}`,
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[32],
  };

  // Welcome heading style
  const welcomeHeadingStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['5xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors?.text?.default || '#000000',
  };

  // Filter drafts based on search
  const filteredDrafts = savedDrafts.filter(draft =>
    draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    draft.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sidebar event handlers
  const handleMenuItemClick = (menuId: string) => {
    switch (menuId) {
      case 'home':
        // Already on home, do nothing or scroll to top
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'knowledge':
        navigate('/knowledge');
        break;
      case 'history':
        navigate('/posts');
        break;
      case 'pacing':
        // Navigate to pacing page when implemented
        console.log('Pacing page - coming soon');
        break;
      case 'notifications':
        // Navigate to notifications page when implemented
        console.log('Notifications page - coming soon');
        break;
      case 'plan-billing':
        // Navigate to billing page when implemented
        console.log('Plan & Billing page - coming soon');
        break;
      default:
        console.log('Unknown menu item:', menuId);
    }
  };

  const handleCreateNewClick = async () => {
    // Track activity when user creates new content
    if (trackActivity) {
      await trackActivity('content_creation');
    }
    navigate('/content-editor');
  };

  const handleAvatarClick = () => {
    navigate('/profile');
  };

  const handleThemeChange = (theme: string) => {
    console.log('Theme changed to:', theme);
  };

  const handleHelpClick = () => {
    console.log('Help clicked');
  };

  const handleTemplateClick = async (templateId: string) => {
    // Track activity when user selects a template
    if (trackActivity) {
      await trackActivity('content_creation');
    }
    navigate('/content-editor', { state: { templateId } });
  };

  const handleContentClick = (draftId: string) => {
    navigate('/content-editor', { state: { draftId } });
  };

  const handleGenerateContent = async () => {
    // Generate new content suggestions if none exist, or reload if they do
    if (contentSuggestions.length === 0) {
      await generateContentSuggestions();
    } else {
      await loadContentSuggestions();
    }
  };

  // Show loading state only on initial load
  if (!hasLoadedInitialData && !error) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {/* HomeSidebar */}
        <HomeSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          userName={getUserName()}
          userAvatar={getUserAvatar()}
          activeMenuItem="home"
          onMenuItemClick={handleMenuItemClick}
          onCreateNewClick={handleCreateNewClick}
          onAvatarClick={handleAvatarClick}
          onThemeChange={handleThemeChange}
          onHelpClick={handleHelpClick}
        />

        {/* Main Content Area */}
        <div style={mainContainerStyles}>
          <div style={contentContainerStyles}>
            {/* Welcome Heading */}
            <h1 style={welcomeHeadingStyle}>
              Welcome, {getUserName()}!
            </h1>

            {/* Loading indicator */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              padding: spacing.spacing[40],
              flexDirection: 'column',
              gap: spacing.spacing[16]
            }}>
              <div style={{ color: colors?.text?.subtle || '#666666' }}>Loading your dashboard...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* HomeSidebar */}
      <HomeSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        userName={getUserName()}
        userAvatar={getUserAvatar()}
        activeMenuItem="home"
        onMenuItemClick={handleMenuItemClick}
        onCreateNewClick={handleCreateNewClick}
        onAvatarClick={handleAvatarClick}
        onThemeChange={handleThemeChange}
        onHelpClick={handleHelpClick}
      />

      {/* Main Content Area */}
      <div style={mainContainerStyles}>
        <div style={contentContainerStyles}>
          {/* Welcome Heading */}
          <h1 style={welcomeHeadingStyle}>
            Welcome, {getUserName()}!
          </h1>

          {/* Streak Card and Stats Card Row - Using Real Data */}
          <div style={{ display: 'flex', gap: spacing.spacing[16] }}>
            <StreakCard {...getStreakCardProps()} />
            <div style={{ flex: 1 }}>
              <StatsSummaryCard {...getStatsSummaryProps()} />
            </div>
          </div>

          {/* Suggestion Card - Always show with dynamic content */}
          {hasLoadedInitialData && (
            <SuggestionCard 
              title="For Today"
              description={
                contentSuggestions.length > 0 
                  ? "Here are some content suggestions based on your goals and preferences."
                  : "Let's create personalized content suggestions for you!"
              }
              contentCards={
                contentSuggestions.length > 0 
                  ? contentSuggestions.slice(0, 2).map(suggestion => ({
                      variant: 'gradient' as const,
                      title: suggestion.title,
                      subtitle: suggestion.description || 'Suggested for today',
                      onClick: () => navigate('/content-editor', { state: { suggestion } })
                    }))
                  : [
                      {
                        variant: 'empty' as const,
                        title: 'Generate Your First Suggestions',
                        subtitle: 'Click generate to get AI-powered content ideas',
                        onClick: handleGenerateContent
                      }
                    ]
              }
              onCalendarClick={() => console.log('Calendar clicked')}
              onGenerateClick={handleGenerateContent}
              style={{ width: '100%' }}
            />
          )}

          {/* Templates Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ 
              ...textStyles.md.semibold, 
              color: colors?.text?.subtle || '#666666'
            }}>
              Let's get started!
            </h2>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: spacing.spacing[4],
                background: 'none',
                border: 'none',
                color: colors?.text?.subtle || '#666666',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onClick={() => navigate('/content-editor')}
            >
              see all templates
              <ChevronRight size={12} />
            </button>
          </div>

          {/* Template Cards Row - Using Real Templates */}
          <div style={{ display: 'flex', gap: spacing.spacing[12] }}>
            <TemplateCard 
              variant="empty"
              onClick={() => navigate('/content-editor')}
              style={{ flex: 1 }}
            />
            {templates.slice(0, 2).map((template, index) => (
              <TemplateCard 
                key={template.id}
                variant="default"
                title={template.title}
                description={template.description || ''}
                bichaurinhoVariant={index + 3}
                onClick={() => handleTemplateClick(template.id)}
                style={{ flex: 1 }}
              />
            ))}
          </div>

          {/* Your History Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ 
              ...textStyles.md.semibold, 
              color: colors?.text?.subtle || '#666666'
            }}>
              Your History
            </h2>
            <Input
              size="sm"
              placeholder="Search..."
              leadIcon={<Search size={16} />}
              style="default"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
              </div>

          {/* Content Cards Grid */}
          {loadingDrafts && !hasLoadedInitialData ? (
            <div style={{ textAlign: 'center', padding: spacing.spacing[32] }}>
              <p style={{ color: colors?.text?.subtle || '#666666' }}>Loading your content...</p>
              </div>
          ) : filteredDrafts.length > 0 ? (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: spacing.spacing[24] 
            }}>
              {filteredDrafts.map((draft, index) => (
                <ContentCard 
                  key={draft.id}
                  variant={index % 2 === 0 ? 'gradient' : 'image'}
                  title={draft.title}
                  subtitle={`Last edited ${new Date(draft.updated_at).toLocaleDateString()}`}
                  onClick={() => handleContentClick(draft.id)}
                />
              ))}
                </div>
          ) : (
            <div style={{ 
              textAlign: 'center', 
              padding: spacing.spacing[48],
              color: colors?.text?.subtle || '#666666'
            }}>
              <p>No content yet. Start creating with the templates above!</p>
              </div>
          )}

          {/* Error Message */}
          {error && (
            <div style={{ 
              textAlign: 'center', 
              padding: spacing.spacing[24],
              color: colors?.text?.subtle || '#666666',
              fontSize: '14px'
            }}>
              <p>Some features may be limited due to connection issues.</p>
            </div>
          )}
          </div>
      </div>
    </div>
  );
};

export default ProductHome;