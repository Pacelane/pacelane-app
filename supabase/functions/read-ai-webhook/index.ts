import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-read-signature',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface ReadAIWebhookPayload {
  event_type: string;
  meeting_id: string;
  meeting: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    duration_minutes: number;
    platform: string;
    recording_url?: string;
    transcript_url?: string;
    summary_url?: string;
    meeting_url?: string;
    host: {
      email: string;
      name: string;
    };
    participants: Array<{
      id: string;
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
      interruptions_count?: number;
      questions_asked?: number;
    }>;
    topics?: Array<{
      id?: string;
      title: string;
      description?: string;
      start_time_seconds: number;
      end_time_seconds: number;
      duration_seconds: number;
      importance_score?: number;
      keywords?: string[];
      participant_involvement?: Record<string, any>;
      sentiment?: number;
    }>;
    action_items?: Array<{
      id?: string;
      title: string;
      description?: string;
      assignee_name?: string;
      assignee_email?: string;
      due_date?: string;
      priority?: string;
      confidence_score?: number;
      timestamp_in_meeting?: number;
      context_text?: string;
    }>;
    insights?: Record<string, any>;
    analytics?: Record<string, any>;
    transcript_text?: string;
    summary_text?: string;
    key_moments?: Array<any>;
    sentiment_analysis?: Record<string, any>;
  };
  user_email?: string; // To identify which Pacelane user this belongs to
  timestamp: string;
  webhook_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Only POST method is allowed'
      }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get webhook payload
    const payload: ReadAIWebhookPayload = await req.json();
    console.log('Read.ai webhook received:', { 
      event_type: payload.event_type, 
      meeting_id: payload.meeting_id,
      user_email: payload.user_email 
    });

    // Verify webhook signature if enabled
    const signature = req.headers.get('x-read-signature');
    const webhookSecret = Deno.env.get('READ_AI_WEBHOOK_SECRET');
    
    if (webhookSecret && signature) {
      const isValid = await verifyWebhookSignature(
        JSON.stringify(payload), 
        signature, 
        webhookSecret
      );
      
      if (!isValid) {
        console.error('Invalid webhook signature');
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid webhook signature'
        }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Log webhook for debugging
    const { data: webhookLog } = await supabase
      .from('read_ai_webhooks')
      .insert({
        webhook_id: payload.webhook_id,
        event_type: payload.event_type,
        payload: payload,
        signature: signature,
        processing_status: 'processing'
      })
      .select()
      .single();

    try {
      // Find user by email (if provided) or handle user mapping
      let userId: string | null = null;
      
      if (payload.user_email) {
        const { data: user } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', payload.user_email)
          .single();
        
        userId = user?.user_id || null;
      }

      // For now, if no user mapping, we'll store it without user_id
      // In production, you'd want to implement proper user mapping
      if (!userId) {
        console.warn('No user mapping found for email:', payload.user_email);
        // You might want to store these for manual processing
      }

      // Process based on event type
      let result;
      switch (payload.event_type) {
        case 'meeting.completed':
        case 'meeting.processed':
          result = await processMeetingData(supabase, payload, userId);
          break;
        
        case 'meeting.started':
          result = await processMeetingStarted(supabase, payload, userId);
          break;
        
        default:
          console.log('Unhandled event type:', payload.event_type);
          result = { success: true, message: 'Event logged but not processed' };
      }

      // Update webhook log as completed
      if (webhookLog) {
        await supabase
          .from('read_ai_webhooks')
          .update({
            processing_status: 'completed',
            processed_at: new Date().toISOString(),
            user_id: userId,
            meeting_id: result.meetingId
          })
          .eq('id', webhookLog.id);
      }

      return new Response(JSON.stringify({
        success: true,
        message: result.message,
        event_type: payload.event_type
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (processingError) {
      console.error('Error processing webhook:', processingError);
      
      // Update webhook log as failed
      if (webhookLog) {
        await supabase
          .from('read_ai_webhooks')
          .update({
            processing_status: 'failed',
            error_message: processingError.message,
            processed_at: new Date().toISOString()
          })
          .eq('id', webhookLog.id);
      }

      throw processingError;
    }

  } catch (error) {
    console.error('Error in read-ai-webhook function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Process completed meeting data
async function processMeetingData(supabase: any, payload: ReadAIWebhookPayload, userId: string | null) {
  const meeting = payload.meeting;
  
  // Insert meeting data
  const { data: meetingRecord, error: meetingError } = await supabase
    .from('read_ai_meetings')
    .upsert({
      user_id: userId,
      meeting_id: meeting.id,
      title: meeting.title,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      duration_minutes: meeting.duration_minutes,
      platform: meeting.platform,
      recording_url: meeting.recording_url,
      transcript_url: meeting.transcript_url,
      summary_url: meeting.summary_url,
      meeting_url: meeting.meeting_url,
      host_email: meeting.host.email,
      host_name: meeting.host.name,
      participants: meeting.participants,
      topics: meeting.topics || [],
      action_items: meeting.action_items || [],
      insights: meeting.insights || {},
      analytics: meeting.analytics || {},
      transcript_text: meeting.transcript_text,
      summary_text: meeting.summary_text,
      key_moments: meeting.key_moments || [],
      sentiment_analysis: meeting.sentiment_analysis || {},
      webhook_data: payload
    }, { onConflict: 'meeting_id' })
    .select()
    .single();

  if (meetingError) {
    throw new Error(`Failed to store meeting: ${meetingError.message}`);
  }

  // Process participants
  if (meeting.participants?.length > 0) {
    const participantRecords = meeting.participants.map(participant => ({
      meeting_id: meetingRecord.id,
      participant_id: participant.id,
      name: participant.name,
      email: participant.email,
      is_host: participant.is_host,
      is_guest: participant.is_guest,
      join_time: participant.join_time,
      leave_time: participant.leave_time,
      speaking_time_seconds: participant.speaking_time_seconds,
      participation_score: participant.participation_score,
      sentiment_score: participant.sentiment_score,
      talk_ratio: participant.talk_ratio,
      interruptions_count: participant.interruptions_count,
      questions_asked: participant.questions_asked
    }));

    await supabase
      .from('read_ai_participants')
      .upsert(participantRecords, { onConflict: 'meeting_id,participant_id' });
  }

  // Process action items
  if (meeting.action_items?.length > 0) {
    const actionItemRecords = meeting.action_items.map(item => ({
      meeting_id: meetingRecord.id,
      action_item_id: item.id,
      title: item.title,
      description: item.description,
      assignee_name: item.assignee_name,
      assignee_email: item.assignee_email,
      due_date: item.due_date,
      priority: item.priority || 'medium',
      confidence_score: item.confidence_score,
      timestamp_in_meeting: item.timestamp_in_meeting,
      context_text: item.context_text
    }));

    await supabase
      .from('read_ai_action_items')
      .upsert(actionItemRecords, { onConflict: 'meeting_id,action_item_id' });
  }

  // Process topics
  if (meeting.topics?.length > 0) {
    const topicRecords = meeting.topics.map(topic => ({
      meeting_id: meetingRecord.id,
      topic_id: topic.id,
      title: topic.title,
      description: topic.description,
      start_time_seconds: topic.start_time_seconds,
      end_time_seconds: topic.end_time_seconds,
      duration_seconds: topic.duration_seconds,
      importance_score: topic.importance_score,
      keywords: topic.keywords || [],
      participant_involvement: topic.participant_involvement || {},
      sentiment: topic.sentiment
    }));

    await supabase
      .from('read_ai_topics')
      .upsert(topicRecords, { onConflict: 'meeting_id,topic_id' });
  }

  console.log(`Processed meeting: ${meeting.title} (${meeting.id})`);
  
  return {
    success: true,
    message: `Meeting data processed successfully`,
    meetingId: meetingRecord.id
  };
}

// Process meeting started event (for real-time updates)
async function processMeetingStarted(supabase: any, payload: ReadAIWebhookPayload, userId: string | null) {
  const meeting = payload.meeting;
  
  // Store basic meeting info when started
  const { data: meetingRecord } = await supabase
    .from('read_ai_meetings')
    .upsert({
      user_id: userId,
      meeting_id: meeting.id,
      title: meeting.title,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      duration_minutes: 0, // Will be updated when completed
      platform: meeting.platform,
      host_email: meeting.host.email,
      host_name: meeting.host.name,
      webhook_data: payload
    }, { onConflict: 'meeting_id' })
    .select()
    .single();

  console.log(`Meeting started: ${meeting.title} (${meeting.id})`);
  
  return {
    success: true,
    message: `Meeting started event processed`,
    meetingId: meetingRecord?.id
  };
}

// Verify webhook signature using HMAC-SHA256
async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const providedSignature = signature.replace('sha256=', '');
    
    return expectedSignatureHex === providedSignature;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}
