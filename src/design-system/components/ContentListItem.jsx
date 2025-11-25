import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, FileText } from 'lucide-react';
import { useTheme } from '../../services/theme-context.jsx';
import { useIsMobile } from '@/hooks/use-mobile';
import { spacing } from '../tokens/spacing.js';
import { cornerRadius } from '../tokens/corner-radius.js';
import { textStyles } from '../styles/typography/typography-styles.js';
import { shadows, getShadow } from '../tokens/shadows.js';
import { useTranslation } from '@/services/i18n-context';
import Button from './Button.jsx';
import Badge from './Badge.jsx';
import DropdownMenu from './DropdownMenu.jsx';

const ContentListItem = ({
  // Core variants
  variant = 'gradient',          // 'gradient' | 'image'
  
  // Content
  title = 'Content Title',
  subtitle = 'Last edited',
  content = '',
  image,                         // Image URL for image variant
  status = 'draft',              // Current status of the content
  
  // Interaction handlers
  onMenuAction,                  // Function called with action type ('delete', 'markAsDraft', 'markAsPublished', 'markAsArchived')
  onClick,                       // Card click handler
  
  // Standard props
  className = '',
  style = {},
  ...rest
}) => {
  const { colors } = useTheme();
  const isMobile = useIsMobile();
  const { t } = useTranslation('pages');
  const [isHovered, setIsHovered] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Get first 3 lines of content for preview
  const displayContent = content.split('\n').slice(0, 3).join('\n');

  // Status dropdown items (for the Badge dropdown)
  const statusDropdownItems = [
    {
      label: t('posts.status.draft'),
      onClick: () => {
        onMenuAction?.('mark-draft');
        setShowStatusDropdown(false);
      }
    },
    {
      label: t('posts.status.published'),
      onClick: () => {
        onMenuAction?.('mark-published');
        setShowStatusDropdown(false);
      }
    },
    {
      label: t('posts.status.archived'),
      onClick: () => {
        onMenuAction?.('mark-archived');
        setShowStatusDropdown(false);
      }
    }
  ];

  // Main dropdown menu items (three dots menu) - only show different status options
  const dropdownItems = [];
  
  if (status !== 'draft') {
    dropdownItems.push({
      label: t('posts.menu.markAsDraft'),
      onClick: () => onMenuAction?.('mark-draft')
    });
  }
  
  if (status !== 'published') {
    dropdownItems.push({
      label: t('posts.menu.markAsPublished'),
      onClick: () => onMenuAction?.('mark-published')
    });
  }
  
  if (status !== 'archived') {
    dropdownItems.push({
      label: t('posts.menu.markAsArchived'),
      onClick: () => onMenuAction?.('mark-archived')
    });
  }
  
  // Add divider if there are status options
  if (dropdownItems.length > 0) {
    dropdownItems.push({ type: 'divider' });
  }
  
  // Add delete option
  dropdownItems.push({
    label: t('posts.menu.delete'),
    type: 'destructive',
    onClick: () => onMenuAction?.('delete')
  });

  // Get status display info - now all neutral colored
  const getStatusLabel = (status) => {
    switch (status) {
      case 'published':
        return t('posts.status.published');
      case 'archived':
        return t('posts.status.archived');
      case 'draft':
      default:
        return t('posts.status.draft');
    }
  };

  // Handle mouse events
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  // Table row styles - responsive padding, no hover effects
  const rowStyles = {
    display: 'flex',
    alignItems: 'center',
    padding: isMobile 
      ? `${spacing.spacing[12]}px ${spacing.spacing[16]}px`
      : `${spacing.spacing[12]}px ${spacing.spacing[24]}px`,
    backgroundColor: 'transparent',
    borderBottom: `1px solid ${colors.border.default}`,
    cursor: 'pointer',
    minHeight: isMobile ? spacing.spacing[64] : spacing.spacing[56] // Slightly taller on mobile
  };


  return (
    <motion.div
      className={className}
      style={{
        ...style,
        ...rowStyles,
        ...rest
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {/* Title and Date - Responsive layout */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? spacing.spacing[4] : spacing.spacing[24],
        minWidth: 0,
        marginRight: spacing.spacing[16] // Add space before status tag
      }}>
        {/* Title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 
            style={{ 
              ...textStyles.sm.semibold,
              color: colors.text.default,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {title}
          </h3>
        </div>
        
        {/* Date */}
        <div style={{ flexShrink: 0 }}>
          <p 
            style={{ 
              ...textStyles.xs.normal,
              color: colors.text.subtle,
              margin: 0,
              whiteSpace: 'nowrap'
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>

      {/* Status Badge with Dropdown */}
      <div style={{ 
        position: 'relative', 
        flexShrink: 0, 
        marginRight: spacing.spacing[12] // Consistent spacing before more options
      }}>
        <Badge
          variant="default"
          size={isMobile ? 'sm' : 'lg'}
          color="neutral"
          label={getStatusLabel(status)}
          border={true}
          onClick={(e) => {
            e.stopPropagation();
            setShowStatusDropdown(!showStatusDropdown);
          }}
        />
        
        {/* Status Dropdown */}
        <DropdownMenu
          isOpen={showStatusDropdown}
          onClose={() => setShowStatusDropdown(false)}
          items={statusDropdownItems}
          position="bottom-right"
        />
      </div>

      {/* Always Visible More Options Button */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
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
      </div>
    </motion.div>
  );
};

export default ContentListItem;
