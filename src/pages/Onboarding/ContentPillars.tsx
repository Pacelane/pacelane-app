import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import Toast from '@/design-system/components/Toast';

// Design System Components
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import ProgressBar from '@/design-system/components/ProgressBar';
import OnboardingProgressIndicator from '@/design-system/components/OnboardingProgressIndicator';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';

// Icons
import { ArrowLeft, ArrowRight, Plus, Trash as Trash2 } from '@phosphor-icons/react';

interface TopicOption {
  id: number;
  value: string;
}

const ContentPillars = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const [topicOptions, setTopicOptions] = useState<TopicOption[]>([
    {
      id: 1,
      value: ''
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const addTopicOption = () => {
    const newId = topicOptions.length > 0 ? Math.max(...topicOptions.map(t => t.id)) + 1 : 1;
    setTopicOptions(prev => [...prev, { id: newId, value: '' }]);
  };

  const removeTopicOption = (id: number) => {
    setTopicOptions(prev => prev.filter(option => option.id !== id));
  };

  const updateTopicOption = (id: number, value: string) => {
    setTopicOptions(prev =>
      prev.map(option =>
        option.id === id ? { ...option, value } : option
      )
    );
  };

  const handleGoBack = () => {
    navigate('/onboarding/guides');
  };

  const handleContinue = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Get all topic options with content
      const validTopicOptions = topicOptions
        .filter(option => option.value && option.value.trim().length > 0)
        .map(option => option.value.trim());

      const { error } = await supabase
        .from('profiles')
        .update({ 
          content_pillars: validTopicOptions
        } as any)
        .eq('user_id', user.id);

      if (error) throw error;

      navigate('/onboarding/pacing');
    } catch (error) {
      console.error('Error saving editorial topics:', error);
      setToast({ message: 'Failed to save editorial topics. Please try again.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we have at least one topic option with content
  const canContinue = topicOptions.some(option => option.value.trim());

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg.default,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navigation */}
      <TopNav />

      {/* Content Container with gradient background */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: colors.bg.muted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.spacing[40],
          paddingBottom: '160px', // Account for button container height
        }}
      >
        {/* Content Column */}
        <div style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.spacing[24],
          alignItems: 'center',
        }}>
          {/* Back Button */}
          <div style={{ 
            alignSelf: 'flex-start', 
            width: isMobile ? '100%' : '400px',
            maxWidth: isMobile ? '320px' : '400px'
          }}>
            <Button
              label="Go Back"
              style="dashed"
              size="xs"
              leadIcon={<ArrowLeft size={12} />}
              onClick={handleGoBack}
            />
          </div>

          {/* Progress Indicator */}
          <div style={{
            width: isMobile ? '100%' : '400px',
            maxWidth: isMobile ? '320px' : '400px'
          }}>
            <OnboardingProgressIndicator 
              currentStep={5}
              compact={true}
            />
          </div>

          {/* Main Card */}
          <div
            style={{
              backgroundColor: colors.bg.card.default,
              borderRadius: cornerRadius.borderRadius.lg,
              border: `1px solid ${colors.border.darker}`,
              boxShadow: getShadow('regular.card', colors, { withBorder: true }),
              width: isMobile ? '100%' : '400px',
              maxWidth: isMobile ? '320px' : '400px',
              overflow: 'hidden',
            }}
          >
            {/* Main Container */}
            <div
              style={{
                padding: isMobile ? spacing.spacing[24] : spacing.spacing[36],
                backgroundColor: colors.bg.card.default,
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Heading Container - 16px gap between bichaurinho and title/subtitle */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: spacing.spacing[16],
                  marginBottom: spacing.spacing[32],
                }}
              >
                {/* Title and Subtitle Container - 12px gap between title and subtitle */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.spacing[12],
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Title */}
                  <h1
                    style={{
                      fontFamily: typography.fontFamily['awesome-serif'],
                      fontSize: typography.desktop.size['5xl'],
                      fontWeight: typography.desktop.weight.semibold,
                      lineHeight: '0.9',
                      color: colors.text.default,
                      margin: 0,
                      textAlign: 'left',
                    }}
                  >
                    Editorial Topics
                  </h1>

                  {/* Subtitle */}
                  <p
                    style={{
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.desktop.size.sm,
                      fontWeight: typography.desktop.weight.normal,
                      lineHeight: typography.desktop.lineHeight.sm,
                      color: colors.text.muted,
                      margin: 0,
                      textAlign: 'left',
                    }}
                  >
                    What topics do you want to write about? Add the main themes and subjects that interest you and your audience.
                  </p>
                </div>
              </div>

              {/* Dynamic Topic Inputs Container */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.spacing[12],
                }}
              >
                {topicOptions.map((option) => (
                  <div key={option.id}>
                    <Input
                      placeholder="Enter your editorial topic"
                      value={option.value}
                      onChange={(e) => updateTopicOption(option.id, e.target.value)}
                      style="tail-action"
                      size="lg"
                      disabled={isLoading}
                      tailAction={{
                        icon: <Trash2 size={16} />,
                        onClick: () => removeTopicOption(option.id)
                      }}
                    />
                  </div>
                ))}

                {/* Add Topic Option Button */}
                <div style={{ marginTop: spacing.spacing[8], width: '100%' }}>
                  <Button
                    label="Add Topic"
                    style="secondary"
                    size="sm"
                    leadIcon={<Plus size={16} />}
                    onClick={addTopicOption}
                    disabled={isLoading}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Text Container */}
            <div
              style={{
                padding: `${spacing.spacing[24]} ${spacing.spacing[36]}`,
                backgroundColor: colors.bg.card.subtle,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.spacing[4],
              }}
            >
              <p
                style={{
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.desktop.size.sm,
                  fontWeight: typography.desktop.weight.normal,
                  lineHeight: typography.desktop.lineHeight.sm,
                  color: colors.text.muted,
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                {!canContinue 
                  ? "Please add at least one editorial topic to continue."
                  : `${topicOptions.filter(o => o.value.trim()).length} topic${topicOptions.filter(o => o.value.trim()).length === 1 ? '' : 's'} ready.`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Button Container - Fixed overlay at bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          backgroundColor: colors.bg.default,
          borderTop: `1px solid ${colors.border.default}`,
          padding: spacing.spacing[40],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <div style={{ 
          width: '280px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <Button
            label={isLoading ? "Saving..." : "Continue"}
            style="primary"
            size="lg"
            tailIcon={!isLoading ? <ArrowRight size={16} /> : undefined}
            onClick={handleContinue}
            disabled={!canContinue || isLoading}
            fullWidth={true}
          />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default ContentPillars;