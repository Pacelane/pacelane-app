import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/api/useAuth';
import { useContent } from '../hooks/api/useContent';
import { useAnalytics } from '../hooks/api/useAnalytics';
import { useTheme } from '../services/theme-context';
import { useTranslation } from '@/services/i18n-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { templateData } from '@/data/templateData';
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
import { getUserAvatarUrl } from '@/utils/avatarUtils';

const ProductHome = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { savedDrafts, contentSuggestions, knowledgeFiles, loadSavedDrafts, loadContentSuggestions, loadingDrafts, loadingSuggestions, error, createUIContentOrder } = useContent();
  const { streak, stats, weekActivity, loading: analyticsLoading, trackActivity } = useAnalytics();
  const { colors } = useTheme();
  const { t } = useTranslation('pages');
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);

  // Check if user is a first-time user
  const isNewUser = isFirstTimeUser(profile, savedDrafts, contentSuggestions, knowledgeFiles);
  // Sidebar handled by MainAppChrome layout
  const [templates] = useState(templateData.slice(0, 2)); // Show first 2 templates
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
      currentStep: t('productHome.loading.creatingOrder'),
      progress: 10
    });
    
    try {
      console.log('Creating content order with new agent pipeline...');
      
      // Update progress
      setGenerationProgress(prev => ({
        ...prev,
        currentStep: t('productHome.loading.buildingBrief'),
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
        currentStep: t('productHome.loading.processing'),
        progress: 50
      }));

      console.log('Content order created successfully:', result.data);

      // Update progress
      setGenerationProgress(prev => ({
        ...prev,
        currentStep: t('productHome.loading.finalizing'),
        progress: 80
      }));

      // Complete progress
      setGenerationProgress(prev => ({
        ...prev,
        currentStep: t('productHome.loading.done'),
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
    // Use Bichaurinho avatar utility
    return getUserAvatarUrl(profile, user);
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
        title: t('productHome.stats.title'),
        stats: [
          { label: t('productHome.stats.projects'), value: "0" },
          { label: t('productHome.stats.knowledge'), value: "0" },
          { label: t('productHome.stats.ideas'), value: "0" }
        ]
      };
    }

    return {
      title: t('productHome.stats.title'),
      stats: [
        { label: t('productHome.stats.projects'), value: stats.projects.toString() },
        { label: t('productHome.stats.knowledge'), value: stats.knowledge_files.toString() },
        { label: t('productHome.stats.ideas'), value: stats.ideas.toString() }
      ]
    };
  };

  // Main content container (wrapped by MainAppChrome 840px container)

  // Content container styles - padding handled by MainAppChrome
  const contentContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[32],
    backgroundColor: 'transparent',
  };

  // Welcome heading style
  const welcomeHeadingStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors?.text?.default || '#000000',
    margin: 0,
  };

  // Subtitle style
  const subtitleStyle = {
    ...textStyles.sm.medium,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[8],
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
      return t('productHome.contentSuggestion.preview');
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
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        backgroundColor: 'transparent'
      }}>
        <SubtleLoadingSpinner 
          title={t('productHome.loading.dashboard')}
          size={20}
        />
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

  // Always show InitialHome for all users
  return <InitialHome />;
};

export default ProductHome;
