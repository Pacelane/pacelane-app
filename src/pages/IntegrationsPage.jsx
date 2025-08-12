import React, { useState } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';

// Design System Components
import IntegrationCard from '@/design-system/components/IntegrationCard';

// Icons
import { 
  MessageCircle, 
  Calendar, 
  PlayCircle
} from 'lucide-react';

/**
 * IntegrationsPage - Manage third-party integrations
 * Shows integration cards with toggles for WhatsApp, Read.ai, and Google Calendar
 */
const IntegrationsPage = () => {
  const { colors } = useTheme();

  // Integration states (in a real app, these would come from API/context)
  const [integrations, setIntegrations] = useState({
    whatsapp: {
      enabled: false,
      connected: false,
    },
    readai: {
      enabled: false,
      connected: true, // Simulating already connected but not enabled
    },
    googleCalendar: {
      enabled: true,
      connected: true,
    },
  });

  // Handle toggle changes
  const handleToggleChange = (integrationKey, newValue) => {
    setIntegrations(prev => ({
      ...prev,
      [integrationKey]: {
        ...prev[integrationKey],
        enabled: newValue,
      }
    }));
  };

  // Integration configuration
  const integrationConfig = [
    {
      key: 'whatsapp',
      name: 'WhatsApp',
      description: 'Add files to your knowledge base from WhatsApp and create content directly from messages',
      icon: <MessageCircle size={32} />,
      iconColor: '#25D366',
      features: ['Knowledge base integration', 'Content creation', 'File management'],
    },
    {
      key: 'readai',
      name: 'Read.ai',
      description: 'Add meeting transcripts to your knowledge base for enhanced content creation',
      icon: <PlayCircle size={32} />,
      iconColor: '#6366F1',
      features: ['Meeting transcription', 'Knowledge base sync', 'Content insights'],
    },
    {
      key: 'googleCalendar',
      name: 'Google Calendar',
      description: 'Sync your calendar to understand your routines and create more relevant content',
      icon: <Calendar size={32} />,
      iconColor: '#4285F4',
      features: ['Calendar sync', 'Routine analysis', 'Context-aware content'],
    },
  ];

  // Page container styles
  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[32],
    backgroundColor: 'transparent',
  };

  // Title style using awesome serif font, 4xl semi bold
  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Subtitle style - sm medium, text subtle
  const subtitleStyle = {
    ...textStyles.sm.medium,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[8],
  };

  // Grid styles
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: spacing.spacing[24],
  };

  // Handle configure button clicks
  const handleConfigureClick = (integrationKey) => {
    // In a real app, this would open configuration modal or navigate to settings
    console.log(`Configure ${integrationKey} integration`);
  };

  return (
    <div style={containerStyles}>
      {/* Header Section */}
      <div>
        <h1 style={titleStyle}>Integrations</h1>
        <p style={subtitleStyle}>
          Connect your favorite tools to streamline your content creation workflow
        </p>
      </div>

      {/* Integration Cards Grid */}
      <div style={gridStyles}>
        {integrationConfig.map((integration) => (
          <IntegrationCard
            key={integration.key}
            name={integration.name}
            description={integration.description}
            icon={integration.icon}
            iconColor={integration.iconColor}
            features={integration.features}
            connected={integrations[integration.key].connected}
            enabled={integrations[integration.key].enabled}
            onToggle={(newValue) => handleToggleChange(integration.key, newValue)}
            onConfigure={() => handleConfigureClick(integration.key)}
          />
        ))}
      </div>
    </div>
  );
};

export default IntegrationsPage;
