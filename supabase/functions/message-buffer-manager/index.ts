import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
interface MessageBuffer {
  id: string;
  conversation_id: number;
  user_id: string;
  buffer_start_time: string;
  buffer_end_time?: string;
  last_message_time: string;
  status: 'active' | 'processing' | 'completed';
  message_count: number;
}

interface BufferedMessage {
  id: string;
  buffer_id: string;
  chatwoot_message_id: number;
  content?: string;
  message_type: 'text' | 'audio' | 'image' | 'file';
  content_type?: string;
  attachments: any[];
  sender_info: any;
  conversation_info: any;
  received_at: string;
}

interface ChatwootWebhookPayload {
  id: number;
  content?: string;
  message_type: string;
  content_type?: string;
  attachments?: any[];
  conversation: {
    id: number;
    status: string;
    channel: string;
    messages_count: number;
  };
  sender: {
    id: number;
    name: string;
    phone_number?: string;
    identifier?: string;
  };
  account: {
    id: number;
    name: string;
  };
  created_at: string;
}

class MessageBufferManager {
  private readonly BUFFER_DURATION_MS = 30000; // 30 seconds
  private readonly MAX_BUFFER_SIZE = 50;
  private readonly MAX_BUFFER_AGE_MS = 300000; // 5 minutes safety timeout

  constructor(private supabase: any) {}

  async handleIncomingMessage(payload: ChatwootWebhookPayload): Promise<{
    success: boolean;
    action: string;
    bufferId?: string;
    message?: string;
  }> {
    try {
      console.log(`Processing message ${payload.id} for conversation ${payload.conversation.id}`);
      
      // Get or create active buffer
      const buffer = await this.getOrCreateActiveBuffer(payload);
      
      // Add message to buffer
      await this.addMessageToBuffer(buffer, payload);
      
      // Schedule buffer processing
      await this.scheduleBufferProcessing(buffer);
      
      return {
        success: true,
        action: 'buffered',
        bufferId: buffer.id,
        message: `Message added to buffer. Buffer has ${buffer.message_count + 1} messages.`
      };
    } catch (error) {
      console.error('Error handling incoming message:', error);
      return {
        success: false,
        action: 'error',
        message: `Failed to buffer message: ${error.message}`
      };
    }
  }

