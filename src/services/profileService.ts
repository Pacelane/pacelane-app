// Profile Service - Business Logic Layer
// This is where all profile-related operations happen
// Backend developers will mainly work in this file

import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse } from '@/types/api';
import type { 
  Profile, 
  ProfileUpdate,
  BasicProfileUpdate,
  LinkedInProfileUpdate,
  LinkedInSetupData,
  ContentPillarsData,
  PacingData,
  ContactData,
  OnboardingUpdate
} from '@/types/profile';

export class ProfileService {
  // ========== BASIC PROFILE OPERATIONS ==========

  /**
   * Fetch a user's complete profile from the database
   * @param userId - The user's ID from Supabase Auth
   * @returns Promise with either profile data or error message
   */
  static async fetchProfile(userId: string): Promise<ApiResponse<Profile>> {
    try {
      console.log('ProfileService: Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('ProfileService: Profile fetch error:', error);
        throw error;
      }
      
      console.log('ProfileService: Profile fetched successfully');
      return { data };
    } catch (error: any) {
      console.error('ProfileService: fetchProfile failed:', error);
      return { error: error.message || 'Failed to fetch profile' };
    }
  }

  /**
   * Update basic profile information (name, bio, address, etc.)
   * @param userId - The user's ID
   * @param updates - Basic profile fields to update
   * @returns Promise with updated profile data or error message
   */
  static async updateBasicProfile(
    userId: string, 
    updates: BasicProfileUpdate
  ): Promise<ApiResponse<Profile>> {
    try {
      console.log('ProfileService: Updating basic profile for user:', userId, updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('ProfileService: Basic profile update error:', error);
        throw error;
      }
      
      console.log('ProfileService: Basic profile updated successfully');
      return { data };
    } catch (error: any) {
      console.error('ProfileService: updateBasicProfile failed:', error);
      return { error: error.message || 'Failed to update basic profile' };
    }
  }

  // ========== LINKEDIN OPERATIONS ==========

  /**
   * Setup LinkedIn profile with URL and scraped data
   * @param userId - The user's ID
   * @param setupData - LinkedIn URL and optional scraped data
   * @returns Promise with updated profile or error message
   */
  static async setupLinkedInProfile(
    userId: string,
    setupData: LinkedInSetupData
  ): Promise<ApiResponse<Profile>> {
    try {
      console.log('ProfileService: Setting up LinkedIn profile for user:', userId);
      
      // First, try to scrape the LinkedIn profile
      let profileData = null;
      let scrapedFields = {};
      
      if (setupData.profileUrl) {
        try {
          const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke(
            'scrape-linkedin-profile',
            { body: { linkedinUrl: setupData.profileUrl } }
          );

          if (!scrapeError && scrapeData?.success && scrapeData?.profileData) {
            profileData = scrapeData.profileData;
            scrapedFields = {
              linkedin_data: profileData,
              linkedin_name: profileData.fullName || null,
              linkedin_company: profileData.company || null,
              linkedin_about: profileData.about || null,
              linkedin_location: profileData.location || null,
              linkedin_headline: profileData.headline || null,
              linkedin_scraped_at: new Date().toISOString()
            };
            console.log('ProfileService: LinkedIn profile scraped successfully');
          } else {
            console.warn('ProfileService: LinkedIn scraping failed, saving URL only');
          }
        } catch (scrapeError) {
          console.warn('ProfileService: LinkedIn scraping error:', scrapeError);
        }
      }

      // Update profile with LinkedIn data
      const updateData = {
        linkedin_profile: setupData.profileUrl.trim(),
        ...scrapedFields
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('ProfileService: LinkedIn profile update error:', error);
        throw error;
      }

      console.log('ProfileService: LinkedIn profile setup completed');
      return { data };
    } catch (error: any) {
      console.error('ProfileService: setupLinkedInProfile failed:', error);
      return { error: error.message || 'Failed to setup LinkedIn profile' };
    }
  }

  /**
   * Update LinkedIn profile information
   * @param userId - The user's ID
   * @param updates - LinkedIn-related fields to update
   * @returns Promise with updated profile or error message
   */
  static async updateLinkedInProfile(
    userId: string,
    updates: LinkedInProfileUpdate
  ): Promise<ApiResponse<Profile>> {
    try {
      console.log('ProfileService: Updating LinkedIn profile for user:', userId, updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('ProfileService: LinkedIn profile update error:', error);
        throw error;
      }
      
      console.log('ProfileService: LinkedIn profile updated successfully');
      return { data };
    } catch (error: any) {
      console.error('ProfileService: updateLinkedInProfile failed:', error);
      return { error: error.message || 'Failed to update LinkedIn profile' };
    }
  }

