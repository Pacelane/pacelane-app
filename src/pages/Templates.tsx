import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { templateData, templateCategories } from '@/data/templateData';

// Design System Components
import TemplateCard from '@/design-system/components/TemplateCard';
import Button from '@/design-system/components/Button';
import EmptyState from '@/design-system/components/EmptyState';
import Tabs from '@/design-system/components/Tabs';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';

const Templates = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const [templates] = useState(templateData);
  const [activeCategory, setActiveCategory] = useState('all');

  // Debug: Log template data
  console.log('Templates loaded:', templates.length, 'templates');
  console.log('First template:', templates[0]);

  // Filter templates by category
  const filteredTemplates = activeCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category === activeCategory);

  // Tab configuration - simplified for single template
  const tabItems = [
    { id: 'all', label: 'All' },
    { id: templateCategories.PERSONAL, label: 'Personal' },
    { id: templateCategories.EDUCATIONAL, label: 'Educational' },
    { id: templateCategories.ORGANIZATIONAL, label: 'Organizational' },
    { id: templateCategories.PROMOTIONAL, label: 'Promotional' }
  ];

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

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveCategory(tabId);
  };

  // Page container styles - matches Knowledge Base layout
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[24],
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

  // Grid container styles - mobile single column, desktop 2 columns
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
    gap: spacing.spacing[16],
    width: '100%',
    justifyContent: isMobile ? 'stretch' : 'stretch',
  };

  return (
    <div style={containerStyles}>
      {/* REQUIRED: Page Header Section */}
      <div>
        <h1 style={titleStyle}>Templates</h1>
        <p style={subtitleStyle}>
          Choose from our collection of proven LinkedIn post templates to kickstart your content creation
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        gap: spacing.spacing[16],
        alignItems: isMobile ? 'stretch' : 'flex-start'
      }}>
        <Tabs
          style="segmented"
          type="default"
          tabs={tabItems}
          activeTab={activeCategory}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div style={gridStyles}>
          {/* Template Cards - Show filtered templates */}
          {filteredTemplates.map((template) => (
            <TemplateCard 
              key={template.id}
              variant="default"
              title={template.title}
              description={template.description || ''}
              bichaurinhoVariant={template.bichaurinhoVariant || 1}
              onClick={() => {
                console.log('TemplateCard onClick called for:', template.id);
                handleTemplateClick(template.id);
              }}
              style={{ width: isMobile ? '100%' : 'auto' }}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          title="No templates in this category"
          subtitle="Try selecting a different category to find templates that match your needs"
        />
      )}
    </div>
  );
};

export default Templates;
