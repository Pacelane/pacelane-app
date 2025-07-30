// Profile Type Definitions
// This file defines all profile-related data structures and operations

// Re-export Profile from auth.ts to avoid circular dependencies
export type { Profile } from './auth';

// ========== PROFILE UPDATE TYPES ==========

// Basic profile information updates (matching actual database schema)
export interface BasicProfileUpdate {
  display_name?: string;
  phone_number?: string;
  // Note: bio, address, city, country, whatsapp don't exist in current schema
}

// LinkedIn-related profile updates
export interface LinkedInProfileUpdate {
  linkedin_profile?: string;
  linkedin_name?: string;
  linkedin_company?: string;
  linkedin_about?: string;
  linkedin_location?: string;
  linkedin_headline?: string;
  linkedin_data?: any;
  linkedin_scraped_at?: string;
}

// Onboarding-related updates
export interface OnboardingUpdate {
  onboarding_completed?: boolean;
  content_pillars?: string[];
  pacing_preferences?: PacingPreferences;
}

// Pacing preferences structure
export interface PacingPreferences {
  intensity?: string;
  frequency?: string[];
  daily_summary_time?: string;
  followups_frequency?: string;
  recommendations_time?: string;
  context_sessions_time?: string;
}

// Complete profile update (all possible fields)
export interface ProfileUpdate extends 
  BasicProfileUpdate, 
  LinkedInProfileUpdate, 
  OnboardingUpdate {}

// ========== PROFILE OPERATION TYPES ==========

// Data needed for LinkedIn profile setup
export interface LinkedInSetupData {
  profileUrl: string;
  scrapedData?: any;
}

// Data for content pillars step
export interface ContentPillarsData {
  selectedPillars: string[];
}

// Data for pacing preferences step
export interface PacingData {
  intensity: string;
  frequency: string[];
  daily_summary_time: string;
  followups_frequency: string;
  recommendations_time: string;
  context_sessions_time: string;
}

// Data for contact information step
export interface ContactData {
  countryCode: string;
  phoneNumber: string;
}

// ========== PROFILE ACTIONS ==========

export interface ProfileActions {
  updateBasicProfile: (updates: BasicProfileUpdate) => Promise<any>;
  updateLinkedInProfile: (updates: LinkedInProfileUpdate) => Promise<any>;
  setupLinkedInProfile: (data: LinkedInSetupData) => Promise<any>;
  saveContentPillars: (data: ContentPillarsData) => Promise<any>;
  savePacingPreferences: (data: PacingData) => Promise<any>;
  saveContactInfo: (data: ContactData) => Promise<any>;
  completeOnboarding: () => Promise<any>;
  refreshProfile: () => Promise<void>;
}

// ========== PROFILE STATE ==========

export interface ProfileState {
  profile: Profile | null;
  loading: boolean;
  saving: boolean;
  error?: string;
} 