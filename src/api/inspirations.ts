// Inspirations API Layer - Frontend Interface
// This layer adds frontend-specific logic and validation

import { InspirationsService } from '@/services/inspirationsService';
import { addInspirationSchema, validateData } from '@/api/schemas';
import type { AddInspirationData } from '@/types/inspirations';

/**
 * Frontend API for inspirations operations
 * This layer adds frontend-specific logic and validation
 */
export const inspirationsApi = {
  // ========== INSPIRATIONS OPERATIONS ==========

  /**
   * Load all inspirations for the current user
   * @param userId - User ID from auth
   * @returns Promise with inspirations list
   */
  async loadInspirations(userId: string) {
    return InspirationsService.loadUserInspirations(userId);
  },

  /**
   * Add a new inspiration with LinkedIn URL
   * Includes validation and duplicate checking
   * @param userId - User ID from auth
   * @param linkedinUrl - LinkedIn profile URL
   * @returns Promise with new inspiration data
   */
  async addInspiration(userId: string, linkedinUrl: string) {
    // Normalize URL format
    const fullUrl = this.formatLinkedInUrl(linkedinUrl);

    // Validate input data
    const validation = validateData(addInspirationSchema, { linkedinUrl: fullUrl });
    if (!validation.success) {
      return { error: Object.values(validation.errors!)[0] };
    }

    // Check if URL already exists (prevent duplicates)
    const existsResult = await InspirationsService.checkUrlExists(userId, fullUrl);
    if (existsResult.error) {
      return existsResult;
    }
    
    if (existsResult.data) {
      return { error: 'This LinkedIn profile is already in your inspirations' };
    }

    return InspirationsService.addInspiration(userId, { linkedinUrl: fullUrl });
  },

  /**
   * Remove an inspiration
   * @param userId - User ID from auth  
   * @param inspirationId - Inspiration ID to remove
   * @returns Promise with removal result
   */
  async removeInspiration(userId: string, inspirationId: string) {
    // Frontend validation
    if (!inspirationId.trim()) {
      return { error: 'Inspiration ID is required' };
    }

    return InspirationsService.removeInspiration(userId, inspirationId);
  },

  // ========== VALIDATION HELPERS ==========

  /**
   * Check if a LinkedIn URL already exists (frontend helper)
   * @param userId - User ID from auth
   * @param linkedinUrl - LinkedIn URL to check
   * @returns Promise with boolean result
   */
  async checkUrlExists(userId: string, linkedinUrl: string) {
    return InspirationsService.checkUrlExists(userId, linkedinUrl);
  },

  /**
   * Validate LinkedIn URL format (frontend helper)
   * @param url - URL to validate
   * @returns Object with validation result
   */
  validateLinkedInUrl(url: string): { valid: boolean; error?: string } {
    if (!url.trim()) {
      return { valid: false, error: 'LinkedIn URL is required' };
    }

    // Check if it looks like a LinkedIn profile URL
    const urlPattern = /linkedin\.com\/in\//i;
    if (!urlPattern.test(url)) {
      return { 
        valid: false, 
        error: 'Please enter a valid LinkedIn profile URL (e.g., linkedin.com/in/username)' 
      };
    }

    // Check for common URL issues
    if (url.includes('linkedin.com/company/')) {
      return { 
        valid: false, 
        error: 'Please use a personal LinkedIn profile URL, not a company page' 
      };
    }

    return { valid: true };
  },

  /**
   * Format LinkedIn URL consistently
   * @param url - Raw URL input
   * @returns Formatted URL
   */
  formatLinkedInUrl(url: string): string {
    const trimmed = url.trim();
    return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  },

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Test LinkedIn scraping (for debugging)
   * @param linkedinUrl - LinkedIn URL to test
   * @returns Promise with scraping test result
   */
  async testScraping(linkedinUrl: string) {
    if (!linkedinUrl.trim()) {
      return { error: 'LinkedIn URL is required for testing' };
    }

    const formattedUrl = this.formatLinkedInUrl(linkedinUrl);
    return InspirationsService.testLinkedInScraping(formattedUrl);
  }
};

// Export individual functions for convenience
export const {
  loadInspirations,
  addInspiration,
  removeInspiration,
  checkUrlExists,
  validateLinkedInUrl,
  formatLinkedInUrl,
  testScraping
} = inspirationsApi; 