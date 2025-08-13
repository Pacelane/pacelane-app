import { supabase } from '@/integrations/supabase/client';

interface WhatsAppNotificationConfig {
  chatwootBaseUrl: string;
  chatwootApiToken: string;
  chatwootAccountId: string;
}

interface DraftNotification {
  userId: string;
  draftId: string;
  draftTitle: string;
  draftContent: string;
  whatsappNumber: string;
  chatwootContactId?: string;
  chatwootConversationId?: number;
}

export class WhatsAppNotificationService {
  private config: WhatsAppNotificationConfig;

  constructor() {
    this.config = {
      chatwootBaseUrl: process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || '',
      chatwootApiToken: process.env.NEXT_PUBLIC_CHATWOOT_API_TOKEN || '',
      chatwootAccountId: process.env.NEXT_PUBLIC_CHATWOOT_ACCOUNT_ID || '',
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

      // Create the notification message
      const message = this.createDraftNotificationMessage(notification);
      
      // Send via Chatwoot API
      const success = await this.sendChatwootMessage(conversationId, message);
      
      if (success) {
        console.log(`✅ WhatsApp notification sent successfully for draft ${notification.draftId}`);
        
        // Update the draft to mark notification as sent
        await this.markNotificationSent(notification.draftId);
        
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
      // First, try to find existing conversation in our database
      const { data: existingConversation, error: findError } = await supabase
        .from('conversations')
        .select('chatwoot_conversation_id')
        .eq('user_id', notification.userId)
        .single();

      if (!findError && existingConversation?.chatwoot_conversation_id) {
        console.log(`✅ Found existing conversation: ${existingConversation.chatwoot_conversation_id}`);
        return existingConversation.chatwoot_conversation_id;
      }

      // If no existing conversation, we need to create one via Chatwoot API
      // This requires the user to have initiated a conversation first
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
    const message = `🎉 Your content is ready!\n\n`;
    message += `📝 **${notification.draftTitle}**\n\n`;
    message += `📱 Open the Pacelane app to view and edit your draft.\n\n`;
    message += `🆔 Draft ID: ${notification.draftId}\n\n`;
    message += `💡 Tip: You can customize the tone, length, and platform before posting.`;
    
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
      const { error } = await supabase
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
   * Get all users with completed drafts that need WhatsApp notifications
   */
  async getPendingNotifications(): Promise<DraftNotification[]> {
    try {
      // Get drafts that are ready but haven't had WhatsApp notifications sent
      const { data: drafts, error } = await supabase
        .from('saved_drafts')
        .select(`
          id,
          user_id,
          title,
          content,
          whatsapp_notification_sent,
          whatsapp_notification_sent_at,
          created_at
        `)
        .eq('status', 'ready')
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
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('whatsapp_number')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile?.whatsapp_number) {
        return { whatsappNumber: null, chatwootContactId: null, chatwootConversationId: null };
      }

      // Get Chatwoot conversation info
      const { data: conversation, error: conversationError } = await supabase
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
}
