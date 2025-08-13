// Auth API Layer - Frontend Interface
// This layer adds frontend-specific logic like default URLs and validation

import { AuthService } from '@/services/authService';
import { signInSchema, signUpSchema, validateData } from '@/api/schemas';
import type { SignInData, SignUpData } from '@/types/auth';

/**
 * Frontend API for authentication operations
 * Adds validation and frontend-specific logic
 */
export const authApi = {
  /**
   * Sign in a user with email and password
   * Includes frontend validation
   * @param credentials - Email and password
   * @returns Promise with auth result
   */
  async signIn(credentials: SignInData) {
    // Validate input data
    const validation = validateData(signInSchema, credentials);
    if (!validation.success) {
      return { error: Object.values(validation.errors!)[0] };
    }

    return AuthService.signIn(credentials);
  },

  /**
   * Sign up a new user
   * Automatically sets the email redirect to our onboarding flow
   * @param credentials - Email and password
   * @returns Promise with auth result
   */
  async signUp(credentials: SignUpData) {
    // Transform data for validation - extract name from options.data.display_name
    const validationData = {
      email: credentials.email,
      password: credentials.password,
      name: credentials.options?.data?.display_name || ''
    };

    // Validate input data
    const validation = validateData(signUpSchema, validationData);
    if (!validation.success) {
      console.error('Auth API: Sign-up validation failed:', validation.errors);
      return { error: Object.values(validation.errors!)[0] };
    }

    try {
      // Add frontend-specific logic: default redirect URL
      const credentialsWithRedirect = {
        ...credentials,
        emailRedirectTo: credentials.emailRedirectTo || 
          `${window.location.origin}/onboarding/welcome`
      };
      
      return AuthService.signUp(credentialsWithRedirect);
    } catch (error: any) {
      console.error('Auth API: Unexpected error during sign-up:', error);
      return { 
        error: error.message || 'An unexpected error occurred. Please try again.' 
      };
    }
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

  // ========== UTILITY FUNCTIONS (FOR HOOKS) ==========
  
  /**
   * Get current session (for useAuth hook)
   * @returns Current session data
   */
  getCurrentSession() {
    return AuthService.getCurrentSession();
  },

  /**
   * Listen for auth state changes (for useAuth hook)
   * @param callback - Function to call when auth changes
   * @returns Subscription to unsubscribe later
   */
  onAuthStateChange(callback: (event: any, session: any) => void) {
    return AuthService.onAuthStateChange(callback);
  }
};

// Export individual functions for convenience
export const {
  signIn,
  signUp, 
  signInWithGoogle,
  signOut,
  getCurrentSession,
  onAuthStateChange
} = authApi; 