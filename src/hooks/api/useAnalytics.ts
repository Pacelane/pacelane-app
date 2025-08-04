// useAnalytics Hook - Analytics State Management
// This hook provides dashboard analytics, streak data, and user activity stats
// Frontend developers can use this for dashboard and analytics functionality

import { useState, useEffect } from 'react';
import * as analyticsApi from '@/api/analytics';
import { useAuth } from '@/contexts/AuthContext';
import type { ActivityData, UserStreak, DashboardStats, WeekActivity } from '@/api/analytics';

// ========== TYPE DEFINITIONS ==========

export interface AnalyticsState {
  // Dashboard Data
  activityData: ActivityData | null;
  streak: UserStreak | null;
  stats: DashboardStats | null;
  weekActivity: WeekActivity[];
  
  // Loading States
  loading: boolean;
  loadingStreak: boolean;
  loadingStats: boolean;
  
  // Error State
  error: string | undefined;
}

export interface AnalyticsActions {
  // Data Loading Actions
  loadDashboardData: () => Promise<void>;
  loadStreak: () => Promise<void>;
  loadStats: () => Promise<void>;
  
  // Activity Tracking Actions
  trackActivity: (activityType: 'content_creation' | 'chat_message' | 'file_upload' | 'profile_update') => Promise<void>;
  
  // Utility Actions
  refreshData: () => Promise<void>;
  clearError: () => void;
}

/**
 * Custom React hook for analytics operations
 * Provides analytics state management and actions
 * @returns Analytics state and action functions
 */
export const useAnalytics = (): AnalyticsState & AnalyticsActions => {
  // ========== STATE MANAGEMENT ==========
  
  const { user } = useAuth();
  
  // Analytics Data State
  const [activityData, setActivityData] = useState<ActivityData | null>(null);
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [weekActivity, setWeekActivity] = useState<WeekActivity[]>([]);
  
  // Loading States
  const [loading, setLoading] = useState(false);
  const [loadingStreak, setLoadingStreak] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Error State
  const [error, setError] = useState<string | undefined>();

  // ========== HELPER FUNCTIONS ==========

  /**
   * Execute an analytics operation with loading state management
   * @param operation - The analytics operation to execute
   * @param loadingState - Which loading state to manage
   * @param successMessage - Optional success message for logging
   * @returns Promise with operation result
   */
  const executeAnalyticsOperation = async (
    operation: () => Promise<any>,
    loadingState: 'loading' | 'loadingStreak' | 'loadingStats',
    successMessage?: string
  ) => {
    if (!user) {
      const errorMsg = 'User must be logged in to perform this operation';
      setError(errorMsg);
      return { error: errorMsg };
    }

    // Set loading state
    switch (loadingState) {
      case 'loading': setLoading(true); break;
      case 'loadingStreak': setLoadingStreak(true); break;
      case 'loadingStats': setLoadingStats(true); break;
    }
    
    setError(undefined);

    try {
      const result = await operation();
      
      if (result.error) {
        console.error('Analytics operation error:', result.error);
        setError(result.error.message);
        return result;
      }

      if (successMessage) {
        console.log(successMessage, result.data);
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analytics operation failed';
      console.error('Analytics operation error:', errorMessage);
      setError(errorMessage);
      return { error: errorMessage };

    } finally {
      // Clear loading state
      switch (loadingState) {
        case 'loading': setLoading(false); break;
        case 'loadingStreak': setLoadingStreak(false); break;
        case 'loadingStats': setLoadingStats(false); break;
      }
    }
  };

  // ========== DATA LOADING ACTIONS ==========

  /**
   * Load complete dashboard data
   */
  const loadDashboardData = async () => {
    const result = await executeAnalyticsOperation(
      () => analyticsApi.fetchDashboardData(user!.id),
      'loading',
      'useAnalytics: Dashboard data loaded successfully'
    );

    if (result.data) {
      setActivityData(result.data);
      setStreak(result.data.streak);
      setStats(result.data.stats);
      setWeekActivity(result.data.weekActivity);
    }
  };

  /**
   * Load user streak data only
   */
  const loadStreak = async () => {
    const result = await executeAnalyticsOperation(
      () => analyticsApi.fetchUserStreak(user!.id),
      'loadingStreak',
      'useAnalytics: Streak data loaded successfully'
    );

    if (result.data) {
      setStreak(result.data);
    }
  };

  /**
   * Load dashboard stats only
   */
  const loadStats = async () => {
    const result = await executeAnalyticsOperation(
      () => analyticsApi.fetchDashboardStats(user!.id),
      'loadingStats',
      'useAnalytics: Dashboard stats loaded successfully'
    );

    if (result.data) {
      setStats(result.data);
    }
  };

  // ========== ACTIVITY TRACKING ACTIONS ==========

  /**
   * Track user activity
   * @param activityType - Type of activity to track
   */
  const trackActivity = async (activityType: 'content_creation' | 'chat_message' | 'file_upload' | 'profile_update') => {
    await executeAnalyticsOperation(
      () => analyticsApi.trackActivity(user!.id, activityType),
      'loading',
      `useAnalytics: Activity tracked successfully: ${activityType}`
    );
  };

  // ========== UTILITY ACTIONS ==========

  /**
   * Refresh all analytics data
   */
  const refreshData = async () => {
    await loadDashboardData();
  };

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(undefined);
  };

  // ========== AUTO-LOADING ==========

  /**
   * Auto-load dashboard data when user logs in
   */
  useEffect(() => {
    if (user && !activityData) {
      loadDashboardData();
    }
  }, [user]);

  // ========== RETURN HOOK INTERFACE ==========

  return {
    // Analytics Data State
    activityData,
    streak,
    stats,
    weekActivity,
    
    // Loading States
    loading,
    loadingStreak,
    loadingStats,
    
    // Error State
    error,

    // Data Loading Actions
    loadDashboardData,
    loadStreak,
    loadStats,
    
    // Activity Tracking Actions
    trackActivity,
    
    // Utility Actions
    refreshData,
    clearError
  };
}; 