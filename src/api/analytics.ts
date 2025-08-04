// Analytics API - Fetches dashboard statistics and user activity data
// This handles streak data, stats summaries, and activity tracking

import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// ========== TYPE DEFINITIONS ==========

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  active_days_this_month: number;
  total_activities: number;
}

export interface DashboardStats {
  projects: number;
  knowledge_files: number;
  ideas: number;
  templates: number;
}

export interface WeekActivity {
  letter: string;
  active: boolean;
  date: string;
}

export interface ActivityData {
  streak: UserStreak;
  stats: DashboardStats;
  weekActivity: WeekActivity[];
}

// ========== API FUNCTIONS ==========

/**
 * Get user streak data
 * @param userId - User ID
 * @returns Promise with streak information
 */
export const fetchUserStreak = async (userId: string) => {
  console.log('AnalyticsAPI: Fetching user streak for user:', userId);

  try {
    const { data, error } = await supabase
      .rpc('get_user_streak', { p_user_id: userId });

    if (error) {
      console.error('AnalyticsAPI: Streak fetch error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message,
          details: error.details || '',
          hint: error.hint || '',
          code: error.code || ''
        }
      };
    }

    console.log('AnalyticsAPI: Streak fetched successfully:', data);
    return { data: data[0] || { current_streak: 0, longest_streak: 0, active_days_this_month: 0, total_activities: 0 }, error: null };

  } catch (err) {
    console.error('AnalyticsAPI: Unexpected error in fetchUserStreak:', err);
    return { 
      data: null, 
      error: { 
        message: err instanceof Error ? err.message : 'Failed to fetch user streak',
        details: err instanceof Error ? err.stack || '' : '',
        hint: '',
        code: ''
      }
    };
  }
};

/**
 * Get dashboard statistics
 * @param userId - User ID
 * @returns Promise with dashboard stats
 */
export const fetchDashboardStats = async (userId: string) => {
  console.log('AnalyticsAPI: Fetching dashboard stats for user:', userId);

  try {
    // Fetch multiple counts in parallel
    const [draftsResult, knowledgeResult, suggestionsResult, templatesResult] = await Promise.allSettled([
      supabase
        .from('saved_drafts')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
      
      supabase
        .from('knowledge_files')
        .select('id', { count: 'exact' })
        .eq('user_id', userId),
      
      supabase
        .from('content_suggestions')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_active', true),
      
      supabase
        .from('templates')
        .select('id', { count: 'exact' })
        .or(`user_id.eq.${userId},is_system.eq.true`)
        .eq('is_active', true)
    ]);

    const stats: DashboardStats = {
      projects: draftsResult.status === 'fulfilled' ? (draftsResult.value.count || 0) : 0,
      knowledge_files: knowledgeResult.status === 'fulfilled' ? (knowledgeResult.value.count || 0) : 0,
      ideas: suggestionsResult.status === 'fulfilled' ? (suggestionsResult.value.count || 0) : 0,
      templates: templatesResult.status === 'fulfilled' ? (templatesResult.value.count || 0) : 0,
    };

    console.log('AnalyticsAPI: Dashboard stats fetched successfully:', stats);
    return { data: stats, error: null };

  } catch (err) {
    console.error('AnalyticsAPI: Unexpected error in fetchDashboardStats:', err);
    return { 
      data: null, 
      error: { 
        message: err instanceof Error ? err.message : 'Failed to fetch dashboard stats',
        details: err instanceof Error ? err.stack || '' : '',
        hint: '',
        code: ''
      }
    };
  }
};

/**
 * Get week activity data
 * @param userId - User ID
 * @returns Promise with week activity
 */
