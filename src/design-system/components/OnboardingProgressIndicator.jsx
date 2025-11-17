import React from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';

// Icons
import { 
  Check, 
  User, 
  Lightbulb, 
  Target, 
  BookOpen, 
  Layers, 
  Clock, 
  Phone, 
  MessageSquare, 
  Sparkles 
} from 'lucide-react';

const OnboardingProgressIndicator = ({ 
  currentStep = 1, 
  className = '',
  showDetails = true,
  compact = false 
}) => {
  const { colors } = useTheme();

  const steps = [
    {
      id: 1,
      title: 'Bem-vindo',
      description: 'Introdução ao Pacelane',
      icon: Sparkles,
      route: '/onboarding/welcome'
    },
    {
      id: 2,
      title: 'Configuração do Perfil',
      description: 'Conecte seu perfil do LinkedIn',
      icon: User,
      route: '/onboarding/first-things-first'
    },
    {
      id: 3,
      title: 'Resumo do Perfil',
      description: 'Revise suas informações do LinkedIn',
      icon: User,
      route: '/onboarding/linkedin-summary'
    },
    {
      id: 4,
      title: 'Tom de Voz',
      description: 'Defina suas preferências de estilo de conteúdo',
      icon: BookOpen,
      route: '/onboarding/guides'
    },
    {
      id: 5,
      title: 'Tópicos Editoriais',
      description: 'Escolha suas áreas de foco de tópicos',
      icon: Layers,
      route: '/onboarding/content-pillars'
    },
    {
      id: 6,
      title: 'Ritmo',
      description: 'Defina horário e frequência de postagem',
      icon: Clock,
      route: '/onboarding/pacing'
    },
    {
      id: 7,
      title: 'Informações de Contato',
      description: 'Adicione suas informações de contato',
      icon: Phone,
      route: '/onboarding/contact'
    },
    {
      id: 8,
      title: 'Configuração do WhatsApp',
      description: 'Conecte notificações do WhatsApp',
      icon: MessageSquare,
      route: '/onboarding/whatsapp-setup'
    },
    {
      id: 9,
      title: 'Pronto',
      description: 'Complete sua configuração',
      icon: Check,
      route: '/onboarding/ready'
    }
  ];

  const totalSteps = steps.length;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[16],
    width: '100%',
  };

  const progressBarContainerStyle = {
    backgroundColor: colors.bg.muted,
    borderRadius: cornerRadius.borderRadius.full,
    height: '8px',
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  };

  const progressBarFillStyle = {
    backgroundColor: colors.bg.state.primary,
    height: '100%',
    width: `${progressPercentage}%`,
    borderRadius: cornerRadius.borderRadius.full,
    transition: 'width 0.3s ease-in-out',
  };

  const progressTextStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.spacing[0],
  };

  const currentStepTextStyle = {
    ...textStyles.sm.semibold,
    color: colors.text.default,
    margin: 0,
  };

  const progressCountStyle = {
    ...textStyles.sm.normal,
    color: colors.text.subtle,
    margin: 0,
  };

  const stepsListStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[8],
    marginTop: spacing.spacing[16],
  };

  const stepItemStyle = (stepNumber, isActive, isCompleted) => ({
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[12],
    padding: spacing.spacing[8],
    borderRadius: cornerRadius.borderRadius.sm,
    backgroundColor: isActive 
      ? colors.bg.state.soft 
      : isCompleted 
        ? colors.bg.subtle 
        : 'transparent',
    border: isActive 
      ? `1px solid ${colors.border.highlight}` 
      : '1px solid transparent',
    transition: 'all 0.2s ease-in-out',
  });

  const stepIconContainerStyle = (isActive, isCompleted) => ({
    width: '32px',
    height: '32px',
    borderRadius: cornerRadius.borderRadius.sm,
    backgroundColor: isCompleted 
      ? colors.bg.state.primary 
      : isActive 
        ? colors.bg.state.primary 
        : colors.bg.muted,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  });

  const stepTextContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  };

  const stepTitleStyle = (isActive, isCompleted) => ({
    ...textStyles.sm.medium,
    color: isActive 
      ? colors.text.default 
      : isCompleted 
        ? colors.text.default 
        : colors.text.subtle,
    margin: 0,
  });

  const stepDescriptionStyle = (isActive, isCompleted) => ({
    ...textStyles.xs.normal,
    color: isActive 
      ? colors.text.subtle 
      : isCompleted 
        ? colors.text.muted 
        : colors.text.hint,
    margin: 0,
  });

  if (compact) {
    return (
      <div className={className} style={containerStyle}>
        <div style={progressTextStyle}>
          <span style={currentStepTextStyle}>
            Etapa {currentStep} de {totalSteps}
          </span>
          <span style={progressCountStyle}>
            {Math.round(progressPercentage)}% completo
          </span>
        </div>
        <div style={progressBarContainerStyle}>
          <div style={progressBarFillStyle} />
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={containerStyle}>
      <div style={progressTextStyle}>
          <span style={currentStepTextStyle}>
            {steps[currentStep - 1]?.title || 'Progresso do Onboarding'}
          </span>
          <span style={progressCountStyle}>
            {currentStep} de {totalSteps} ({Math.round(progressPercentage)}%)
          </span>
      </div>
      
      <div style={progressBarContainerStyle}>
        <div style={progressBarFillStyle} />
      </div>

      {showDetails && (
        <div style={stepsListStyle}>
          {steps.map((step) => {
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const IconComponent = step.icon;

            return (
              <div 
                key={step.id} 
                style={stepItemStyle(step.id, isActive, isCompleted)}
              >
                <div style={stepIconContainerStyle(isActive, isCompleted)}>
                  {isCompleted ? (
                    <Check 
                      size={16} 
                      color="white"
                    />
                  ) : (
                    <IconComponent 
                      size={16} 
                      color={isActive ? "white" : colors.icon.muted}
                    />
                  )}
                </div>
                
                <div style={stepTextContainerStyle}>
                  <span style={stepTitleStyle(isActive, isCompleted)}>
                    {step.title}
                  </span>
                  <span style={stepDescriptionStyle(isActive, isCompleted)}>
                    {step.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OnboardingProgressIndicator;
