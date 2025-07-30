// AUTH CONTEXT - SIMPLIFIED VERSION
// This file now just wraps our custom useAuth hook
// All the complex logic has been moved to src/hooks/api/useAuth.ts

import React, { createContext, useContext } from 'react';
import { useAuth as useAuthHook } from '@/hooks/api/useAuth';
import type { AuthState, AuthActions } from '@/types/auth';

// Context type = our auth state + actions
type AuthContextType = AuthState & AuthActions;

// Create context with default values
const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Hook to access auth context
 * Components use this to get auth state and functions
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Auth Provider Component
 * Wraps the app and provides auth context to all child components
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get all auth state and functions from our custom hook
  const auth = useAuthHook();
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};