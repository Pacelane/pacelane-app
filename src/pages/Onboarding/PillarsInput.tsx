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

const PillarsInput = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>(['', '']);

  // Content types options
  const contentTypesOptions = [
    'Como Fazer',
    'Opiniões sobre Notícias',
    'Histórias Pessoais',
    'Lições de Carreira',
    'Bastidores',
    'Histórias de Clientes',
    'Educacional',
    'Memes & Humor',
  ];

  // Handle content type selection
  const toggleContentType = (type: string) => {
    setSelectedContentTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  // Handle theme input change
  const handleThemeChange = (index: number, value: string) => {
    const newThemes = [...themes];
    newThemes[index] = value;
    setThemes(newThemes);
  };

  // Handle delete theme
  const handleDeleteTheme = (index: number) => {
    const newThemes = themes.filter((_, i) => i !== index);
    setThemes(newThemes);
  };

  // Handle add theme
  const handleAddTheme = () => {
    setThemes([...themes, '']);
  };

  // Handle button clicks
  const handleGoBack = () => {
    navigate('/onboarding/goals');
  };

  const handleContinue = () => {
    // Mock: Navigate to the next step (to be defined)
    console.log('Selected Content Types:', selectedContentTypes);
    console.log('Themes:', themes);
    // navigate('/onboarding/next-step');
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

  // Themes section styles
  const themesSectionStyles = {
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

  // Individual line bar styles (with red accent for first 4 lines, orange for next 12)
  const getLineBarStyles = (index: number) => ({
    flex: '1 1 0',
    minWidth: '2px',
    height: '18px',
    backgroundColor: 
      index < 4 
        ? primitiveColors.red[500] 
        : index < 16 
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
    { label: 'Objetivos', active: true },
    { label: 'Pilares', active: false },
    { label: 'Formato', active: false },
    { label: 'Conhecimento', active: false },
  ];

  return (
    <div style={pageContainerStyles}>
      {/* Custom scrollbar styles */}
      <style>{`
        .pillars-content-container::-webkit-scrollbar {
          width: 6px;
        }
        .pillars-content-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .pillars-content-container::-webkit-scrollbar-thumb {
          background-color: ${colors.border.default};
          border-radius: 3px;
        }
        .pillars-content-container::-webkit-scrollbar-thumb:hover {
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
            <div className="pillars-content-container" style={contentContainerStyles}>
              {/* Text container */}
              <div style={textContainerStyles}>
                <h1 style={titleStyles}>Seus Pilares</h1>
                <p style={subtitleStyles}>
                  Nos diga quais tipos de conteúdo e temas você quer abordar
                </p>
              </div>

              {/* Content types section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
                <p style={sectionTitleStyles}>Tipos de conteúdo que você quer fazer</p>
                <div style={chipsContainerStyles}>
                  {contentTypesOptions.map((type) => (
                    <Chips
                      key={type}
                      label={type}
                      size="lg"
                      style="default"
                      selected={selectedContentTypes.includes(type)}
                      onClick={() => toggleContentType(type)}
                    />
                  ))}
                </div>
              </div>

              {/* Themes section */}
              <div style={themesSectionStyles}>
                <p style={sectionTitleStyles}>Temas que você quer falar</p>
                
                {/* Theme inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                  {themes.map((theme, index) => (
                    <Input
                      key={index}
                      style="tail-action"
                      size="lg"
                      placeholder={`Tema ${index + 1}`}
                      value={theme}
                      onChange={(e) => handleThemeChange(index, e.target.value)}
                      tailAction={{
                        icon: <Trash size={16} />,
                        onClick: () => handleDeleteTheme(index),
                      }}
                    />
                  ))}
                  
                  {/* Add Theme button */}
                  <Button
                    style="secondary"
                    size="sm"
                    label="Adicionar Tema"
                    leadIcon={<Plus size={16} />}
                    onClick={handleAddTheme}
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
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[4] }}>35% Concluído</p>
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

export default PillarsInput;

