import React, { useState } from 'react';
import { useTheme } from '../../services/theme-context.jsx';
import { spacing } from '../tokens/spacing.js';
import { textStyles } from '../styles/typography/typography-styles.js';
import { stroke } from '../tokens/stroke.js';
import { cornerRadius } from '../tokens/corner-radius.js';
import { getShadow } from '../tokens/shadows.js';

// Design System Components
import Button from './Button.jsx';
import SidebarMenuItem from './SidebarMenuItem.jsx';

// Icons
import { Plus, HelpCircle } from 'lucide-react';

const AppSidebar = ({
  userName,
  userAvatar,
  navigationItems = [],
  onCreateNew,
  onUserMenuClick,
  onNavigationClick,
  onFinishOnboarding,
  onHelpClick,
  className = '',
  ...rest
}) => {
  const { colors } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Sidebar container styles
  const sidebarStyles = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: isCollapsed ? '72px' : '280px',
    backgroundColor: colors.bg.card.default,
    borderRight: `${stroke.default} solid ${colors.border.default}`,
    transition: 'width 0.3s ease-in-out',
    overflow: 'hidden',
  };

  // Header styles
  const headerStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[12],
    padding: spacing.spacing[16],
    borderBottom: `${stroke.default} solid ${colors.border.default}`,
    minHeight: '64px',
  };

  // Avatar styles
  const avatarStyles = {
    width: '24px',
    height: '24px',
    borderRadius: cornerRadius.borderRadius.sm,
    objectFit: 'cover',
  };

  // Content styles
  const contentStyles = {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'auto',
  };

  // Create new button container
  const createButtonContainerStyles = {
    padding: `${spacing.spacing[12]} ${spacing.spacing[16]} ${spacing.spacing[4]}`,
  };

  // Navigation container
  const navigationContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[4],
    padding: `${spacing.spacing[4]} ${spacing.spacing[16]}`,
    flex: 1,
  };

  // Footer styles
  const footerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spacing[8],
    padding: spacing.spacing[16],
    borderTop: `${stroke.default} solid ${colors.border.default}`,
  };

  // User menu button
  const userMenuButtonStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '20px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: cornerRadius.borderRadius.sm,
    transition: 'background-color 0.15s ease-out',
  };

  return (
    <aside 
      className={className} 
      style={sidebarStyles}
      {...rest}
    >
      {/* Header */}
      <div style={headerStyles}>
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: spacing.spacing[12] }}>
          <img 
            src={userAvatar} 
            alt={`${userName} avatar`} 
            style={avatarStyles}
          />
          {!isCollapsed && (
            <div 
              style={{
                ...textStyles.sm.medium,
                color: colors.text.default,
                flex: 1,
              }}
            >
              {userName}
            </div>
          )}
        </div>
        <button
          onClick={onUserMenuClick}
          style={userMenuButtonStyles}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = colors.bg.state.ghost;
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
          }}
          aria-label="User menu"
        >
          {/* Three dots icon */}
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none"
            style={{ color: colors.icon.muted }}
          >
            <circle cx="3" cy="8" r="1.5" fill="currentColor" />
            <circle cx="8" cy="8" r="1.5" fill="currentColor" />
            <circle cx="13" cy="8" r="1.5" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div style={contentStyles}>
        {/* Create New Button */}
        <div style={createButtonContainerStyles}>
          <Button
            label={isCollapsed ? undefined : "Create New"}
            variant={isCollapsed ? "iconOnly" : "default"}
            style="secondary"
            size="sm"
            leadIcon={<Plus size={16} />}
            onClick={onCreateNew}
            aria-label={isCollapsed ? "Create New" : undefined}
          />
        </div>

        {/* Navigation Items */}
        <div style={navigationContainerStyles}>
          {navigationItems.map((item) => (
            <SidebarMenuItem
              key={item.id}
              variant={isCollapsed ? 'iconOnly' : 'default'}
              state={item.isActive ? 'active' : 'default'}
              label={item.label}
              leadIcon={getIconComponent(item.icon)}
              onClick={() => onNavigationClick?.(item.id)}
              aria-label={isCollapsed ? item.label : undefined}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyles}>
        {/* Logo placeholder - you can add your logo here */}
        <div 
          style={{
            ...textStyles.sm.semibold,
            color: colors.text.default,
            flex: 1,
          }}
        >
          {!isCollapsed && 'Pacelane'}
        </div>
        
        <Button
          label={isCollapsed ? undefined : "Help"}
          variant={isCollapsed ? "iconOnly" : "default"}
          style="dashed"
          size="xs"
          leadIcon={<HelpCircle size={12} />}
          onClick={onHelpClick}
          aria-label={isCollapsed ? "Help" : undefined}
        />
      </div>
    </aside>
  );
};

// Helper function to convert icon strings to components
const getIconComponent = (iconName) => {
  // This is a simple mapping - you can extend this based on your needs
  const iconMap = {
    home: '🏠',
    profile: '👤',
    knowledge: '📚',
    calendar: '📅',
    'file-text': '📄',
  };

  const iconChar = iconMap[iconName] || '•';
  
  return (
    <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {iconChar}
    </span>
  );
};

export default AppSidebar;
