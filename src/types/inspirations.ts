// Inspirations Type Definitions
// This file defines all inspirations-related data structures and operations

// Inspiration represents a LinkedIn profile that inspires the user
export interface Inspiration {
  id: string;
  user_id: string;
  linkedin_url: string;
  name?: string;                    // Extracted from LinkedIn scraping
  company?: string;                 // Extracted from LinkedIn scraping
  headline?: string;                // Extracted from LinkedIn scraping
  about?: string;                   // Extracted from LinkedIn scraping (from schema)
  location?: string;                // Extracted from LinkedIn scraping (from schema)
  linkedin_data?: any;              // Raw LinkedIn scraping data (JSON)
  scraped_at?: string;              // When the LinkedIn data was scraped
  created_at?: string;              // When inspiration was added
  updated_at?: string;              // When inspiration was last updated
}

// Data needed to add a new inspiration
export interface AddInspirationData {
  linkedinUrl: string;
}

// Data returned from LinkedIn scraping
export interface LinkedInScrapingResult {
  success: boolean;
  profileData?: {
    basic_info?: {
      fullname?: string;
      current_company?: string;
      headline?: string;
      about?: string;
      location?: string;
    };
    // Add other scraping fields as needed
  };
}

// Inspirations state for components
export interface InspirationsState {
  inspirations: Inspiration[];
  loading: boolean;
  adding: boolean;
  error?: string;
}

// Actions available for inspirations management
export interface InspirationsActions {
  loadInspirations: () => Promise<any>;
  addInspiration: (data: AddInspirationData) => Promise<any>;
  removeInspiration: (inspirationId: string) => Promise<any>;
  clearError: () => void;
}

// Form data for adding inspirations
export interface InspirationFormData {
  linkedinUrl: string;
}

// Response from inspiration operations
export interface InspirationOperationResult {
  data?: Inspiration;
  error?: string;
} 