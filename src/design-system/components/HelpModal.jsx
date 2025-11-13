import React, { useState } from 'react';
import { PaperPlaneTilt as Send, CircleNotch as Loader2 } from '@phosphor-icons/react';
import { useTheme } from '@/services/theme-context';
import { useHelp } from '@/services/help-context';
import { useTranslation } from '@/services/i18n-context';
import { useToast } from './Toast';
import { spacing } from '../tokens/spacing.js';
import { textStyles } from '../styles/typography/typography-styles.js';
import { typography } from '../tokens/typography.js';
import Modal from './Modal.jsx';
import Button from './Button.jsx';
import Input from './Input.jsx';
import TextArea from './TextArea.jsx';
import Select from './Select.jsx';

/**
 * HelpModal component - Modal with help request form
 * 
 * Features:
 * - Complete help request form with validation
 * - Auto-captures page context and user info
 * - Theme-aware design
 * - Loading states during submission
 * - Form validation and error handling
 * - Uses the Modal component with 640px width and 800px height
 */
const HelpModal = () => {
  const { colors } = useTheme();
  const { isHelpModalOpen, closeHelp, submitHelpRequest, helpContext } = useHelp();
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'question',
    subject: '',
    message: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Form field options
  const helpTypeOptions = [
    { value: 'question', label: t('help.types.question') },
    { value: 'bug', label: t('help.types.bug') },
    { value: 'feature', label: t('help.types.feature') },
    { value: 'account', label: t('help.types.account') },
    { value: 'billing', label: t('help.types.billing') },
    { value: 'other', label: t('help.types.other') },
  ];



  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.subject.trim()) {
      newErrors.subject = t('help.validation.subjectRequired');
    } else if (formData.subject.length < 5) {
      newErrors.subject = t('help.validation.subjectTooShort');
    }
    
    if (!formData.message.trim()) {
      newErrors.message = t('help.validation.messageRequired');
    } else if (formData.message.length < 10) {
      newErrors.message = t('help.validation.messageTooShort');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Show loading toast
    const loadingToastId = toast.loading(t('help.messages.submitting'), {
      title: t('help.messages.submittingTitle')
    });
    
    try {
      const result = await submitHelpRequest(formData);
      
      // Remove loading toast
      toast.remove(loadingToastId);
      
      if (result.success) {
        // Show success toast
        toast.success(result.message || t('help.messages.success'), {
          title: t('help.messages.successTitle'),
          duration: 5000
        });
        
        // Reset form
        setFormData({
          type: 'question',
          subject: '',
          message: '',
        });
        setErrors({});
        
        // Modal will be closed by the help context
      } else {
        // Show error toast
        toast.error(result.error || t('help.messages.failed'), {
          title: t('help.messages.failedTitle'),
          duration: 6000
        });
        
        // Also set form error for inline display
        setErrors({ submit: result.error || t('help.messages.failed') });
      }
    } catch (error) {
      // Remove loading toast
      toast.remove(loadingToastId);
      
      console.error('Help request submission error:', error);
      
      // Show error toast
      toast.error(t('help.messages.error'), {
        title: t('help.messages.errorTitle'),
        duration: 6000
      });
      
      // Set form error for inline display
      setErrors({ submit: t('help.messages.error') });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      closeHelp();
      // Reset form when closing
      setFormData({
        type: 'question',
        subject: '',
        message: '',
      });
      setErrors({});
    }
  };

  // Styles
  const headerStyles = {
    padding: `${spacing.spacing[32]} ${spacing.spacing[32]} ${spacing.spacing[24]}`,
    borderBottom: `1px solid ${colors.border.default}`,
  };

  const titleStyle = {
    fontFamily: typography.fontFamily['awesome-serif'],
    fontSize: typography.desktop.size['2xl'],
    fontWeight: typography.desktop.weight.semibold,
    lineHeight: typography.desktop.lineHeight.leading7,
    color: colors.text.default,
    margin: 0,
  };

  const subtitleStyle = {
    ...textStyles.sm.normal,
    color: colors.text.subtle,
    margin: 0,
    marginTop: spacing.spacing[8],
  };

  const formStyles = {
    padding: `${spacing.spacing[24]} ${spacing.spacing[32]}`,
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[24],
    flex: 1,
    overflow: 'auto',
    minHeight: 0,
  };

  const footerStyles = {
    padding: `${spacing.spacing[24]} ${spacing.spacing[32]} ${spacing.spacing[32]}`,
    borderTop: `1px solid ${colors.border.default}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.spacing[16],
    flexShrink: 0,
  };



  const errorStyles = {
    ...textStyles.sm.normal,
    color: colors.text.destructive,
    marginTop: spacing.spacing[4],
  };

  return (
    <Modal
      isOpen={isHelpModalOpen}
      onClose={handleClose}
      showCloseButton={!isSubmitting}
    >
      {/* Header */}
      <div style={headerStyles}>
        <h2 style={titleStyle}>{t('help.modalTitle')}</h2>
        <p style={subtitleStyle}>
          {t('help.modalSubtitle')}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={formStyles}>
        {/* Help Type */}
        <div>
          <Select
            label={t('help.typeLabel')}
            value={formData.type}
            onValueChange={(value) => handleInputChange('type', value)}
            options={helpTypeOptions}
            required
          />
        </div>

        {/* Subject */}
        <div>
          <Input
            label={t('help.subjectLabel')}
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            placeholder={t('help.subjectPlaceholder')}
            required
            failed={!!errors.subject}
          />
          {errors.subject && (
            <div style={errorStyles}>{errors.subject}</div>
          )}
        </div>

        {/* Message */}
        <div>
          <TextArea
            label={t('help.messageLabel')}
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder={t('help.messagePlaceholder')}
            rows={6}
            required
            failed={!!errors.message}
          />
          {errors.message && (
            <div style={errorStyles}>{errors.message}</div>
          )}
        </div>





        {/* Submit Error */}
        {errors.submit && (
          <div style={errorStyles}>{errors.submit}</div>
        )}
      </form>

      {/* Footer */}
      <div style={footerStyles}>
        <div style={{
          ...textStyles.xs.normal,
          color: colors.text.muted,
        }}>
          {t('help.responseTime')}
        </div>
        
        <div style={{ display: 'flex', gap: spacing.spacing[12] }}>
          <Button
            label={t('help.cancelButton')}
            style="ghost"
            size="md"
            onClick={handleClose}
            disabled={isSubmitting}
          />
          <Button
            label={isSubmitting ? t('help.sendingButton') : t('help.sendButton')}
            style="primary"
            size="md"
            leadIcon={isSubmitting ? <Loader2 size={16} /> : <Send size={16} />}
            onClick={handleSubmit}
            disabled={isSubmitting}
            loading={isSubmitting}
          />
        </div>
      </div>
    </Modal>
  );
};

export default HelpModal;
