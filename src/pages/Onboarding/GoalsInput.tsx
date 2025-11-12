import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { shadows, getShadow } from '@/design-system/tokens/shadows';
import { stroke } from '@/design-system/tokens/stroke';
import { colors as primitiveColors } from '@/design-system/tokens/primitive-colors';
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import StatusBadge from '@/design-system/components/StatusBadge';
import Chips from '@/design-system/components/Chips';
import Input from '@/design-system/components/Input';
import { Plus, Trash } from '@phosphor-icons/react';

const GoalsInput = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [targetAudiences, setTargetAudiences] = useState<string[]>(['', '']);

  // Goals options
  const goalsOptions = [
    'Reconhecimento de Marca',
    'Geração de Leads',
    'Recrutamento',
    'Liderança de Pensamento',
    'Atrair oportunidades',
    'Manter-se Relevante',
  ];

  // Handle goal selection
  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal]
    );
  };

  // Handle target audience input change
  const handleAudienceChange = (index: number, value: string) => {
    const newAudiences = [...targetAudiences];
    newAudiences[index] = value;
    setTargetAudiences(newAudiences);
  };

  // Handle delete target audience
  const handleDeleteAudience = (index: number) => {
    const newAudiences = targetAudiences.filter((_, i) => i !== index);
    setTargetAudiences(newAudiences);
  };

  // Handle add target audience
  const handleAddAudience = () => {
    setTargetAudiences([...targetAudiences, '']);
  };

  // Handle button clicks
  const handleGoBack = () => {
    navigate('/onboarding/pacing');
  };

  const handleContinue = () => {
    // Navigate to Pillars input page
    console.log('Selected Goals:', selectedGoals);
    console.log('Target Audiences:', targetAudiences);
    navigate('/onboarding/pillars');
  };

  // Page container styles
  const pageContainerStyles = {
    minHeight: '100vh',
    backgroundColor: colors.bg.muted,
    display: 'flex',
    flexDirection: 'column' as const,
  };

  // Main content container styles (below TopNav)
  const mainContentStyles = {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.spacing[24],
  };

  // Main card container styles
  const mainCardStyles = {
    width: '580px',
    height: '480px',
    backgroundColor: 'transparent',
    borderRadius: cornerRadius.borderRadius.lg,
    border: `${stroke.DEFAULT} solid ${colors.border.default}`,
    boxShadow: getShadow('regular.card', colors, { withBorder: false }),
    display: 'flex',
    flexDirection: 'row' as const,
    overflow: 'hidden',
  };

  // Main container (left side) styles
  const mainContainerStyles = {
    flex: 1,
    backgroundColor: colors.bg.card.default,
    borderRight: `${stroke.DEFAULT} solid ${colors.border.default}`,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  };

  // Content container styles (top part of main container)
  const contentContainerStyles = {
    flex: 1,
    borderBottom: `${stroke.DEFAULT} solid ${colors.border.default}`,
    paddingTop: spacing.spacing[36],
    paddingBottom: spacing.spacing[24],
    paddingLeft: spacing.spacing[36],
    paddingRight: spacing.spacing[36],
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[16],
    overflowY: 'auto' as const,
    scrollbarWidth: 'thin' as const,
    scrollbarColor: `${colors.border.default} transparent`,
  };

  // Text container styles
  const textContainerStyles = {
    width: '100%',
    height: '140px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[8],
  };

  // Title styles using Instrument Serif
  const titleStyles = {
    fontFamily: typography.fontFamily['instrument-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Subtitle styles
  const subtitleStyles = {
    ...textStyles.sm.normal,
    color: colors.text.muted,
    margin: 0,
  };

  // Section title styles
  const sectionTitleStyles = {
    ...textStyles.sm.medium,
    color: colors.text.default,
    margin: 0,
  };

  // Chips container styles
  const chipsContainerStyles = {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: spacing.spacing[8],
  };

  // Target audiences section styles
  const audiencesSectionStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[12],
    marginTop: spacing.spacing[16],
  };

  // Button container styles (bottom part of main container)
  const buttonContainerStyles = {
    paddingTop: spacing.spacing[20],
    paddingBottom: spacing.spacing[20],
    paddingLeft: spacing.spacing[36],
    paddingRight: spacing.spacing[36],
    display: 'flex',
    flexDirection: 'row' as const,
    gap: spacing.spacing[4],
  };

  // Accuracy bar (right side) styles
  const accuracyBarStyles = {
    width: '200px',
    backgroundColor: colors.bg.subtle,
    paddingTop: spacing.spacing[16],
    paddingBottom: spacing.spacing[16],
    paddingLeft: spacing.spacing[16],
    paddingRight: spacing.spacing[16],
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'space-between',
  };

  // Bar container styles
  const barContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'stretch',
    width: '100%',
  };

  // Lines bar container styles
  const linesBarContainerStyles = {
    width: '100%',
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '2px',
  };

  // Individual line bar styles (with red accent for first 4 lines, orange for next 8)
  const getLineBarStyles = (index: number) => ({
    flex: '1 1 0',
    minWidth: '2px',
    height: '18px',
    backgroundColor: 
      index < 4 
        ? primitiveColors.red[500] 
        : index < 12 
        ? primitiveColors.orange[500] 
        : primitiveColors.transparentDark[10],
    borderRadius: cornerRadius.borderRadius['2xs'],
  });

  // Divider styles
  const dividerStyles = {
    width: '100%',
    height: '1px',
    backgroundColor: colors.border.default,
  };

  // Steps container styles
  const stepsContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[6],
  };

  // Step item styles
  const stepItemStyles = {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: spacing.spacing[8],
  };

  // Step text styles
  const stepTextStyles = {
    ...textStyles.xs.normal,
    color: colors.text.muted,
    margin: 0,
    flex: 1,
  };

  // Label text styles
  const labelTextStyles = {
    ...textStyles.xs.semibold,
    color: colors.text.muted,
    margin: 0,
  };

  // Info text styles
  const infoTextStyles = {
    ...textStyles.xs.normal,
    color: colors.text.muted,
    margin: 0,
  };

  // Steps list
  const steps = [
    { label: 'URL do LinkedIn', active: true },
    { label: 'Número do WhatsApp', active: true },
    { label: 'Frequência', active: true },
    { label: 'Objetivos', active: false },
    { label: 'Pilares', active: false },
    { label: 'Formato', active: false },
    { label: 'Conhecimento', active: false },
  ];

  return (
    <div style={pageContainerStyles}>
      {/* Custom scrollbar styles */}
      <style>{`
        .goals-content-container::-webkit-scrollbar {
          width: 6px;
        }
        .goals-content-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .goals-content-container::-webkit-scrollbar-thumb {
          background-color: ${colors.border.default};
          border-radius: 3px;
        }
        .goals-content-container::-webkit-scrollbar-thumb:hover {
          background-color: ${colors.border.darker};
        }
      `}</style>

      {/* TopNav Bar - Stuck to the top */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
        <TopNav />
      </div>

      {/* Main content container */}
      <div style={mainContentStyles}>
        {/* Main card container */}
        <div style={mainCardStyles}>
          {/* Main container (left side) */}
          <div style={mainContainerStyles}>
            {/* Content container */}
            <div className="goals-content-container" style={contentContainerStyles}>
              {/* Text container */}
              <div style={textContainerStyles}>
                <h1 style={titleStyles}>Seus Objetivos</h1>
                <p style={subtitleStyles}>
                  Nos diga quais são seus objetivos e os públicos-alvo que você quer alcançar
                </p>
              </div>

              {/* Goals section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
                <p style={sectionTitleStyles}>Quais são seus objetivos?</p>
                <div style={chipsContainerStyles}>
                  {goalsOptions.map((goal) => (
                    <Chips
                      key={goal}
                      label={goal}
                      size="lg"
                      style="default"
                      selected={selectedGoals.includes(goal)}
                      onClick={() => toggleGoal(goal)}
                    />
                  ))}
                </div>
              </div>

              {/* Target audiences section */}
              <div style={audiencesSectionStyles}>
                <p style={sectionTitleStyles}>Quais são seus públicos-alvo?</p>
                
                {/* Target audience inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                  {targetAudiences.map((audience, index) => (
                    <Input
                      key={index}
                      style="tail-action"
                      size="lg"
                      placeholder={`Público-alvo ${index + 1}`}
                      value={audience}
                      onChange={(e) => handleAudienceChange(index, e.target.value)}
                      tailAction={{
                        icon: <Trash size={16} />,
                        onClick: () => handleDeleteAudience(index),
                      }}
                    />
                  ))}
                  
                  {/* Add Target Audience button */}
                  <Button
                    style="secondary"
                    size="sm"
                    label="Adicionar Público-alvo"
                    leadIcon={<Plus size={16} />}
                    onClick={handleAddAudience}
                  />
                </div>
              </div>
            </div>

            {/* Button container */}
            <div style={buttonContainerStyles}>
              <div style={{ flex: 1 }}>
                <Button
                  style="secondary"
                  size="sm"
                  label="Voltar"
                  onClick={handleGoBack}
                  fullWidth
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  style="primary"
                  size="sm"
                  label="Continuar"
                  onClick={handleContinue}
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* Accuracy bar (right side) */}
          <div style={accuracyBarStyles}>
            {/* Bar container */}
            <div style={barContainerStyles}>
              <p style={labelTextStyles}>Precisão dos resultados</p>
              <div style={{ marginTop: spacing.spacing[8] }}>
                <div style={linesBarContainerStyles}>
                  {[...Array(27)].map((_, index) => (
                    <div key={index} style={getLineBarStyles(index)} />
                  ))}
                </div>
              </div>
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[4] }}>25% Concluído</p>
              <div style={{ ...dividerStyles, marginTop: spacing.spacing[8] }} />
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[8] }}>
                Quanto mais informações você fornecer sobre si mesmo, melhores serão os resultados.
              </p>
            </div>

            {/* Steps container */}
            <div style={stepsContainerStyles}>
              <div style={dividerStyles} />
              {steps.map((step) => (
                <React.Fragment key={step.label}>
                  <div style={stepItemStyles}>
                    <StatusBadge active={step.active} />
                    <p style={stepTextStyles}>{step.label}</p>
                  </div>
                  <div style={dividerStyles} />
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsInput;

