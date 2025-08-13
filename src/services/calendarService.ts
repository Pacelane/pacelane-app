import { supabase } from '../integrations/supabase/client';

export interface CalendarConnection {
  id: string;
  calendar_id: string;
  calendar_name: string;
  is_primary: boolean;
  last_sync: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  calendar_id: string;
  event_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  attendees: any[];
  meeting_notes?: string;
  location?: string;
  is_all_day: boolean;
  created_at: string;
}

export interface CalendarSyncResult {
  success: boolean;
  message: string;
  totalEvents: number;
  calendarsCount: number;
}

export interface CalendarEventsResult {
  success: boolean;
  events: CalendarEvent[];
  count: number;
}

export class CalendarService {
  // Get current authenticated user id
  private static async getCurrentUserId(): Promise<string | null> {
    try {
      const { data } = await supabase.auth.getUser();
      return data?.user?.id ?? null;
    } catch (e) {
      return null;
    }
  }
  // Get OAuth URL for Google Calendar connection
  static async getAuthUrl(): Promise<{ success: boolean; authUrl?: string; error?: string }> {
    try {
      console.log('CalendarService: Calling google-calendar-sync with action: auth-url');
      
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'auth-url' }
      });

      console.log('CalendarService: Edge function response:', { data, error });

      if (error) {
        console.error('CalendarService: getAuthUrl error:', error);
        throw error;
      }

      if (!data || !data.authUrl) {
        throw new Error('No auth URL returned from Edge Function');
      }

      return { success: true, authUrl: data.authUrl };
    } catch (error: any) {
      console.error('CalendarService: getAuthUrl failed:', error);
      return { success: false, error: error.message || 'Failed to get auth URL' };
    }
  }

  // Handle OAuth callback (this would typically be called from a callback page)
  static async handleCallback(code: string, state: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { 
          action: 'callback',
          code,
          state
        }
      });

      if (error) {
        console.error('CalendarService: handleCallback error:', error);
        throw error;
      }

      return { success: true, message: data.message };
    } catch (error: any) {
      console.error('CalendarService: handleCallback failed:', error);
      return { success: false, error: error.message || 'Failed to handle callback' };
    }
  }

  // Sync calendar events
  static async syncCalendar(): Promise<CalendarSyncResult> {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body: { action: 'sync' }
      });

      if (error) {
        console.error('CalendarService: syncCalendar error:', error);
        throw error;
      }

      return {
        success: true,
        message: data.message,
        totalEvents: data.totalEvents,
        calendarsCount: data.calendarsCount
      };
    } catch (error: any) {
      console.error('CalendarService: syncCalendar failed:', error);
      return {
        success: false,
        message: error.message || 'Failed to sync calendar',
        totalEvents: 0,
        calendarsCount: 0
      };
    }
  }

  // Get calendar events
  static async getEvents(options?: {
    start?: string;
    end?: string;
    limit?: number;
  }): Promise<CalendarEventsResult> {
    try {
      const body: any = { action: 'events' };
      if (options?.start) body.start = options.start;
      if (options?.end) body.end = options.end;
      if (options?.limit) body.limit = options.limit;

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body
      });

      if (error) {
        console.error('CalendarService: getEvents error:', error);
        throw error;
      }

      return {
        success: true,
        events: data.events || [],
        count: data.count || 0
      };
    } catch (error: any) {
      console.error('CalendarService: getEvents failed:', error);
      return {
        success: false,
        events: [],
        count: 0
      };
    }
  }

  // Get user's connected calendars
  static async getConnectedCalendars(): Promise<{ success: boolean; calendars?: CalendarConnection[]; error?: string }> {
    try {
      const userId = await CalendarService.getCurrentUserId();
      if (!userId) return { success: true, calendars: [] };

      const { data, error } = await supabase
        .from('user_calendars')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('CalendarService: getConnectedCalendars error:', error);
        throw error;
      }

      return { success: true, calendars: data || [] };
    } catch (error: any) {
      console.error('CalendarService: getConnectedCalendars failed:', error);
      return { success: false, error: error.message || 'Failed to get connected calendars' };
    }
  }

  // Disconnect calendar
  static async disconnectCalendar(calendarId?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const body: any = { action: 'disconnect' };
      if (calendarId) body.calendar_id = calendarId;

      const { data, error } = await supabase.functions.invoke('google-calendar-sync', {
        body
      });

      if (error) {
        console.error('CalendarService: disconnectCalendar error:', error);
        throw error;
      }

      return { success: true, message: data.message };
    } catch (error: any) {
      console.error('CalendarService: disconnectCalendar failed:', error);
      return { success: false, error: error.message || 'Failed to disconnect calendar' };
    }
  }

  // Get upcoming meetings for content generation
  static async getUpcomingMeetings(limit: number = 5): Promise<CalendarEvent[]> {
    try {
      const userId = await CalendarService.getCurrentUserId();
      if (!userId) return [];
      const now = new Date().toISOString();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Next 7 days

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', now)
        .lte('start_time', endDate)
        .order('start_time', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('CalendarService: getUpcomingMeetings error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('CalendarService: getUpcomingMeetings failed:', error);
      return [];
    }
  }

  // Get recent meetings for content generation
  static async getRecentMeetings(limit: number = 5): Promise<CalendarEvent[]> {
    try {
      const userId = await CalendarService.getCurrentUserId();
      if (!userId) return [];
      const now = new Date().toISOString();
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // Last 7 days

      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .gte('start_time', startDate)
        .lte('start_time', now)
        .order('start_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('CalendarService: getRecentMeetings error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('CalendarService: getRecentMeetings failed:', error);
      return [];
    }
  }

  // Check if user has connected calendars
  static async hasConnectedCalendars(): Promise<boolean> {
    try {
      const userId = await CalendarService.getCurrentUserId();
      if (!userId) return false;

      const { data, error } = await supabase
        .from('user_calendars')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (error) {
        console.error('CalendarService: hasConnectedCalendars error:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error('CalendarService: hasConnectedCalendars failed:', error);
      return false;
    }
  }
}
