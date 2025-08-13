import React from 'react';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { textStyles } from '@/design-system/styles/typography/typography-styles';

const InlineTip = ({
  children,
  icon,
  className = '',
  style = {},
  ...rest
}) => {
  const containerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[8],
    padding: `${spacing.spacing[8]} ${spacing.spacing[12]}`,
    borderRadius: cornerRadius.borderRadius.md,
    backgroundColor: 'rgba(225, 231, 253, 0.2)', // E1E7FD with 20% opacity
    border: '1px solid #A6B3FD', // Indigo 300
    ...textStyles.sm.normal,
    color: '#352AA5', // Indigo 800
    ...style
  };

  return (
    <div
      className={className}
      style={containerStyles}
      {...rest}
    >
      {icon && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center',
          color: '#4B3BED' // Indigo 600
        }}>
          {icon}
        </div>
      )}
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default InlineTip;
