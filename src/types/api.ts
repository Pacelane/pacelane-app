// API Response Types
// This file defines how our API responses will be structured
// Every API call will return data in a consistent format

// Generic API Response - T is a placeholder for any type of data
export interface ApiResponse<T> {
  data?: T;                           // The actual data (if successful)
  error?: string;                     // Error message (if something went wrong)
}

// This approach means:
// - If successful: { data: yourData, error: undefined }
// - If failed: { data: undefined, error: "error message" }

// Example usage:
// ApiResponse<Profile> = { data: Profile object, error?: string }
// ApiResponse<User> = { data: User object, error?: string }
// ApiResponse<void> = { data: undefined, error?: string } (for actions like logout)

// Success helper type for when we know the call succeeded
export interface ApiSuccess<T> {
  data: T;
  error?: never;                      // TypeScript knows error won't exist
}

// Error helper type for when we know the call failed  
export interface ApiError {
  data?: never;                       // TypeScript knows data won't exist
  error: string;
}

// Status types for loading states
export interface LoadingState {
  loading: boolean;
  error?: string;
} 