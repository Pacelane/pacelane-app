import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Types
interface ChatwootWebhookPayload {
  id: number;
  content?: string;
  message_type: string;
  content_type?: string;
  content_attributes?: any;
  attachments?: any[];
  conversation: {
    id: number;
    status: string;
    channel: string;
    messages_count: number;
    meta?: any;
  };
  sender: {
    id: number;
    name: string;
    phone_number?: string;
    identifier?: string;
    email?: string;
  };
  account: {
    id: number;
    name: string;
  };
  created_at: string;
  event: string;
  message_created?: boolean;
}

interface ValidationResult {
  isValid: boolean;
  reason?: string;
  shouldProcess: boolean;
}

class ChatwootWebhookV2Processor {
  private readonly REQUIRED_CHANNEL = 'Channel::Whatsapp';
  private readonly REQUIRED_EVENT = 'message_created';
  private readonly BUFFER_MANAGER_URL: string;

  constructor(private supabase: any) {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    this.BUFFER_MANAGER_URL = `${supabaseUrl}/functions/v1/message-buffer-manager`;
  }

  async handleWebhook(payload: ChatwootWebhookPayload): Promise<Response> {
    try {
      console.log(`Received webhook for message ${payload.id}, event: ${payload.event}`);
      
      // Validate the webhook payload
      const validation = await this.validateWebhook(payload);
      if (!validation.isValid) {
        console.log(`Webhook validation failed: ${validation.reason}`);
        return this.createResponse({
          success: true,
          action: 'skipped',
          reason: validation.reason
        });
      }

      if (!validation.shouldProcess) {
        console.log(`Webhook should not be processed: ${validation.reason}`);
        return this.createResponse({
          success: true,
          action: 'ignored',
          reason: validation.reason
        });
      }

      // Check if message buffering is enabled
      const bufferingEnabled = await this.isFeatureEnabled('message_buffering');
      if (!bufferingEnabled) {
        console.log('Message buffering is disabled, falling back to immediate processing');
        return await this.fallbackToImmediateProcessing(payload);
      }

      // Send message to buffer manager
      const bufferResult = await this.sendToBufferManager(payload);
      
      if (!bufferResult.success) {
        console.error('Buffer manager failed, attempting fallback processing');
        return await this.fallbackToImmediateProcessing(payload);
      }

      console.log(`Message ${payload.id} successfully buffered: ${bufferResult.message}`);
      
      return this.createResponse({
        success: true,
        action: 'buffered',
        message: bufferResult.message,
        buffer_id: bufferResult.bufferId
      });

    } catch (error) {
      console.error('Webhook processing error:', error);
      
      // Attempt fallback processing on error
      try {
        return await this.fallbackToImmediateProcessing(payload);
      } catch (fallbackError) {
        console.error('Fallback processing also failed:', fallbackError);
        return this.createResponse({
          success: false,
          action: 'error',
          message: `Both buffer and fallback processing failed: ${error.message}`
        }, 500);
      }
    }
  }

  private async validateWebhook(payload: ChatwootWebhookPayload): Promise<ValidationResult> {
    // Check if it's a message creation event
    if (payload.event !== this.REQUIRED_EVENT) {
      return {
        isValid: true,
        shouldProcess: false,
        reason: `Event ${payload.event} is not ${this.REQUIRED_EVENT}`
      };
    }

    // Check if it's from WhatsApp channel
    if (payload.conversation?.channel !== this.REQUIRED_CHANNEL) {
      return {
        isValid: true,
        shouldProcess: false,
        reason: `Channel ${payload.conversation?.channel} is not WhatsApp`
      };
    }

    // Check if it's an incoming message (not outgoing)
    if (payload.message_type === 'outgoing') {
      return {
        isValid: true,
        shouldProcess: false,
        reason: 'Outgoing message, not processing'
      };
    }

    // Check if message has content or attachments
    const hasContent = payload.content && payload.content.trim().length > 0;
    const hasAttachments = payload.attachments && payload.attachments.length > 0;
    
    if (!hasContent && !hasAttachments) {
      return {
        isValid: true,
        shouldProcess: false,
        reason: 'Message has no content or attachments'
      };
    }

    // Check if conversation is active
    if (payload.conversation?.status !== 'open') {
      return {
        isValid: true,
        shouldProcess: false,
        reason: `Conversation status is ${payload.conversation?.status}, not open`
      };
    }

    // Check if sender information is available
    if (!payload.sender?.id) {
      return {
        isValid: false,
        reason: 'Missing sender information'
      };
    }

    // Check if conversation information is available
    if (!payload.conversation?.id) {
      return {
        isValid: false,
        reason: 'Missing conversation information'
      };
    }

    return {
      isValid: true,
      shouldProcess: true
    };
  }

  private async sendToBufferManager(payload: ChatwootWebhookPayload): Promise<any> {
    try {
      const response = await fetch(`${this.BUFFER_MANAGER_URL}?action=handle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Buffer manager responded with ${response.status}: ${await response.text()}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling buffer manager:', error);
      throw error;
    }
  }

  private async fallbackToImmediateProcessing(payload: ChatwootWebhookPayload): Promise<Response> {
    console.log('Attempting fallback to immediate processing');
    
    try {
      // Call the original webhook handler as fallback
      const originalWebhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/chatwoot-webhook`;
      
      const response = await fetch(originalWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      return this.createResponse({
        success: true,
        action: 'fallback_processed',
        message: 'Processed via fallback to original webhook',
        original_result: result
      });
      
    } catch (error) {
      console.error('Fallback processing failed:', error);
      throw error;
    }
  }

  private async isFeatureEnabled(flagName: string): Promise<boolean> {
    try {
      const { data } = await this.supabase
        .from('feature_flags')
        .select('is_enabled')
        .eq('flag_name', flagName)
        .single();

      return data?.is_enabled || false;
    } catch (error) {
      console.error(`Error checking feature flag ${flagName}:`, error);
      return false; // Default to disabled on error
    }
  }

  private createResponse(data: any, status: number = 200): Response {
    return new Response(
      JSON.stringify(data),
      {
        status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
        }
      }
    );
  }

  async logWebhookActivity(payload: ChatwootWebhookPayload, action: string, result: any): Promise<void> {
    try {
      await this.supabase
        .from('webhook_logs')
        .insert({
          webhook_type: 'chatwoot_v2',
          message_id: payload.id,
          conversation_id: payload.conversation?.id,
          sender_id: payload.sender?.id,
          action,
          payload: payload,
          result,
          processed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error logging webhook activity:', error);
      // Don't throw - logging failures shouldn't break the main flow
    }
  }
}

// Health check endpoint
async function handleHealthCheck(): Promise<Response> {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Test database connection
    const { data, error } = await supabase
      .from('feature_flags')
      .select('flag_name')
      .limit(1);

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0',
        features: {
          message_buffering: true,
          fallback_processing: true,
          webhook_validation: true
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
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
    const url = new URL(req.url);
    
    // Health check endpoint
    if (url.pathname.includes('/health') || req.method === 'GET') {
      return await handleHealthCheck();
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const processor = new ChatwootWebhookV2Processor(supabase);
    const payload = await req.json();

    console.log('Chatwoot Webhook V2 - Processing payload:', {
      messageId: payload.id,
      event: payload.event,
      messageType: payload.message_type,
      conversationId: payload.conversation?.id,
      channel: payload.conversation?.channel
    });

    const response = await processor.handleWebhook(payload);
    
    // Log the webhook activity (fire and forget)
    const responseData = await response.clone().json();
    processor.logWebhookActivity(payload, responseData.action, responseData).catch(console.error);
    
    return response;

  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
