import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { templateData } from '@/data/templateData';
import { supabase } from '@/integrations/supabase/client';
import { CalendarService } from '@/services/calendarService';
import { useToast } from '@/design-system/components/Toast';

// Design System Components
import IntegrationCard from '@/design-system/components/IntegrationCard';
import TemplateCard from '@/design-system/components/TemplateCard';
import KnowledgeBasePromptCard from '@/design-system/components/KnowledgeBasePromptCard';
import WhatsAppConfigModal from '@/design-system/components/WhatsAppConfigModal';
import ReadAiConfigModal from '@/design-system/components/ReadAiConfigModal';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { typography } from '@/design-system/tokens/typography';

// Icons
import { ChevronRight } from 'lucide-react';

// Integration logo images
import whatsappLogo from '@/assets/images/whatsapp-logo.png';
import readaiLogo from '@/assets/images/readai-logo.webp';
import googleCalendarLogo from '@/assets/images/google-calendar-logo.png';

const InitialHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // Templates state - use first 3 templates locally
  const [templates] = useState(templateData.slice(0, 3));

  // Integration modal states
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [readaiModalOpen, setReadaiModalOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Integration states
  const [integrations, setIntegrations] = useState({
    whatsapp: {
      connected: false,
      enabled: false,
    },
    readai: {
      connected: false,
      enabled: false,
    },
    calendar: {
      connected: false,
      enabled: false,
    },
  });

  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadIntegrationStatus();
    }
  }, [user]);

  // Load integration status
  const loadIntegrationStatus = async () => {
    if (!user) return;

    try {
      // Check WhatsApp integration
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('whatsapp_number')
        .eq('user_id', user.id)
        .single();

      if (!error && profile?.whatsapp_number?.trim()) {
        setWhatsappNumber(profile.whatsapp_number);
        setIntegrations(prev => ({
          ...prev,
          whatsapp: {
            connected: true,
            enabled: true,
          }
        }));
      }

      // TODO: Add Read.ai and Calendar integration checks
      // For now, we'll assume they're not connected
    } catch (error) {
      console.error('Error loading integration status:', error);
    }
  };

  // Integration handlers
  const handleWhatsAppSave = async (number: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ whatsapp_number: number })
        .eq('user_id', user.id);

      if (error) throw error;

      setWhatsappNumber(number);
      setIntegrations(prev => ({
        ...prev,
        whatsapp: {
          connected: true,
          enabled: true,
        }
      }));
      setWhatsappModalOpen(false);
    } catch (error) {
      console.error('Error saving WhatsApp number:', error);
    }
  };

  const handleReadaiComplete = () => {
    setIntegrations(prev => ({
      ...prev,
      readai: {
        connected: true,
        enabled: true,
      }
    }));
    setReadaiModalOpen(false);
  };

  // Handle Google Calendar configuration
  const handleCalendarConfigure = async () => {
    try {
      const result = await CalendarService.getAuthUrl();
      if (result.success && result.authUrl) {
        // Append state=user.id only (edge function requires it); don't alter redirect_uri
        const authUrl = new URL(result.authUrl);
        if (user?.id) authUrl.searchParams.set('state', user.id);
        window.location.href = authUrl.toString();
      } else {
        toast.error(result.error || 'Failed to start Google Calendar connection');
      }
    } catch (e) {
      toast.error('Failed to start Google Calendar connection');
    }
  };

  // Navigation handlers
  const handleTemplateClick = async (templateId: string) => {
    navigate('/content-editor', { state: { templateId } });
  };

  // Knowledge base handlers
  const handleAddFiles = () => {
    navigate('/knowledge');
  };

  const handleAddVideos = () => {
    navigate('/knowledge');
  };

  const handleAddUrls = () => {
    navigate('/knowledge');
  };

  // Content container styles - padding handled by MainAppChrome
  const contentContainerStyles = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: spacing.spacing[32],
    backgroundColor: 'transparent',
  };

  // Welcome heading style
  const welcomeHeadingStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['4xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    letterSpacing: typography.desktop.letterSpacing.normal,
    color: colors.text.default,
    margin: 0,
  };

  // Subtitle style
  const subtitleStyle = {
    ...textStyles.sm.medium,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[8],
  };

  return (
    <div style={contentContainerStyles}>
      {/* Header Section */}
      <div>
        <h1 style={welcomeHeadingStyle}>Welcome to Pacelane!</h1>
        <p style={subtitleStyle}>
          Let's get you set up with the tools you need to create amazing content
        </p>
      </div>

      {/* Integration Cards Section */}
      <div>
        <h2 style={{ 
          ...textStyles.md.semibold, 
          color: colors.text.subtle,
          marginBottom: spacing.spacing[16]
        }}>
          Connect your tools
        </h2>

        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: spacing.spacing[16] 
        }}>
          <IntegrationCard
            name="WhatsApp"
            description="Add files to your knowledge base from WhatsApp and create content directly from messages"
            icon={<img src={whatsappLogo} alt="WhatsApp" style={{ width: 24, height: 24 }} />}
            iconColor="#25D366"
            features={['Knowledge base integration', 'Content creation', 'File management']}
            connected={integrations.whatsapp.connected}
            enabled={integrations.whatsapp.enabled}
            onToggle={(newValue) => {
              setIntegrations(prev => ({
                ...prev,
                whatsapp: { ...prev.whatsapp, enabled: newValue }
              }));
            }}
            onConfigure={() => setWhatsappModalOpen(true)}
            style={{ flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : 'auto' }}
          />
          
          <IntegrationCard
            name="Read.ai"
            description="Add meeting transcripts to your knowledge base for enhanced content creation"
            icon={<img src={readaiLogo} alt="Read.ai" style={{ width: 24, height: 24 }} />}
            iconColor="#6366F1"
            features={['Meeting transcription', 'Knowledge base sync', 'Content insights']}
            connected={integrations.readai.connected}
            enabled={integrations.readai.enabled}
            onToggle={(newValue) => {
              setIntegrations(prev => ({
                ...prev,
                readai: { ...prev.readai, enabled: newValue }
              }));
            }}
            onConfigure={() => setReadaiModalOpen(true)}
            style={{ flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : 'auto' }}
          />
          
          <IntegrationCard
            name="Calendar Integration"
            description="Sync your calendar via Recall.ai to understand your routines and create more relevant content"
            icon={<img src={googleCalendarLogo} alt="Calendar Integration" style={{ width: 24, height: 24 }} />}
            iconColor="#4285F4"
            features={['Calendar sync', 'Meeting recording', 'Context-aware content']}
            connected={integrations.calendar.connected}
            enabled={integrations.calendar.enabled}
            onToggle={(newValue) => {
              setIntegrations(prev => ({
                ...prev,
                calendar: { ...prev.calendar, enabled: newValue }
              }));
            }}
            onConfigure={handleCalendarConfigure}
            style={{ flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : 'auto' }}
          />
        </div>
      </div>

      {/* Knowledge Base Prompt Card */}
      <KnowledgeBasePromptCard
        title="Give Us Context"
        subtitle="With more files, videos, and URLs, your content will be better and more personalized"
        onAddFiles={handleAddFiles}
        onAddVideos={handleAddVideos}
        onAddUrls={handleAddUrls}
      />

      {/* Templates Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.spacing[16] }}>
          <h2 style={{ 
            ...textStyles.md.semibold, 
            color: colors.text.subtle
          }}>
            Start from templates
          </h2>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.spacing[4],
              background: 'none',
              border: 'none',
              color: colors.text.subtle,
              cursor: 'pointer',
              fontSize: '14px',
            }}
            onClick={() => navigate('/templates')}
          >
            see all templates
            <ChevronRight size={12} />
          </button>
        </div>

        {/* Template Cards Row */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          gap: spacing.spacing[12] 
        }}>
          <TemplateCard 
            variant="empty"
            onClick={() => navigate('/content-editor')}
            style={{ flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : 'auto' }}
          />
          {templates.slice(0, 2).map((template, index) => (
            <TemplateCard 
              key={template.id}
              variant="default"
              title={template.title}
              description={template.description || ''}
              bichaurinhoVariant={index + 3}
              onClick={() => handleTemplateClick(template.id)}
              style={{ flex: isMobile ? 'none' : 1, width: isMobile ? '100%' : 'auto' }}
            />
          ))}
        </div>
      </div>

      {/* Integration Modals */}
      <WhatsAppConfigModal
        isOpen={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        currentNumber={whatsappNumber}
        onSave={handleWhatsAppSave}
        loading={false}
      />

      <ReadAiConfigModal
        isOpen={readaiModalOpen}
        onClose={() => setReadaiModalOpen(false)}
        onComplete={handleReadaiComplete}
      />
    </div>
  );
};

export default InitialHome;
