// Auth API Layer - Frontend Interface
// This is where frontend developers will mainly work
// It wraps the AuthService and adds frontend-specific logic

import { AuthService } from '@/services/authService';
import type { SignInData, SignUpData } from '@/types/auth';

/**
 * Frontend API for authentication operations
 * This layer adds frontend-specific logic like default URLs
 */
export const authApi = {
  /**
   * Sign in a user with email and password
   * @param credentials - Email and password
   * @returns Promise with auth result
   */
  async signIn(credentials: SignInData) {
    return AuthService.signIn(credentials);
  },

  /**
   * Sign up a new user
   * Automatically sets the email redirect to our onboarding flow
   * @param credentials - Email and password
   * @returns Promise with auth result
   */
  async signUp(credentials: SignUpData) {
    // Add frontend-specific logic: default redirect URL
    const credentialsWithRedirect = {
      ...credentials,
      emailRedirectTo: credentials.emailRedirectTo || 
        `${window.location.origin}/onboarding/welcome`
    };
    
    return AuthService.signUp(credentialsWithRedirect);
  },

  /**
   * Sign in with Google
   * Automatically sets redirect to our onboarding flow
   * @returns Promise with auth result
   */
  async signInWithGoogle() {
    const redirectTo = `${window.location.origin}/onboarding/welcome`;
    return AuthService.signInWithGoogle(redirectTo);
  },

  /**
   * Sign out the current user
   * @returns Promise with result
   */
  async signOut() {
    return AuthService.signOut();
  },

  // Note: Profile operations have been moved to profileApi
  // Use profileApi for all profile-related operations

  // ========== UTILITY FUNCTIONS ==========
  
  /**
   * Get current session (mainly for internal use)
   * @returns Current session data
   */
  getCurrentSession() {
    return AuthService.getCurrentSession();
  },

  /**
   * Listen for auth state changes (mainly for internal use)
   * @param callback - Function to call when auth changes
   * @returns Subscription to unsubscribe later
   */
  onAuthStateChange(callback: (event: any, session: any) => void) {
    return AuthService.onAuthStateChange(callback);
  }
};

// You can also export individual functions if preferred:
export const {
  signIn,
  signUp, 
  signInWithGoogle,
  signOut,
  fetchProfile,
  updateProfile
} = authApi; 