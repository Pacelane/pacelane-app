import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useContent } from '@/hooks/api/useContent';
import { useTheme } from '@/services/theme-context';
import { supabase } from '@/integrations/supabase/client';

// Utilities
import { 
  getOnboardingCompletionStatus, 
  getMissingIntegrations,
  getOnboardingProgress 
} from '@/utils/firstTimeUserDetection';

// Design System Components
import SetupCard from '@/design-system/components/SetupCard';
import Button from '@/design-system/components/Button';
import SuggestionCard from '@/design-system/components/SuggestionCard';
import ProgressBar from '@/design-system/components/ProgressBar';
import WhatsAppConfigModal from '@/design-system/components/WhatsAppConfigModal';
import ReadAiConfigModal from '@/design-system/components/ReadAiConfigModal';
import Bichaurinho from '@/design-system/components/Bichaurinho';
import SubtleLoadingSpinner from '@/design-system/components/SubtleLoadingSpinner';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';

// Icons
import { Sparkles, Calendar, MessageCircle, Video, ArrowRight, Target, Settings, Users } from 'lucide-react';

/**
 * FirstTimeUserHome - Special home page experience for new users
 * Shows onboarding completion, integration setup, and first content suggestions
 */
const FirstTimeUserHome = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { knowledgeFiles, contentSuggestions, loadContentSuggestions, loadingDrafts, loadingSuggestions } = useContent();
  const { colors } = useTheme();
  
  // Modal states
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [readAiModalOpen, setReadAiModalOpen] = useState(false);
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  
  // Content generation state
  const [generationProgress, setGenerationProgress] = useState({
    isGenerating: false,
    currentStep: '',
    progress: 0
  });

  // Get onboarding and integration status
  const onboardingStatus = getOnboardingCompletionStatus(profile);
  const missingIntegrations = getMissingIntegrations(profile, knowledgeFiles);
  const onboardingProgress = getOnboardingProgress(profile);

  // Generate initial content suggestions
  const generateContentSuggestions = async () => {
    if (!user) return;
    
    setGenerationProgress({
      isGenerating: true,
      currentStep: 'Analyzing your profile...',
      progress: 10
    });
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      if (!token) {
        throw new Error('No auth token available');
      }

      setGenerationProgress(prev => ({
        ...prev,
        currentStep: 'Creating your content strategy...',
        progress: 50
      }));

      const { data, error } = await supabase.functions.invoke('generate-content-suggestions', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (error) throw error;

      setGenerationProgress(prev => ({
        ...prev,
        currentStep: 'Finalizing your suggestions...',
        progress: 90
      }));

      if (data?.suggestions) {
        await loadContentSuggestions();
      }

      setGenerationProgress(prev => ({
        ...prev,
        currentStep: 'Done!',
        progress: 100
      }));

      setTimeout(() => {
        setGenerationProgress({
          isGenerating: false,
          currentStep: '',
          progress: 0
        });
      }, 1000);
      
    } catch (err) {
      console.error('Failed to generate content suggestions:', err);
      setGenerationProgress({
        isGenerating: false,
        currentStep: '',
        progress: 0
      });
    }
  };

  // Handle WhatsApp configuration
  const handleWhatsAppSave = async (number) => {
    if (!user) return;
    
    setSavingWhatsApp(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ whatsapp_number: number })
        .eq('user_id', user.id);

      if (error) throw error;
      
      await refreshProfile();
      setWhatsAppModalOpen(false);
    } catch (error) {
      console.error('Error saving WhatsApp number:', error);
    } finally {
      setSavingWhatsApp(false);
    }
  };

  // Handle Read.ai setup completion
  const handleReadAiComplete = () => {
    // For now, just close the modal
    // In a real implementation, you might want to track this state
    setReadAiModalOpen(false);
  };

  // Navigation handlers
  const handleCompleteOnboarding = () => {
    if (!onboardingStatus.linkedinProfile) {
      navigate('/onboarding/first-things-first');
    } else if (!onboardingStatus.goals) {
      navigate('/onboarding/goals');
    } else if (!onboardingStatus.pacingPreferences) {
      navigate('/onboarding/pacing');
    } else {
      navigate('/onboarding/ready');
    }
  };

  // Get user display name
  const getUserName = () => {
    if (profile?.display_name) return profile.display_name;
    if (profile?.linkedin_name) return profile.linkedin_name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  // Container styles
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[32],
    backgroundColor: 'transparent',
  };

  // Page title styles
  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  const subtitleStyle = {
    ...textStyles.sm.medium,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[8],
  };

  // Welcome section styles
  const welcomeSectionStyles = {
    backgroundColor: colors.bg.card.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.xl,
    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
    padding: spacing.spacing[32],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[24],
  };

  return (
    <div style={containerStyles}>
      {/* Page Header */}
      <div>
        <h1 style={titleStyle}>Welcome to Pacelane!</h1>
        <p style={subtitleStyle}>
          Let's set up your account and create your first content suggestions
        </p>
      </div>

      {/* Welcome Section with Progress */}
      <div style={welcomeSectionStyles}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[20] }}>
          <Bichaurinho variant={15} size={64} />
          <div style={{ flex: 1 }}>
            <h2 style={{
              ...textStyles.xl.semibold,
              color: colors.text.default,
              margin: 0,
              marginBottom: spacing.spacing[8],
            }}>
              Hey {getUserName()}! 👋
            </h2>
            <p style={{
              ...textStyles.sm.normal,
              color: colors.text.subtle,
              margin: 0,
              marginBottom: spacing.spacing[16],
            }}>
              Your account setup is {onboardingProgress}% complete. Let's finish setting up your content strategy!
            </p>
            <ProgressBar
              progress={onboardingProgress}
              size="lg"
              label={`${onboardingProgress}% Complete`}
            />
          </div>
        </div>
      </div>

      {/* Setup Steps Section */}
      {onboardingProgress < 100 && (
        <div>
          <h2 style={{
            ...textStyles.lg.semibold,
            color: colors.text.default,
            margin: 0,
            marginBottom: spacing.spacing[16],
          }}>
            Complete Your Setup
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: spacing.spacing[16],
          }}>
            {!onboardingStatus.linkedinProfile && (
              <SetupCard
                title="LinkedIn Profile"
                subtitle="Connect your LinkedIn profile to personalize your content strategy"
                status="pending"
                bichaurinhoVariant={3}
                buttonLabel="Connect Profile"
                onButtonClick={() => navigate('/onboarding/first-things-first')}
              />
            )}
            
            {onboardingStatus.linkedinProfile && !onboardingStatus.goals && (
              <SetupCard
                title="Content Goals"
                subtitle="Define what you want to achieve with your LinkedIn content"
                status="pending"
                bichaurinhoVariant={5}
                buttonLabel="Set Goals"
                onButtonClick={() => navigate('/onboarding/goals')}
              />
            )}
            
            {onboardingStatus.goals && !onboardingStatus.pacingPreferences && (
              <SetupCard
                title="Posting Schedule"
                subtitle="Choose how often you want to post and when you're available"
                status="pending"
                bichaurinhoVariant={7}
                buttonLabel="Setup Schedule"
                onButtonClick={() => navigate('/onboarding/pacing')}
              />
            )}
            
            {onboardingStatus.pacingPreferences && !onboardingStatus.onboardingCompleted && (
              <SetupCard
                title="Finish Setup"
                subtitle="Complete your onboarding to unlock all features"
                status="pending"
                bichaurinhoVariant={1}
                buttonLabel="Complete Setup"
                onButtonClick={() => navigate('/onboarding/ready')}
              />
            )}
          </div>
        </div>
      )}

      {/* Integrations Section */}
      <div>
        <h2 style={{
          ...textStyles.lg.semibold,
          color: colors.text.default,
          margin: 0,
          marginBottom: spacing.spacing[16],
        }}>
          Connect Your Tools
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: spacing.spacing[16],
        }}>
          {missingIntegrations.whatsApp && (
            <SetupCard
              title="WhatsApp Notifications"
              subtitle="Get content ideas and updates directly to your WhatsApp"
              status="optional"
              bichaurinhoVariant={12}
              buttonLabel="Connect WhatsApp"
              onButtonClick={() => setWhatsAppModalOpen(true)}
            />
          )}
          
          {missingIntegrations.readAi && (
            <SetupCard
              title="Read.ai Integration"
              subtitle="Automatically turn meeting transcripts into content ideas"
              status="optional"
              bichaurinhoVariant={18}
              buttonLabel="Setup Read.ai"
              onButtonClick={() => setReadAiModalOpen(true)}
            />
          )}
          
          {missingIntegrations.calendar && (
            <SetupCard
              title="Google Calendar"
              subtitle="Sync your schedule to optimize content posting times"
              status="optional"
              bichaurinhoVariant={24}
              buttonLabel="Connect Calendar"
              external={true}
              onButtonClick={() => console.log('Calendar integration - coming soon')}
            />
          )}
        </div>
      </div>

      {/* Content Suggestions Section */}
      <div>
        {generationProgress.isGenerating && (
          <div style={{
            padding: spacing.spacing[24],
            backgroundColor: colors.bg.card.default,
            borderRadius: cornerRadius.borderRadius.xl,
            border: `1px solid ${colors.border.default}`,
            boxShadow: getShadow('regular.card', colors, { withBorder: true }),
            marginBottom: spacing.spacing[24]
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.spacing[16],
              marginBottom: spacing.spacing[16]
            }}>
              <SubtleLoadingSpinner size={24} />
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
                  Creating personalized content suggestions just for you...
                </div>
              </div>
            </div>
            
            <ProgressBar
              progress={generationProgress.progress}
              size="md"
            />
          </div>
        )}

        <SuggestionCard 
          title="Your First Content Ideas"
          description={
            contentSuggestions.length > 0 
              ? "Here are some personalized content suggestions to get you started!"
              : "Ready to create your first content suggestions? Let's go!"
          }
          contentCards={
            contentSuggestions.length > 0 
              ? contentSuggestions.slice(0, 3).map(suggestion => ({
                  variant: 'gradient',
                  title: suggestion.title,
                  subtitle: suggestion.description || 'AI-generated content idea',
                  content: suggestion.suggested_outline || suggestion.description || 'Click to start creating this content',
                  onClick: () => navigate('/content-editor', { state: { suggestion } })
                }))
              : [{
                  variant: 'empty',
                  title: 'Generate Your First Ideas',
                  subtitle: 'Click generate to get AI-powered content suggestions',
                  onClick: generateContentSuggestions
                }]
          }
          onCalendarClick={() => console.log('Calendar clicked')}
          onGenerateClick={generateContentSuggestions}
          style={{ width: '100%' }}
        />
      </div>

      {/* WhatsApp Configuration Modal */}
      <WhatsAppConfigModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        currentNumber={profile?.whatsapp_number || ''}
        onSave={handleWhatsAppSave}
        loading={savingWhatsApp}
      />

      {/* Read.ai Configuration Modal */}
      <ReadAiConfigModal
        isOpen={readAiModalOpen}
        onClose={() => setReadAiModalOpen(false)}
        onComplete={handleReadAiComplete}
      />
    </div>
  );
};

export default FirstTimeUserHome;
