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
import Input from '@/design-system/components/Input';
import { ArrowRight, Plus, Trash2, Loader2 } from 'lucide-react';

const Pillars = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [themes, setThemes] = useState<string[]>(['', '']);
  const [saving, setSaving] = useState(false);

  // Content types options
  const contentTypesOptions = [
    'How-To',
    'News Opinions',
    'Personal Stories',
    'Career Lessons',
    'Behind the Scenes',
    'Client Stories',
    'Educational',
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

  const handleContinue = async () => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    setSaving(true);

    try {
      // Filter out empty themes
      const filteredThemes = themes.filter(theme => theme.trim().length > 0);

      // Save to content_pillars column (JSONB array)
      // Combine themes and content types into a single array
      const allPillars = [
        ...filteredThemes,
        ...selectedContentTypes
      ].filter(p => p.trim().length > 0); // Remove any empty strings

      const { error } = await supabase
        .from('profiles')
        .update({ 
          content_pillars: allPillars.length > 0 ? allPillars : null
        } as any)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Content pillars saved!');
      navigate('/onboarding/format');
    } catch (error: any) {
      console.error('Error saving content pillars:', error);
      toast.error('Failed to save content pillars. Please try again.');
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
    width: '580px',
    height: '600px', // Increased to show more content
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
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[8],
  };

  // Title styles using Awesome Serif (corrigido de instrument-serif)
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
    { label: 'LinkedIn URL', active: true },
    { label: 'WhatsApp Number', active: true },
    { label: 'Frequency', active: true },
    { label: 'Goals', active: true },
    { label: 'Pillars', active: false },
    { label: 'Format', active: false },
    { label: 'Knowledge', active: false },
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
                <h1 style={titleStyles}>Your Pillars</h1>
                <p style={subtitleStyles}>
                  Tell us what types of content and themes you want to address
                </p>
              </div>

              {/* Content types section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[12] }}>
                <p style={sectionTitleStyles}>Content types you want to create</p>
                <div style={chipsContainerStyles}>
                  {contentTypesOptions.map((type) => (
                    <Chips
                      key={type}
                      label={type}
                      size="lg"
                      style="default"
                      selected={selectedContentTypes.includes(type)}
                      onClick={() => toggleContentType(type)}
                      disabled={saving}
                    />
                  ))}
                </div>
              </div>

              {/* Themes section */}
              <div style={themesSectionStyles}>
                <p style={sectionTitleStyles}>Themes you want to talk about</p>
                
                {/* Theme inputs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
                  {themes.map((theme, index) => (
                    <Input
                      key={index}
                      style="tail-action"
                      size="lg"
                      placeholder={`Theme ${index + 1}`}
                      value={theme}
                      onChange={(e) => handleThemeChange(index, e.target.value)}
                      disabled={saving}
                      tailAction={{
                        icon: <Trash2 size={16} />,
                        onClick: () => handleDeleteTheme(index),
                      }}
                    />
                  ))}
                  
                  {/* Add Theme button */}
                  <Button
                    style="secondary"
                    size="sm"
                    label="Add Theme"
                    leadIcon={<Plus size={16} />}
                    onClick={handleAddTheme}
                    disabled={saving}
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
                  label="Back"
                  onClick={handleGoBack}
                  disabled={saving}
                  fullWidth
                />
              </div>
              <div style={{ flex: 1 }}>
                <Button
                  style="primary"
                  size="sm"
                  label={saving ? "Saving..." : "Continue"}
                  leadIcon={saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : undefined}
                  tailIcon={!saving ? <ArrowRight size={16} /> : undefined}
                  onClick={handleContinue}
                  disabled={saving}
                  fullWidth
                />
              </div>
            </div>
          </div>

          {/* Accuracy bar (right side) */}
          <div style={accuracyBarStyles}>
            {/* Bar container */}
            <div style={barContainerStyles}>
              <p style={labelTextStyles}>Result Accuracy</p>
              <div style={{ marginTop: spacing.spacing[8] }}>
                <div style={linesBarContainerStyles}>
                  {[...Array(27)].map((_, index) => (
                    <div key={index} style={getLineBarStyles(index)} />
                  ))}
                </div>
              </div>
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[4] }}>35% Complete</p>
              <div style={{ ...dividerStyles, marginTop: spacing.spacing[8] }} />
              <p style={{ ...infoTextStyles, marginTop: spacing.spacing[8] }}>
                The more information you provide about yourself, the better the results will be.
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

export default Pillars;

