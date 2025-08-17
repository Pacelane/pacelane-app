import React, { useState } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { cornerRadius } from '@/design-system/tokens/corner-radius';

// Design System Components
import Modal from '@/design-system/components/Modal';
import Button from '@/design-system/components/Button';

// Icons
import { Copy, Check, ExternalLink, Video } from 'lucide-react';

// Integration setup images
import integrationsPageImage from '@/assets/images/integrations-page.png';
import addWebhookImage from '@/assets/images/add-webhook.png';
import addWebhookNameImage from '@/assets/images/add-webhook-name.png';
import testWebhookImage from '@/assets/images/test webhook.png';

/**
 * ReadAiConfigModal - Modal for configuring Read.ai webhook integration
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Callback when modal should close
 * @param {function} props.onComplete - Callback when setup is marked as complete
 */
const ReadAiConfigModal = ({
  isOpen = false,
  onClose,
  onComplete,
}) => {
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Webhook URL that users need to copy
  const webhookUrl = 'https://plbgeabtrkdhbrnjonje.supabase.co/functions/v1/read-ai-webhook';

  // Handle copy webhook URL
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Handle step navigation
  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle completion
  const handleComplete = () => {
    onComplete?.();
    onClose?.();
  };

  // Modal content styles
  const headerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[8],
    padding: spacing.spacing[24],
    paddingBottom: spacing.spacing[16],
  };

  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size.xl,
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading6,
    color: colors.text.default,
    margin: 0,
  };

  const subtitleStyle = {
    ...textStyles.sm.normal,
    color: colors.text.subtle,
    margin: 0,
  };

  const contentStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[16],
    padding: `0 ${spacing.spacing[24]}`,
    flex: 1,
    overflowY: 'auto',
    minHeight: 0,
  };

  const footerStyles = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${spacing.spacing[16]} ${spacing.spacing[24]} ${spacing.spacing[20]} ${spacing.spacing[24]}`,
    borderTop: `1px solid ${colors.border.default}`,
    flexShrink: 0,
  };

  const stepContainerStyles = {
    backgroundColor: colors.bg.card.subtle,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.md,
    padding: spacing.spacing[16],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[12],
  };

  const urlBoxStyles = {
    backgroundColor: colors.bg.input.default,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.sm,
    padding: spacing.spacing[12],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spacing[12],
    marginTop: spacing.spacing[8],
  };

  const stepIndicatorStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[8],
    marginBottom: spacing.spacing[16],
  };

  const stepNumberStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: spacing.spacing[24],
    height: spacing.spacing[24],
    backgroundColor: colors.bg.state.primary,
    color: colors.text.inverted.default,
    borderRadius: cornerRadius.borderRadius.full,
    fontSize: typography.desktop.size.xs,
    fontWeight: typography.desktop.weight.semibold,
  };

  const imageStyles = {
    width: '100%',
    height: 'auto',
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.sm,
    marginTop: spacing.spacing[12],
    objectFit: 'contain',
    backgroundColor: colors.bg.subtle,
  };

  // Step content
  const getStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div style={stepContainerStyles}>
            <h3 style={{
              ...textStyles.md.semibold,
              color: colors.text.default,
              margin: 0,
            }}>
              Navigate to the integrations page
            </h3>
            <p style={{
              ...textStyles.sm.normal,
              color: colors.text.subtle,
              margin: 0,
            }}>
              In your Read.ai account, click on the account menu and navigate to the Integrations page.
            </p>
            <img 
              src={integrationsPageImage} 
              alt="Read.ai Account Menu → Integrations" 
              style={imageStyles}
            />
          </div>
        );

      case 2:
        return (
          <div style={stepContainerStyles}>
            <h3 style={{
              ...textStyles.md.semibold,
              color: colors.text.default,
              margin: 0,
            }}>
              Click "Add Webhook"
            </h3>
            <p style={{
              ...textStyles.sm.normal,
              color: colors.text.subtle,
              margin: 0,
            }}>
              Once on the integrations page, look for the webhook section and click "Add Webhook" to create a new webhook integration.
            </p>
            <img 
              src={addWebhookImage} 
              alt="Integrations Page with Add Webhook Button" 
              style={imageStyles}
            />
          </div>
        );

      case 3:
        return (
          <div style={stepContainerStyles}>
            <h3 style={{
              ...textStyles.md.semibold,
              color: colors.text.default,
              margin: 0,
            }}>
              Add webhook name and URL
            </h3>
            <p style={{
              ...textStyles.sm.normal,
              color: colors.text.subtle,
              margin: 0,
            }}>
              Enter a name for your webhook (e.g., "Pacelane Integration") and paste the URL below into the webhook URL field.
            </p>
            
            <div>
              <p style={{
                ...textStyles.xs.semibold,
                color: colors.text.default,
                margin: 0,
                marginBottom: spacing.spacing[4],
              }}>
                Webhook URL:
              </p>
              <div style={urlBoxStyles}>
                <code style={{
                  ...textStyles.xs.normal,
                  color: colors.text.default,
                  fontFamily: typography.fontFamily.code,
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {webhookUrl}
                </code>
                <Button
                  variant="iconOnly"
                  style="ghost"
                  size="2xs"
                  leadIcon={copied ? <Check size={14} /> : <Copy size={14} />}
                  onClick={handleCopyUrl}
                />
              </div>
            </div>

            <img 
              src={addWebhookNameImage} 
              alt="Webhook Configuration Form" 
              style={imageStyles}
            />
          </div>
        );

      case 4:
        return (
          <div style={stepContainerStyles}>
            <h3 style={{
              ...textStyles.md.semibold,
              color: colors.text.default,
              margin: 0,
            }}>
              Test your webhook
            </h3>
            <p style={{
              ...textStyles.sm.normal,
              color: colors.text.subtle,
              margin: 0,
            }}>
              Before saving, use the "Test" button to send a test request to verify your webhook is properly configured and responding.
            </p>
            <img 
              src={testWebhookImage} 
              alt="Webhook Test Button and Success Response" 
              style={imageStyles}
            />
          </div>
        );

      case 5:
        return (
          <div style={stepContainerStyles}>
            <h3 style={{
              ...textStyles.md.semibold,
              color: colors.text.default,
              margin: 0,
            }}>
              Complete setup and start using
            </h3>
            <p style={{
              ...textStyles.sm.normal,
              color: colors.text.subtle,
              margin: 0,
            }}>
              Save your webhook configuration. The status will show as "Pending" until your next meeting. After a meeting, Read.ai will automatically send meeting transcripts to your Pacelane knowledge base!
            </p>
            <div style={{
              backgroundColor: colors.bg.card.subtle,
              border: `1px solid ${colors.border.success}`,
              borderRadius: cornerRadius.borderRadius.sm,
              padding: spacing.spacing[12],
              display: 'flex',
              alignItems: 'center',
              gap: spacing.spacing[8],
              marginTop: spacing.spacing[12],
            }}>
              <Check size={16} color={colors.icon.success} />
              <p style={{
                ...textStyles.xs.normal,
                color: colors.text.success,
                margin: 0,
              }}>
                Once configured, meeting transcripts will automatically be added to your knowledge base for enhanced content creation.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      showCloseButton={true}
      size="lg"
    >
      {/* Header */}
      <div style={headerStyles}>
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[12] }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: spacing.spacing[32],
            height: spacing.spacing[32],
            backgroundColor: '#6366F1',
            borderRadius: cornerRadius.borderRadius.sm,
          }}>
            <Video size={16} color="white" />
          </div>
          <h2 style={titleStyle}>Read.ai Integration Setup</h2>
        </div>
        <p style={subtitleStyle}>
          Connect Read.ai to automatically add meeting transcripts to your knowledge base
        </p>
      </div>

      {/* Content */}
      <div style={contentStyles}>
        {/* Step Indicator */}
        <div style={stepIndicatorStyles}>
          <div style={stepNumberStyles}>
            {currentStep}
          </div>
          <span style={{
            ...textStyles.sm.medium,
            color: colors.text.default,
          }}>
            Step {currentStep} of 5
          </span>
        </div>

        {/* Step Content */}
        {getStepContent()}
      </div>

      {/* Footer */}
      <div style={footerStyles}>
        <Button
          label="Read.ai Documentation"
          style="ghost"
          size="sm"
          leadIcon={<ExternalLink size={16} />}
          onClick={() => window.open('https://support.read.ai/hc/en-us/articles/16352415827219-Getting-Started-with-Webhooks', '_blank')}
        />

        <div style={{ display: 'flex', gap: spacing.spacing[12] }}>
          {currentStep > 1 && (
            <Button
              label="Previous"
              style="ghost"
              size="sm"
              onClick={handlePreviousStep}
            />
          )}
          {currentStep < 5 ? (
            <Button
              label="Next Step"
              style="primary"
              size="sm"
              onClick={handleNextStep}
            />
          ) : (
            <Button
              label="Mark as Complete"
              style="primary"
              size="sm"
              leadIcon={<Check size={16} />}
              onClick={handleComplete}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ReadAiConfigModal;
