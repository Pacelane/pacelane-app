import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { templateData } from '@/data/templateData';

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
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const [templates] = useState(templateData); // Use local template data directly

  // Debug: Log template data
  console.log('Templates loaded:', templates.length, 'templates');
  console.log('First template:', templates[0]);

  // Handle template selection
  const handleTemplateClick = (templateId: string) => {
    console.log('Template clicked:', templateId);
    
    // Validate template exists before navigating
    const template = templates.find(t => t.id === templateId);
    if (!template) {
      console.error('Template not found in local data:', templateId);
      return;
    }
    
    console.log('Template data being passed:', {
      id: template.id,
      title: template.title,
      hasContent: template.content ? true : false,
      contentLength: template.content?.length || 0
    });
    
    // Navigate to content editor with template ID in state
    navigate('/content-editor', { state: { templateId } });
  };

  // Handle start from scratch
  const handleStartFromScratch = () => {
    console.log('Start from scratch clicked');
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

  // Grid container styles - mobile single column, desktop fixed width
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, 240px)',
    gap: spacing.spacing[12],
    width: '100%',
    justifyContent: isMobile ? 'stretch' : 'start',
  };



  return (
    <div style={containerStyles}>
      {/* Back Button */}
      <div style={{ alignSelf: 'flex-start' }}>
        <Button 
          style="dashed"
          size="xs"
          leadIcon={<ArrowLeft size={16} />}
          label="Go Back"
          onClick={handleGoBack}
        />
      </div>

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
          {/* Template Cards - Show all templates */}
          {templates.map((template, index) => (
            <TemplateCard 
              key={template.id}
              variant="default"
              title={template.title}
              description={template.description || ''}
              bichaurinhoVariant={(index % 32) + 1} // Cycle through available variants
              onClick={() => {
                console.log('TemplateCard onClick called for:', template.id);
                handleTemplateClick(template.id);
              }}
              style={{ width: isMobile ? '100%' : 'auto' }}
            />
          ))}
          
          {/* Start from Scratch Card - Always at the end */}
          <TemplateCard 
            variant="empty"
            onClick={handleStartFromScratch}
            style={{ width: isMobile ? '100%' : 'auto' }}
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
