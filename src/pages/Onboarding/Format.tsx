import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import { useToast } from '@/design-system/components/Toast';
import { supabase } from '@/integrations/supabase/client';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow } from '@/design-system/tokens/shadows';
import { stroke } from '@/design-system/tokens/stroke';
import { colors as primitiveColors } from '@/design-system/tokens/primitive-colors';
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import Badge from '@/design-system/components/Badge';
import Chips from '@/design-system/components/Chips';
import { ArrowRight, Loader2, AlignJustify, List, MessageSquare, Smile } from 'lucide-react';

type WritingFormat = 'standard' | 'formatted' | 'short' | 'emojis';

interface FormatOption {
  id: WritingFormat;
  label: string;
  icon: React.ReactNode;
}

const Format = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFormat, setSelectedFormat] = useState<WritingFormat>('standard');
  const [saving, setSaving] = useState(false);

  // Format options
  const formatOptions: FormatOption[] = [
    {
      id: 'standard',
      label: 'Padrão',
      icon: <AlignJustify size={20} />
    },
    {
      id: 'formatted',
      label: 'Formatado',
      icon: <List size={20} />
    },
    {
      id: 'short',
      label: 'Curto',
      icon: <MessageSquare size={20} />
    },
    {
      id: 'emojis',
      label: 'Emojis',
      icon: <Smile size={20} />
    }
  ];

  // Example post content based on format (Twin Peaks characters)
  const getExamplePost = (format: WritingFormat) => {
    switch (format) {
      case 'standard':
        return {
          author: 'Harry S. Truman',
          role: 'Sheriff of Twin Peaks',
          timeAgo: '2d',
          content: 'Uma coisa que às vezes a gente não percebe: o custo para recomeçar uma conversa com o ChatGPT é exatamente o mesmo que continuar ajustando uma que saiu dos trilhos.\n\nVocê começou uma tarefa com a IA, o resultado não ficou alinhado com o que você precisava, e agora está gastando prompt atrás de prompt tentando corrigir, ajustar, voltar naquele detalhe que você errou... enquanto toda a conversa vai ficando cada vez mais complexa e poluída.\n\nMas aqui está a questão: você já identificou os erros na iteração anterior. Você já sabe qual linha de raciocínio não funcionou. Então por que não começar do zero com um prompt inicial mais refinado, já incorporando os aprendizados daquela primeira tentativa?\n\nO resultado é mais limpo, mais rápido e muitas vezes melhor.',
          avatarInitials: 'HT'
        };
      case 'formatted':
        return {
          author: 'Dale Cooper',
          role: 'FBI Special Agent',
          timeAgo: '2d',
          content: 'Uma coisa que às vezes a gente não percebe:\n\nO custo para recomeçar uma conversa com o ChatGPT é exatamente o mesmo que continuar ajustando uma que saiu dos trilhos.\n\n• Você começou uma tarefa com a IA\n• O resultado não ficou alinhado\n• Agora está gastando prompt atrás de prompt\n\nMas aqui está a questão:\n\nVocê já identificou os erros na iteração anterior.\nVocê já sabe qual linha de raciocínio não funcionou.\n\nEntão por que não começar do zero com um prompt inicial mais refinado, já incorporando os aprendizados daquela primeira tentativa?\n\nO resultado é mais limpo, mais rápido e muitas vezes melhor.',
          avatarInitials: 'DC'
        };
      case 'short':
        return {
          author: 'Leland Palmer',
          role: 'Attorney at Law',
          timeAgo: '2d',
          content: 'Uma coisa que às vezes a gente não percebe:\n\nO custo para recomeçar uma conversa com o ChatGPT é exatamente o mesmo que continuar ajustando uma que saiu dos trilhos.\n\nVocê já identificou os erros. Você já sabe o que não funcionou.\n\nPor que não começar do zero com um prompt mais refinado?\n\nO resultado é mais limpo, mais rápido e muitas vezes melhor.',
          avatarInitials: 'LP'
        };
      case 'emojis':
        return {
          author: 'Dr. Lawrence Jacoby',
          role: 'Psychiatrist',
          timeAgo: '2d',
          content: 'Uma coisa que às vezes a gente não percebe: 🤔\n\nO custo para recomeçar uma conversa com o ChatGPT é exatamente o mesmo que continuar ajustando uma que saiu dos trilhos. 💭\n\nVocê começou uma tarefa com a IA, o resultado não ficou alinhado com o que você precisava, e agora está gastando prompt atrás de prompt tentando corrigir, ajustar... ⚙️\n\nMas aqui está a questão: ✨\n\nVocê já identificou os erros na iteração anterior. ✅\nVocê já sabe qual linha de raciocínio não funcionou. 🎯\n\nEntão por que não começar do zero com um prompt inicial mais refinado, já incorporando os aprendizados daquela primeira tentativa? 🚀\n\nO resultado é mais limpo, mais rápido e muitas vezes melhor. 💪',
          avatarInitials: 'LJ'
        };
      default:
        return {
          author: 'Harry S. Truman',
          role: 'Sheriff of Twin Peaks',
          timeAgo: '2d',
          content: 'Uma coisa que às vezes a gente não percebe: o custo para recomeçar uma conversa com o ChatGPT é exatamente o mesmo que continuar ajustando uma que saiu dos trilhos.',
          avatarInitials: 'HT'
        };
    }
  };

  const examplePost = getExamplePost(selectedFormat);

  // Handle format selection
  const handleFormatSelect = (format: WritingFormat) => {
    setSelectedFormat(format);
  };

  // Handle button clicks
  const handleGoBack = () => {
    navigate('/onboarding/pillars');
  };

  const handleContinue = async () => {
    if (!user) {
      toast.error('Por favor, faça login para continuar');
      return;
    }

    setSaving(true);

    try {
      // Get existing content_guides or initialize empty object
      const { data: profileData, error: fetchError } = await supabase
        .from('profiles')
        .select('content_guides')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Merge writing format into content_guides
      const existingGuides = profileData?.content_guides || {};
      const updatedGuides = {
        ...existingGuides,
        writing_format: selectedFormat
      };

      const { error } = await supabase
        .from('profiles')
        .update({
          content_guides: updatedGuides
        } as any)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Formato de escrita salvo!');
      navigate('/onboarding/knowledge');
    } catch (error: any) {
      console.error('Error saving writing format:', error);
      toast.error('Falha ao salvar formato de escrita. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
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
    width: '720px', // Increased width (was 580px)
    height: '700px',
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
    overflowY: 'auto' as const, // Allow scrolling with custom scrollbar
    scrollbarWidth: 'thin' as const,
    scrollbarColor: `${colors.border.default} transparent`,
  };

  // Text container styles
  const textContainerStyles = {
    width: '100%',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[8],
  };

  // Title styles using Awesome Serif
  const titleStyles = {
    fontFamily: typography.fontFamily['awesome-serif'],
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

  // Format selection container styles
  const formatContainerStyles = {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: spacing.spacing[8],
    flexWrap: 'wrap' as const,
  };

  // Example post card styles (LinkedIn-like)
  const exampleCardStyles = {
    border: `${stroke.DEFAULT} solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.md,
    padding: spacing.spacing[16],
    backgroundColor: colors.bg.card.default,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[12],
    marginTop: spacing.spacing[16],
    boxShadow: getShadow('regular.card', colors, { withBorder: false }),
  };

  // Profile section styles
  const profileSectionStyles = {
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: spacing.spacing[12],
  };

  // Avatar styles (LinkedIn-like circular)
  const avatarStyles = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: colors.bg.state.primary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    border: `2px solid ${colors.border.default}`,
  };

  // Profile info styles
  const profileInfoStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[2],
  };

  // Author name styles (LinkedIn-like)
  const authorNameStyles = {
    ...textStyles.sm.semibold,
    color: colors.text.default,
    margin: 0,
    lineHeight: typography.desktop.lineHeight.tight,
  };

  // Author role styles (LinkedIn-like)
  const authorRoleStyles = {
    ...textStyles.xs.normal,
    color: colors.text.muted,
    margin: 0,
    lineHeight: typography.desktop.lineHeight.tight,
  };

  // Time ago styles (LinkedIn-like)
  const timeAgoStyles = {
    ...textStyles.xs.normal,
    color: colors.text.subtle,
    margin: 0,
    marginLeft: 'auto',
  };

  // Post content styles (LinkedIn-like, no separate title)
  const postContentStyles = {
    ...textStyles.sm.normal,
    color: colors.text.default,
    margin: 0,
    whiteSpace: 'pre-line' as const,
    lineHeight: typography.desktop.lineHeight.md,
    wordBreak: 'break-word' as const,
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

  // Individual line bar styles (with red accent for first 4 lines, orange for next 16)
  const getLineBarStyles = (index: number) => ({
    flex: '1 1 0',
    minWidth: '2px',
    height: '18px',
    backgroundColor:
      index < 4
        ? primitiveColors.red[500]
        : index < 20
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
    { label: 'Pilares', active: true },
    { label: 'Formato', active: false },
    { label: 'Conhecimento', active: false },
  ];

  return (
    <div style={pageContainerStyles}>
      {/* Custom scrollbar styles */}
      <style>{`
        .format-content-container::-webkit-scrollbar {
          width: 8px;
        }
        .format-content-container::-webkit-scrollbar-track {
          background: transparent;
        }
        .format-content-container::-webkit-scrollbar-thumb {
          background-color: ${colors.border.default};
          border-radius: 4px;
        }
        .format-content-container::-webkit-scrollbar-thumb:hover {
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
            <div className="format-content-container" style={contentContainerStyles}>
              {/* Text container */}
              <div style={textContainerStyles}>
                <h1 style={titleStyles}>Seu Formato de Escrita</h1>
                <p style={subtitleStyles}>
                  Conte-nos qual formato de escrita você prefere para seus posts no LinkedIn
                </p>
              </div>

              {/* Format selection */}
              <div style={formatContainerStyles}>
                {formatOptions.map((format) => (
                  <Chips
                    key={format.id}
                    label={format.label}
                    size="lg"
                    style="default"
                    selected={selectedFormat === format.id}
                    onClick={() => handleFormatSelect(format.id)}
                    leadingIcon={format.icon}
                    disabled={saving}
                  />
                ))}
              </div>

              {/* Example post card (LinkedIn-like) */}
              <div style={exampleCardStyles}>
                {/* Profile section with time */}
                <div style={{
                  ...profileSectionStyles,
                  width: '100%',
                }}>
                  <div style={avatarStyles}>
                    <span style={{
                      ...textStyles.sm.semibold,
                      color: colors.text.white?.default || colors.text.inverted?.default || '#FFFFFF',
                    }}>
                      {examplePost.avatarInitials}
                    </span>
                  </div>
                  <div style={{
                    ...profileInfoStyles,
                    flex: 1,
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'row' as const,
                      alignItems: 'center',
                      gap: spacing.spacing[4],
                    }}>
                      <p style={authorNameStyles}>{examplePost.author}</p>
                      <span style={{
                        ...textStyles.xs.normal,
                        color: colors.text.muted,
                        margin: 0,
                      }}>•</span>
                      <p style={timeAgoStyles}>{examplePost.timeAgo}</p>
                    </div>
                    <p style={authorRoleStyles}>{examplePost.role}</p>
                  </div>
                </div>

                {/* Post content (LinkedIn-like) */}
                <div style={{
                  marginTop: spacing.spacing[8],
                }}>
                  <p style={postContentStyles}>{examplePost.content}</p>
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
                  disabled={saving}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  style="primary"
                  size="sm"
                  label={saving ? "Salvando..." : "Continuar"}
                  leadIcon={saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : undefined}
                  tailIcon={!saving ? <ArrowRight size={16} /> : undefined}
                  onClick={handleContinue}
                  fullWidth
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          {/* Accuracy bar (right side) */}
          <div style={accuracyBarStyles}>
            {/* Bar container */}
            <div style={barContainerStyles}>
              <p style={labelTextStyles}>Precisão do Resultado</p>
              <div style={{ marginTop: spacing.spacing[8] }}>
                <div style={linesBarContainerStyles}>
                  {[...Array(27)].map((_, index) => (
                    <div key={index} style={getLineBarStyles(index)} />
                  ))}
                </div>
              </div>
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[4] }}>60% Completo</p>
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
                    <Badge variant="dot" size="sm" color={step.active ? "green" : "neutral"} />
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

export default Format;

