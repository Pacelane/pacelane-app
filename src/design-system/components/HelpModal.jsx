import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useTheme } from '@/services/theme-context';
import { useHelp } from '@/services/help-context';
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
    { value: 'question', label: 'General Question' },
    { value: 'bug', label: 'Bug Report' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'account', label: 'Account Issue' },
    { value: 'billing', label: 'Billing Question' },
    { value: 'other', label: 'Other' },
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
      newErrors.subject = 'Subject is required';
    } else if (formData.subject.length < 5) {
      newErrors.subject = 'Subject must be at least 5 characters';
    }
    
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
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
    const loadingToastId = toast.loading('Sending your help request...', {
      title: 'Submitting Request'
    });
    
    try {
      const result = await submitHelpRequest(formData);
      
      // Remove loading toast
      toast.remove(loadingToastId);
      
      if (result.success) {
        // Show success toast
        toast.success(result.message || 'Your help request has been submitted successfully!', {
          title: 'Request Submitted',
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
        toast.error(result.error || 'Failed to submit help request. Please try again.', {
          title: 'Submission Failed',
          duration: 6000
        });
        
        // Also set form error for inline display
        setErrors({ submit: result.error || 'Failed to submit help request' });
      }
    } catch (error) {
      // Remove loading toast
      toast.remove(loadingToastId);
      
      console.error('Help request submission error:', error);
      
      // Show error toast
      toast.error('An unexpected error occurred. Please try again.', {
        title: 'Submission Error',
        duration: 6000
      });
      
      // Set form error for inline display
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
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
        <h2 style={titleStyle}>Get Help</h2>
        <p style={subtitleStyle}>
          Describe your issue and we'll get back to you as soon as possible
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={formStyles}>
        {/* Help Type */}
        <div>
          <Select
            label="What can we help you with?"
            value={formData.type}
            onValueChange={(value) => handleInputChange('type', value)}
            options={helpTypeOptions}
            required
          />
        </div>

        {/* Subject */}
        <div>
          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            placeholder="Briefly describe your issue"
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
            label="Message"
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            placeholder="Please provide as much detail as possible about your issue..."
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
          We typically respond within 24 hours
        </div>
        
        <div style={{ display: 'flex', gap: spacing.spacing[12] }}>
          <Button
            label="Cancel"
            style="ghost"
            size="md"
            onClick={handleClose}
            disabled={isSubmitting}
          />
          <Button
            label={isSubmitting ? "Sending..." : "Send Help Request"}
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
