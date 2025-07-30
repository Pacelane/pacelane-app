// Inspirations Service - Business Logic Layer  
// This is where all inspirations-related operations happen
// Backend developers will mainly work in this file

import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse } from '@/types/api';
import type { 
  Inspiration, 
  AddInspirationData, 
  LinkedInScrapingResult
} from '@/types/inspirations';

export class InspirationsService {
  // ========== INSPIRATIONS CRUD OPERATIONS ==========

  /**
   * Load all inspirations for a specific user
   * @param userId - The user's ID from Supabase Auth
   * @returns Promise with inspirations list or error message
   */
  static async loadUserInspirations(userId: string): Promise<ApiResponse<Inspiration[]>> {
    try {
      console.log('InspirationsService: Loading inspirations for user:', userId);
      
      const { data, error } = await supabase
        .from('inspirations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('InspirationsService: Load inspirations error:', error);
        throw error;
      }
      
      console.log('InspirationsService: Loaded', data?.length || 0, 'inspirations');
      return { data: data || [] };
    } catch (error: any) {
      console.error('InspirationsService: loadUserInspirations failed:', error);
      return { error: error.message || 'Failed to load inspirations' };
    }
  }

  /**
   * Add a new inspiration with LinkedIn scraping
   * @param userId - The user's ID
   * @param data - Inspiration data containing LinkedIn URL
   * @returns Promise with new inspiration data or error message
   */
  static async addInspiration(
    userId: string, 
    data: AddInspirationData
  ): Promise<ApiResponse<Inspiration>> {
    try {
      console.log('InspirationsService: Adding inspiration for user:', userId, data.linkedinUrl);
      
      // Format URL (add https:// if missing)
      const fullUrl = data.linkedinUrl.startsWith('http') 
        ? data.linkedinUrl.trim() 
        : `https://${data.linkedinUrl.trim()}`;

      // First, try to scrape the LinkedIn profile
      let profileData = null;
      let scrapedFields = {};
      
      try {
        console.log('InspirationsService: Attempting LinkedIn scraping');
        const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke(
          'scrape-linkedin-profile',
          { body: { linkedinUrl: fullUrl } }
        );

        if (!scrapeError && scrapeData?.success && scrapeData?.profileData) {
          profileData = scrapeData.profileData;
          scrapedFields = {
            linkedin_data: profileData,
            name: profileData.basic_info?.fullname || null,
            company: profileData.basic_info?.current_company || null,
            headline: profileData.basic_info?.headline || null,
            about: profileData.basic_info?.about || null,
            location: profileData.basic_info?.location || null,
            scraped_at: new Date().toISOString()
          };
          console.log('InspirationsService: LinkedIn scraping successful');
        } else {
          console.warn('InspirationsService: LinkedIn scraping failed, saving URL only');
        }
      } catch (scrapeError) {
        console.warn('InspirationsService: LinkedIn scraping error:', scrapeError);
        // Continue without scraped data - this is not a critical failure
      }

      // Save inspiration to database
      const insertData = {
        user_id: userId,
        linkedin_url: fullUrl,
        ...scrapedFields
      };

      const { data: insertedInspiration, error: insertError } = await supabase
        .from('inspirations')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        console.error('InspirationsService: Insert inspiration error:', insertError);
        throw insertError;
      }

      console.log('InspirationsService: Inspiration added successfully');
      return { data: insertedInspiration };
    } catch (error: any) {
      console.error('InspirationsService: addInspiration failed:', error);
      return { error: error.message || 'Failed to add inspiration' };
    }
  }

  /**
   * Remove an inspiration by ID
   * @param userId - The user's ID (for security)
   * @param inspirationId - The inspiration ID to remove
   * @returns Promise with success or error message
   */
  static async removeInspiration(
    userId: string, 
    inspirationId: string
  ): Promise<ApiResponse<void>> {
    try {
      console.log('InspirationsService: Removing inspiration:', inspirationId, 'for user:', userId);
      
      const { error } = await supabase
        .from('inspirations')
        .delete()
        .eq('id', inspirationId)
        .eq('user_id', userId); // Security: ensure user can only delete their own inspirations
      
      if (error) {
        console.error('InspirationsService: Remove inspiration error:', error);
        throw error;
      }
      
      console.log('InspirationsService: Inspiration removed successfully');
      return { data: undefined };
    } catch (error: any) {
      console.error('InspirationsService: removeInspiration failed:', error);
      return { error: error.message || 'Failed to remove inspiration' };
    }
  }

  // ========== VALIDATION HELPERS ==========

  /**
   * Check if a LinkedIn URL already exists for a user
   * @param userId - The user's ID
   * @param linkedinUrl - The LinkedIn URL to check
   * @returns Promise with boolean result or error
   */
  static async checkUrlExists(
    userId: string, 
    linkedinUrl: string
  ): Promise<ApiResponse<boolean>> {
    try {
      console.log('InspirationsService: Checking if URL exists:', linkedinUrl);
      
      const { data, error } = await supabase
        .from('inspirations')
        .select('id')
        .eq('user_id', userId)
        .eq('linkedin_url', linkedinUrl)
        .limit(1);
      
      if (error) {
        console.error('InspirationsService: Check URL exists error:', error);
        throw error;
      }
      
      const exists = data && data.length > 0;
      console.log('InspirationsService: URL exists check result:', exists);
      return { data: exists };
    } catch (error: any) {
      console.error('InspirationsService: checkUrlExists failed:', error);
      return { error: error.message || 'Failed to check URL' };
    }
  }

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Test LinkedIn scraping function (for debugging)
   * @param linkedinUrl - LinkedIn URL to test scraping
   * @returns Promise with scraping result
   */
  static async testLinkedInScraping(linkedinUrl: string): Promise<ApiResponse<LinkedInScrapingResult>> {
    try {
      console.log('InspirationsService: Testing LinkedIn scraping for:', linkedinUrl);
      
      const { data, error } = await supabase.functions.invoke(
        'scrape-linkedin-profile',
        { body: { linkedinUrl } }
      );
      
      if (error) {
        console.error('InspirationsService: Scraping test error:', error);
        throw error;
      }
      
      console.log('InspirationsService: Scraping test completed');
      return { data };
    } catch (error: any) {
      console.error('InspirationsService: testLinkedInScraping failed:', error);
      return { error: error.message || 'LinkedIn scraping test failed' };
    }
  }
} 