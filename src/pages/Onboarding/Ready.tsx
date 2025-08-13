import React, { useState, useEffect } from 'react';
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
import { colors as primitiveColors } from '@/design-system/tokens/primitive-colors';

// Icons
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

// Confetti piece component
const ConfettiPiece = ({ delay, duration, left, color }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '-24px',
        left: `${left}%`,
        width: '24px',
        height: '12px',
        backgroundColor: color,
        borderRadius: '4px',
        animation: `confetti-fall ${duration}s linear ${delay}s infinite`,
        zIndex: 1,
      }}
    />
  );
};

const Ready = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { colors } = useTheme();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState([]);

  // Generate confetti pieces
  useEffect(() => {
    const confettiColors = [
      primitiveColors.blue[500],    // Blue
      primitiveColors.green[500],   // Green
      primitiveColors.orange[500],  // Orange
      primitiveColors.red[500],     // Red
      primitiveColors.violet[500],  // Purple
      primitiveColors.cyan[500],    // Cyan
      primitiveColors.emerald[500], // Emerald
      primitiveColors.rose[500],    // Rose
    ];

    const pieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 2,
      left: Math.random() * 100,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
    }));

    setConfettiPieces(pieces);
  }, []);

  const handleGoBack = () => {
    navigate('/onboarding/contact');
  };

  const generateInitialContentSuggestions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('No session available for content suggestions');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Failed to generate initial content suggestions:', response.status, errorText);
        return;
      }

      const result = await response.json();
      console.log('Initial content suggestions generated successfully:', result);
    } catch (error) {
      console.warn('Error generating initial content suggestions:', error);
    }
  };

  const createUserBucket = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('No session available for bucket creation');
        return false;
      }

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
        const errorText = await response.text();
        console.warn('Failed to create user bucket:', response.status, errorText);
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
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Confetti Animation Styles */}
      <style>
        {`
          @keyframes confetti-fall {
            0% {
              transform: translateY(-10px) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(360deg);
              opacity: 0;
            }
          }
        `}
      </style>

      {/* Confetti Container */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        {confettiPieces.map((piece) => (
          <ConfettiPiece
            key={piece.id}
            delay={piece.delay}
            duration={piece.duration}
            left={piece.left}
            color={piece.color}
          />
        ))}
      </div>

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