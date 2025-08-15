import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface DraftNotification {
  userId: string;
  draftId: string;
  draftTitle: string;
  draftContent: string;
  whatsappNumber: string;
  chatwootContactId?: string;
  chatwootConversationId?: number;
  // Enhanced fields for context-aware notifications
  enhanced?: boolean;
  meetingContext?: any;
  knowledgeBaseContext?: any;
  suggestionContext?: any;
}

interface WhatsAppNotificationConfig {
  chatwootBaseUrl: string;
  chatwootApiToken: string;
  chatwootAccountId: string;
}

class WhatsAppNotificationProcessor {
  private supabase: any;
  private config: WhatsAppNotificationConfig;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    this.config = {
      chatwootBaseUrl: Deno.env.get('CHATWOOT_BASE_URL') ?? '',
      chatwootApiToken: Deno.env.get('CHATWOOT_API_ACCESS_TOKEN') ?? '',
      chatwootAccountId: Deno.env.get('CHATWOOT_ACCOUNT_ID') ?? '',
    };
  }

  /**
   * Send WhatsApp notification for completed draft
   */
  async sendDraftNotification(notification: DraftNotification): Promise<boolean> {
    try {
      console.log(`📱 Sending WhatsApp notification for draft ${notification.draftId} to user ${notification.userId}`);

      // First, try to find existing conversation for this user
      let conversationId = notification.chatwootConversationId;
      
      if (!conversationId) {
        conversationId = await this.findOrCreateConversation(notification);
      }

      if (!conversationId) {
        console.error('❌ Could not find or create conversation for WhatsApp notification');
        return false;
      }

      // Create the notification message (enhanced or basic based on context)
      const message = notification.enhanced 
        ? this.createEnhancedNotificationMessage(notification)
        : this.createDraftNotificationMessage(notification);
      
      // Send via Chatwoot API
      const success = await this.sendChatwootMessage(conversationId, message);
      
      if (success) {
        console.log(`✅ WhatsApp notification sent successfully for draft ${notification.draftId}`);
        
        // Update the draft to mark notification as sent
        await this.markNotificationSent(notification.draftId);
        
        // If enhanced notification, record pacing suggestion
        if (notification.enhanced) {
          await this.recordPacingSuggestion(notification);
        }
        
        return true;
      } else {
        console.error('❌ Failed to send WhatsApp notification');
        return false;
      }

    } catch (error) {
      console.error('❌ Error sending WhatsApp notification:', error);
      return false;
    }
  }

  /**
   * Find existing conversation or create new one for user
   */
  private async findOrCreateConversation(notification: DraftNotification): Promise<number | null> {
    try {
      console.log(`🔍 Looking for conversation for user ${notification.userId}`);
      
      // First, try to find existing conversation in our conversations table
      const { data: existingConversation, error: findError } = await this.supabase
        .from('conversations')
        .select('chatwoot_conversation_id')
        .eq('user_id', notification.userId)
        .single();

      if (!findError && existingConversation?.chatwoot_conversation_id) {
        console.log(`✅ Found existing conversation in conversations table: ${existingConversation.chatwoot_conversation_id}`);
        return existingConversation.chatwoot_conversation_id;
      }

      // ✅ ENHANCED: Check meeting_notes table for conversation ID
      const { data: meetingNote, error: meetingError } = await this.supabase
        .from('meeting_notes')
        .select('chatwoot_conversation_id')
        .eq('user_id', notification.userId)
        .not('chatwoot_conversation_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!meetingError && meetingNote?.chatwoot_conversation_id) {
        console.log(`✅ Found conversation ID in meeting_notes: ${meetingNote.chatwoot_conversation_id}`);
        
        // Create entry in conversations table for future use
        try {
          await this.supabase
            .from('conversations')
            .insert({
              user_id: notification.userId,
              chatwoot_conversation_id: meetingNote.chatwoot_conversation_id,
              context_json: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          console.log(`✅ Created conversation entry for future use`);
        } catch (insertError) {
          console.log(`ℹ️ Could not create conversation entry (may already exist):`, insertError);
        }
        
        return meetingNote.chatwoot_conversation_id;
      }

      // ✅ ENHANCED: Check user_bucket_mapping for WhatsApp number
      const { data: userMapping, error: mappingError } = await this.supabase
        .from('user_bucket_mapping')
        .select('whatsapp_number, contact_id')
        .eq('user_id', notification.userId)
        .single();

      if (!mappingError && userMapping?.whatsapp_number) {
        console.log(`ℹ️ Found WhatsApp number ${userMapping.whatsapp_number} for user ${notification.userId}`);
        console.log(`💡 User has WhatsApp configured but no active conversation`);
      }

      // If no existing conversation found anywhere, we need the user to initiate one
      console.log(`⚠️ No existing conversation found for user ${notification.userId}`);
      console.log(`💡 User needs to send a WhatsApp message first to establish conversation`);
      
      return null;

    } catch (error) {
      console.error('❌ Error finding conversation:', error);
      return null;
    }
  }

  /**
   * Create the notification message content
   */
  private createDraftNotificationMessage(notification: DraftNotification): string {
    let message = `🎉 Your content is ready!\n\n`;
    message += `📝 **${notification.draftTitle}**\n\n`;
    message += `📱 Open the Pacelane app to view and edit your draft.\n\n`;
    message += `🆔 Draft ID: ${notification.draftId}\n\n`;
    message += `💡 Tip: You can customize the tone, length, and platform before posting.`;
    
    return message;
  }

  /**
   * Create an enhanced notification message for context-aware drafts
   */
  private createEnhancedNotificationMessage(notification: DraftNotification): string {
    let message = `🎉 Your content is ready!\n\n`;
    message += `📝 **${notification.draftTitle}**\n\n`;
    
    // Add meeting context if available
    if (notification.meetingContext && notification.meetingContext.meetings_since) {
      const meetings = notification.meetingContext.meetings_since;
      if (meetings && meetings.length > 0) {
        message += `📅 **Recent Activity Since Last Suggestion:**\n`;
        message += `• ${meetings.length} meeting${meetings.length > 1 ? 's' : ''} recorded\n`;
        
        // Add key insights from recent meetings
        if (meetings.length > 0) {
          const latestMeeting = meetings[0];
          if (latestMeeting.topics && latestMeeting.topics.length > 0) {
            message += `• Latest topics: ${latestMeeting.topics.slice(0, 2).map((t: any) => t.text).join(', ')}\n`;
          }
          if (latestMeeting.action_items && latestMeeting.action_items.length > 0) {
            message += `• Action items: ${latestMeeting.action_items.slice(0, 2).map((a: any) => a.text).join(', ')}\n`;
          }
        }
        message += `\n`;
      }
    }
    
    // Add knowledge base context if available
    if (notification.knowledgeBaseContext && notification.knowledgeBaseContext.transcripts_available) {
      const transcripts = notification.knowledgeBaseContext.transcripts_available;
      if (transcripts && transcripts.length > 0) {
        message += `📚 **Knowledge Base Updates:**\n`;
        message += `• ${transcripts.length} new transcript${transcripts.length > 1 ? 's' : ''} added\n`;
        message += `• Content is context-aware and personalized\n\n`;
      }
    }
    
    message += `📱 Open the Pacelane app to view and edit your draft.\n\n`;
    message += `🆔 Draft ID: ${notification.draftId}\n\n`;
    message += `💡 **This suggestion incorporates your recent meetings and knowledge base for personalized content.**\n\n`;
    message += `🚀 Ready to create engaging, context-aware content!`;
    
    return message;
  }

  /**
   * Send message via Chatwoot API
   */
  private async sendChatwootMessage(conversationId: number, content: string): Promise<boolean> {
    try {
      if (!this.config.chatwootBaseUrl || !this.config.chatwootApiToken || !this.config.chatwootAccountId) {
        console.error('❌ Chatwoot API configuration missing');
        return false;
      }

      const url = `${this.config.chatwootBaseUrl}/api/v1/accounts/${this.config.chatwootAccountId}/conversations/${conversationId}/messages`;
      
      const messageData = {
        content: content,
        message_type: 'outgoing',
        content_type: 'text'
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': this.config.chatwootApiToken,
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to send Chatwoot message: ${response.status} ${errorText}`);
        return false;
      }

      const result = await response.json();
      console.log(`✅ Chatwoot message sent successfully: ${result.id}`);
      return true;

    } catch (error) {
      console.error('❌ Error sending Chatwoot message:', error);
      return false;
    }
  }

  /**
   * Mark notification as sent in the database
   */
  private async markNotificationSent(draftId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('saved_drafts')
        .update({ 
          whatsapp_notification_sent: true,
          whatsapp_notification_sent_at: new Date().toISOString()
        })
        .eq('id', draftId);

      if (error) {
        console.error('❌ Error marking notification as sent:', error);
      } else {
        console.log(`✅ Marked notification as sent for draft ${draftId}`);
      }
    } catch (error) {
      console.error('❌ Error updating draft notification status:', error);
    }
  }

  /**
   * Record a pacing suggestion for an enhanced notification
   */
  private async recordPacingSuggestion(notification: DraftNotification): Promise<void> {
    try {
      // Get the user's active pacing schedule
      const { data: schedule, error: scheduleError } = await this.supabase
        .from('pacing_schedules')
        .select('id')
        .eq('user_id', notification.userId)
        .eq('is_active', true)
        .single();

      if (scheduleError || !schedule) {
        console.warn(`⚠️ No active pacing schedule found for user ${notification.userId}`);
        return;
      }

      // Record the suggestion
      const { error: suggestionError } = await this.supabase
        .from('pacing_suggestions')
        .insert({
          user_id: notification.userId,
          schedule_id: schedule.id,
          suggestion_date: new Date().toISOString().split('T')[0],
          content_type: 'post',
          context_summary: {
            meeting_context: notification.meetingContext || {},
            knowledge_base_context: notification.knowledgeBaseContext || {},
            suggestion_context: notification.suggestionContext || {}
          },
          meeting_context: notification.meetingContext || {},
          knowledge_base_context: notification.knowledgeBaseContext || {},
          suggestion_status: 'sent',
          whatsapp_notification_sent: true,
          whatsapp_notification_sent_at: new Date().toISOString()
        });

      if (suggestionError) {
        console.error('❌ Error recording pacing suggestion:', suggestionError);
      } else {
        console.log(`✅ Recorded pacing suggestion for user ${notification.userId}`);
      }

    } catch (error) {
      console.error('❌ Error recording pacing suggestion:', error);
    }
  }

  /**
   * Get all users with completed drafts that need WhatsApp notifications
   */
  async getPendingNotifications(): Promise<DraftNotification[]> {
    try {
      // Get drafts that are ready but haven't had WhatsApp notifications sent
      const { data: drafts, error } = await this.supabase
        .from('saved_drafts')
        .select(`
          id,
          user_id,
          title,
          content,
          whatsapp_notification_sent,
          whatsapp_notification_sent_at,
          created_at,
          enhanced,
          meeting_context,
          knowledge_base_context,
          suggestion_context
        `)
        .eq('status', 'draft')
        .eq('whatsapp_notification_sent', false)
        .not('user_id', 'is', null);

      if (error) {
        console.error('❌ Error fetching pending notifications:', error);
        return [];
      }

      if (!drafts || drafts.length === 0) {
        console.log('📱 No pending WhatsApp notifications');
        return [];
      }

      console.log(`📱 Found ${drafts.length} drafts pending WhatsApp notifications`);

      // For each draft, get user's WhatsApp number and conversation info
      const notifications: DraftNotification[] = [];
      
      for (const draft of drafts) {
        const userInfo = await this.getUserWhatsAppInfo(draft.user_id);
        
        if (userInfo.whatsappNumber) {
          notifications.push({
            userId: draft.user_id,
            draftId: draft.id,
            draftTitle: draft.title || 'Untitled Draft',
            draftContent: draft.content || '',
            whatsappNumber: userInfo.whatsappNumber,
            chatwootContactId: userInfo.chatwootContactId,
            chatwootConversationId: userInfo.chatwootConversationId,
            enhanced: draft.enhanced,
            meetingContext: draft.meeting_context,
            knowledgeBaseContext: draft.knowledge_base_context,
            suggestionContext: draft.suggestion_context,
          });
        } else {
          console.log(`⚠️ User ${draft.user_id} has no WhatsApp number configured`);
        }
      }

      return notifications;

    } catch (error) {
      console.error('❌ Error getting pending notifications:', error);
      return [];
    }
  }

  /**
   * Get user's WhatsApp information
   */
  private async getUserWhatsAppInfo(userId: string): Promise<{
    whatsappNumber: string | null;
    chatwootContactId: string | null;
    chatwootConversationId: number | null;
  }> {
    try {
      // Get user's WhatsApp number from profile
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('whatsapp_number')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile?.whatsapp_number) {
        return { whatsappNumber: null, chatwootContactId: null, chatwootConversationId: null };
      }

      // Get Chatwoot conversation info
      const { data: conversation, error: conversationError } = await this.supabase
        .from('conversations')
        .select('chatwoot_conversation_id')
        .eq('user_id', userId)
        .single();

      const chatwootConversationId = conversationError ? null : conversation?.chatwoot_conversation_id;

      return {
        whatsappNumber: profile.whatsapp_number,
        chatwootContactId: null, // We'll need to get this from Chatwoot API
        chatwootConversationId: chatwootConversationId,
      };

    } catch (error) {
      console.error('❌ Error getting user WhatsApp info:', error);
      return { whatsappNumber: null, chatwootContactId: null, chatwootConversationId: null };
    }
  }

  /**
   * Process all pending notifications
   */
  async processPendingNotifications(): Promise<{ success: number; failed: number }> {
    try {
      const notifications = await this.getPendingNotifications();
      
      if (notifications.length === 0) {
        return { success: 0, failed: 0 };
      }

      console.log(`📱 Processing ${notifications.length} pending WhatsApp notifications`);

      let success = 0;
      let failed = 0;

      for (const notification of notifications) {
        try {
          const sent = await this.sendDraftNotification(notification);
          if (sent) {
            success++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`❌ Error processing notification for draft ${notification.draftId}:`, error);
          failed++;
        }
      }

      console.log(`📱 WhatsApp notifications processed: ${success} success, ${failed} failed`);
      return { success, failed };

    } catch (error) {
      console.error('❌ Error processing pending notifications:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * Send notification for a specific draft (called by job runner)
   */
  async sendNotificationForDraft(draftId: string): Promise<boolean> {
    try {
      console.log(`📱 Sending notification for specific draft: ${draftId}`);

      // Get draft details
      const { data: draft, error } = await this.supabase
        .from('saved_drafts')
        .select(`
          id,
          user_id,
          title,
          content,
          status,
          whatsapp_notification_sent,
          enhanced,
          meeting_context,
          knowledge_base_context,
          suggestion_context
        `)
        .eq('id', draftId)
        .single();

      if (error || !draft) {
        console.error('❌ Draft not found:', draftId);
        return false;
      }

      if (draft.whatsapp_notification_sent) {
        console.log(`📱 Notification already sent for draft ${draftId}`);
        return true;
      }

      if (draft.status !== 'draft') {
        console.log(`📱 Draft ${draftId} not ready (status: ${draft.status})`);
        return false;
      }

      // Get user's WhatsApp info
      const userInfo = await this.getUserWhatsAppInfo(draft.user_id);
      
      if (!userInfo.whatsappNumber) {
        console.log(`⚠️ User ${draft.user_id} has no WhatsApp number configured`);
        return false;
      }

      // Create notification object
      const notification: DraftNotification = {
        userId: draft.user_id,
        draftId: draft.id,
        draftTitle: draft.title || 'Untitled Draft',
        draftContent: draft.content || '',
        whatsappNumber: userInfo.whatsappNumber,
        chatwootContactId: userInfo.chatwootContactId,
        chatwootConversationId: userInfo.chatwootConversationId,
        enhanced: draft.enhanced,
        meetingContext: draft.meeting_context,
        knowledgeBaseContext: draft.knowledge_base_context,
        suggestionContext: draft.suggestion_context,
      };

      // Send notification
      return await this.sendDraftNotification(notification);

    } catch (error) {
      console.error('❌ Error sending notification for draft:', error);
      return false;
    }
  }

  /**
   * Get basic notification for a draft (backward compatibility)
   */
  async getNotificationForDraft(draftId: string): Promise<DraftNotification | null> {
    try {
      // Get draft information
      const { data: draft, error: draftError } = await this.supabase
        .from('saved_drafts')
        .select(`
          id,
          user_id,
          title,
          content,
          whatsapp_notification_sent,
          whatsapp_notification_sent_at
        `)
        .eq('id', draftId)
        .single();

      if (draftError || !draft) {
        console.error('❌ Error fetching draft:', draftError);
        return null;
      }

      // Get user's WhatsApp information
      const userInfo = await this.getUserWhatsAppInfo(draft.user_id);
      
      if (!userInfo.whatsappNumber) {
        console.log(`⚠️ User ${draft.user_id} has no WhatsApp number configured`);
        return null;
      }

      // Return basic notification without enhanced context
      return {
        userId: draft.user_id,
        draftId: draft.id,
        draftTitle: draft.title || 'Untitled Draft',
        draftContent: draft.content || '',
        whatsappNumber: userInfo.whatsappNumber,
        chatwootContactId: userInfo.chatwootContactId,
        chatwootConversationId: userInfo.chatwootConversationId,
        enhanced: false,
        meetingContext: null,
        knowledgeBaseContext: null,
        suggestionContext: null
      };

    } catch (error) {
      console.error('❌ Error getting basic notification for draft:', error);
      return null;
    }
  }

  /**
   * Get enhanced context for a draft notification
   */
  async getEnhancedContextForDraft(draftId: string): Promise<DraftNotification | null> {
    try {
      // Get draft information
      const { data: draft, error: draftError } = await this.supabase
        .from('saved_drafts')
        .select(`
          id,
          user_id,
          title,
          content,
          whatsapp_notification_sent,
          whatsapp_notification_sent_at
        `)
        .eq('id', draftId)
        .single();

      if (draftError || !draft) {
        console.error('❌ Error fetching draft:', draftError);
        return null;
      }

      // Get user's WhatsApp information
      const userInfo = await this.getUserWhatsAppInfo(draft.user_id);
      
      if (!userInfo.whatsappNumber) {
        console.log(`⚠️ User ${draft.user_id} has no WhatsApp number configured`);
        return null;
      }

      // Get enhanced context from the new system
      const enhancedContext = await this.getEnhancedContext(draft.user_id);

      return {
        userId: draft.user_id,
        draftId: draft.id,
        draftTitle: draft.title || 'Untitled Draft',
        draftContent: draft.content || '',
        whatsappNumber: userInfo.whatsappNumber,
        chatwootContactId: userInfo.chatwootContactId,
        chatwootConversationId: userInfo.chatwootConversationId,
        enhanced: true,
        meetingContext: enhancedContext.meetingContext,
        knowledgeBaseContext: enhancedContext.knowledgeBaseContext,
        suggestionContext: enhancedContext.suggestionContext
      };

    } catch (error) {
      console.error('❌ Error getting enhanced context for draft:', error);
      return null;
    }
  }

  /**
   * Get enhanced context for a user
   */
  private async getEnhancedContext(userId: string): Promise<{
    meetingContext: any;
    knowledgeBaseContext: any;
    suggestionContext: any;
  }> {
    try {
      // Get meeting context since last suggestion
      const { data: meetingContext, error: meetingError } = await this.supabase
        .rpc('get_meeting_context_since_last_suggestion', { user_uuid: userId });

      if (meetingError) {
        console.warn(`⚠️ Error getting meeting context:`, meetingError);
      }

      // Get user's notification preferences (handle missing data gracefully)
      let preferences = null;
      try {
        const { data: prefData, error: prefError } = await this.supabase
          .from('user_notification_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (!prefError && prefData) {
          preferences = prefData;
        } else {
          console.log(`ℹ️ No user notification preferences found for user ${userId}, using defaults`);
        }
      } catch (error) {
        console.log(`ℹ️ Error getting user preferences, using defaults:`, error);
      }

      return {
        meetingContext: meetingContext || {},
        knowledgeBaseContext: meetingContext?.transcripts_available || [],
        suggestionContext: {
          preferences: preferences || {},
          context_integration_enabled: true
        }
      };

    } catch (error) {
      console.error('❌ Error getting enhanced context:', error);
      return {
        meetingContext: {},
        knowledgeBaseContext: [],
        suggestionContext: {}
      };
    }
  }
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const processor = new WhatsAppNotificationProcessor();

    if (req.method === 'GET') {
      // Process all pending notifications
      const result = await processor.processPendingNotifications();
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'WhatsApp notifications processed',
          result
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (req.method === 'POST') {
      // Send notification for specific draft
      const { draftId, enhanced = false } = await req.json();
      
      if (!draftId) {
        return new Response(
          JSON.stringify({ success: false, message: 'draftId is required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      let notification;
      
      if (enhanced) {
        // Get enhanced notification with context
        notification = await processor.getEnhancedContextForDraft(draftId);
      } else {
        // Get basic notification (backward compatibility)
        notification = await processor.getNotificationForDraft(draftId);
      }
      
      if (!notification) {
        return new Response(
          JSON.stringify({ success: false, message: 'Could not get notification for draft' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const success = await processor.sendDraftNotification(notification);
      
      return new Response(
        JSON.stringify({
          success,
          message: success ? 'WhatsApp notification sent' : 'Failed to send WhatsApp notification',
          draftId,
          enhanced: notification.enhanced || false,
          context_integration: notification.enhanced || false
        }),
        { 
          status: success ? 200 : 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('WhatsApp notification processing error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Internal server error',
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
