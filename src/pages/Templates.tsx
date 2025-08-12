import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import * as templatesApi from '@/api/templates';
import type { Template } from '@/api/templates';

// Design System Components
import TemplateCard from '@/design-system/components/TemplateCard';
import Button from '@/design-system/components/Button';
import EmptyState from '@/design-system/components/EmptyState';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';

// Icons
import { ArrowLeft } from 'lucide-react';

const Templates = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Load all templates from database
  const loadTemplates = async () => {
    if (!user) return;
    
    setLoadingTemplates(true);
    try {
      const result = await templatesApi.fetchSystemTemplates();
      if (result.data) {
        setTemplates(result.data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Load templates on component mount
  useEffect(() => {
    if (user) {
      loadTemplates();
    }
  }, [user]);

  // Handle template selection
  const handleTemplateClick = async (templateId: string) => {
    navigate('/content-editor', { state: { templateId } });
  };

  // Handle start from scratch
  const handleStartFromScratch = () => {
    navigate('/content-editor');
  };

  // Handle back navigation
  const handleGoBack = () => {
    navigate('/product-home');
  };

  // Page container styles
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[32],
    backgroundColor: 'transparent',
  };

  // Title style - MUST use Awesome Serif font with 4xl size and semibold weight
  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Subtitle style - MUST use small medium text with subtle color
  const subtitleStyle = {
    ...textStyles.sm.medium,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[8], // REQUIRED: 8px gap between title and subtitle
  };

  // Grid container styles for 3 columns
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: spacing.spacing[16],
    width: '100%',
  };

  // Show loading state
  if (loadingTemplates && templates.length === 0) {
    return (
      <div style={containerStyles}>
        {/* Back Button */}
        <Button 
          style="dashed"
          size="xs"
          leadIcon={<ArrowLeft size={16} />}
          label="Go Back"
          onClick={handleGoBack}
        />

        {/* Page Header */}
        <div>
          <h1 style={titleStyle}>How do you want to start?</h1>
          <p style={subtitleStyle}>
            Select a template or start from scratch.
          </p>
        </div>

        {/* Loading indicator */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          padding: spacing.spacing[40],
          flexDirection: 'column',
          gap: spacing.spacing[16]
        }}>
          <div style={{ color: colors.text.subtle }}>Loading templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* Back Button */}
      <Button 
        style="dashed"
        size="xs"
        leadIcon={<ArrowLeft size={16} />}
        label="Go Back"
        onClick={handleGoBack}
      />

      {/* REQUIRED: Page Header Section */}
      <div>
        <h1 style={titleStyle}>How do you want to start?</h1>
        <p style={subtitleStyle}>
          Select a template or start from scratch.
        </p>
      </div>

      {/* Templates Grid */}
      {templates.length > 0 ? (
        <div style={gridStyles}>
          {/* Template Cards - Show 6 templates (2 rows × 3 columns) */}
          {templates.slice(0, 6).map((template, index) => (
            <TemplateCard 
              key={template.id}
              variant="default"
              title={template.title}
              description={template.description || ''}
              bichaurinhoVariant={(index % 32) + 1} // Cycle through available variants
              onClick={() => handleTemplateClick(template.id)}
            />
          ))}
          
          {/* Start from Scratch Card - Always at the end */}
          <TemplateCard 
            variant="empty"
            onClick={handleStartFromScratch}
          />
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          title="No templates available"
          subtitle="Start creating your content from scratch!"
          buttonLabel="Start from Scratch"
          onButtonClick={handleStartFromScratch}
        />
      )}
    </div>
  );
};

export default Templates;
