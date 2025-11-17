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
import Bichaurinho from '@/design-system/components/Bichaurinho';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';

// Icons
import { ArrowLeft, ArrowRight, Plus, Trash2 } from 'lucide-react';

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

      // Get existing content_pillars to preserve content_types if they exist
      const { data: profileData } = await supabase
        .from('profiles')
        .select('content_pillars')
        .eq('user_id', user.id)
        .single();

      // Preserve existing content_types if they exist, otherwise use empty array
      let existingContentTypes: string[] = [];
      if (profileData?.content_pillars) {
        if (typeof profileData.content_pillars === 'object' && profileData.content_pillars !== null && !Array.isArray(profileData.content_pillars)) {
          // New format: { content_types: [], themes: [] }
          existingContentTypes = Array.isArray(profileData.content_pillars.content_types) 
            ? profileData.content_pillars.content_types 
            : [];
        }
      }

      // Save in the correct format: { content_types: [], themes: [] }
      const contentPillarsData = {
        content_types: existingContentTypes,
        themes: validTopicOptions.length > 0 ? validTopicOptions : []
      };

      const { error } = await supabase
        .from('profiles')
        .update({ 
          content_pillars: contentPillarsData
        } as any)
        .eq('user_id', user.id);

      if (error) throw error;

      navigate('/onboarding/pacing');
    } catch (error) {
      console.error('Error saving editorial topics:', error);
      setToast({ message: 'Falha ao salvar tópicos editoriais. Por favor, tente novamente.', type: 'error' });
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
                  <Bichaurinho variant={26} size={48} />
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
                    Tópicos Editoriais
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
                    Sobre quais tópicos você quer escrever? Adicione os principais temas e assuntos que interessam a você e ao seu público.
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
                      placeholder="Digite seu tópico editorial"
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
                    label="Adicionar Tópico"
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
                  ? "Por favor, adicione pelo menos um tópico editorial para continuar."
                  : `${topicOptions.filter(o => o.value.trim()).length} tópico${topicOptions.filter(o => o.value.trim()).length === 1 ? '' : 's'} pronto${topicOptions.filter(o => o.value.trim()).length === 1 ? '' : 's'}.`
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