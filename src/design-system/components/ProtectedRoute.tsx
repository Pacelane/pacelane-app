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

  // If user is authenticated but hasn't completed onboarding, redirect to onboarding welcome page
  // The welcome page will handle the onboarding status check and redirect accordingly
  console.log('ProtectedRoute: Checking onboarding status', { 
    userId: user?.id, 
    isOnboarded: (profile as any).is_onboarded,
    profile: profile 
  });
  
  // Handle case where is_onboarded might be null, undefined, or false
  const isOnboarded = (profile as any).is_onboarded === true;
  
  if (!isOnboarded) {
    console.log('ProtectedRoute: User has not completed onboarding, redirecting to onboarding welcome page');
    return <Navigate to="/onboarding/welcome" replace />;
  }
  
  console.log('ProtectedRoute: User has completed onboarding, allowing access');

  // If user is authenticated and has completed onboarding, allow access
  return <>{children}</>;
};

export default ProtectedRoute;
