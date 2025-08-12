import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../services/theme-context.jsx';
import { spacing } from '../tokens/spacing.js';
import { cornerRadius } from '../tokens/corner-radius.js';
import { getShadow } from '../tokens/shadows.js';
import { textStyles } from '../styles/typography/typography-styles.js';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import Bichaurinho from './Bichaurinho.jsx';

// Toast Context
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (toast) => {
    const id = Date.now().toString();
    const newToast = {
      id,
      ...toast,
      duration: toast.duration || 5000,
    };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove toast after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const toast = {
    success: (message, options = {}) => addToast({ 
      message, 
      type: 'success', 
      ...options 
    }),
    error: (message, options = {}) => addToast({ 
      message, 
      type: 'error', 
      ...options 
    }),
    warning: (message, options = {}) => addToast({ 
      message, 
      type: 'warning', 
      ...options 
    }),
    info: (message, options = {}) => addToast({ 
      message, 
      type: 'info', 
      ...options 
    }),
    custom: (message, options = {}) => addToast({ 
      message, 
      type: 'custom', 
      ...options 
    }),
    loading: (message, options = {}) => addToast({ 
      message, 
      type: 'loading', 
      duration: 0, // Loading toasts don't auto-dismiss
      ...options 
    }),
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

// Toast Container
const ToastContainer = () => {
  const { toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: spacing.spacing[20],
        right: spacing.spacing[20],
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.spacing[12],
        maxWidth: '400px',
      }}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

// Individual Toast Item
const ToastItem = ({ toast }) => {
  const { colors } = useTheme();
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => removeToast(toast.id), 200);
  };

  const getToastStyles = () => {
    const baseStyles = {
      backgroundColor: colors.bg.card.default,
      color: colors.text.default,
      border: `1px solid ${colors.border.default}`,
    };

    switch (toast.type) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: colors.bg.badge.green,
          borderColor: colors.border.green,
          color: colors.bg.basic.green.strong,
        };
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: colors.bg.badge.red,
          borderColor: colors.border.red,
          color: colors.bg.basic.red.strong,
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: colors.bg.badge.orange,
          borderColor: colors.border.orange,
          color: colors.bg.basic.orange.strong,
        };
      case 'info':
        return {
          ...baseStyles,
          backgroundColor: colors.bg.badge.blue,
          borderColor: colors.border.blue,
          color: colors.bg.basic.blue.strong,
        };
      default:
        return baseStyles;
    }
  };

  const getIcon = () => {
    const iconProps = { size: 20 };
    
    switch (toast.type) {
      case 'success':
        return <CheckCircle {...iconProps} color={colors.bg.basic.green.strong} />;
      case 'error':
        return <XCircle {...iconProps} color={colors.bg.basic.red.strong} />;
      case 'warning':
        return <AlertCircle {...iconProps} color={colors.bg.basic.orange.strong} />;
      case 'info':
        return <Info {...iconProps} color={colors.bg.basic.blue.strong} />;
      case 'loading':
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <Bichaurinho variant={16} size={20} />
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        ...getToastStyles(),
        padding: spacing.spacing[16],
        borderRadius: cornerRadius.borderRadius.md,
        boxShadow: getShadow('regular.modalMd', colors, { withBorder: true }),
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing.spacing[12],
        transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.2s ease-in-out',
        maxWidth: '400px',
        minWidth: '300px',
      }}
    >
      {getIcon()}
      <div style={{ flex: 1 }}>
        {toast.title && (
          <div
            style={{
              ...textStyles.sm.semibold,
              color: getToastStyles().color,
              marginBottom: spacing.spacing[4],
            }}
          >
            {toast.title}
          </div>
        )}
        <div
          style={{
            ...textStyles.sm.normal,
            color: getToastStyles().color,
            opacity: 0.8,
          }}
        >
          {toast.message}
        </div>
      </div>
      <button
        onClick={handleClose}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: getToastStyles().color,
          opacity: 0.6,
          padding: spacing.spacing[4],
          borderRadius: cornerRadius.borderRadius.sm,
          transition: 'opacity 0.2s ease-in-out',
        }}
        onMouseEnter={(e) => {
          e.target.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = '0.6';
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

// Simple toast function for external use
export const toast = {
  success: (message, options) => {
    // This will be replaced by the context version when provider is available
    console.log('Toast:', message, options);
  },
  error: (message, options) => {
    console.log('Toast Error:', message, options);
  },
  warning: (message, options) => {
    console.log('Toast Warning:', message, options);
  },
  info: (message, options) => {
    console.log('Toast Info:', message, options);
  },
};

export default ToastProvider;
