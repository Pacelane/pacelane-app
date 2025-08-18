import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

// CORS headers for webhook endpoint
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-slack-signature, x-slack-request-timestamp',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Slack webhook configuration
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';

// Supported event types for customer support
const SUPPORTED_EVENTS = [
  'user_error',
  'system_error', 
  'integration_failure',
  'content_generation_failure',
  'authentication_issue',
  'billing_issue',
  'feature_request',
  'bug_report',
  'general_support'
];

// Severity levels for support tickets
type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

interface SupportTicket {
  id?: string;
  user_id?: string;
  user_email?: string;
  event_type: string;
  severity: SeverityLevel;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  error_details?: {
    error_message?: string;
    stack_trace?: string;
    request_id?: string;
    function_name?: string;
    timestamp?: string;
  };
  user_context?: {
    user_agent?: string;
    ip_address?: string;
    page_url?: string;
    session_id?: string;
  };
  created_at?: string;
}

interface SlackMessage {
  text: string;
  blocks?: Array<any>;
  attachments?: Array<{
    color: string;
    fields: Array<{
      title: string;
      value: string;
      short: boolean;
    }>;
    footer?: string;
    ts?: number;
  }>;
}

class CustomerSupportSlackProcessor {
  private supabase: any;
  private supabaseUrl: string;
  private supabaseServiceKey: string;

