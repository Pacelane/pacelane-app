import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/services/theme-context';
import { useHelp } from '@/services/help-context';
import { useAuth } from '@/hooks/api/useAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { spacing } from '@/design-system/tokens/spacing';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { stroke } from '@/design-system/tokens/stroke';
import HomeSidebar from '@/design-system/components/HomeSidebar';
import Logo from '@/design-system/components/Logo';

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
  const isMobile = useIsMobile();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Hide sidebar on the content editor route
  const hideSidebar = location.pathname === '/content-editor';
  
  // On mobile, hide sidebar by default and show it as overlay when menu is open
  const shouldShowSidebar = !hideSidebar && (!isMobile || isMobileMenuOpen);

  // Active menu mapping based on current route
  const activeMenuItem = (() => {
    if (location.pathname.startsWith('/product-home')) return 'home';
    if (location.pathname.startsWith('/templates')) return 'home'; // Templates is part of home flow
    if (location.pathname.startsWith('/knowledge')) return 'knowledge';
    if (location.pathname.startsWith('/profile')) return 'profile';
    if (location.pathname.startsWith('/posts')) return 'history';
    if (location.pathname.startsWith('/integrations')) return 'integrations';
    if (location.pathname.startsWith('/pacing')) return 'pacing';
    // MVP: Temporarily disabled - uncomment when needed
    // if (location.pathname.startsWith('/notifications')) return 'notifications';
    // if (location.pathname.startsWith('/plan-billing')) return 'plan-billing';
    return 'home';
  })();

  const handleMenuItemClick = (menuId) => {
    // Close mobile menu when navigating
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
    
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
      // MVP: Temporarily disabled - uncomment when needed
      // case 'notifications':
      //   navigate('/notifications');
      //   break;
      // case 'plan-billing':
      //   navigate('/plan-billing');
      //   break;
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
  const handleSignOut = async () => {
    const result = await signOut();
    if (!result.error) {
      navigate('/signin');
    }
  };

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
    marginLeft: isMobile ? 0 : (shouldShowSidebar ? (isSidebarCollapsed ? '72px' : '240px') : 0),
    marginTop: isMobile && !hideSidebar ? '64px' : 0, // Account for mobile topbar
    transition: isMobile ? 'none' : 'margin-left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
  };

  const contentWrapperStyles = hideSidebar ? undefined : {
    width: '100%',
    maxWidth: isMobile ? 'none' : '840px',
    margin: '0 auto',
    paddingTop: spacing.spacing[40],
    paddingBottom: isMobile ? spacing.spacing[40] : spacing.spacing[80],
    paddingLeft: spacing.spacing[24],
    paddingRight: spacing.spacing[24],
    backgroundColor: 'transparent',
    boxSizing: 'border-box',
  };

  return (
    <div style={rootStyles} className={className} {...rest}>
      {/* Mobile Topbar */}
      {isMobile && !hideSidebar && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '64px',
          backgroundColor: colors.bg.card.default,
          borderBottom: `${stroke.DEFAULT} solid ${colors.border.default}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `0 ${spacing.spacing[16]}`,
          zIndex: 1001,
        }}>
          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: cornerRadius.borderRadius.sm,
              backgroundColor: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: spacing.spacing[8],
            }}
            aria-label="Toggle menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 12h18M3 6h18M3 18h18"
                stroke={colors.icon.default}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Logo */}
          <Logo width={100} />

          {/* Spacer to center logo */}
          <div style={{ width: '40px' }} />
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1001, // Between topbar (1001) and sidebar (1002)
          }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      {shouldShowSidebar && (
        <HomeSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapsed={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          activeMenuItem={activeMenuItem}
          onMenuItemClick={handleMenuItemClick}
          onCreateNewClick={handleCreateNewClick}
          onThemeChange={handleThemeChange}
          onHelpClick={handleHelpClick}
          onAvatarClick={handleAvatarClick}
          onSignOut={handleSignOut}
          userName={user?.email?.split('@')[0] || 'User'}
          userAvatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=48&h=48&fit=crop&crop=face"
          style={isMobile ? {
            position: 'fixed',
            zIndex: 1002, // Higher than topbar (1001) to appear above it
            left: 0,
            top: 0,
          } : undefined}
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