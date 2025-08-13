// useAuth Hook - React State Management
// This hook manages all authentication state and provides auth functions
// Frontend developers will use this instead of directly calling the API

import { useState, useEffect } from 'react';
import { authApi } from '@/api/auth';
import { profileApi } from '@/api/profile';
import type { AuthState, AuthActions, Profile } from '@/types/auth';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Custom React hook for authentication
 * Manages auth state and provides auth functions
 * @returns Auth state and functions
 */
export const useAuth = (): AuthState & AuthActions => {
  // ========== STATE MANAGEMENT ==========
  
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    loading: true,
  });

  // ========== HELPER FUNCTIONS ==========

  /**
   * Check if user has completed onboarding
   * @returns boolean indicating onboarding completion status
   */
  const isOnboardingComplete = (): boolean => {
    return authState.profile?.onboarding_completed === true;
  };

  /**
   * Fetch and set user profile
   * @param userId - User ID from Supabase auth
   */
  const fetchProfile = async (userId: string) => {
    console.log('useAuth: Fetching profile for user:', userId);
    
    const result = await profileApi.fetchProfile(userId);
    
    if (result.data) {
      console.log('useAuth: Profile loaded successfully');
      setAuthState(prev => ({ 
        ...prev, 
        profile: result.data! 
      }));
      
      // Check if onboarding is complete (for logging purposes only)
      const isOnboardingComplete = result.data.onboarding_completed;
      console.log('useAuth: Onboarding status:', isOnboardingComplete ? 'Complete' : 'Incomplete');
      
      // Note: We don't redirect here anymore - let ProtectedRoute handle it
      // This prevents conflicts between automatic redirects and route guards
    } else {
      console.error('useAuth: Failed to load profile:', result.error);
      setAuthState(prev => ({ 
        ...prev, 
        profile: null 
      }));
      
      // Note: We don't redirect here anymore - let ProtectedRoute handle it
      // This prevents conflicts between automatic redirects and route guards
    }
  };

  /**
   * Refresh the current user's profile
   * Useful after profile updates
   */
  const refreshProfile = async (): Promise<void> => {
    if (authState.user) {
      await fetchProfile(authState.user.id);
    }
  };

  // ========== AUTH FUNCTIONS ==========

  /**
   * Sign in with email and password
   * @param data - Email and password
   * @returns Promise with result
   */
  const signIn = async (data: { email: string; password: string }) => {
    console.log('useAuth: Attempting to sign in user:', data.email);
    return authApi.signIn(data);
  };

  /**
   * Sign up a new user
   * @param data - SignUpData with email, password, and optional options
   * @returns Promise with result
   */
  const signUp = async (data: { email: string; password: string; options?: { data?: { display_name?: string; }; }; }) => {
    console.log('useAuth: Attempting to sign up user:', data.email);
    return authApi.signUp(data as any);
  };

  /**
   * Sign in with Google
   * @returns Promise with result
   */
  const signInWithGoogle = async () => {
    console.log('useAuth: Attempting Google sign in');
    return authApi.signInWithGoogle();
  };

  /**
   * Sign out the current user
   * @returns Promise with result
   */
  const signOut = async () => {
    console.log('useAuth: Attempting to sign out');
    return authApi.signOut();
  };

  // ========== SIDE EFFECTS (useEffect) ==========

  useEffect(() => {
    console.log('useAuth: Setting up auth state listener');

    // Listen for auth state changes (login/logout events)
    const { data: { subscription } } = authApi.onAuthStateChange(
      async (event, session: Session | null) => {
        console.log('useAuth: Auth state changed:', event, session?.user?.email);
        
        // Update auth state
        setAuthState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false
        }));
        
        // Fetch profile if user is logged in
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state update
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          // Clear profile if user logged out
          setAuthState(prev => ({ 
            ...prev, 
            profile: null 
          }));
        }
      }
    );

    // Get initial session on hook mount
    authApi.getCurrentSession().then(({ data: { session } }) => {
      console.log('useAuth: Initial session check:', session?.user?.email || 'No user');
      
      setAuthState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false
      }));
      
      // Fetch profile if we have a user
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });

    // Cleanup function: unsubscribe when component unmounts
    return () => {
      console.log('useAuth: Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array = run only once on mount

  // ========== RETURN AUTH STATE & FUNCTIONS ==========
  
  return {
    // Auth state
    user: authState.user,
    session: authState.session,
    profile: authState.profile,
    loading: authState.loading,
    
    // Auth functions
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    refreshProfile,
    
    // Helper functions
    isOnboardingComplete,
  };
}; 