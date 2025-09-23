// Auth Type Definitions
// This file defines the "shape" of all our auth-related data
// Think of it like a blueprint that tells TypeScript what properties each object should have

import type { User, Session } from '@supabase/supabase-js';

// Profile represents a user's profile data from our database
// This matches the actual Supabase schema
export interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  linkedin_profile?: string;
  company_linkedin?: string;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
  // LinkedIn fields from actual schema
  linkedin_name?: string;
  linkedin_company?: string;
  linkedin_about?: string;
  linkedin_location?: string;
  linkedin_headline?: string;
  linkedin_data?: any;                // JSON data from LinkedIn scraping
  linkedin_scraped_at?: string;
  // Other actual fields
  phone_number?: string;
  whatsapp_number?: string;           // WhatsApp number for notifications
  content_guides?: any;               // JSON data
  pacing_preferences?: any;           // JSON data
}

// What we get when a user signs in
export interface AuthState {
  user: User | null;                  // Supabase User object or null if not logged in
  session: Session | null;            // Supabase Session object
  profile: Profile | null;            // Our custom profile data
  loading: boolean;                   // Whether we're still loading auth data
}

// Data needed to sign in
export interface SignInData {
  email: string;
  password: string;
}

// Data needed to sign up (same as sign in, but we might add more fields later)
export interface SignUpData extends SignInData {
  name: string;                       // Full name required for sign up
  emailRedirectTo?: string;           // Where to redirect after email confirmation
  options?: {
    data?: {
      display_name?: string;
    };
  };
}

// All the actions our auth system can perform
export interface AuthActions {
  signIn: (data: SignInData) => Promise<any>;
  signUp: (data: SignUpData) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<any>;
  refreshProfile: () => Promise<void>;
  isOnboardingComplete: () => boolean;
} 