  constructor() {
    // Initialize Supabase configuration
    this.supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    this.supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    
    // Initialize Supabase client with service role key for admin access
    this.supabase = createClient(
      this.supabaseUrl,
      this.supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  /**
   * Validate support ticket payload structure
   */
  private validatePayload(payload: any): payload is SupportTicket {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const required = ['event_type', 'severity', 'title', 'description'];
    return required.every(field => payload.hasOwnProperty(field));
  }

  /**
   * Check if event type is supported
   */
  private isSupportedEvent(eventType: string): boolean {
    return SUPPORTED_EVENTS.includes(eventType);
  }

  /**
   * Get severity color for Slack message
   */
  private getSeverityColor(severity: SeverityLevel): string {
    const colors = {
      low: '#36a64f',      // Green
      medium: '#ff9500',   // Orange  
      high: '#ff4444',     // Red
      critical: '#8B0000'  // Dark Red
    };
    return colors[severity] || colors.medium;
  }

  /**
   * Get severity emoji for Slack message
   */
  private getSeverityEmoji(severity: SeverityLevel): string {
    const emojis = {
      low: '🟢',
      medium: '🟡', 
      high: '🔴',
      critical: '🚨'
    };
    return emojis[severity] || emojis.medium;
  }

  /**
   * Get event type emoji for better visual identification
   */
  private getEventTypeEmoji(eventType: string): string {
    const emojis: Record<string, string> = {
      user_error: '👤',
      system_error: '⚠️',
      integration_failure: '🔌',
      content_generation_failure: '📝',
      authentication_issue: '🔐',
      billing_issue: '💳',
      feature_request: '💡',
      bug_report: '🐛',
      general_support: '❓'
    };
    return emojis[eventType] || '📋';
  }

  /**
   * Store support ticket in database
   */
  private async storeSupportTicket(ticket: SupportTicket): Promise<{ success: boolean; ticketId?: string; error?: string }> {
    try {
      const ticketData = {
        user_id: ticket.user_id || null,
        user_email: ticket.user_email || null,
        event_type: ticket.event_type,
        severity: ticket.severity,
        title: ticket.title,
        description: ticket.description,
        metadata: ticket.metadata || {},
        error_details: ticket.error_details || {},
        user_context: ticket.user_context || {},
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('customer_support_tickets')
        .insert([ticketData])
        .select()
        .single();

      if (error) {
        console.error('Database insert error for support ticket:', error);
        return { 
          success: false, 
          error: `Failed to store ticket: ${error.message}` 
        };
      }

      console.log('Support ticket stored in database:', data.id);
      return { 
        success: true, 
        ticketId: data.id 
      };

    } catch (error) {
      console.error('Error storing support ticket:', error);
      return { 
        success: false, 
        error: `Database error: ${error.message}` 
      };
    }
  }

  /**
   * Build Slack message from support ticket
   */
  private buildSlackMessage(ticket: SupportTicket, ticketId?: string): SlackMessage {
    const severityEmoji = this.getSeverityEmoji(ticket.severity);
    const eventEmoji = this.getEventTypeEmoji(ticket.event_type);
    const severityColor = this.getSeverityColor(ticket.severity);
    
    // Main message text
    const mainText = `${severityEmoji} New ${ticket.severity.toUpperCase()} support ticket: ${ticket.title}`;
    
    // Build attachment fields
    const fields = [
      {
        title: 'Event Type',
        value: `${eventEmoji} ${ticket.event_type.replace('_', ' ').toUpperCase()}`,
        short: true
      },
      {
        title: 'Severity',
        value: `${severityEmoji} ${ticket.severity.toUpperCase()}`,
        short: true
      }
    ];

    // Add user information if available
    if (ticket.user_email) {
      fields.push({
        title: 'User Email',
        value: ticket.user_email,
        short: true
      });
    }

    if (ticket.user_id) {
      fields.push({
        title: 'User ID',
        value: ticket.user_id,
        short: true
      });
    }

    // Add ticket ID if available
    if (ticketId) {
      fields.push({
        title: 'Ticket ID',
        value: ticketId,
        short: true
      });
    }

    // Add error details if available
    if (ticket.error_details?.error_message) {
      fields.push({
        title: 'Error Message',
        value: `\`\`\`${ticket.error_details.error_message}\`\`\``,
        short: false
      });
    }

    if (ticket.error_details?.function_name) {
      fields.push({
        title: 'Function',
        value: ticket.error_details.function_name,
        short: true
      });
    }

    if (ticket.error_details?.request_id) {
      fields.push({
        title: 'Request ID',
        value: ticket.error_details.request_id,
        short: true
      });
    }

    // Add user context if available
    if (ticket.user_context?.page_url) {
      fields.push({
        title: 'Page URL',
        value: ticket.user_context.page_url,
        short: false
      });
    }

    const slackMessage: SlackMessage = {
      text: mainText,
      attachments: [
        {
          color: severityColor,
          fields: [
            {
              title: 'Description',
              value: ticket.description,
              short: false
            },
            ...fields
          ],
          footer: 'Pacelane Customer Support',
          ts: Math.floor(Date.now() / 1000)
        }
      ]
    };

    // Add stack trace as a separate attachment if available
    if (ticket.error_details?.stack_trace) {
      slackMessage.attachments!.push({
        color: '#ff0000',
        fields: [
          {
            title: 'Stack Trace',
            value: `\`\`\`${ticket.error_details.stack_trace.substring(0, 1000)}\`\`\``,
            short: false
          }
        ]
      });
    }

    return slackMessage;
  }

  /**
   * Send message to Slack webhook
   */
  private async sendToSlack(message: SlackMessage): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Sending message to Slack:', JSON.stringify(message, null, 2));

      const response = await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Slack webhook failed: ${response.status} ${response.statusText} - ${errorText}`);
        return { 
          success: false, 
          error: `Slack API error: ${response.status} ${response.statusText}` 
        };
      }

      console.log('Successfully sent message to Slack');
      return { success: true };

    } catch (error) {
      console.error('Error sending to Slack:', error);
      return { 
        success: false, 
        error: `Network error: ${error.message}` 
      };
    }
  }

  /**
   * Process support ticket webhook payload
   */
  async processSupportTicket(payload: SupportTicket): Promise<{ success: boolean; message: string; ticketId?: string }> {
    console.log('Processing customer support ticket:', payload.event_type, payload.severity);

    // Validate payload
    if (!this.validatePayload(payload)) {
      return { success: false, message: 'Invalid support ticket payload structure' };
    }

    // Check if event type is supported
    if (!this.isSupportedEvent(payload.event_type)) {
      return { 
        success: false, 
        message: `Unsupported event type: ${payload.event_type}. Supported types: ${SUPPORTED_EVENTS.join(', ')}` 
      };
    }

    try {
      // Store ticket in database
      const storeResult = await this.storeSupportTicket(payload);
      if (!storeResult.success) {
        console.error('Failed to store support ticket:', storeResult.error);
        // Continue to send to Slack even if database storage fails
      }

      // Build Slack message
      const slackMessage = this.buildSlackMessage(payload, storeResult.ticketId);

      // Send to Slack
      const slackResult = await this.sendToSlack(slackMessage);
      if (!slackResult.success) {
        return { 
          success: false, 
          message: `Failed to send to Slack: ${slackResult.error}`,
          ticketId: storeResult.ticketId
        };
      }

      console.log('✅ Support ticket processed successfully');
      return {
        success: true,
        message: 'Support ticket processed and sent to Slack successfully',
        ticketId: storeResult.ticketId
      };

    } catch (error) {
      console.error('Error processing support ticket:', error);
      return {
        success: false,
        message: `Processing error: ${error.message}`
      };
    }
  }

  /**
   * Create support ticket from error information
   */
  async createErrorTicket(
    errorMessage: string,
    errorDetails: Record<string, any> = {},
    userContext: Record<string, any> = {}
  ): Promise<{ success: boolean; message: string; ticketId?: string }> {
    const ticket: SupportTicket = {
      event_type: 'system_error',
      severity: 'high',
      title: `System Error: ${errorMessage.substring(0, 100)}`,
      description: errorMessage,
      error_details: {
        error_message: errorMessage,
        ...errorDetails
      },
      user_context: userContext,
      user_id: userContext.user_id || null,
      user_email: userContext.user_email || null
    };

    return await this.processSupportTicket(ticket);
  }

  /**
   * Create support ticket from user feedback
   */
  async createFeedbackTicket(
    title: string,
    description: string,
    eventType: string = 'general_support',
    severity: SeverityLevel = 'medium',
    userId?: string,
    userEmail?: string,
    metadata: Record<string, any> = {}
  ): Promise<{ success: boolean; message: string; ticketId?: string }> {
    const ticket: SupportTicket = {
      event_type: eventType,
      severity: severity,
      title: title,
      description: description,
      metadata: metadata,
      user_id: userId,
      user_email: userEmail
    };

    return await this.processSupportTicket(ticket);
  }
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Parse webhook payload
    const payload = await req.json();
    
    console.log('Received customer support webhook payload:', JSON.stringify(payload, null, 2));
    
    // Initialize processor
    const processor = new CustomerSupportSlackProcessor();
    
    // Check if this is a direct support ticket or needs to be created from other data
    let result;
    
    if (payload.event_type && payload.severity && payload.title && payload.description) {
      // Direct support ticket
      result = await processor.processSupportTicket(payload);
    } else if (payload.error_message || payload.error) {
      // Error information that needs to be converted to a ticket
      const errorMessage = payload.error_message || payload.error || 'Unknown error occurred';
      result = await processor.createErrorTicket(errorMessage, payload.error_details || {}, payload.user_context || {});
    } else if (payload.title && payload.description) {
      // User feedback or general support request
      result = await processor.createFeedbackTicket(
        payload.title,
        payload.description,
        payload.event_type || 'general_support',
        payload.severity || 'medium',
        payload.user_id,
        payload.user_email,
        payload.metadata || {}
      );
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid payload: missing required fields. Need either (event_type, severity, title, description) or (error_message) or (title, description)' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return response
    const status = result.success ? 200 : 400;
    return new Response(
      JSON.stringify(result),
      { 
        status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Customer support webhook processing error:', error);
    
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
