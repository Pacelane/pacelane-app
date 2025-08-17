import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/design-system/components/Toast';

// Design System Components
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import ProgressBar from '@/design-system/components/ProgressBar';
import OnboardingProgressIndicator from '@/design-system/components/OnboardingProgressIndicator';
import Bichaurinho from '@/design-system/components/Bichaurinho';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';

// Icons
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';

// Data
import { getGuidesForGoals } from '@/data/onboardingData';

interface Guide {
  id: number;
  value: string;
  isPreSelected: boolean;
}

const Guides = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const isMobile = useIsMobile();

  const [isLoading, setIsLoading] = useState(false);
  const [userGoals, setUserGoals] = useState<string[]>([]);

  // Initialize with empty guides - will be populated based on user goals
  const [guides, setGuides] = useState<Guide[]>([]);

  // Fetch user goals and populate guides
  useEffect(() => {
    const fetchUserGoals = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('goals')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user goals:', error);
          return;
        }

        const goals = (data?.goals as string[]) || [];
        setUserGoals(goals);

        // Get suggested guides based on goals
        const suggestedGuides = getGuidesForGoals(goals);
        
        // Convert to Guide format with pre-selected status
        const initialGuides: Guide[] = suggestedGuides.map((guide, index) => ({
          id: index + 1,
          value: guide,
          isPreSelected: true
        }));

        setGuides(initialGuides);
      } catch (error) {
        console.error('Error loading user goals:', error);
      }
    };

    fetchUserGoals();
  }, [user]);

  const addGuide = () => {
    const newId = guides.length > 0 ? Math.max(...guides.map(g => g.id)) + 1 : 1;
    setGuides(prev => [...prev, { id: newId, value: '', isPreSelected: false }]);
  };

  const removeGuide = (id: number) => {
    setGuides(prev => prev.filter(guide => guide.id !== id));
  };

  const updateGuide = (id: number, value: string) => {
    setGuides(prev =>
      prev.map(guide =>
        guide.id === id ? { ...guide, value } : guide
      )
    );
  };

  const handleGoBack = () => {
    navigate('/onboarding/goals');
  };



  const handleContinue = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Get all guides with content (including pre-selected ones)
      const validGuides = guides
        .filter(guide => guide.value && guide.value.trim().length > 0)
        .map(guide => guide.value.trim());

      // Always save the guides - the pre-selected ones should be included by default
      // since they have values: 'Be authentic', 'Share your experience', 'Avoid hype'
      const { error } = await supabase
        .from('profiles')
        .update({ content_guides: validGuides })
        .eq('user_id', user.id);

      if (error) throw error;

      navigate('/onboarding/content-pillars');
    } catch (error) {
      console.error('Error saving guides:', error);
      toast.error('Failed to save guides. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we have at least one guide with content
  const canContinue = guides.some(guide => guide.value.trim());

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
          backgroundColor: colors.bg.default,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.spacing[40],
          paddingBottom: '160px', // Account for button container height
        }}
      >
        {/* Gradient background with 5% opacity */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/src/assets/images/gradient-bg.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.05,
            zIndex: 0,
          }}
        />

        {/* Content Column */}
        <div style={{
          position: 'relative',
          zIndex: 1,
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
                {/* Bichaurinho */}
                <div>
                  <Bichaurinho variant={30} size={48} />
                </div>

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
                    What Are<br />Your Guides?
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
                    {userGoals.length > 0 
                      ? `Based on your goals (${userGoals.join(', ')}), here are some suggested guides. Feel free to edit or add your own.`
                      : 'What values guide the way you want to create content? (For example: be authentic, share your experience, avoid hype)'
                    }
                  </p>
                </div>
              </div>

              {/* Dynamic Guide Inputs Container */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.spacing[12],
                }}
              >
                {guides.map((guide) => (
                  <div key={guide.id}>
                    <Input
                      placeholder="Enter your content guide"
                      value={guide.value}
                      onChange={(e) => updateGuide(guide.id, e.target.value)}
                      style="tail-action"
                      size="lg"
                      disabled={isLoading}
                      tailAction={{
                        icon: <Trash2 size={16} />,
                        onClick: () => removeGuide(guide.id)
                      }}
                    />
                  </div>
                ))}

                {/* Add Guide Button */}
                <div style={{ marginTop: spacing.spacing[8], width: '100%' }}>
                  <Button
                    label="Add Guide"
                    style="secondary"
                    size="sm"
                    leadIcon={<Plus size={16} />}
                    onClick={addGuide}
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
                  ? "Please add at least one guide to continue."
                  : `${guides.filter(g => g.value.trim()).length} guide${guides.filter(g => g.value.trim()).length === 1 ? '' : 's'} ready.`
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
        <div style={{ width: '280px' }}>
          <Button
            label={isLoading ? "Saving..." : "Continue"}
            style="primary"
            size="lg"
            tailIcon={!isLoading ? <ArrowRight size={16} /> : undefined}
            onClick={handleContinue}
            disabled={!canContinue || isLoading}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Guides;