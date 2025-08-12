import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { useHelp } from '@/services/help-context';
import { useAuth } from '@/hooks/api/useAuth';
import { spacing } from '@/design-system/tokens/spacing';
import HomeSidebar from '@/design-system/components/HomeSidebar';

/**
 * MainAppChrome - shared app chrome with sidebar and centered content container
 * - Provides theme-aware background (colors.bg.subtle)
 * - Renders `HomeSidebar` on the left (except for content editor)
 * - Wraps children in an 840px centered container with vertical padding
 */
const MainAppChrome = ({ className = '', children, ...rest }) => {
  const { colors } = useTheme();
  const { openHelp } = useHelp();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Hide sidebar on the content editor route
  const hideSidebar = location.pathname === '/content-editor';

  // Active menu mapping based on current route
  const activeMenuItem = (() => {
    if (location.pathname.startsWith('/product-home')) return 'home';
    if (location.pathname.startsWith('/templates')) return 'home'; // Templates is part of home flow
    if (location.pathname.startsWith('/knowledge')) return 'knowledge';
    if (location.pathname.startsWith('/profile')) return 'profile';
    if (location.pathname.startsWith('/posts')) return 'history';
    if (location.pathname.startsWith('/integrations')) return 'integrations';
    if (location.pathname.startsWith('/pacing')) return 'pacing';
    if (location.pathname.startsWith('/notifications')) return 'notifications';
    if (location.pathname.startsWith('/plan-billing')) return 'plan-billing';
    return 'home';
  })();

  const handleMenuItemClick = (menuId) => {
    switch (menuId) {
      case 'home':
        navigate('/product-home');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'knowledge':
        navigate('/knowledge');
        break;
      case 'history':
        navigate('/posts');
        break;
      case 'integrations':
        navigate('/integrations');
        break;
      case 'pacing':
        navigate('/pacing');
        break;
      case 'notifications':
        navigate('/notifications');
        break;
      case 'plan-billing':
        navigate('/plan-billing');
        break;
      default:
        break;
    }
  };

  const handleCreateNewClick = () => navigate('/content-editor');
  const handleAvatarClick = () => navigate('/profile');
  const handleHelpClick = () => {
    openHelp({
      page: location.pathname,
      section: 'MainAppChrome',
      action: 'Clicked help button from main app chrome'
    });
  };
  const handleThemeChange = () => {};

  // Layout styles
  const rootStyles = {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: colors.bg.subtle,
  };

  const mainStyles = {
    flex: 1,
    minHeight: '100vh',
    width: '100%',
    overflowY: 'auto',
    overflowX: 'hidden', // Prevent horizontal scrolling
  };

  const contentWrapperStyles = hideSidebar ? undefined : {
    width: '100%',
    maxWidth: '840px',
    margin: '0 auto',
    paddingTop: spacing.spacing[40],
    paddingBottom: spacing.spacing[80],
    paddingLeft: spacing.spacing[24],
    paddingRight: spacing.spacing[24],
    backgroundColor: 'transparent',
    boxSizing: 'border-box',
  };

  return (
    <div style={rootStyles} className={className} {...rest}>
      {!hideSidebar && (
        <HomeSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          activeMenuItem={activeMenuItem}
          onMenuItemClick={handleMenuItemClick}
          onCreateNewClick={handleCreateNewClick}
          onThemeChange={handleThemeChange}
          onHelpClick={handleHelpClick}
          onAvatarClick={handleAvatarClick}
          userName={user?.email?.split('@')[0] || 'User'}
          userAvatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face"
        />
      )}

      <main style={mainStyles} role="main">
        {contentWrapperStyles ? (
          <div style={contentWrapperStyles}>{children}</div>
        ) : (
          children
        )}
      </main>
    </div>
  );
};

export default MainAppChrome;