import React, { useState, useEffect } from 'react';
import { useTheme } from '@/services/theme-context';
import { useAuth } from '@/hooks/api/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';
import { useToast } from '@/design-system/components/Toast';
import { CalendarService } from '@/services/calendarService';

// Design System Components
import IntegrationCard from '@/design-system/components/IntegrationCard';
import WhatsAppConfigModal from '@/design-system/components/WhatsAppConfigModal';
import ReadAiConfigModal from '@/design-system/components/ReadAiConfigModal';
import LinkedInConfigModal from '@/design-system/components/LinkedInConfigModal';

// Integration logo images
import whatsappLogo from '@/assets/images/whatsapp-logo.png';
import readaiLogo from '@/assets/images/readai-logo.webp';
import googleCalendarLogo from '@/assets/images/google-calendar-logo.png';

// Icons
import { Linkedin } from 'lucide-react';

/**
 * IntegrationsPage - Manage third-party integrations
 * Shows integration cards with toggles for WhatsApp, Read.ai, and Google Calendar
 */
const IntegrationsPage = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

  // Modal states
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [readaiModalOpen, setReadaiModalOpen] = useState(false);
  const [linkedinModalOpen, setLinkedinModalOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  // Integration states
  const [integrations, setIntegrations] = useState({
    whatsapp: {
      connected: false,
    },
    readai: {
      connected: false,
    },
    googleCalendar: {
      connected: true,
    },
    linkedin: {
      connected: false,
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
          }
        }));
      } catch (error) {
        console.error('Error fetching WhatsApp number:', error);
      }
    };

    fetchWhatsAppNumber();
  }, [user]);



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
      key: 'linkedin',
      name: 'LinkedIn',
      description: 'Analyze your LinkedIn posts to understand your writing style and create personalized content',
      icon: <Linkedin size={24} color="#0A66C2" />,
      iconColor: '#0A66C2',
      features: ['Writing style analysis', 'Post scraping', 'Content personalization'],
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
  const handleConfigureClick = async (integrationKey) => {
    if (integrationKey === 'whatsapp') {
      setWhatsappModalOpen(true);
      return;
    }
    if (integrationKey === 'linkedin') {
      setLinkedinModalOpen(true);
      return;
    }
    if (integrationKey === 'readai') {
      setReadaiModalOpen(true);
      return;
    }
    if (integrationKey === 'googleCalendar') {
      try {
        const result = await CalendarService.getAuthUrl();
        if (result.success && result.authUrl) {
          // Append state=user.id only (edge function requires it); don't alter redirect_uri
          const authUrl = new URL(result.authUrl);
          if (user?.id) authUrl.searchParams.set('state', user.id);
          window.location.href = authUrl.toString();
        } else {
          toast.error(result.error || 'Failed to start Calendar connection');
        }
      } catch (e) {
        toast.error('Failed to start Calendar connection');
      }
      return;
    }
    // Fallback
    console.log(`Configure ${integrationKey} integration`);
  };

  const handleSyncNow = async () => {
    try {
      const result = await CalendarService.syncCalendar();
      if (result.success) {
        // refresh any local state if needed in future
      }
    } catch (e) {
      // no-op
    }
  };

  // Handle Read.ai setup completion
  const handleReadaiComplete = () => {
    // Update integration status to connected
    setIntegrations(prev => ({
      ...prev,
      readai: {
        ...prev.readai,
        connected: true,
      }
    }));
    
    toast.success('Read.ai integration configured successfully!');
  };

  // Handle LinkedIn setup completion
  const handleLinkedInComplete = () => {
    // Update integration status to connected
    setIntegrations(prev => ({
      ...prev,
      linkedin: {
        ...prev.linkedin,
        connected: true,
      }
    }));
    
    toast.success('LinkedIn integration configured successfully!');
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
            onConfigure={() => handleConfigureClick(integration.key)}
            onSync={integration.key === 'googleCalendar' ? handleSyncNow : undefined}
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

      {/* Read.ai Configuration Modal */}
      <ReadAiConfigModal
        isOpen={readaiModalOpen}
        onClose={() => setReadaiModalOpen(false)}
        onComplete={handleReadaiComplete}
      />

      {/* LinkedIn Configuration Modal */}
      <LinkedInConfigModal
        isOpen={linkedinModalOpen}
        onClose={() => setLinkedinModalOpen(false)}
        onComplete={handleLinkedInComplete}
      />
    </div>
  );
};

export default IntegrationsPage;
