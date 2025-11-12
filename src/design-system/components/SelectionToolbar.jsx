import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { stroke } from '@/design-system/tokens/stroke';
import { getShadow } from '@/design-system/tokens/shadows';
import Button from '@/design-system/components/Button';
import { 
  ArrowsOut as Maximize2,      // Expand
  ArrowsIn as Minimize2,      // Shorten
  FileText,       // Insert Paragraph
  PenNib as PenLine,        // Continue Writing
  Sparkle as Sparkles        // Improve Writing
} from '@phosphor-icons/react';

/**
 * SelectionToolbar - Floating toolbar that appears when text is selected
 * Shows quick action buttons in a clean, horizontal layout
 * Desktop only component
 */
const SelectionToolbar = ({ 
  selection, 
  onQuickAction,
  onAskAI,
  disabled = false 
}) => {
  const { colors } = useTheme();
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const toolbarRef = useRef(null);

  // Quick action options matching the design
  const quickActions = [
    { id: 'expand', label: 'Expand', icon: <Maximize2 size={14} /> },
    { id: 'shorten', label: 'Shorten', icon: <Minimize2 size={14} /> },
    { id: 'continue_writing', label: 'Continue Writing', icon: <PenLine size={14} /> },
    { id: 'improve_writing', label: 'Improve Writing', icon: <Sparkles size={14} /> },
  ];

  // Calculate toolbar position based on selection
  useEffect(() => {
    if (!selection || !selection.range) return;

    const calculatePosition = () => {
      const range = selection.range;
      const rect = range.getBoundingClientRect();
      
      // Position toolbar above the selection with some offset
      const top = rect.top + window.scrollY - 60; // 60px above selection for more space
      const left = rect.left + window.scrollX + (rect.width / 2); // Center horizontally
      
      setPosition({ top, left });
    };

    calculatePosition();
    
    // Recalculate on scroll or resize
    window.addEventListener('scroll', calculatePosition, true);
    window.addEventListener('resize', calculatePosition);
    
    return () => {
      window.removeEventListener('scroll', calculatePosition, true);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [selection]);

  if (!selection || !selection.text) return null;

  const toolbarStyles = {
    position: 'absolute',
    top: `${position.top}px`,
    left: `${position.left}px`,
    transform: 'translateX(-50%)',
    zIndex: 1000,
    backgroundColor: colors.bg.card.default,
    border: `${stroke.default} solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    boxShadow: getShadow('regular.modalMd', colors, { withBorder: false }),
    padding: spacing.spacing[4],
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[4],
    flexWrap: 'nowrap',
  };

  const handleActionClick = (actionId) => {
    console.log('Quick action clicked:', actionId);
    if (onQuickAction) {
      onQuickAction(actionId);
    }
  };

  return (
    <div ref={toolbarRef} style={toolbarStyles}>
      {quickActions.map((action) => (
        <Button
          key={action.id}
          label={action.label}
          style="secondary"
          size="xs"
          leadIcon={action.icon}
          onClick={() => handleActionClick(action.id)}
          disabled={disabled}
        />
      ))}
      
      {/* Ask AI button - blue primary button at the end */}
      <Button
        label="Ask AI"
        style="primary"
        size="xs"
        leadIcon={<Sparkles size={14} />}
        onClick={onAskAI}
        disabled={disabled}
      />
    </div>
  );
};

export default SelectionToolbar;