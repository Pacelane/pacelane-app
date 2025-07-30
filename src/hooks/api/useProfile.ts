// useProfile Hook - Profile State Management
// This hook provides profile-specific state and operations
// Frontend developers can use this for profile-related functionality

import { useState } from 'react';
import { profileApi } from '@/api/profile';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  ProfileState,
  ProfileActions,
  BasicProfileUpdate,
  LinkedInProfileUpdate,
  ContentPillarsData,
  PacingData,
  ContactData
} from '@/types/profile';

/**
 * Custom React hook for profile operations
 * Provides profile state management and actions
 * @returns Profile state and action functions
 */
export const useProfile = (): ProfileState & ProfileActions => {
  // ========== STATE MANAGEMENT ==========
  
  const { user, profile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // ========== HELPER FUNCTIONS ==========

  /**
   * Execute a profile operation with loading state management
   * @param operation - The profile operation to execute
   * @param successMessage - Optional success message for logging
   * @returns Promise with operation result
   */
  const executeProfileOperation = async (
    operation: () => Promise<any>,
    successMessage?: string
  ) => {
    if (!user) {
      const errorMsg = 'User must be logged in to perform this operation';
      setError(errorMsg);
      return { error: errorMsg };
    }

    setSaving(true);
    setError(undefined);

    try {
      const result = await operation();
      
      if (result.error) {
        console.error('Profile operation error:', result.error);
        setError(result.error);
        return result;
      }

      // Refresh the profile in auth context to get latest data
      await refreshProfile();
      
      if (successMessage) {
        console.log('useProfile:', successMessage);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Profile operation failed';
      console.error('useProfile: Operation failed:', error);
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      setSaving(false);
    }
  };

  // ========== PROFILE ACTIONS ==========

  /**
   * Update basic profile information (name, bio, contact details)
   * @param updates - Basic profile fields to update
   * @returns Promise with operation result
   */
  const updateBasicProfile = async (updates: BasicProfileUpdate) => {
    return executeProfileOperation(
      () => profileApi.updateBasicProfile(user!.id, updates),
      'Basic profile updated successfully'
    );
  };

  /**
   * Update LinkedIn profile information
   * @param updates - LinkedIn-related fields to update
   * @returns Promise with operation result
   */
  const updateLinkedInProfile = async (updates: LinkedInProfileUpdate) => {
    return executeProfileOperation(
      () => profileApi.updateLinkedInProfile(user!.id, updates),
      'LinkedIn profile updated successfully'
    );
  };

  /**
   * Setup LinkedIn profile during onboarding (with scraping)
   * @param data - LinkedIn setup data containing profile URL
   * @returns Promise with operation result
   */
  const setupLinkedInProfile = async (data: { profileUrl: string }) => {
    return executeProfileOperation(
      () => profileApi.setupLinkedInProfile(user!.id, data.profileUrl),
      'LinkedIn profile setup completed'
    );
  };

  /**
   * Save content pillars during onboarding
   * @param data - Content pillars data
   * @returns Promise with operation result
   */
  const saveContentPillars = async (data: ContentPillarsData) => {
    return executeProfileOperation(
      () => profileApi.saveContentPillars(user!.id, data.selectedPillars),
      'Content pillars saved successfully'
    );
  };

  /**
   * Save pacing preferences during onboarding
   * @param data - Pacing preferences data
   * @returns Promise with operation result
   */
  const savePacingPreferences = async (data: PacingData) => {
    return executeProfileOperation(
      () => profileApi.savePacingPreferences(user!.id, data),
      'Pacing preferences saved successfully'
    );
  };

  /**
   * Save contact information during onboarding
   * @param data - Contact data
   * @returns Promise with operation result
   */
  const saveContactInfo = async (data: ContactData) => {
    return executeProfileOperation(
      () => profileApi.saveContactInfo(user!.id, data),
      'Contact information saved successfully'
    );
  };

  /**
   * Complete the onboarding process
   * @returns Promise with operation result
   */
  const completeOnboarding = async () => {
    return executeProfileOperation(
      () => profileApi.completeOnboarding(user!.id),
      'Onboarding completed successfully'
    );
  };

  // ========== CONVENIENCE METHODS ==========

  /**
   * Update multiple profile fields at once
   * @param updates - Any profile fields to update
   * @returns Promise with operation result
   */
  const updateProfile = async (updates: any) => {
    return executeProfileOperation(
      () => profileApi.updateProfile(user!.id, updates),
      'Profile updated successfully'
    );
  };

  /**
   * Clear any profile errors
   */
  const clearError = () => {
    setError(undefined);
  };

  // ========== RETURN STATE & ACTIONS ==========
  
  return {
    // Profile state (from auth context)
    profile,
    loading: false, // Profile loading is handled by auth context
    saving,
    error,

    // Profile actions
    updateBasicProfile,
    updateLinkedInProfile,
    setupLinkedInProfile,
    saveContentPillars,
    savePacingPreferences,
    saveContactInfo,
    completeOnboarding,
    updateProfile,
    refreshProfile,

    // Utility functions
    clearError,
  };
}; 