  // ========== ONBOARDING OPERATIONS ==========

  /**
   * Save content pillars during onboarding
   * @param userId - The user's ID
   * @param data - Content pillars data
   * @returns Promise with updated profile or error message
   */
  static async saveContentPillars(
    userId: string,
    data: ContentPillarsData
  ): Promise<ApiResponse<Profile>> {
    try {
      console.log('ProfileService: Saving content pillars for user:', userId, data);
      
      // Get existing profile to preserve other linkedin_data
      const { data: existingProfile } = await this.fetchProfile(userId);
      const existingLinkedinData = existingProfile?.linkedin_data || {};

      const updateData = {
        linkedin_data: {
          ...existingLinkedinData,
          content_pillars: data.selectedPillars
        }
      };

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('ProfileService: Content pillars save error:', error);
        throw error;
      }
      
      console.log('ProfileService: Content pillars saved successfully');
      return { data: updatedProfile };
    } catch (error: any) {
      console.error('ProfileService: saveContentPillars failed:', error);
      return { error: error.message || 'Failed to save content pillars' };
    }
  }

  /**
   * Save pacing preferences during onboarding
   * @param userId - The user's ID
   * @param data - Pacing preferences data
   * @returns Promise with updated profile or error message
   */
  static async savePacingPreferences(
    userId: string,
    data: PacingData
  ): Promise<ApiResponse<Profile>> {
    try {
      console.log('ProfileService: Saving pacing preferences for user:', userId, data);
      
      const pacingData = {
        intensity: data.intensity,
        frequency: data.frequency,
        daily_summary_time: data.daily_summary_time,
        followups_frequency: data.followups_frequency,
        recommendations_time: data.recommendations_time,
        context_sessions_time: data.context_sessions_time
      };

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({ pacing_preferences: pacingData })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('ProfileService: Pacing preferences save error:', error);
        throw error;
      }
      
      console.log('ProfileService: Pacing preferences saved successfully');
      return { data: updatedProfile };
    } catch (error: any) {
      console.error('ProfileService: savePacingPreferences failed:', error);
      return { error: error.message || 'Failed to save pacing preferences' };
    }
  }

  /**
   * Save contact information during onboarding
   * @param userId - The user's ID
   * @param data - Contact data
   * @returns Promise with updated profile or error message
   */
  static async saveContactInfo(
    userId: string,
    data: ContactData
  ): Promise<ApiResponse<Profile>> {
    try {
      console.log('ProfileService: Saving contact info for user:', userId);
      
      const fullPhoneNumber = `${data.countryCode}${data.phoneNumber}`;

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({ phone_number: fullPhoneNumber })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('ProfileService: Contact info save error:', error);
        throw error;
      }
      
      console.log('ProfileService: Contact info saved successfully');
      return { data: updatedProfile };
    } catch (error: any) {
      console.error('ProfileService: saveContactInfo failed:', error);
      return { error: error.message || 'Failed to save contact info' };
    }
  }

  /**
   * Complete the onboarding process
   * @param userId - The user's ID
   * @returns Promise with updated profile or error message
   */
  static async completeOnboarding(userId: string): Promise<ApiResponse<Profile>> {
    try {
      console.log('ProfileService: Completing onboarding for user:', userId);
      
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('ProfileService: Onboarding completion error:', error);
        throw error;
      }
      
      console.log('ProfileService: Onboarding completed successfully');
      return { data: updatedProfile };
    } catch (error: any) {
      console.error('ProfileService: completeOnboarding failed:', error);
      return { error: error.message || 'Failed to complete onboarding' };
    }
  }

  // ========== GENERIC UPDATE OPERATION ==========

  /**
   * Generic profile update method for any profile fields
   * @param userId - The user's ID
   * @param updates - Any profile fields to update
   * @returns Promise with updated profile or error message
   */
  static async updateProfile(
    userId: string, 
    updates: Partial<Profile>
  ): Promise<ApiResponse<Profile>> {
    try {
      console.log('ProfileService: Updating profile for user:', userId, updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('ProfileService: Profile update error:', error);
        throw error;
      }
      
      console.log('ProfileService: Profile updated successfully');
      return { data };
    } catch (error: any) {
      console.error('ProfileService: updateProfile failed:', error);
      return { error: error.message || 'Failed to update profile' };
    }
  }
} 