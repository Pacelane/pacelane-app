import React, { useState } from 'react';
import { useTheme } from '@/services/theme-context';
import { useTranslation } from '@/services/i18n-context';
import { useHelp } from '@/services/help-context';
import { spacing } from '../tokens/spacing.js';
import { textStyles } from '../styles/typography/typography-styles.js';
import { stroke } from '../tokens/stroke.js';
import { cornerRadius } from '../tokens/corner-radius.js';
import defaultAvatar from '@/assets/images/pfp-avatar.png';

// Design System Components
import Button from './Button.jsx';
import ButtonGroup from './ButtonGroup.jsx';
import SidebarMenuItem from './SidebarMenuItem.jsx';
import Logo from './Logo.jsx';
import LogoSymbol from './LogoSymbol.jsx';
import DropdownMenu from './DropdownMenu.jsx';


// Icons
import {
  CaretRight as ChevronRight,
  CaretLeft as ChevronLeft,
  Plus,
  House as Home,
  User,
  BookOpen,
  FileText,
  Plug,
  Gauge,
  Bell,
  CreditCard,
  Sun,
  Moon,
  Question as HelpCircle,
  Gear as Settings,
  SignOut as LogOut
} from '@phosphor-icons/react';

/**
 * HomeSidebar component for navigation in the design system app
 * 
 * @param {Object} props
 * @param {boolean} [props.isCollapsed] - Whether the sidebar is in collapsed state
 * @param {function} [props.onToggleCollapsed] - Callback when collapse/expand is triggered
 * @param {string} [props.userName] - User's display name
 * @param {string} [props.userAvatar] - User's avatar image URL
 * @param {string} [props.activeMenuItem] - Currently active menu item
 * @param {function} [props.onMenuItemClick] - Callback when menu item is clicked
 * @param {function} [props.onCreateNewClick] - Callback when Create New button is clicked
 * @param {function} [props.onThemeChange] - Callback when theme is changed
 * @param {function} [props.onHelpClick] - Callback when Help button is clicked
 * @param {function} [props.onAvatarClick] - Callback when avatar container is clicked (for profile navigation)
 * @param {function} [props.onSignOut] - Callback when sign out is clicked
 * @param {string} [props.className] - Additional CSS classes
 */
