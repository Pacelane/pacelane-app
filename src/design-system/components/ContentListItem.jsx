import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import { useTheme } from '../../services/theme-context.jsx';
import { spacing } from '../tokens/spacing.js';
import { cornerRadius } from '../tokens/corner-radius.js';
import { textStyles } from '../styles/typography/typography-styles.js';
import { shadows, getShadow } from '../tokens/shadows.js';
import Button from './Button.jsx';
import DropdownMenu from './DropdownMenu.jsx';

const ContentListItem = ({
  // Core variants
  variant = 'gradient',          // 'gradient' | 'image'
  
  // Content
  title = 'Content Title',
  subtitle = 'Last edited',
  content = '',
  image,                         // Image URL for image variant
  
  // Interaction handlers
  onMenuAction,                  // Function called with action type ('delete')
  onClick,                       // Card click handler
  
  // Standard props
  className = '',
  style = {},
  ...rest
}) => {
  const { colors } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Get first line of content for preview
  const displayContent = content.split('\n')[0].substring(0, 120) + (content.length > 120 ? '...' : '');

  // Dropdown menu items
  const dropdownItems = [
    {
      label: 'Delete',
      type: 'destructive',
      onClick: () => onMenuAction?.('delete')
    }
  ];

  // Handle mouse events
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <motion.div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.spacing[16],
        padding: spacing.spacing[16],
        borderRadius: cornerRadius.borderRadius.md,
        backgroundColor: colors.bg.card.default,
        border: `1px solid ${colors.border.default}`,
        boxShadow: isHovered 
          ? getShadow('regular.card', colors, { withBorder: false })
          : 'none',
        transition: 'all 0.2s ease-in-out',
        cursor: onClick ? 'pointer' : 'default',
        ...style
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      {...rest}
    >
      {/* Preview Thumbnail */}
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: cornerRadius.borderRadius.sm,
          flexShrink: 0,
          background: variant === 'image' && image 
            ? `url(${image})`
            : `linear-gradient(135deg, ${colors.bg.state.soft}, ${colors.bg.state.primary})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: `1px solid ${colors.border.default}`,
        }}
      />

      {/* Content */}
      <div style={{ 
        flex: 1, 
        minWidth: 0, // Allow text to truncate
        display: 'flex',
        flexDirection: 'column',
        gap: spacing.spacing[4]
      }}>
        {/* Title */}
        <h3
          style={{
            ...textStyles.md.medium,
            color: colors.text.default,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {title}
        </h3>
        
        {/* Subtitle */}
        <p
          style={{
            ...textStyles.sm.normal,
            color: colors.text.muted,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {subtitle}
        </p>

        {/* Content Preview */}
        <p
          style={{
            ...textStyles.xs.normal,
            color: colors.text.subtle,
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {displayContent}
        </p>
      </div>

      {/* More Options Button */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
            >
              <Button
                variant="iconOnly"
                style="ghost"
                size="xs"
                leadIcon={<MoreHorizontal size={12} />}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDropdown(!showDropdown);
                }}
              />
              
              {/* Dropdown Menu */}
              <DropdownMenu
                isOpen={showDropdown}
                onClose={() => setShowDropdown(false)}
                items={dropdownItems}
                position="bottom-right"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ContentListItem;
