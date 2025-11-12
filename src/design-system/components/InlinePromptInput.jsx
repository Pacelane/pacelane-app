import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { stroke } from '@/design-system/tokens/stroke';
import { getShadow } from '@/design-system/tokens/shadows';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import Button from '@/design-system/components/Button';
import Input from '@/design-system/components/Input';
import { PaperPlaneTilt as Send, X } from '@phosphor-icons/react';

/**
 * InlinePromptInput - Inline input for AI editing instructions
 * Appears near the selected text with a compact design
 */
const InlinePromptInput = ({ 
  selection,
  onSubmit, 
  onCancel,
  loading = false 
}) => {
  const { colors } = useTheme();
  const [instruction, setInstruction] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Auto-focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle click outside to close (only if clicking outside the container)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onCancel();
      }
    };

    // Add listener with a small delay to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onCancel]);

  // Calculate position based on selection
  useEffect(() => {
    if (!selection || !selection.range) return;

    const calculatePosition = () => {
      const range = selection.range;
      const rect = range.getBoundingClientRect();
      
      // Position below the selection
      const top = rect.bottom + window.scrollY + 8; // 8px below selection
      const left = rect.left + window.scrollX;
      
      setPosition({ top, left });
    };

    calculatePosition();
    
    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);
    
    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [selection]);

  const handleSubmit = () => {
    if (instruction.trim() && !loading) {
      onSubmit(instruction.trim());
      setInstruction('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const containerStyles = {
    position: 'absolute',
    top: `${position.top}px`,
    left: `${position.left}px`,
    zIndex: 1000,
    backgroundColor: colors.bg.card.default,
    border: `${stroke.default} solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.modalMd', colors, { withBorder: false }),
    padding: spacing.spacing[12],
    minWidth: '400px',
    maxWidth: '600px',
  };

  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.spacing[8],
  };

  const inputContainerStyles = {
    display: 'flex',
    gap: spacing.spacing[8],
    alignItems: 'flex-end',
  };

  return (
    <div ref={containerRef} style={containerStyles} data-inline-prompt>
      <div style={headerStyles}>
        <span style={{ ...textStyles.xs.semibold, color: colors.text.muted }}>
          What would you like to change?
        </span>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={14} style={{ color: colors.icon.muted }} />
        </button>
      </div>
      
      <div style={inputContainerStyles}>
        <div style={{ flex: 1 }}>
          <Input
            ref={inputRef}
            placeholder="E.g., 'Make this more concise' or 'Add more details'"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
          />
        </div>
        <Button
          variant="iconOnly"
          style="primary"
          size="md"
          leadIcon={<Send size={16} />}
          onClick={handleSubmit}
          disabled={!instruction.trim() || loading}
          loading={loading}
        />
      </div>
      
      <div style={{ 
        marginTop: spacing.spacing[8],
        ...textStyles.xs.normal,
        color: colors.text.hint
      }}>
        Press Enter to send, Esc to cancel
      </div>
    </div>
  );
};

export default InlinePromptInput;
