import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useTheme } from '@/services/theme-context';
import { spacing } from '@/design-system/tokens/spacing';
import SpinningBichaurinho from '@/design-system/components/SpinningBichaurinho';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
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

  // Redirect to sign-in if not authenticated
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check if user has completed onboarding
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

  // If user is authenticated but hasn't completed onboarding, redirect to onboarding
  if (!(profile as any).is_onboarded) {
    return <Navigate to="/onboarding/welcome" replace />;
  }

  // If user is authenticated and has completed onboarding, allow access
  return <>{children}</>;
};

export default ProtectedRoute;
