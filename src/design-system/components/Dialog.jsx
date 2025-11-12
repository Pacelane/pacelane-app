import React, { createContext, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';
import { useTheme } from '../../services/theme-context.jsx';
import { spacing } from '../tokens/spacing.js';
import { cornerRadius } from '../tokens/corner-radius.js';
import { textStyles } from '../styles/typography/typography-styles.js';
import { getShadow } from '../tokens/shadows.js';
import Button from './Button.jsx';

// Dialog Context
const DialogContext = createContext();

const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('Dialog components must be used within a Dialog');
  }
  return context;
};

// Main Dialog Component
export const Dialog = ({ children, open = false, onOpenChange }) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        onOpenChange?.(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when dialog is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [open, onOpenChange]);

  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

// Dialog Trigger
export const DialogTrigger = ({ children, onClick, ...props }) => {
  const { onOpenChange } = useDialog();

  const handleClick = (e) => {
    onClick?.(e);
    onOpenChange?.(true);
  };

  return React.cloneElement(children, {
    onClick: handleClick,
    ...props,
  });
};

// Dialog Content
export const DialogContent = ({ 
  children, 
  className = '',
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton = true,
  onEscapeKeyDown,
  onPointerDownOutside,
  ...props 
}) => {
  const { colors } = useTheme();
  const { open, onOpenChange } = useDialog();

  // Size configurations
  const sizeConfig = {
    sm: { maxWidth: '400px', width: '90vw' },
    md: { maxWidth: '500px', width: '90vw' },
    lg: { maxWidth: '700px', width: '90vw' },
    xl: { maxWidth: '900px', width: '95vw' },
    full: { maxWidth: '95vw', width: '95vw', height: '95vh' },
  };

  const config = sizeConfig[size];

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onPointerDownOutside?.(e);
      onOpenChange?.(false);
    }
  };

  const handleClose = () => {
    onOpenChange?.(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.50)', // Overlay
            padding: spacing.spacing[16],
          }}
          onClick={handleOverlayClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={className}
            style={{
              backgroundColor: colors.bg.card.default,
              borderRadius: cornerRadius.borderRadius.lg,
              boxShadow: getShadow('regular.modalLg', colors, { withBorder: true }),
              position: 'relative',
              ...config,
              maxHeight: size === 'full' ? config.height : '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {showCloseButton && (
              <Button
                variant="iconOnly"
                style="ghost"
                size="sm"
                leadIcon={<X size={16} />}
                onClick={handleClose}
                style={{
                  position: 'absolute',
                  top: spacing.spacing[16],
                  right: spacing.spacing[16],
                  zIndex: 10,
                }}
              />
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Dialog Header
export const DialogHeader = ({ children, className = '', ...props }) => {
  return (
    <div
      className={className}
      style={{
        padding: `${spacing.spacing[24]} ${spacing.spacing[24]} ${spacing.spacing[16]}`,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.spacing[8],
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// Dialog Title
export const DialogTitle = ({ children, className = '', ...props }) => {
  const { colors } = useTheme();
  
  return (
    <h2
      className={className}
      style={{
        ...textStyles.xl.semibold,
        color: colors.text.default,
        margin: 0,
      }}
      {...props}
    >
      {children}
    </h2>
  );
};

// Dialog Description
export const DialogDescription = ({ children, className = '', ...props }) => {
  const { colors } = useTheme();
  
  return (
    <p
      className={className}
      style={{
        ...textStyles.sm.normal,
        color: colors.text.subtle,
        margin: 0,
      }}
      {...props}
    >
      {children}
    </p>
  );
};

// Dialog Body
export const DialogBody = ({ children, className = '', ...props }) => {
  return (
    <div
      className={className}
      style={{
        padding: `0 ${spacing.spacing[24]}`,
        flex: 1,
        overflow: 'auto',
      }}
      {...props}
    >
      {children}
    </div>
  );
};

// Dialog Footer
export const DialogFooter = ({ children, className = '', ...props }) => {
  const { colors } = useTheme();
  
  return (
    <div
      className={className}
      style={{
        padding: `${spacing.spacing[16]} ${spacing.spacing[24]} ${spacing.spacing[24]}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: spacing.spacing[12],
        borderTop: `1px solid ${colors.border.default}`,
        marginTop: spacing.spacing[16],
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default Dialog;
