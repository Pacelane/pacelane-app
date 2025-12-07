import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import SpinningBichaurinho from '@/design-system/components/SpinningBichaurinho';

interface WrappedProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected route for LinkedIn Wrapped pages
 * Only checks authentication, does NOT require onboarding completion
 * This allows users to access /my-wrapped even if they haven't completed onboarding
 */
const WrappedProtectedRoute: React.FC<WrappedProtectedRouteProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  const { colors } = useTheme();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: colors.bg.default,
        padding: spacing.spacing[24],
      }}>
        <SpinningBichaurinho title="Authenticating..." />
      </div>
    );
  }

  // Redirect to linkedin-wrapped landing page if not authenticated
  if (!user) {
    return <Navigate to="/linkedin-wrapped" state={{ from: location }} replace />;
  }

  // If profile is still loading, show loading state
  if (!profile) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: colors.bg.default,
        padding: spacing.spacing[24],
      }}>
        <SpinningBichaurinho title="Loading your profile..." />
      </div>
    );
  }

  // User is authenticated - allow access regardless of onboarding status
  console.log('WrappedProtectedRoute: User authenticated, allowing access to Wrapped', { 
    userId: user?.id, 
    isOnboarded: (profile as any).is_onboarded,
  });

  return <>{children}</>;
};

export default WrappedProtectedRoute;


