import React, { useState, useEffect } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { typography } from '@/design-system/tokens/typography';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { cornerRadius } from '@/design-system/tokens/corner-radius';

// Design System Components
import Modal from '@/design-system/components/Modal';
import Input from '@/design-system/components/Input';
import Button from '@/design-system/components/Button';

// Icons
import { MessageCircle, Check, X } from 'lucide-react';

/**
 * WhatsAppConfigModal - Modal for configuring WhatsApp number
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Callback when modal should close
 * @param {string} props.currentNumber - Current WhatsApp number (if any)
 * @param {function} props.onSave - Callback when number is saved (number) => void
 * @param {boolean} props.loading - Whether save operation is in progress
 */
const WhatsAppConfigModal = ({
  isOpen = false,
  onClose,
  currentNumber = '',
  onSave,
  loading = false,
}) => {
  const { colors } = useTheme();
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [error, setError] = useState('');

  // Initialize with current number when modal opens
  useEffect(() => {
    if (isOpen) {
      setWhatsappNumber(currentNumber);
      setError('');
    }
  }, [isOpen, currentNumber]);

  // Validate WhatsApp number format
  const validateNumber = (number) => {
    if (!number.trim()) {
      return 'WhatsApp number is required';
    }
    
    // Basic validation for international format
    const cleanNumber = number.replace(/\s+/g, '');
    if (!cleanNumber.startsWith('+')) {
      return 'Please use international format starting with +';
    }
    
    if (cleanNumber.length < 10 || cleanNumber.length > 17) {
      return 'Please enter a valid WhatsApp number';
    }
    
    return '';
  };

  // Handle save
  const handleSave = () => {
    const validationError = validateNumber(whatsappNumber);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError('');
    onSave?.(whatsappNumber.trim());
  };

  // Handle input change
  const handleInputChange = (e) => {
    setWhatsappNumber(e.target.value);
    if (error) {
      setError(''); // Clear error when user starts typing
    }
  };

  // Handle remove number
  const handleRemove = () => {
    setWhatsappNumber('');
    setError('');
    onSave?.(''); // Save empty string to remove number
  };

  // Check if number has changed
  const hasChanged = whatsappNumber.trim() !== currentNumber.trim();
  const canSave = hasChanged && whatsappNumber.trim() && !error && !loading;
  const canRemove = currentNumber.trim() && !loading;

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
    gap: spacing.spacing[20],
    padding: `0 ${spacing.spacing[24]}`,
    flex: 1,
  };

  const footerStyles = {
    display: 'flex',
    gap: spacing.spacing[12],
    padding: spacing.spacing[24],
    paddingTop: spacing.spacing[16],
    borderTop: `1px solid ${colors.border.default}`,
    justifyContent: 'flex-end',
  };

  const infoBoxStyles = {
    backgroundColor: colors.bg.card.subtle,
    border: `1px solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.sm,
    padding: spacing.spacing[12],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[8],
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      showCloseButton={true}
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
            backgroundColor: '#25D366',
            borderRadius: cornerRadius.borderRadius.sm,
          }}>
            <MessageCircle size={16} color="white" />
          </div>
          <h2 style={titleStyle}>WhatsApp Configuration</h2>
        </div>
        <p style={subtitleStyle}>
          Connect your WhatsApp number to receive content ideas and platform updates
        </p>
      </div>

      {/* Content */}
      <div style={contentStyles}>
        {/* WhatsApp Number Input */}
        <div>
          <Input
            label="WhatsApp Number"
            placeholder="+55 11 99999-9999"
            value={whatsappNumber}
            onChange={handleInputChange}
            style="default"
            size="lg"
            disabled={loading}
            failed={!!error}
            caption={error || 'Use international format: +55 11 99999-9999 (Brazil) or +1 555 123-4567 (US)'}
            leadIcon={<MessageCircle size={18} />}
          />
        </div>

        {/* Information Box */}
        <div style={infoBoxStyles}>
          <h4 style={{
            ...textStyles.sm.semibold,
            color: colors.text.default,
            margin: 0,
          }}>
            What you'll receive:
          </h4>
          <ul style={{
            ...textStyles.xs.normal,
            color: colors.text.muted,
            margin: 0,
            paddingLeft: spacing.spacing[16],
            listStyleType: 'disc',
          }}>
            <li>Personalized content ideas based on your knowledge base</li>
            <li>Platform updates and feature announcements</li>
            <li>Content creation tips and best practices</li>
          </ul>
          <p style={{
            ...textStyles.xs.normal,
            color: colors.text.muted,
            margin: 0,
            marginTop: spacing.spacing[8],
            fontStyle: 'italic',
          }}>
            You can unsubscribe or change your number at any time.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyles}>
        {canRemove && (
          <Button
            label="Remove Number"
            style="ghost"
            size="sm"
            leadIcon={<X size={16} />}
            onClick={handleRemove}
            disabled={loading}
          />
        )}
        <div style={{ display: 'flex', gap: spacing.spacing[12] }}>
          <Button
            label="Cancel"
            style="secondary"
            size="sm"
            onClick={onClose}
            disabled={loading}
          />
          <Button
            label={loading ? "Saving..." : "Save Number"}
            style="primary"
            size="sm"
            leadIcon={loading ? undefined : <Check size={16} />}
            onClick={handleSave}
            disabled={!canSave}
            loading={loading}
          />
        </div>
      </div>
    </Modal>
  );
};

export default WhatsAppConfigModal;
