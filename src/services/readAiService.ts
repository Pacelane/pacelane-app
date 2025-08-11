import { supabase } from '../integrations/supabase/client';

export interface ReadAIMeeting {
  id: string;
  user_id: string;
  meeting_id: string;
  title: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  platform: string;
  recording_url?: string;
  transcript_url?: string;
  summary_url?: string;
  meeting_url?: string;
  host_email: string;
  host_name: string;
  participants: ReadAIParticipant[];
  topics: ReadAITopic[];
  action_items: ReadAIActionItem[];
  insights: Record<string, any>;
  analytics: Record<string, any>;
  transcript_text?: string;
  summary_text?: string;
  key_moments: any[];
  sentiment_analysis: Record<string, any>;
  processed_at: string;
  created_at: string;
}

export interface ReadAIParticipant {
  id: string;
  meeting_id: string;
  participant_id: string;
  name: string;
  email?: string;
  is_host: boolean;
  is_guest: boolean;
  join_time?: string;
  leave_time?: string;
  speaking_time_seconds: number;
  participation_score?: number;
  sentiment_score?: number;
  talk_ratio?: number;
  interruptions_count: number;
  questions_asked: number;
}

export interface ReadAIActionItem {
  id: string;
  meeting_id: string;
  action_item_id?: string;
  title: string;
  description?: string;
  assignee_name?: string;
  assignee_email?: string;
  due_date?: string;
  status: 'open' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  confidence_score?: number;
  timestamp_in_meeting?: number;
  context_text?: string;
  created_at: string;
  updated_at: string;
}

export interface ReadAITopic {
  id: string;
  meeting_id: string;
  topic_id?: string;
  title: string;
  description?: string;
  start_time_seconds: number;
  end_time_seconds: number;
  duration_seconds: number;
  importance_score?: number;
  keywords: string[];
  participant_involvement: Record<string, any>;
  sentiment?: number;
}

export interface MeetingInsights {
  totalMeetings: number;
  totalDuration: number;
  averageDuration: number;
  platformBreakdown: Record<string, number>;
  participationTrends: any;
  topTopics: ReadAITopic[];
  actionItemsStats: {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  };
  sentimentTrends: any;
}

export class ReadAIService {
  // Get all meetings for a user
  static async getMeetings(options?: {
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    platform?: string;
  }): Promise<{ success: boolean; meetings?: ReadAIMeeting[]; error?: string }> {
    try {
      let query = supabase
        .from('read_ai_meetings')
        .select(`
          *,
          read_ai_participants (*),
          read_ai_action_items (*),
          read_ai_topics (*)
        `)
        .order('start_time', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
      }

      if (options?.startDate) {
        query = query.gte('start_time', options.startDate);
      }

      if (options?.endDate) {
        query = query.lte('start_time', options.endDate);
      }

      if (options?.platform) {
        query = query.eq('platform', options.platform);
      }

      const { data, error } = await query;

      if (error) {
        console.error('ReadAIService: getMeetings error:', error);
        throw error;
      }

      return { success: true, meetings: data || [] };
    } catch (error: any) {
      console.error('ReadAIService: getMeetings failed:', error);
      return { success: false, error: error.message || 'Failed to get meetings' };
    }
  }

