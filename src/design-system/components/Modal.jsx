import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { useTheme } from '../../services/theme-context.jsx';
import { spacing } from '../tokens/spacing.js';
import { cornerRadius } from '../tokens/corner-radius.js';
import { getShadow } from '../tokens/shadows.js';
import Button from './Button.jsx';

/**
 * Modal component - Flexible modal container with fixed dimensions
 * 
 * Features:
 * - 640px max-width, 800px fixed height as specified
 * - Semi-transparent overlay background (0.5 opacity)
 * - Theme-aware design that adapts to light/dark themes
 * - Smooth entrance/exit animations
 * - Escape key and overlay click to close
 * - Optional close button
 * - Scroll handling when content overflows
 * 
 * @param {Object} props
 * @param {boolean} [props.isOpen=false] - Whether the modal is open
 * @param {Function} [props.onClose] - Callback when modal should close
 * @param {React.ReactNode} props.children - Content to display inside the modal
 * @param {boolean} [props.showCloseButton=true] - Whether to show the X close button
 * @param {boolean} [props.closeOnOverlayClick=true] - Whether clicking overlay closes modal
 * @param {string} [props.className] - Additional CSS classes
 */
const Modal = ({ 
  isOpen = false, 
  onClose, 
  children, 
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  ...props 
}) => {
  const { colors } = useTheme();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose?.();
    }
  };

  // Handle close button click
  const handleClose = () => {
    onClose?.();
  };

  // Overlay styles
  const overlayStyles = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999, // High z-index to ensure modal appears above all other content
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 50% opacity as specified
    padding: spacing.spacing[16],
  };

  // Modal content styles
  const modalStyles = {
    backgroundColor: colors.bg.card.default,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.modalLg', colors, { withBorder: true }),
    position: 'relative',
    width: '100%',
    maxWidth: '640px', // Fixed max-width as specified
    height: '800px', // Fixed height as specified
    maxHeight: '90vh', // Ensure it doesn't exceed viewport
    overflow: 'hidden', // Control overflow at modal level
    display: 'flex',
    flexDirection: 'column',
  };

  // Close button styles
  const closeButtonStyles = {
    position: 'absolute',
    top: spacing.spacing[16],
    right: spacing.spacing[16],
    zIndex: 10,
  };

  // Content wrapper styles (for overflow handling)
  const contentWrapperStyles = {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={overlayStyles}
          onClick={handleOverlayClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={className}
            style={modalStyles}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {showCloseButton && (
              <div style={closeButtonStyles}>
                <Button
                  variant="iconOnly"
                  style="ghost"
                  size="sm"
                  leadIcon={<X size={16} />}
                  onClick={handleClose}
                  aria-label="Close modal"
                />
              </div>
            )}
            
            <div style={contentWrapperStyles}>
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
