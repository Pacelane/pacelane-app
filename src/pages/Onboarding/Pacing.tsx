import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/design-system/components/Toast';
import { PacingService } from '@/services/pacingService';

// Design System Components
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import ButtonGroup from '@/design-system/components/ButtonGroup';
import Checkbox from '@/design-system/components/Checkbox';
import ProgressBar from '@/design-system/components/ProgressBar';
import OnboardingProgressIndicator from '@/design-system/components/OnboardingProgressIndicator';
import Bichaurinho from '@/design-system/components/Bichaurinho';
import DropdownButton from '@/design-system/components/DropdownButton';
import InlineTip from '@/design-system/components/InlineTip';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

// Icons
import { ArrowLeft, ArrowRight, Clock, Calendar, MessageSquare } from 'lucide-react';

const Pacing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(false);

  // State for pace selection
  const [selectedPace, setSelectedPace] = useState('moderate');
  
  // State for weekday selection
  const [selectedDays, setSelectedDays] = useState<string[]>(['monday', 'wednesday', 'friday']);
  
  // State for dropdowns
  const [dailySummaryTime, setDailySummaryTime] = useState('6:00 PM');
  const [recommendationsTime, setRecommendationsTime] = useState('Morning (8-10 AM)');

  const weekdays = [
    { id: 'monday', label: 'M', day: 'Monday' },
    { id: 'tuesday', label: 'T', day: 'Tuesday' },
    { id: 'wednesday', label: 'W', day: 'Wednesday' },
    { id: 'thursday', label: 'T', day: 'Thursday' },
    { id: 'friday', label: 'F', day: 'Friday' },
    { id: 'saturday', label: 'S', day: 'Saturday' },
    { id: 'sunday', label: 'S', day: 'Sunday' }
  ];

  const timeOptions = [
    '9:00 AM',
    '2:00 PM', 
    '6:00 PM'
  ];





  const paceOptions = [
    { id: 'light', label: 'Light' },
    { id: 'moderate', label: 'Moderate' },
    { id: 'hardcore', label: 'Hard Core' }
  ];

  const handleGoBack = () => {
    navigate('/onboarding/linkedin-summary');
  };

  const toggleDay = (dayId: string) => {
    setSelectedDays(prev => {
      if (prev.includes(dayId)) {
        return prev.filter(d => d !== dayId);
      } else {
        return [...prev, dayId];
      }
    });
  };

  const handleContinue = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const pacingData = {
        pace: selectedPace,
        frequency: selectedDays,
        daily_summary_time: dailySummaryTime,
        recommendations_time: recommendationsTime
      };

      // Save pacing preferences to profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ pacing_preferences: pacingData })
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Create pacing schedule for automated content generation
      const scheduleData = PacingService.convertOnboardingToSchedule(user.id, pacingData);
      const { error: scheduleError } = await PacingService.createPacingSchedule(user.id, scheduleData);
      
      if (scheduleError) {
        console.warn('Failed to create pacing schedule:', scheduleError);
        // Don't block onboarding if schedule creation fails
      } else {
        console.log('Pacing schedule created successfully');
      }

      navigate('/onboarding/contact');
    } catch (error) {
      console.error('Error saving pacing preferences:', error);
      toast.error('Failed to save pacing preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const canContinue = selectedDays.length > 0;

  const InnerSection = ({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.spacing[12],
        padding: spacing.spacing[16],
        border: `1px solid ${colors.border.default}`,
        borderRadius: cornerRadius.borderRadius.lg,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}>
        <h3
          style={{
            fontFamily: typography.fontFamily.body,
            fontSize: typography.desktop.size.sm,
            fontWeight: typography.desktop.weight.semibold,
            color: colors.text.default,
            margin: 0,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontFamily: typography.fontFamily.body,
            fontSize: typography.desktop.size.xs,
            fontWeight: typography.desktop.weight.normal,
            color: colors.text.subtle,
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );



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
          padding: isMobile ? spacing.spacing[24] : spacing.spacing[40],
          paddingBottom: isMobile ? '140px' : '160px', // Account for button container height
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
              currentStep={4}
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
              {/* Heading Container */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: spacing.spacing[16],
                  marginBottom: spacing.spacing[8],
                }}
              >
                {/* Bichaurinho */}
                <div>
                  <Bichaurinho variant={25} size={48} />
                </div>

                {/* Title and Subtitle Container */}
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
                    Your Pacing
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
                    Set your ideal posting frequency and schedule. We'll deliver personalized content suggestions at the perfect times based on your preferences.
                  </p>
                </div>
              </div>



              {/* Pace Selection */}
              <ButtonGroup
                buttons={paceOptions.map(option => ({
                  id: option.id,
                  label: option.label,
                  selected: selectedPace === option.id,
                  onClick: () => setSelectedPace(option.id)
                }))}
              />

              <div style={{ height: spacing.spacing[16] }} />

              {/* Weekday Selection */}
              <InnerSection
                title="Which Days?"
                subtitle="Select the days you prefer to post"
              >
                <div
                  style={{
                    display: 'flex',
                    gap: spacing.spacing[8],
                    justifyContent: 'flex-start',
                  }}
                >
                  {weekdays.map((weekday) => (
                    <div
                      key={weekday.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: spacing.spacing[4],
                      }}
                    >
                      <Checkbox
                        checked={selectedDays.includes(weekday.id)}
                        onChange={() => toggleDay(weekday.id)}
                      />
                      <span
                        style={{
                          fontFamily: typography.fontFamily.body,
                          fontSize: typography.desktop.size.xs,
                          fontWeight: typography.desktop.weight.normal,
                          color: colors.text.muted,
                        }}
                      >
                        {weekday.label}
                      </span>
                    </div>
                  ))}
                </div>
              </InnerSection>

              <div style={{ height: spacing.spacing[16] }} />

              {/* Time Preferences */}
              {/* Commented out for PCL-117
              <InnerSection
                title="Daily Summary"
                subtitle="When should we send you a daily summary?"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
                  <InlineTip style={{ fontSize: typography.desktop.size.xs }}>
                    We'll ask about how your day went and give you the opportunity to add more context about what happened. This helps us focus on what matters when creating your content.
                  </InlineTip>
                  
                  <DropdownButton
                    label={dailySummaryTime}
                    size="sm"
                    items={timeOptions.map(option => ({
                      label: option,
                      onClick: () => setDailySummaryTime(option)
                    }))}
                  />
                </div>
              </InnerSection>

              <div style={{ height: spacing.spacing[12] }} />

              <InnerSection
                title="Content Recommendations"
                subtitle="When should we suggest new content ideas?"
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
                  <InlineTip style={{ fontSize: typography.desktop.size.xs }}>
                    We'll send you personalized content suggestions based on your goals, interests, and recent activities to help spark your next post ideas.
                  </InlineTip>
                  
                  <DropdownButton
                    label={recommendationsTime}
                    size="sm"
                    items={timeOptions.map(option => ({
                      label: option,
                      onClick: () => setRecommendationsTime(option)
                    }))}
                  />
                </div>
              </InnerSection>
              */}


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
                  ? "Please select at least one day to continue."
                  : `${selectedDays.length} day${selectedDays.length === 1 ? '' : 's'} selected.`
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
    </div>
  );
};

export default Pacing;