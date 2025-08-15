import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/api/useAuth';
import { useContent } from '../hooks/api/useContent';
import { useAnalytics } from '../hooks/api/useAnalytics';
import { useTheme } from '../services/theme-context';
import * as templatesApi from '../api/templates';
import type { Template } from '../api/templates';
import { supabase } from '../integrations/supabase/client';

// First-time user utilities
import { isFirstTimeUser } from '@/utils/firstTimeUserDetection';

// Design System Components
// Sidebar is now provided by MainAppChrome
import StreakCard from '@/design-system/components/StreakCard';
import StatsSummaryCard from '@/design-system/components/StatsSummaryCard';
import SuggestionCard from '@/design-system/components/SuggestionCard';
import CalendarSnippetsCard from '@/design-system/components/CalendarSnippetsCard';
import TemplateCard from '@/design-system/components/TemplateCard';
import ContentCard from '@/design-system/components/ContentCard';
import Input from '@/design-system/components/Input';
import Button from '@/design-system/components/Button';
import EmptyState from '@/design-system/components/EmptyState';
import SubtleLoadingSpinner from '@/design-system/components/SubtleLoadingSpinner';
import FirstTimeUserHome from '@/design-system/components/FirstTimeUserHome';
import InitialHome from './InitialHome';

// Design System Tokens
import { spacing } from '../design-system/tokens/spacing';
import { textStyles } from '../design-system/styles/typography/typography-styles';
import { typography } from '../design-system/tokens/typography';
import { cornerRadius } from '../design-system/tokens/corner-radius';
import { shadows, getShadow } from '../design-system/tokens/shadows';

// Icons
import { ChevronRight, Search } from 'lucide-react';

// Additional Components
import { CalendarService } from '@/services/calendarService';

