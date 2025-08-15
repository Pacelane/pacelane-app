import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { useToast } from '@/design-system/components/Toast';

// Design System Components
import TopNav from '@/design-system/components/TopNav';
import Button from '@/design-system/components/Button';
import ProgressBar from '@/design-system/components/ProgressBar';
import Bichaurinho from '@/design-system/components/Bichaurinho';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { getShadow } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';

// Icons
import { ArrowLeft, ArrowRight } from 'lucide-react';

// Configuration
const PACELANE_WHATSAPP_NUMBER = '551152360591'; // Business WhatsApp number

const WhatsAppSetup = () => {
  const navigate = useNavigate();
  const { colors } = useTheme();
  const { toast } = useToast();
  const [hasClickedWhatsAppButton, setHasClickedWhatsAppButton] = useState(false);

  const handleGoBack = () => {
    navigate('/onboarding/contact');
  };

  const handleContinue = async () => {
    // Simply navigate to the next page since the number is already saved
    // and we can't track if they actually sent the message
    navigate('/onboarding/ready');
  };

  const handleWhatsAppConnect = () => {
    const message = encodeURIComponent("Hi! I want to connect my WhatsApp to Pacelane for personalized content suggestions.");
    const whatsappUrl = `https://wa.me/${PACELANE_WHATSAPP_NUMBER}?text=${message}`;
    window.open(whatsappUrl, '_blank');
    setHasClickedWhatsAppButton(true);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.bg.default,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Navigation */}
      <TopNav />

      {/* Content Container with gradient background */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: colors.bg.default,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: spacing.spacing[40],
          paddingBottom: '160px', // Account for button container height
        }}
      >
        {/* Gradient background with 5% opacity */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(/src/assets/images/gradient-bg.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.05,
            zIndex: 0,
          }}
        />

        {/* Content Column */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.spacing[24],
          alignItems: 'center',
        }}>
          {/* Back Button */}
          <div style={{ alignSelf: 'flex-start', width: '400px' }}>
            <Button
              label="Go Back"
              style="dashed"
              size="xs"
              leadIcon={<ArrowLeft size={12} />}
              onClick={handleGoBack}
            />
          </div>

          {/* Main Card */}
          <div
            style={{
              backgroundColor: colors.bg.card.default,
              borderRadius: cornerRadius.borderRadius.lg,
              border: `1px solid ${colors.border.darker}`,
              boxShadow: getShadow('regular.card', colors, { withBorder: true }),
              width: '400px',
              overflow: 'hidden',
            }}
          >
            {/* Main Container */}
            <div
              style={{
                padding: spacing.spacing[36],
                backgroundColor: colors.bg.card.default,
                borderBottom: `1px solid ${colors.border.default}`,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Heading Container - 16px gap between bichaurinho and title/subtitle */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: spacing.spacing[16],
                  marginBottom: spacing.spacing[32],
                }}
              >
                {/* Bichaurinho */}
                <div>
                  <Bichaurinho variant={4} size={48} />
                </div>

                {/* Title and Subtitle Container - 12px gap between title and subtitle */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.spacing[12],
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Title */}
                  <h1
                    style={{
                      fontFamily: typography.fontFamily['awesome-serif'],
                      fontSize: typography.desktop.size['5xl'],
                      fontWeight: typography.desktop.weight.semibold,
                      lineHeight: '0.9',
                      color: colors.text.default,
                      margin: 0,
                      textAlign: 'left',
                    }}
                  >
                    Connect<br />WhatsApp
                  </h1>

                  {/* Subtitle */}
                  <p
                    style={{
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.desktop.size.sm,
                      fontWeight: typography.desktop.weight.normal,
                      lineHeight: typography.desktop.lineHeight.sm,
                      color: colors.text.muted,
                      margin: 0,
                      textAlign: 'left',
                    }}
                  >
                    Let's connect your WhatsApp to start receiving personalized content suggestions.
                  </p>
                </div>
              </div>

              {/* WhatsApp Connection Section */}
              <div
                style={{
                  padding: spacing.spacing[20],
                  backgroundColor: colors.bg.card.subtle,
                  borderRadius: cornerRadius.borderRadius.md,
                  border: `1px solid ${colors.border.default}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: spacing.spacing[16],
                }}
              >
                {/* Connection explanation */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: spacing.spacing[8],
                  }}
                >
                  <h3
                    style={{
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.desktop.size.sm,
                      fontWeight: typography.desktop.weight.semibold,
                      lineHeight: typography.desktop.lineHeight.sm,
                      color: colors.text.default,
                      margin: 0,
                    }}
                  >
                    Complete WhatsApp Setup
                  </h3>
                  <p
                    style={{
                      fontFamily: typography.fontFamily.body,
                      fontSize: typography.desktop.size.xs,
                      fontWeight: typography.desktop.weight.normal,
                      lineHeight: typography.desktop.lineHeight.xs,
                      color: colors.text.muted,
                      margin: 0,
                    }}
                  >
                    Click below to open WhatsApp and send us a message. This will connect your account and start the flow of personalized content suggestions.
                  </p>
                </div>

                                 {/* WhatsApp Connection Button */}
                 <Button
                   label={hasClickedWhatsAppButton ? "✓ Message Sent" : "Send WhatsApp Message"}
                   style={hasClickedWhatsAppButton ? "soft" : "primary"}
                   size="lg"
                   leadIcon={
                     hasClickedWhatsAppButton ? undefined : (
                       <img 
                         src="/src/assets/images/whatsapp-logo.png" 
                         alt="WhatsApp" 
                         style={{ width: 20, height: 20 }}
                       />
                     )
                   }
                   onClick={handleWhatsAppConnect}
                 />
              </div>
            </div>

            {/* Text Container */}
            <div
              style={{
                padding: `${spacing.spacing[24]} ${spacing.spacing[36]}`,
                backgroundColor: colors.bg.card.subtle,
                display: 'flex',
                flexDirection: 'column',
                gap: spacing.spacing[4],
              }}
            >
              <p
                style={{
                  fontFamily: typography.fontFamily.body,
                  fontSize: typography.desktop.size.sm,
                  fontWeight: typography.desktop.weight.normal,
                  lineHeight: typography.desktop.lineHeight.sm,
                  color: colors.text.muted,
                  margin: 0,
                  textAlign: 'center',
                }}
              >
                You can skip this step and connect WhatsApp later in settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Button Container - Fixed overlay at bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '80px',
          backgroundColor: colors.bg.default,
          borderTop: `1px solid ${colors.border.default}`,
          padding: spacing.spacing[40],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
        }}
      >
        <div style={{ width: '280px' }}>
                     <Button
             label="Continue"
             style="primary"
             size="lg"
             tailIcon={<ArrowRight size={16} />}
             onClick={handleContinue}
             disabled={!hasClickedWhatsAppButton}
             className="w-full"
           />
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSetup;
