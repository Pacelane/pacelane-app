// Profile API Layer - Frontend Interface
// This is where frontend developers will mainly work for profile operations
// It wraps the ProfileService and adds frontend-specific logic

import { ProfileService } from '@/services/profileService';
import type { 
  BasicProfileUpdate,
  LinkedInProfileUpdate,
  LinkedInSetupData,
  ContentPillarsData,
  PacingData,
  ContactData
} from '@/types/profile';

/**
 * Frontend API for profile operations
 * This layer adds frontend-specific logic and validation
 */
export const profileApi = {
  // ========== BASIC PROFILE OPERATIONS ==========

  /**
   * Fetch user's profile
   * @param userId - User ID from auth
   * @returns Promise with profile data
   */
  async fetchProfile(userId: string) {
    return ProfileService.fetchProfile(userId);
  },

  /**
   * Update basic profile information
   * @param userId - User ID from auth
   * @param updates - Basic profile fields to update
   * @returns Promise with updated profile
   */
  async updateBasicProfile(userId: string, updates: BasicProfileUpdate) {
    // Add frontend validation here if needed
    if (updates.phone_number && !updates.phone_number.trim()) {
      return { error: 'Phone number cannot be empty' };
    }

    return ProfileService.updateBasicProfile(userId, updates);
  },

  // ========== LINKEDIN OPERATIONS ==========

  /**
   * Setup LinkedIn profile during onboarding
   * @param userId - User ID from auth
   * @param profileUrl - LinkedIn profile URL
   * @returns Promise with updated profile
   */
  async setupLinkedInProfile(userId: string, profileUrl: string) {
    // Frontend validation: ensure URL is provided and formatted
    if (!profileUrl.trim()) {
      return { error: 'LinkedIn profile URL is required' };
    }

    // Add https:// if not present
    const formattedUrl = profileUrl.startsWith('http') 
      ? profileUrl.trim() 
      : `https://${profileUrl.trim()}`;

    return ProfileService.setupLinkedInProfile(userId, {
      profileUrl: formattedUrl
    });
  },

  /**
   * Update LinkedIn profile information
   * @param userId - User ID from auth
   * @param updates - LinkedIn-related fields to update
   * @returns Promise with updated profile
   */
  async updateLinkedInProfile(userId: string, updates: LinkedInProfileUpdate) {
    return ProfileService.updateLinkedInProfile(userId, updates);
  },

  // ========== ONBOARDING OPERATIONS ==========

  /**
   * Save content pillars during onboarding
   * @param userId - User ID from auth
   * @param selectedPillars - Array of selected content pillars
   * @returns Promise with updated profile
   */
  async saveContentPillars(userId: string, selectedPillars: string[]) {
    // Frontend validation
    if (selectedPillars.length === 0) {
      return { error: 'Please select at least one content pillar' };
    }

    return ProfileService.saveContentPillars(userId, { selectedPillars });
  },

  /**
   * Save pacing preferences during onboarding
   * @param userId - User ID from auth
   * @param pacingData - Pacing preferences data
   * @returns Promise with updated profile
   */
  async savePacingPreferences(userId: string, pacingData: PacingData) {
    // Frontend validation
    if (!pacingData.intensity) {
      return { error: 'Please select an intensity level' };
    }
    if (pacingData.frequency.length === 0) {
      return { error: 'Please select at least one day' };
    }

    return ProfileService.savePacingPreferences(userId, pacingData);
  },

  /**
   * Save contact information during onboarding
   * @param userId - User ID from auth
   * @param contactData - Contact information
   * @returns Promise with updated profile
   */
  async saveContactInfo(userId: string, contactData: ContactData) {
    // Frontend validation
    if (!contactData.phoneNumber.trim()) {
      return { error: 'Phone number is required' };
    }

    return ProfileService.saveContactInfo(userId, contactData);
  },

  /**
   * Complete the onboarding process
   * @param userId - User ID from auth
   * @returns Promise with updated profile
   */
  async completeOnboarding(userId: string) {
    return ProfileService.completeOnboarding(userId);
  },

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Generic profile update for any fields
   * @param userId - User ID from auth
   * @param updates - Any profile fields to update
   * @returns Promise with updated profile
   */
  async updateProfile(userId: string, updates: any) {
    return ProfileService.updateProfile(userId, updates);
  }
};

// You can also export individual functions if preferred:
export const {
  fetchProfile,
  updateBasicProfile,
  setupLinkedInProfile,
  updateLinkedInProfile,
  saveContentPillars,
  savePacingPreferences,
  saveContactInfo,
  completeOnboarding,
  updateProfile
} = profileApi; 