const ProductHome = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { savedDrafts, contentSuggestions, knowledgeFiles, loadSavedDrafts, loadContentSuggestions, loadingDrafts, loadingSuggestions, error, createUIContentOrder } = useContent();
  const { streak, stats, weekActivity, loading: analyticsLoading, trackActivity } = useAnalytics();
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  // Check if user is a first-time user
  const isNewUser = isFirstTimeUser(profile, savedDrafts, contentSuggestions, knowledgeFiles);
  // Sidebar handled by MainAppChrome layout
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{
    isGenerating: boolean;
    currentStep: string;
    progress: number;
  }>({
    isGenerating: false,
    currentStep: '',
    progress: 0
  });
  const [recentMeetings, setRecentMeetings] = useState<any[]>([]);



  // Load user data on component mount
  useEffect(() => {
    if (user && !hasLoadedInitialData) {
      const loadData = async () => {
        try {
          await Promise.allSettled([
            loadSavedDrafts(),
            loadContentSuggestions(),
            loadTemplates(),
            (async () => {
              const end = new Date();
              const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
              const { success, events } = await CalendarService.getEvents({
                start: start.toISOString(),
                end: end.toISOString(),
                limit: 10,
              });
              if (success && Array.isArray(events)) {
                // Sort most recent first and take top 10
                const sorted = [...events].sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
                const top = sorted.slice(0, 10);
                const mapped = top.map((e: any) => ({
                  id: e.id || e.event_id,
                  title: e.title || 'Untitled Event',
                  date: e.start_time,
                  time: new Date(e.start_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
                  attendees: Array.isArray(e.attendees) ? e.attendees.length : 0,
                }));
                setRecentMeetings(mapped);
              } else {
                setRecentMeetings([]);
              }
            })()
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

  // Generate new content suggestions using the enhanced multi-agent system
  const generateContentSuggestions = async () => {
    console.log('generateContentSuggestions called!');
    if (!user) {
      console.log('No user found, returning early');
      return;
    }
    
    // Start progress tracking
    setGenerationProgress({
      isGenerating: true,
      currentStep: 'Creating content order...',
      progress: 10
    });
    
    try {
      console.log('Creating content order with new agent pipeline...');
      
      // Update progress
      setGenerationProgress(prev => ({
        ...prev,
        currentStep: 'Building content brief...',
        progress: 20
      }));

      // Create a content order using the new agent pipeline
      const result = await createUIContentOrder({
        platform: 'linkedin',
        length: 'medium',
        tone: 'professional',
        angle: 'insights',
        topic: 'Professional insights and industry trends',
        context: 'Generate content based on user profile and knowledge base'
      });

      if (result.error) {
        console.error('Content order creation error:', result.error);
        throw new Error(result.error);
      }

      // Update progress
      setGenerationProgress(prev => ({
        ...prev,
        currentStep: 'Agent pipeline processing...',
        progress: 50
      }));

      console.log('Content order created successfully:', result.data);

      // Update progress
      setGenerationProgress(prev => ({
        ...prev,
        currentStep: 'Finalizing content...',
        progress: 80
      }));

      // Complete progress
      setGenerationProgress(prev => ({
        ...prev,
        currentStep: 'Done! Content created in drafts.',
        progress: 100
      }));

      // Reset progress after a short delay
      setTimeout(() => {
        setGenerationProgress({
          isGenerating: false,
          currentStep: '',
          progress: 0
        });
      }, 2000);
      
    } catch (err) {
      console.error('Failed to create content order:', err);
      setGenerationProgress({
        isGenerating: false,
        currentStep: '',
        progress: 0
      });
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

  // Main content container (wrapped by MainAppChrome 840px container)

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

  // Templates are not filtered by search - always show all templates

  // Navigation handled by MainAppChrome sidebar

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

  const handleMeetingClick = async (meeting: any) => {
    // Track activity when user creates content from meeting
    if (trackActivity) {
      await trackActivity('content_creation');
    }
    navigate('/content-editor', { state: { meeting } });
  };



  // Function to create a preview of the post content
  const createPostPreview = (suggestion: any) => {
    // Check for various content properties that might exist
    let content = suggestion.suggested_outline || suggestion.description || '';
    
    if (!content) {
      return 'AI-generated content suggestion - click to start creating';
    }
    
    // Get the first paragraph or first 200 characters
    const firstParagraph = content.split('\n\n')[0] || content;
    const preview = firstParagraph.length > 200 
      ? firstParagraph.substring(0, 200) + '...'
      : firstParagraph;
    
    return preview;
  };

  const handleGenerateContent = async () => {
    console.log('handleGenerateContent called!');
    console.log('Current contentSuggestions length:', contentSuggestions.length);
    
    // Always generate new suggestions when button is clicked
    console.log('Generating new suggestions...');
    await generateContentSuggestions();
  };

  // Show loading state only on initial load
  if (!hasLoadedInitialData && !error) {
    return (
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
    );
  }

  // Show first-time user experience if user is new
  // Temporarily disabled - will be re-enabled later
  // if (hasLoadedInitialData && isNewUser) {
  //   return <FirstTimeUserHome />;
  // }

  // Check if user has no posts
  const hasNoPosts = filteredDrafts.length === 0;

  // If user has no posts and data has loaded, show InitialHome
  if (hasLoadedInitialData && hasNoPosts) {
    return <InitialHome />;
  }

  return (
    <div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
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
            <>
              {/* Progress Indicator */}
              {generationProgress.isGenerating && (
                <div style={{
                  padding: spacing.spacing[24],
                  backgroundColor: colors.bg.card.default,
                  borderRadius: cornerRadius.borderRadius.xl,
                  border: `1px solid ${colors.border.default}`,
                  boxShadow: getShadow('regular.card', colors, { withBorder: true }),
                  marginBottom: spacing.spacing[16]
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.spacing[16],
                    marginBottom: spacing.spacing[12]
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: colors.icon.highlight,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: 'spin 1s linear infinite'
                    }}>
                      <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid transparent',
                        borderTop: '2px solid white',
                        borderRadius: '50%'
                      }} />
                    </div>
                    <div>
                      <div style={{
                        ...textStyles.sm.semibold,
                        color: colors.text.default,
                        marginBottom: spacing.spacing[4]
                      }}>
                        {generationProgress.currentStep}
                      </div>
                      <div style={{
                        ...textStyles.xs.normal,
                        color: colors.text.muted
                      }}>
                        Using AI to create personalized content for you...
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div style={{
                    width: '100%',
                    height: '4px',
                    backgroundColor: colors.bg.subtle,
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${generationProgress.progress}%`,
                      height: '100%',
                      backgroundColor: colors.icon.highlight,
                      transition: 'width 0.3s ease',
                      borderRadius: '2px'
                    }} />
                  </div>
                </div>
              )}

              <SuggestionCard 
                title="For Today"
                description={
                  contentSuggestions.length > 0 
                    ? "Here are some content suggestions based on your goals and preferences."
                    : "Let's create personalized content suggestions for you!"
                }
                contentCards={
                  contentSuggestions.length > 0 
                    ? contentSuggestions.slice(0, 3).map(suggestion => {
                        return {
                          variant: 'gradient' as const,
                          title: suggestion.title,
                          subtitle: suggestion.description || 'AI-generated content suggestion',
                          content: createPostPreview(suggestion),
                          onClick: () => navigate('/content-editor', { state: { suggestion } })
                        };
                      })
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

              {/* Calendar Snippets Card */}
              <CalendarSnippetsCard 
                title="Past Meetings"
                subtitle="Turn your recent meetings into content"
                meetings={recentMeetings}
                onMeetingClick={handleMeetingClick}
                onViewAllClick={() => console.log('View all meetings clicked')}
                style={{ width: '100%' }}
              />
            </>
          )}

          {/* Removed lower placeholder sections */}

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
              onClick={() => navigate('/templates')}
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
              placeholder="Search your posts..."
              leadIcon={<Search size={16} />}
              style="default"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
              </div>

          {/* Content Cards Grid */}
          {loadingDrafts && !hasLoadedInitialData ? (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: spacing.spacing[32],
            }}>
              <SubtleLoadingSpinner 
                title="Loading your content..."
                size={16}
              />
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
            <EmptyState
              title="No content yet"
              subtitle="Start creating with the templates above!"
              buttonLabel="Browse Templates"
              onButtonClick={() => navigate('/templates')}
            />
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
  );
};

export default ProductHome;