  // Get a specific meeting by ID
  static async getMeeting(meetingId: string): Promise<{ success: boolean; meeting?: ReadAIMeeting; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('read_ai_meetings')
        .select(`
          *,
          read_ai_participants (*),
          read_ai_action_items (*),
          read_ai_topics (*)
        `)
        .eq('id', meetingId)
        .single();

      if (error) {
        console.error('ReadAIService: getMeeting error:', error);
        throw error;
      }

      return { success: true, meeting: data };
    } catch (error: any) {
      console.error('ReadAIService: getMeeting failed:', error);
      return { success: false, error: error.message || 'Failed to get meeting' };
    }
  }

  // Get recent meetings for content generation
  static async getRecentMeetings(limit: number = 5): Promise<ReadAIMeeting[]> {
    try {
      const { data, error } = await supabase
        .from('read_ai_meetings')
        .select(`
          *,
          read_ai_participants (*),
          read_ai_action_items (*),
          read_ai_topics (*)
        `)
        .order('end_time', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('ReadAIService: getRecentMeetings error:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('ReadAIService: getRecentMeetings failed:', error);
      return [];
    }
  }

  // Get action items with filtering
  static async getActionItems(options?: {
    status?: string;
    assigneeEmail?: string;
    dueDateBefore?: string;
    limit?: number;
  }): Promise<{ success: boolean; actionItems?: ReadAIActionItem[]; error?: string }> {
    try {
      let query = supabase
        .from('read_ai_action_items')
        .select(`
          *,
          read_ai_meetings (title, start_time, platform)
        `)
        .order('created_at', { ascending: false });

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.assigneeEmail) {
        query = query.eq('assignee_email', options.assigneeEmail);
      }

      if (options?.dueDateBefore) {
        query = query.lte('due_date', options.dueDateBefore);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('ReadAIService: getActionItems error:', error);
        throw error;
      }

      return { success: true, actionItems: data || [] };
    } catch (error: any) {
      console.error('ReadAIService: getActionItems failed:', error);
      return { success: false, error: error.message || 'Failed to get action items' };
    }
  }

  // Update action item status
  static async updateActionItem(
    actionItemId: string, 
    updates: Partial<ReadAIActionItem>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('read_ai_action_items')
        .update(updates)
        .eq('id', actionItemId);

      if (error) {
        console.error('ReadAIService: updateActionItem error:', error);
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('ReadAIService: updateActionItem failed:', error);
      return { success: false, error: error.message || 'Failed to update action item' };
    }
  }

  // Get meeting insights and analytics
  static async getMeetingInsights(options?: {
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; insights?: MeetingInsights; error?: string }> {
    try {
      let meetingsQuery = supabase
        .from('read_ai_meetings')
        .select('*');

      let actionItemsQuery = supabase
        .from('read_ai_action_items')
        .select('*, read_ai_meetings!inner(start_time)');

      if (options?.startDate) {
        meetingsQuery = meetingsQuery.gte('start_time', options.startDate);
        actionItemsQuery = actionItemsQuery.gte('read_ai_meetings.start_time', options.startDate);
      }

      if (options?.endDate) {
        meetingsQuery = meetingsQuery.lte('start_time', options.endDate);
        actionItemsQuery = actionItemsQuery.lte('read_ai_meetings.start_time', options.endDate);
      }

      const [meetingsResult, actionItemsResult, topicsResult] = await Promise.all([
        meetingsQuery,
        actionItemsQuery,
        supabase
          .from('read_ai_topics')
          .select('*, read_ai_meetings!inner(start_time)')
          .order('importance_score', { ascending: false })
          .limit(10)
      ]);

      if (meetingsResult.error || actionItemsResult.error || topicsResult.error) {
        throw new Error('Failed to fetch insights data');
      }

      const meetings = meetingsResult.data || [];
      const actionItems = actionItemsResult.data || [];
      const topics = topicsResult.data || [];

      // Calculate insights
      const totalMeetings = meetings.length;
      const totalDuration = meetings.reduce((sum, m) => sum + m.duration_minutes, 0);
      const averageDuration = totalMeetings > 0 ? totalDuration / totalMeetings : 0;

      const platformBreakdown = meetings.reduce((acc, meeting) => {
        acc[meeting.platform] = (acc[meeting.platform] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const actionItemsStats = {
        total: actionItems.length,
        completed: actionItems.filter(item => item.status === 'completed').length,
        pending: actionItems.filter(item => item.status === 'open').length,
        overdue: actionItems.filter(item => 
          item.due_date && new Date(item.due_date) < new Date() && item.status !== 'completed'
        ).length,
      };

      const insights: MeetingInsights = {
        totalMeetings,
        totalDuration,
        averageDuration,
        platformBreakdown,
        participationTrends: {}, // TODO: Calculate participation trends
        topTopics: topics,
        actionItemsStats,
        sentimentTrends: {}, // TODO: Calculate sentiment trends
      };

      return { success: true, insights };
    } catch (error: any) {
      console.error('ReadAIService: getMeetingInsights failed:', error);
      return { success: false, error: error.message || 'Failed to get meeting insights' };
    }
  }

  // Search meetings by content
  static async searchMeetings(searchTerm: string): Promise<{ success: boolean; meetings?: ReadAIMeeting[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('read_ai_meetings')
        .select(`
          *,
          read_ai_participants (*),
          read_ai_action_items (*),
          read_ai_topics (*)
        `)
        .or(`title.ilike.%${searchTerm}%,summary_text.ilike.%${searchTerm}%,transcript_text.ilike.%${searchTerm}%`)
        .order('start_time', { ascending: false });

      if (error) {
        console.error('ReadAIService: searchMeetings error:', error);
        throw error;
      }

      return { success: true, meetings: data || [] };
    } catch (error: any) {
      console.error('ReadAIService: searchMeetings failed:', error);
      return { success: false, error: error.message || 'Failed to search meetings' };
    }
  }

  // Get meeting content for AI content generation
  static async getMeetingForContentGeneration(meetingId: string): Promise<{
    title: string;
    summary: string;
    keyTopics: string[];
    actionItems: string[];
    participants: string[];
    insights: string[];
    sentiment: string;
    duration: string;
    platform: string;
  } | null> {
    try {
      const result = await this.getMeeting(meetingId);
      
      if (!result.success || !result.meeting) {
        return null;
      }

      const meeting = result.meeting;
      
      return {
        title: meeting.title,
        summary: meeting.summary_text || 'No summary available',
        keyTopics: meeting.topics?.map(t => t.title) || [],
        actionItems: meeting.action_items?.map(ai => ai.title) || [],
        participants: meeting.participants?.map(p => p.name) || [],
        insights: Object.values(meeting.insights).map(String) || [],
        sentiment: meeting.sentiment_analysis?.overall || 'neutral',
        duration: `${meeting.duration_minutes} minutes`,
        platform: meeting.platform,
      };
    } catch (error) {
      console.error('ReadAIService: getMeetingForContentGeneration failed:', error);
      return null;
    }
  }
}
