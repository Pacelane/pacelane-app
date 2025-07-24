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

  // Show loading or let children render
  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};