const HomeSidebar = ({
  isCollapsed = false,
  onToggleCollapsed,
  userName = 'John Doe',
  userAvatar = null, // Will use default avatar as fallback
  activeMenuItem = 'home',
  onMenuItemClick,
  onCreateNewClick,
  onThemeChange,
  onHelpClick,
  onAvatarClick,
  onSignOut,
  className = '',
  style,
  ...rest
}) => {
  const { colors, themePreference, setTheme } = useTheme();
  const { t } = useTranslation();
  const { openHelp } = useHelp();
  const [isAvatarHovered, setIsAvatarHovered] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Determine avatar source - use default avatar as fallback
  const avatarSrc = userAvatar || defaultAvatar;
  const isDefaultAvatar = avatarSrc === defaultAvatar;

  // Handle theme selection
  const handleThemeSelect = (item, index) => {
    const themes = ['light', 'dark'];
    const selectedTheme = themes[index];
    setTheme(selectedTheme);
    onThemeChange?.(selectedTheme);
  };

  // Handle theme toggle for collapsed state
  const handleThemeToggle = () => {
    const newTheme = themePreference === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    onThemeChange?.(newTheme);
  };

  // Handle user dropdown toggle
  const handleAvatarClick = () => {
    if (isCollapsed) {
      // If collapsed, go directly to profile
      onAvatarClick?.();
    } else {
      // If expanded, toggle dropdown
      setIsUserDropdownOpen(!isUserDropdownOpen);
    }
  };

  // User dropdown menu items
  const userDropdownItems = [
    {
      label: t('sidebar.userMenu.profileSettings'),
      onClick: () => {
        setIsUserDropdownOpen(false);
        onAvatarClick?.();
      }
    },
    {
      label: t('sidebar.userMenu.signOut'),
      type: 'destructive',
      onClick: () => {
        setIsUserDropdownOpen(false);
        onSignOut?.();
      }
    }
  ];

  // Menu items configuration
  const mainMenuItems = [
    { id: 'home', label: t('sidebar.menu.home'), icon: <Home />, section: 'main' },
    { id: 'profile', label: t('sidebar.menu.profile'), icon: <User />, section: 'main' },
    { id: 'knowledge', label: t('sidebar.menu.knowledge'), icon: <BookOpen />, section: 'main' },
    { id: 'history', label: t('sidebar.menu.history'), icon: <FileText />, section: 'main' },
    { id: 'pacing', label: t('sidebar.menu.pacing'), icon: <Gauge />, section: 'main' },
    { id: 'integrations', label: t('sidebar.menu.integrations'), icon: <Plug />, section: 'main' },
  ];

  const secondaryMenuItems = [
    // MVP: Temporarily disabled - uncomment when needed
    // { id: 'notifications', label: t('sidebar.menu.notifications'), icon: <Bell />, section: 'secondary' },
    // { id: 'plan-billing', label: t('sidebar.menu.planBilling'), icon: <CreditCard />, section: 'secondary' },
  ];

  // Theme selector items
  const themeItems = [
    { id: 'light', leadIcon: <Sun />, onClick: handleThemeSelect },
    { id: 'dark', leadIcon: <Moon />, onClick: handleThemeSelect },
  ];

  // Sidebar container styles
  const sidebarStyles = {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    width: isCollapsed ? '72px' : '240px',
    backgroundColor: colors.bg.sidebar.default,
    borderRight: `${stroke.DEFAULT} solid ${colors.border.default}`,
    transition: 'width 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)', // Smooth width transition
    zIndex: 1000, // Ensure sidebar is above content
    ...style, // Allow custom styles for mobile
  };

  // Header container (Logo + Toggle Button)
  const headerContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spacing[8],
    padding: `${spacing.spacing[12]} ${spacing.spacing[16]}`,
    backgroundColor: colors.bg.sidebar.default,
    borderBottom: `${stroke.DEFAULT} solid ${colors.border.default}`,
    transition: 'gap 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
  };

  // Toggle button styles (small and subtle)
  const toggleButtonStyles = {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: cornerRadius.borderRadius.sm,
    padding: spacing.spacing[4],
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.icon.muted,
    transition: 'background-color 0.15s ease-out, color 0.15s ease-out',
    flexShrink: 0,
  };

  // Avatar container styles (clickable button)
  const avatarContainerStyles = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: isCollapsed ? 'center' : 'flex-start',
    gap: isCollapsed ? 0 : spacing.spacing[12],
    padding: `${spacing.spacing[12]} ${spacing.spacing[16]}`,
    backgroundColor: isAvatarHovered ? colors.bg.state.ghostHover : colors.bg.sidebar.default,
    border: 'none',
    borderBottom: `${stroke.DEFAULT} solid ${colors.border.default}`,
    width: '100%',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease-out, justify-content 0.3s cubic-bezier(0.4, 0.0, 0.2, 1), gap 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    outline: 'none', // Remove focus outline as requested
  };

  // Avatar image styles
  const avatarImageStyles = {
    width: '24px',
    height: '24px',
    borderRadius: cornerRadius.borderRadius.sm,
    border: `${stroke.DEFAULT} solid ${colors.border.default}`,
    objectFit: 'cover',
    backgroundColor: 'transparent',
    padding: '0',
  };

  // Button container styles
  const buttonContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: isCollapsed ? 'center' : 'stretch',
    gap: spacing.spacing[2],
    padding: `${spacing.spacing[12]} ${spacing.spacing[16]} ${spacing.spacing[12]}`,
    backgroundColor: colors.bg.sidebar.default,
    overflow: 'visible',
    transition: 'align-items 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
  };

  // Menu container styles
  const menuContainerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[4],
    padding: `${spacing.spacing[8]} ${spacing.spacing[16]} ${spacing.spacing[16]}`,
    backgroundColor: colors.bg.sidebar.default,
    flex: 1,
    overflow: 'visible',
  };

  // Actions container styles
  const actionsContainerStyles = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: isCollapsed ? 'center' : 'space-between',
    gap: isCollapsed ? 0 : 'auto',
    padding: spacing.spacing[16],
    backgroundColor: colors.bg.sidebar.default,
    borderTop: `${stroke.DEFAULT} solid ${colors.border.default}`,
    transition: 'justify-content 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
  };

  return (
    <nav
      style={sidebarStyles}
      className={className}
      role="navigation"
      aria-label="Main navigation"
      {...rest}
    >
      {/* Header Container - Logo + Toggle Button */}
      <div style={headerContainerStyles}>
        {isCollapsed ? (
          <LogoSymbol size={24} />
        ) : (
          <Logo width={120} />
        )}
        
        {/* Subtle Toggle Button */}
        <button
          style={toggleButtonStyles}
          onClick={onToggleCollapsed}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.bg.state.ghostHover;
            e.currentTarget.style.color = colors.icon.default;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = colors.icon.muted;
          }}
          aria-label={isCollapsed ? t('sidebar.ariaLabels.expandSidebar') : t('sidebar.ariaLabels.collapseSidebar')}
          type="button"
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Avatar Container */}
      <button
        style={avatarContainerStyles}
        onClick={handleAvatarClick}
        onMouseEnter={() => setIsAvatarHovered(true)}
        onMouseLeave={() => setIsAvatarHovered(false)}
        aria-label={isCollapsed ? `${t('sidebar.ariaLabels.viewProfile')} ${userName}` : t('sidebar.ariaLabels.userMenu')}
        type="button"
      >
        <img
          src={avatarSrc}
          alt={`${userName}'s avatar`}
          style={avatarImageStyles}
        />
        
        {!isCollapsed && (
          <span style={{ 
            ...textStyles.sm.medium, 
            color: colors.text.default,
            flex: 1,
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            opacity: isCollapsed ? 0 : 1,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
          }}>
            {userName}
          </span>
        )}

        {/* User Dropdown Menu */}
        {!isCollapsed && (
          <DropdownMenu
            isOpen={isUserDropdownOpen}
            onClose={() => setIsUserDropdownOpen(false)}
            items={userDropdownItems}
            position="bottom-right"
            minWidth="160px"
          />
        )}
      </button>

      {/* Button Container - Create New */}
      <div style={buttonContainerStyles}>
        <Button
          label={isCollapsed ? undefined : t('sidebar.createNew')}
          variant={isCollapsed ? "iconOnly" : "default"}
          style="secondary"
          size="sm"
          leadIcon={<Plus size={16} />}
          onClick={onCreateNewClick}
          aria-label={isCollapsed ? t('sidebar.ariaLabels.createNew') : undefined}
        />
      </div>

      {/* Sidebar Menu Items Container */}
      <div style={menuContainerStyles}>
        {/* Main Menu Items */}
        {mainMenuItems.map((item) => (
          <SidebarMenuItem
            key={item.id}
            variant={isCollapsed ? 'iconOnly' : 'default'}
            state={activeMenuItem === item.id ? 'active' : 'default'}
            label={item.label}
            leadIcon={item.icon}
            onClick={() => onMenuItemClick?.(item.id)}
            aria-label={isCollapsed ? item.label : undefined}
          />
        ))}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Secondary Menu Items */}
        {secondaryMenuItems.map((item) => (
          <SidebarMenuItem
            key={item.id}
            variant={isCollapsed ? 'iconOnly' : 'default'}
            state={activeMenuItem === item.id ? 'active' : 'default'}
            label={item.label}
            leadIcon={item.icon}
            onClick={() => onMenuItemClick?.(item.id)}
            aria-label={isCollapsed ? item.label : undefined}
          />
        ))}
      </div>



      {/* Actions Container */}
      <div style={actionsContainerStyles}>
        {/* Theme Selector */}
        {isCollapsed ? (
          <Button
            variant="iconOnly"
            style="ghost"
            size="xs"
            leadIcon={themePreference === 'light' ? <Moon size={12} /> : <Sun size={12} />}
            onClick={handleThemeToggle}
            aria-label={themePreference === 'light' ? t('sidebar.ariaLabels.switchToDark') : t('sidebar.ariaLabels.switchToLight')}
          />
        ) : (
          <ButtonGroup
            type="iconOnly"
            size="xs"
            items={themeItems}
          />
        )}

        {/* Help Button - Only show when expanded */}
        {!isCollapsed && (
          <Button
            label={t('sidebar.help')}
            style="dashed"
            size="xs"
            leadIcon={<HelpCircle size={12} />}
            onClick={() => {
              if (onHelpClick) {
                onHelpClick();
              } else {
                openHelp({
                  section: 'Sidebar',
                  action: 'Clicked help button from sidebar'
                });
              }
            }}
          />
        )}
      </div>
    </nav>
  );
};

export default HomeSidebar;