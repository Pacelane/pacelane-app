import React, { useState, useEffect } from 'react';
import { useTheme } from '@/services/theme-context';
import { useAuth } from '@/hooks/api/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';
import { useToast } from '@/design-system/components/Toast';

// Design System Components
import IntegrationCard from '@/design-system/components/IntegrationCard';
import WhatsAppConfigModal from '@/design-system/components/WhatsAppConfigModal';

// Integration logo images
import whatsappLogo from '@/assets/images/whatsapp-logo.png';
import readaiLogo from '@/assets/images/readai-logo.webp';
import googleCalendarLogo from '@/assets/images/google-calendar-logo.png';

/**
 * IntegrationsPage - Manage third-party integrations
 * Shows integration cards with toggles for WhatsApp, Read.ai, and Google Calendar
 */
const IntegrationsPage = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

  // WhatsApp modal state
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  // Integration states
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

  // Fetch WhatsApp number on component mount
  useEffect(() => {
    const fetchWhatsAppNumber = async () => {
      if (!user) return;

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('whatsapp_number')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        const hasNumber = profile?.whatsapp_number?.trim();
        setWhatsappNumber(hasNumber || '');
        
        // Update WhatsApp integration status
        setIntegrations(prev => ({
          ...prev,
          whatsapp: {
            ...prev.whatsapp,
            connected: !!hasNumber,
            enabled: !!hasNumber, // Enable if number exists
          }
        }));
      } catch (error) {
        console.error('Error fetching WhatsApp number:', error);
      }
    };

    fetchWhatsAppNumber();
  }, [user]);

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

  // Handle WhatsApp number save
  const handleWhatsAppSave = async (number) => {
    if (!user) return;

    setSavingWhatsapp(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ whatsapp_number: number.trim() || null })
        .eq('user_id', user.id);

      if (error) throw error;

      const hasNumber = number.trim();
      setWhatsappNumber(hasNumber);
      
      // Update integration status
      setIntegrations(prev => ({
        ...prev,
        whatsapp: {
          ...prev.whatsapp,
          connected: !!hasNumber,
          enabled: !!hasNumber, // Enable if number exists, disable if removed
        }
      }));

      setWhatsappModalOpen(false);
      
      if (hasNumber) {
        toast.success('WhatsApp number saved successfully!');
      } else {
        toast.success('WhatsApp number removed successfully!');
      }
    } catch (error) {
      console.error('Error saving WhatsApp number:', error);
      toast.error('Failed to save WhatsApp number. Please try again.');
    } finally {
      setSavingWhatsapp(false);
    }
  };

  // Integration configuration
  const integrationConfig = [
    {
      key: 'whatsapp',
      name: 'WhatsApp',
      description: 'Add files to your knowledge base from WhatsApp and create content directly from messages',
      icon: <img src={whatsappLogo} alt="WhatsApp" style={{ width: 24, height: 24 }} />,
      iconColor: '#25D366',
      features: ['Knowledge base integration', 'Content creation', 'File management'],
    },
    {
      key: 'readai',
      name: 'Read.ai',
      description: 'Add meeting transcripts to your knowledge base for enhanced content creation',
      icon: <img src={readaiLogo} alt="Read.ai" style={{ width: 24, height: 24 }} />,
      iconColor: '#6366F1',
      features: ['Meeting transcription', 'Knowledge base sync', 'Content insights'],
    },
    {
      key: 'googleCalendar',
      name: 'Google Calendar',
      description: 'Sync your calendar to understand your routines and create more relevant content',
      icon: <img src={googleCalendarLogo} alt="Google Calendar" style={{ width: 24, height: 24 }} />,
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
    if (integrationKey === 'whatsapp') {
      setWhatsappModalOpen(true);
    } else {
      // For other integrations, you can add specific handling here
      console.log(`Configure ${integrationKey} integration`);
    }
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

      {/* WhatsApp Configuration Modal */}
      <WhatsAppConfigModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        currentNumber={whatsappNumber}
        onSave={handleWhatsAppSave}
        loading={savingWhatsapp}
      />
    </div>
  );
};

export default IntegrationsPage;
