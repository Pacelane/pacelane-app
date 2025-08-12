import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/design-system/components/Toast';

// Design System Components
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import Bichaurinho from '@/design-system/components/Bichaurinho';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';

// Icons
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

const Ready = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { colors } = useTheme();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoBack = () => {
    navigate('/onboarding/contact');
  };

  const generateInitialContentSuggestions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        console.warn('Failed to generate initial content suggestions');
        return;
      }

      console.log('Initial content suggestions generated successfully');
    } catch (error) {
      console.warn('Error generating initial content suggestions:', error);
    }
  };

  const createUserBucket = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return false;

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/user-bucket-service`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          action: 'identify-and-ensure-bucket',
          userId: user.id 
        }),
      });

      if (!response.ok) {
        console.warn('Failed to create user bucket');
        return false;
      }

      const result = await response.json();
      console.log('User bucket created:', result);
      return result.success;
    } catch (error) {
      console.warn('Error creating user bucket:', error);
      return false;
    }
  };

  const completeOnboarding = async () => {
    if (!user) return null;

    try {
      console.log('Ready: Updating profile with onboarding_completed: true');
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Ready: Error updating profile:', error);
        throw error;
      }
      
      console.log('Ready: Profile updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return null;
    }
  };

  const handleStart = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      console.log('Ready: Starting onboarding completion...');
      
      // Complete onboarding - simple and direct
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error completing onboarding:', error);
        throw error;
      }
      
      console.log('Ready: Onboarding completed successfully');
      
      // Navigate directly - no complex verification
      toast.success('Welcome to Pacelane! Your content strategy is ready.');
      navigate('/product-home');
      
    } catch (error) {
      console.error('Error starting:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
          <div style={{ alignSelf: 'flex-start', width: '400px' }}>
            <Button
              label="Go Back"
              style="dashed"
              size="xs"
              leadIcon={<ArrowLeft size={12} />}
              onClick={handleGoBack}
            />
      </div>

          {/* Main Card */}
          <div
            style={{
              backgroundColor: colors.bg.card.default,
              borderRadius: cornerRadius.borderRadius.lg,
              border: `1px solid ${colors.border.darker}`,
              boxShadow: getShadow('regular.card', colors, { withBorder: true }),
              width: '400px',
              overflow: 'hidden',
            }}
          >
            {/* Main Container */}
            <div
              style={{
                padding: spacing.spacing[36],
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
                  marginBottom: spacing.spacing[24],
                }}
              >
                {/* Bichaurinho */}
                <div>
                  <Bichaurinho variant={1} size={48} />
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
                    Ready to<br />Start?
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
                    Perfect! We have everything we need to create your personalized content strategy.
                  </p>
                </div>
              </div>

              {/* Features List */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.spacing[12],
                }}
              >
                {[
                  'Personalized content suggestions',
                  'LinkedIn profile analysis insights',
                  'Content calendar planning',
                  'Performance tracking'
                ].map((feature, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.spacing[12],
                    }}
                  >
                    <div
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: colors.text.muted,
                        flexShrink: 0,
                      }}
                    />
                    <p
                      style={{
                        fontFamily: typography.fontFamily.body,
                        fontSize: typography.desktop.size.sm,
                        fontWeight: typography.desktop.weight.normal,
                        lineHeight: typography.desktop.lineHeight.sm,
                        color: colors.text.muted,
                        margin: 0,
                      }}
                    >
                      {feature}
                    </p>
                  </div>
                ))}
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
                Your content strategy will be generated and ready to use!
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
            label={isLoading ? "Setting up your strategy..." : "Let's Go!"}
            style="primary"
            size="lg"
            leadIcon={!isLoading ? <Sparkles size={16} /> : undefined}
            tailIcon={!isLoading ? <ArrowRight size={16} /> : undefined}
            onClick={handleStart}
            disabled={isLoading}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default Ready;