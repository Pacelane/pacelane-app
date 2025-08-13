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
  const { user, loading } = useAuth();
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

  // If user is authenticated, allow access to everything
  // No complex onboarding checks - just let them through
  return <>{children}</>;
};

export default ProtectedRoute;
