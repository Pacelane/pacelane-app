import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user && profile) {
      // If user is authenticated but hasn't completed onboarding, redirect to welcome
      if (!profile.onboarding_completed) {
        navigate('/onboarding/welcome');
      }
    }
  }, [user, profile, loading, navigate]);

  // Show loading while checking auth and profile
  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // Don't render children if onboarding isn't completed
  if (!profile.onboarding_completed) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Redirecting to onboarding...</div>
      </div>
    );
  }

  return <>{children}</>;
};