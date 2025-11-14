import React, { useState } from 'react';
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



interface ToneOption {
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

  // Initialize with pre-selected tone of voice option
  const [toneOptions, setToneOptions] = useState<ToneOption[]>([
    {
      id: 1,
      value: 'Profissional mas não formal',
      isPreSelected: true
    }
  ]);

  // No need to fetch user goals anymore since we're not suggesting based on goals

  const addToneOption = () => {
    const newId = toneOptions.length > 0 ? Math.max(...toneOptions.map(g => g.id)) + 1 : 1;
    setToneOptions(prev => [...prev, { id: newId, value: '', isPreSelected: false }]);
  };

  const removeToneOption = (id: number) => {
    setToneOptions(prev => prev.filter(option => option.id !== id));
  };

  const updateToneOption = (id: number, value: string) => {
    setToneOptions(prev =>
      prev.map(option =>
        option.id === id ? { ...option, value } : option
      )
    );
  };

  const handleGoBack = () => {
    navigate('/onboarding/linkedin-summary');
  };



  const handleContinue = async () => {
    console.log('Continue button clicked');
    console.log('User:', user);
    console.log('Tone options:', toneOptions);
    
    if (!user) {
      console.log('No user found, returning early');
      toast.error('Por favor, faça login para continuar');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get all tone options with content (including pre-selected ones)
      const validToneOptions = toneOptions
        .filter(option => option.value && option.value.trim().length > 0)
        .map(option => option.value.trim());

      console.log('Valid tone options:', validToneOptions);

      // Always save the tone of voice preferences - the pre-selected ones should be included by default
      // since they have values: 'Professional but not formal'
      const { error } = await supabase
        .from('profiles')
        .update({ guides: validToneOptions })
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Successfully saved tone preferences, navigating to content-pillars');
      navigate('/onboarding/content-pillars');
    } catch (error) {
      console.error('Error saving tone of voice preferences:', error);
      toast.error('Falha ao salvar preferências de tom de voz. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we have at least one tone option with content
  const canContinue = toneOptions.some(option => option.value.trim());

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
              label="Voltar"
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
                    Tom de Voz
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
                    Como você quer que seu conteúdo soe? Pré-selecionamos um tom profissional mas acessível. Adicione mais opções que reflitam sua voz única.
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
                {toneOptions.map((option) => (
                  <div key={option.id}>
                    <Input
                      placeholder="Digite sua preferência de tom de voz"
                      value={option.value}
                      onChange={(e) => updateToneOption(option.id, e.target.value)}
                      style="tail-action"
                      size="lg"
                      disabled={isLoading}
                      tailAction={{
                        icon: <Trash2 size={16} />,
                        onClick: () => removeToneOption(option.id)
                      }}
                    />
                  </div>
                ))}

                {/* Add Tone Option Button */}
                <div style={{ marginTop: spacing.spacing[8], width: '100%' }}>
                  <Button
                    label="Adicionar Opção de Tom"
                    style="secondary"
                    size="sm"
                    leadIcon={<Plus size={16} />}
                    onClick={addToneOption}
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
                  ? "Por favor, adicione pelo menos uma opção de tom de voz para continuar."
                  : `${toneOptions.filter(o => o.value.trim()).length} opção${toneOptions.filter(o => o.value.trim()).length === 1 ? '' : 'ões'} de tom pronta${toneOptions.filter(o => o.value.trim()).length === 1 ? '' : 's'}.`
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
            label={isLoading ? "Salvando..." : "Continuar"}
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

export default Guides;