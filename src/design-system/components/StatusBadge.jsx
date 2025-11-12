import React from 'react';
import { useTheme } from '@/services/theme-context';
import { stroke } from '@/design-system/tokens/stroke';
import { cornerRadius } from '@/design-system/tokens/corner-radius';

/**
 * StatusBadge - A simple circular status indicator
 * 
 * @param {boolean} active - Whether the status is active (on) or inactive (off)
 * @param {string} className - Optional className for additional styling
 * @param {object} rest - Additional props to pass to the container
 */
const StatusBadge = ({ active = false, className, ...rest }) => {
  const { colors } = useTheme();

  // Container: 16x16px with border
  const containerStyles = {
    width: '16px',
    height: '16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `${stroke.default} solid ${colors.bg.default}`,
    borderRadius: cornerRadius.borderRadius.full,
    flexShrink: 0,
  };

  // Circle: 8px, centered
  const circleStyles = {
    width: '8px',
    height: '8px',
    borderRadius: cornerRadius.borderRadius.full,
    backgroundColor: active 
      ? colors.bg.basic.emerald.accent 
      : colors.icon.black.disabled,
    transition: 'background-color 0.2s ease',
  };

  return (
    <div 
      style={containerStyles}
      className={className}
      role="status"
      aria-label={active ? 'Active' : 'Inactive'}
      {...rest}
    >
      <div style={circleStyles} />
    </div>
  );
};

export default StatusBadge;