export const fetchWeekActivity = async (userId: string) => {
  console.log('AnalyticsAPI: Fetching week activity for user:', userId);

  try {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay; // Get to Monday
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    // Generate the week dates (Monday to Sunday)
    const weekDates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    });

    // Fetch activity for this week
    const { data: activities, error } = await supabase
      .from('user_activity')
      .select('activity_date')
      .eq('user_id', userId)
      .in('activity_date', weekDates);

    if (error) {
      console.error('AnalyticsAPI: Week activity fetch error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message,
          details: error.details || '',
          hint: error.hint || '',
          code: error.code || ''
        }
      };
    }

    const activeDate = new Set(activities?.map(a => a.activity_date) || []);
    const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    
    const weekActivity: WeekActivity[] = weekDates.map((date, index) => ({
      letter: weekdays[index],
      active: activeDate.has(date),
      date: date
    }));

    console.log('AnalyticsAPI: Week activity fetched successfully:', weekActivity);
    return { data: weekActivity, error: null };

  } catch (err) {
    console.error('AnalyticsAPI: Unexpected error in fetchWeekActivity:', err);
    return { 
      data: null, 
      error: { 
        message: err instanceof Error ? err.message : 'Failed to fetch week activity',
        details: err instanceof Error ? err.stack || '' : '',
        hint: '',
        code: ''
      }
    };
  }
};

/**
 * Track user activity
 * @param userId - User ID
 * @param activityType - Type of activity
 * @returns Promise with success status
 */
export const trackActivity = async (userId: string, activityType: 'content_creation' | 'chat_message' | 'file_upload' | 'profile_update') => {
  console.log('AnalyticsAPI: Tracking activity:', { userId, activityType });

  try {
    const { data, error } = await supabase
      .rpc('track_user_activity', { 
        p_user_id: userId, 
        p_activity_type: activityType 
      });

    if (error) {
      console.error('AnalyticsAPI: Activity tracking error:', error);
      return { 
        data: null, 
        error: { 
          message: error.message,
          details: error.details || '',
          hint: error.hint || '',
          code: error.code || ''
        }
      };
    }

    console.log('AnalyticsAPI: Activity tracked successfully');
    return { data: true, error: null };

  } catch (err) {
    console.error('AnalyticsAPI: Unexpected error in trackActivity:', err);
    return { 
      data: null, 
      error: { 
        message: err instanceof Error ? err.message : 'Failed to track activity',
        details: err instanceof Error ? err.stack || '' : '',
        hint: '',
        code: ''
      }
    };
  }
};

/**
 * Get all dashboard data at once
 * @param userId - User ID
 * @returns Promise with complete activity data
 */
export const fetchDashboardData = async (userId: string) => {
  console.log('AnalyticsAPI: Fetching complete dashboard data for user:', userId);

  try {
    const [streakResult, statsResult, weekResult] = await Promise.allSettled([
      fetchUserStreak(userId),
      fetchDashboardStats(userId),
      fetchWeekActivity(userId)
    ]);

    const data: Partial<ActivityData> = {};
    const errors: string[] = [];

    if (streakResult.status === 'fulfilled' && streakResult.value.data) {
      data.streak = streakResult.value.data;
    } else {
      errors.push('Failed to fetch streak data');
      data.streak = { current_streak: 0, longest_streak: 0, active_days_this_month: 0, total_activities: 0 };
    }

    if (statsResult.status === 'fulfilled' && statsResult.value.data) {
      data.stats = statsResult.value.data;
    } else {
      errors.push('Failed to fetch stats data');
      data.stats = { projects: 0, knowledge_files: 0, ideas: 0, templates: 5 }; // 5 default system templates
    }

    if (weekResult.status === 'fulfilled' && weekResult.value.data) {
      data.weekActivity = weekResult.value.data;
    } else {
      errors.push('Failed to fetch week activity');
      // Default week activity (all inactive)
      data.weekActivity = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(letter => ({
        letter,
        active: false,
        date: ''
      }));
    }

    const hasErrors = errors.length > 0;
    console.log(`AnalyticsAPI: Dashboard data fetched ${hasErrors ? 'with errors' : 'successfully'}:`, { data, errors });

    return { 
      data: data as ActivityData, 
      error: hasErrors ? { 
        message: errors.join(', '),
        details: '',
        hint: 'Some dashboard features may be limited',
        code: ''
      } : null 
    };

  } catch (err) {
    console.error('AnalyticsAPI: Unexpected error in fetchDashboardData:', err);
    return { 
      data: null, 
      error: { 
        message: err instanceof Error ? err.message : 'Failed to fetch dashboard data',
        details: err instanceof Error ? err.stack || '' : '',
        hint: '',
        code: ''
      }
    };
  }
}; 