// Auth Service - Business Logic Layer
// This is where all the actual authentication work happens
// Backend developers will mainly work in this file

import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse } from '@/types/api';
import type { Profile, SignInData, SignUpData } from '@/types/auth';

export class AuthService {
  // Note: Profile operations have been moved to ProfileService
  // Use ProfileService for all profile-related operations

  // ========== AUTHENTICATION OPERATIONS ==========

  /**
   * Sign in a user with email and password
   * @param credentials - Email and password
   * @returns Promise with auth data or error message
   */
  static async signIn(credentials: SignInData): Promise<ApiResponse<any>> {
    try {
      console.log('AuthService: Signing in user:', credentials.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (error) {
        console.error('AuthService: Sign in error:', error);
        throw error;
      }
      
      console.log('AuthService: User signed in successfully');
      return { data };
    } catch (error: any) {
      console.error('AuthService: signIn failed:', error);
      return { error: error.message || 'Failed to sign in' };
    }
  }

  /**
   * Sign up a new user
   * @param credentials - Email, password, and optional redirect URL
   * @returns Promise with auth data or error message  
   */
  static async signUp(credentials: SignUpData): Promise<ApiResponse<any>> {
    try {
      console.log('AuthService: Signing up user:', credentials.email);
      
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          ...(credentials.emailRedirectTo && { emailRedirectTo: credentials.emailRedirectTo }),
          ...(credentials.options?.data && { data: credentials.options.data })
        }
      });
      
      if (error) {
        console.error('AuthService: Sign up error:', error);
        throw error;
      }
      
      console.log('AuthService: User signed up successfully');
      return { data };
    } catch (error: any) {
      console.error('AuthService: signUp failed:', error);
      return { error: error.message || 'Failed to sign up' };
    }
  }

  /**
   * Sign in with Google OAuth
   * @param redirectTo - Where to redirect after successful auth
   * @returns Promise with auth data or error message
   */
  static async signInWithGoogle(redirectTo?: string): Promise<ApiResponse<any>> {
    try {
      console.log('AuthService: Starting Google sign in');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: redirectTo ? { redirectTo } : undefined
      });
      
      if (error) {
        console.error('AuthService: Google sign in error:', error);
        throw error;
      }
      
      console.log('AuthService: Google sign in initiated successfully');
      return { data };
    } catch (error: any) {
      console.error('AuthService: signInWithGoogle failed:', error);
      return { error: error.message || 'Failed to sign in with Google' };
    }
  }

  /**
   * Sign out the current user
   * @returns Promise with success or error message
   */
  static async signOut(): Promise<ApiResponse<void>> {
    try {
      console.log('AuthService: Signing out user');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('AuthService: Sign out error:', error);
        throw error;
      }
      
      console.log('AuthService: User signed out successfully');
      return { data: undefined };
    } catch (error: any) {
      console.error('AuthService: signOut failed:', error);
      return { error: error.message || 'Failed to sign out' };
    }
  }

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Get the current user session
   * @returns Current session data
   */
  static async getCurrentSession() {
    return supabase.auth.getSession();
  }

  /**
   * Listen for auth state changes (login/logout events)
   * @param callback - Function to call when auth state changes
   * @returns Subscription object to unsubscribe later
   */
  static onAuthStateChange(callback: (event: any, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
} 