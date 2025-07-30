// useInspirations Hook - Inspirations State Management
// This hook provides inspirations-specific state and operations
// Frontend developers can use this for inspirations-related functionality

import { useState, useEffect } from 'react';
import { inspirationsApi } from '@/api/inspirations';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  InspirationsState,
  InspirationsActions,
  Inspiration
} from '@/types/inspirations';

/**
 * Custom React hook for inspirations operations
 * Provides inspirations state management and actions
 * @returns Inspirations state and action functions
 */
export const useInspirations = (): InspirationsState & InspirationsActions => {
  // ========== STATE MANAGEMENT ==========
  
  const { user } = useAuth();
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | undefined>();

  // ========== HELPER FUNCTIONS ==========

  /**
   * Execute an inspiration operation with loading state management
   * @param operation - The inspiration operation to execute
   * @param loadingState - Which loading state to manage ('loading' or 'adding')
   * @param successMessage - Optional success message for logging
   * @returns Promise with operation result
   */
  const executeInspirationOperation = async (
    operation: () => Promise<any>,
    loadingState: 'loading' | 'adding' = 'loading',
    successMessage?: string
  ) => {
    if (!user) {
      const errorMsg = 'User must be logged in to perform this operation';
      setError(errorMsg);
      return { error: errorMsg };
    }

    // Set appropriate loading state
    if (loadingState === 'loading') {
      setLoading(true);
    } else {
      setAdding(true);
    }
    setError(undefined);

    try {
      const result = await operation();
      
      if (result.error) {
        console.error('Inspiration operation error:', result.error);
        setError(result.error);
        return result;
      }

      if (successMessage) {
        console.log('useInspirations:', successMessage);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Inspiration operation failed';
      console.error('useInspirations: Operation failed:', error);
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      if (loadingState === 'loading') {
        setLoading(false);
      } else {
        setAdding(false);
      }
    }
  };

  // ========== INSPIRATIONS ACTIONS ==========

  /**
   * Load all inspirations for the current user
   * @returns Promise with operation result
   */
  const loadInspirations = async () => {
    return executeInspirationOperation(
      async () => {
        const result = await inspirationsApi.loadInspirations(user!.id);
        
        if (result.data) {
          setInspirations(result.data);
        }
        
        return result;
      },
      'loading',
      'Inspirations loaded successfully'
    );
  };

  /**
   * Add a new inspiration with LinkedIn URL
   * @param linkedinUrl - LinkedIn profile URL
   * @returns Promise with operation result
   */
  const addInspiration = async (linkedinUrl: string) => {
    return executeInspirationOperation(
      async () => {
        const result = await inspirationsApi.addInspiration(user!.id, linkedinUrl);
        
        if (result.data) {
          // Add the new inspiration to the front of the list
          setInspirations(prev => [result.data!, ...prev]);
        }
        
        return result;
      },
      'adding',
      'Inspiration added successfully'
    );
  };

  /**
   * Remove an inspiration by ID
   * @param inspirationId - Inspiration ID to remove
   * @returns Promise with operation result
   */
  const removeInspiration = async (inspirationId: string) => {
    return executeInspirationOperation(
      async () => {
        const result = await inspirationsApi.removeInspiration(user!.id, inspirationId);
        
        if (!result.error) {
          // Remove the inspiration from the local state
          setInspirations(prev => prev.filter(inspiration => inspiration.id !== inspirationId));
        }
        
        return result;
      },
      'loading',
      'Inspiration removed successfully'
    );
  };

  // ========== CONVENIENCE METHODS ==========

  /**
   * Check if a LinkedIn URL already exists
   * @param linkedinUrl - LinkedIn URL to check
   * @returns Promise with boolean result
   */
  const checkUrlExists = async (linkedinUrl: string) => {
    if (!user) return { error: 'User not logged in' };
    
    return inspirationsApi.checkUrlExists(user.id, linkedinUrl);
  };

  /**
   * Validate LinkedIn URL format
   * @param url - URL to validate
   * @returns Validation result object
   */
  const validateLinkedInUrl = (url: string) => {
    return inspirationsApi.validateLinkedInUrl(url);
  };

  /**
   * Clear any inspiration errors
   */
  const clearError = () => {
    setError(undefined);
  };

  /**
   * Get inspiration by ID
   * @param inspirationId - Inspiration ID to find
   * @returns Inspiration object or undefined
   */
  const getInspirationById = (inspirationId: string): Inspiration | undefined => {
    return inspirations.find(inspiration => inspiration.id === inspirationId);
  };

  /**
   * Check if a URL is already in the current inspirations list (client-side check)
   * @param url - URL to check
   * @returns Boolean indicating if URL exists
   */
  const isUrlInList = (url: string): boolean => {
    const formattedUrl = inspirationsApi.formatLinkedInUrl(url);
    return inspirations.some(inspiration => inspiration.linkedin_url === formattedUrl);
  };

  // ========== SIDE EFFECTS ==========

  // Load inspirations when user changes or component mounts
  useEffect(() => {
    if (user) {
      loadInspirations();
    } else {
      // Clear inspirations when user logs out
      setInspirations([]);
      setError(undefined);
    }
  }, [user]);

  // ========== RETURN STATE & ACTIONS ==========
  
  return {
    // State
    inspirations,
    loading,
    adding,
    error,

    // Actions
    loadInspirations,
    addInspiration,
    removeInspiration,

    // Utility functions
    checkUrlExists,
    validateLinkedInUrl,
    clearError,
    getInspirationById,
    isUrlInList,
  };
}; 