  async getOrCreateActiveBuffer(payload: ChatwootWebhookPayload): Promise<MessageBuffer> {
    const conversationId = payload.conversation.id;
    const now = new Date().toISOString();
    
    // Try to find an active buffer for this conversation
    const { data: existingBuffer, error: findError } = await this.supabase
      .from('message_buffer')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('status', 'active')
      .gte('last_message_time', new Date(Date.now() - this.MAX_BUFFER_AGE_MS).toISOString())
      .order('last_message_time', { ascending: false })
      .limit(1)
      .single();

    if (findError && findError.code !== 'PGRST116') {
      throw new Error(`Error finding active buffer: ${findError.message}`);
    }

    if (existingBuffer) {
      // Update existing buffer with new message time
      const { data: updatedBuffer, error: updateError } = await this.supabase
        .from('message_buffer')
        .update({
          last_message_time: now,
          message_count: existingBuffer.message_count + 1
        })
        .eq('id', existingBuffer.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error updating buffer: ${updateError.message}`);
      }

      return updatedBuffer;
    }

    // Create new buffer
    const userId = await this.getUserIdFromConversation(conversationId, payload.sender, payload.account);
    
    const { data: newBuffer, error: createError } = await this.supabase
      .from('message_buffer')
      .insert({
        conversation_id: conversationId,
        user_id: userId,
        buffer_start_time: now,
        last_message_time: now,
        status: 'active',
        message_count: 1
      })
      .select()
      .single();

    if (createError) {
      throw new Error(`Error creating buffer: ${createError.message}`);
    }

    // Update conversation with active buffer
    await this.supabase
      .from('conversations')
      .upsert({
        chatwoot_conversation_id: conversationId,
        user_id: userId,
        active_buffer_id: newBuffer.id,
        last_message_at: now,
        conversation_state: 'buffering'
      }, {
        onConflict: 'chatwoot_conversation_id'
      });

    console.log(`Created new buffer ${newBuffer.id} for conversation ${conversationId}`);
    return newBuffer;
  }

  async addMessageToBuffer(buffer: MessageBuffer, payload: ChatwootWebhookPayload): Promise<void> {
    // Determine message type based on both message_type and attachments
    const messageType = this.determineMessageType(payload);
    
    const messageData = {
      buffer_id: buffer.id,
      chatwoot_message_id: payload.id,
      content: payload.content || null,
      message_type: messageType,
      content_type: payload.content_type || null,
      attachments: payload.attachments || [],
      sender_info: {
        id: payload.sender.id,
        name: payload.sender.name,
        phone_number: payload.sender.phone_number,
        identifier: payload.sender.identifier
      },
      conversation_info: {
        id: payload.conversation.id,
        status: payload.conversation.status,
        channel: payload.conversation.channel,
        messages_count: payload.conversation.messages_count
      },
      received_at: payload.created_at || new Date().toISOString(),
      processed: false
    };

    const { error } = await this.supabase
      .from('buffered_messages')
      .insert(messageData);

    if (error) {
      throw new Error(`Error adding message to buffer: ${error.message}`);
    }

    console.log(`Added message ${payload.id} (type: ${messageType}) to buffer ${buffer.id}`);
  }

  async scheduleBufferProcessing(buffer: MessageBuffer): Promise<void> {
    const scheduledFor = new Date(
      new Date(buffer.last_message_time).getTime() + this.BUFFER_DURATION_MS
    ).toISOString();

    // Cancel any existing scheduled job for this buffer
    await this.supabase
      .from('buffer_processing_jobs')
      .update({ status: 'cancelled' })
      .eq('buffer_id', buffer.id)
      .eq('status', 'scheduled');

    // Create new scheduled job
    const { error } = await this.supabase
      .from('buffer_processing_jobs')
      .insert({
        buffer_id: buffer.id,
        scheduled_for: scheduledFor,
        status: 'scheduled',
        attempts: 0
      });

    if (error) {
      throw new Error(`Error scheduling buffer processing: ${error.message}`);
    }

    console.log(`Scheduled buffer ${buffer.id} for processing at ${scheduledFor}`);
  }

  private async getUserIdFromConversation(conversationId: number, sender: any, account: any): Promise<string> {
    try {
      console.log(`🔍 Identifying user for conversation ${conversationId} using centralized service`);
      
      // Extract WhatsApp number from sender (same as original webhook)
      const whatsappNumber = sender.phone_number || sender.identifier;
      
      // Generate contact ID in same format as original webhook using actual account ID
      const contactId = `contact_${sender.id}_account_${account.id}`;
      
      console.log(`📱 WhatsApp number: ${whatsappNumber}, Contact ID: ${contactId}`);
      
      // Use the same centralized user-bucket service as the original webhook
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/user-bucket-service`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'identify-and-ensure-bucket',
          whatsappNumber,
          contactId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ User-bucket service error:', response.status, errorText);
        throw new Error(`User-bucket service error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ User identification result:', result);
      
      if (result.success && result.data?.userId) {
        console.log(`✅ Found user ID: ${result.data.userId}`);
        return result.data.userId;
      }
      
      // Fallback: try direct database lookup
      console.log('⚠️ User-bucket service did not return userId, trying direct lookup');
      
      // Try to find from existing conversation
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select('user_id')
        .eq('chatwoot_conversation_id', conversationId)
        .single();

      if (conversation?.user_id) {
        console.log(`✅ Found user ID from conversations table: ${conversation.user_id}`);
        return conversation.user_id;
      }

      throw new Error(`Could not determine user_id for conversation ${conversationId}`);
      
    } catch (error) {
      console.error(`❌ Error identifying user for conversation ${conversationId}:`, error);
      throw new Error(`Could not determine user_id for conversation ${conversationId}: ${error.message}`);
    }
  }

  /**
   * Determine message type based on both message_type and attachments
   */
  private determineMessageType(payload: ChatwootWebhookPayload): 'text' | 'audio' | 'image' | 'file' {
    // First, try to determine from message_type
    const normalizedType = this.normalizeMessageType(payload.message_type);
    
    // If we have attachments, refine the type based on attachment content
    if (payload.attachments && payload.attachments.length > 0) {
      const attachment = payload.attachments[0]; // Use first attachment to determine type
      const contentType = attachment.content_type || attachment.file_type || '';
      
      console.log(`🔍 Attachment detected: content_type="${contentType}", file_name="${attachment.file_name || attachment.filename}", message_type="${payload.message_type}"`);
      
      if (contentType.startsWith('audio/') || contentType === 'audio') {
        console.log(`🎤 Detected as audio message`);
        return 'audio';
      } else if (contentType.startsWith('image/') || contentType === 'image') {
        console.log(`🖼️ Detected as image message`);
        return 'image';
      } else if (contentType.startsWith('video/') || contentType === 'video' || contentType.includes('document') || contentType.includes('application/') || contentType === 'file') {
        console.log(`📎 Detected as file message`);
        return 'file';
      } else {
        console.log(`⚠️ Unknown content type "${contentType}", using normalized type: ${normalizedType}`);
      }
    }
    
    console.log(`📝 Final message type: ${normalizedType}`);
    return normalizedType;
  }

  private normalizeMessageType(messageType: string): 'text' | 'audio' | 'image' | 'file' {
    switch (messageType?.toLowerCase()) {
      case 'text':
      case 'incoming':
        return 'text';
      case 'audio':
      case 'voice':
        return 'audio';
      case 'image':
      case 'photo':
      case 'picture':
        return 'image';
      case 'file':
      case 'document':
      case 'attachment':
      case 'video': // Videos are treated as files for now
        return 'file';
      default:
        return 'text';
    }
  }

  async getBufferStatus(bufferId: string): Promise<MessageBuffer | null> {
    const { data, error } = await this.supabase
      .from('message_buffer')
      .select('*')
      .eq('id', bufferId)
      .single();

    if (error) {
      console.error('Error getting buffer status:', error);
      return null;
    }

    return data;
  }

  async getBufferedMessages(bufferId: string): Promise<BufferedMessage[]> {
    const { data, error } = await this.supabase
      .from('buffered_messages')
      .select('*')
      .eq('buffer_id', bufferId)
      .order('received_at', { ascending: true });

    if (error) {
      console.error('Error getting buffered messages:', error);
      return [];
    }

    return data || [];
  }

  async isFeatureEnabled(flagName: string): Promise<boolean> {
    const { data } = await this.supabase
      .from('feature_flags')
      .select('is_enabled')
      .eq('flag_name', flagName)
      .single();

    return data?.is_enabled || false;
  }
}

// Main handler
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const bufferManager = new MessageBufferManager(supabase);
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'handle';

    switch (action) {
      case 'handle': {
        if (req.method !== 'POST') {
          return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const payload = await req.json();
        const result = await bufferManager.handleIncomingMessage(payload);

        return new Response(
          JSON.stringify(result),
          { 
            status: result.success ? 200 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'status': {
        const bufferId = url.searchParams.get('buffer_id');
        if (!bufferId) {
          return new Response(
            JSON.stringify({ error: 'buffer_id parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const status = await bufferManager.getBufferStatus(bufferId);
        return new Response(
          JSON.stringify({ buffer: status }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'messages': {
        const bufferId = url.searchParams.get('buffer_id');
        if (!bufferId) {
          return new Response(
            JSON.stringify({ error: 'buffer_id parameter required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const messages = await bufferManager.getBufferedMessages(bufferId);
        return new Response(
          JSON.stringify({ messages }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Buffer manager error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
