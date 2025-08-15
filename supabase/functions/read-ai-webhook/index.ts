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
  session_id: string;
  trigger: string;
  title: string;
  start_time: string;
  end_time: string;
  participants: Array<{
    name: string;
    email: string;
  }>;
  owner: {
    name: string;
    email: string;
  };
  summary: string;
  action_items: Array<{
    text: string;
  }>;
  key_questions: Array<{
    text: string;
  }>;
  topics: Array<{
    text: string;
  }>;
  report_url: string;
  chapter_summaries: Array<{
    title: string;
    description: string;
    topics: Array<{
      text: string;
    }>;
  }>;
  transcript: {
    speakers: Array<{
      name: string;
    }>;
    speaker_blocks: Array<{
      start_time: string;
      end_time: string;
      speaker: {
        name: string;
      };
      words: string;
    }>;
  };
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
      trigger: payload.trigger, 
      session_id: payload.session_id,
      owner_email: payload.owner.email 
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
        webhook_id: payload.session_id,
        event_type: payload.trigger,
        payload: payload,
        signature: signature,
        processing_status: 'processing'
      })
      .select()
      .single();

    try {
      // Find user by email (owner email from Read.ai)
      let userId: string | null = null;
      
      if (payload.owner.email) {
        console.log(`🔍 Looking for user with email: ${payload.owner.email}`);
        
        try {
          const { data: user, error } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', payload.owner.email)
            .single();
          
          if (error) {
            if (error.code === 'PGRST116') {
              // No rows returned - user not found
              console.warn(`⚠️ No user found for email: ${payload.owner.email}`);
            } else {
              console.error(`❌ Database error finding user:`, error);
            }
          } else if (user && user.user_id) {
            userId = user.user_id;
            console.log(`✅ Found user: ${userId} for email: ${payload.owner.email}`);
          }
        } catch (userError) {
          console.error(`❌ Error in user lookup:`, userError);
        }
      }

      // For now, if no user mapping, we'll store it without user_id
      // In production, you'd want to implement proper user mapping
      if (!userId) {
        console.warn('⚠️ No user mapping found for email:', payload.owner.email);
        // You might want to store these for manual processing
      } else {
        console.log(`✅ Processing webhook for user: ${userId}`);
      }

      // Process based on trigger type
      let result;
      switch (payload.trigger) {
        case 'meeting_end':
          result = await processMeetingData(supabase, payload, userId);
          break;
        
        default:
          console.log('Unhandled trigger type:', payload.trigger);
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
        trigger: payload.trigger
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
  // Calculate duration in minutes
  const startTime = new Date(payload.start_time);
  const endTime = new Date(payload.end_time);
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

  // Build transcript text from speaker blocks
  const transcriptText = payload.transcript?.speaker_blocks
    ?.map(block => `${block.speaker.name}: ${block.words}`)
    .join('\n') || '';

  // Insert meeting data
  const { data: meetingRecord, error: meetingError } = await supabase
    .from('read_ai_meetings')
    .upsert({
      user_id: userId,
      meeting_id: payload.session_id,
      title: payload.title,
      start_time: payload.start_time,
      end_time: payload.end_time,
      duration_minutes: durationMinutes,
      platform: 'unknown', // Read.ai doesn't specify platform in webhook
      recording_url: null,
      transcript_url: null,
      summary_url: payload.report_url,
      meeting_url: payload.report_url,
      host_email: payload.owner.email,
      host_name: payload.owner.name,
      participants: payload.participants,
      topics: payload.topics,
      action_items: payload.action_items,
      insights: { chapter_summaries: payload.chapter_summaries },
      analytics: { speakers: payload.transcript?.speakers || [] },
      transcript_text: transcriptText,
      summary_text: payload.summary,
      key_moments: payload.key_questions || [],
      sentiment_analysis: {},
      webhook_data: payload
    }, { onConflict: 'meeting_id' })
    .select()
    .single();

  if (meetingError) {
    throw new Error(`Failed to store meeting: ${meetingError.message}`);
  }

  // Process participants
  if (payload.participants?.length > 0) {
    const participantRecords = payload.participants.map((participant, index) => ({
      meeting_id: meetingRecord.id,
      participant_id: `${payload.session_id}-participant-${index}`,
      name: participant.name,
      email: participant.email,
      is_host: participant.email === payload.owner.email,
      is_guest: false,
      join_time: payload.start_time,
      leave_time: payload.end_time,
      speaking_time_seconds: 0, // Read.ai doesn't provide this in webhook
      participation_score: null,
      sentiment_score: null,
      talk_ratio: null,
      interruptions_count: 0,
      questions_asked: 0
    }));

    await supabase
      .from('read_ai_participants')
      .upsert(participantRecords, { onConflict: 'meeting_id,participant_id' });
  }

  // Process action items
  if (payload.action_items?.length > 0) {
    const actionItemRecords = payload.action_items.map((item, index) => ({
      meeting_id: meetingRecord.id,
      action_item_id: `${payload.session_id}-action-${index}`,
      title: item.text,
      description: null,
      assignee_name: null,
      assignee_email: null,
      due_date: null,
      priority: 'medium',
      confidence_score: null,
      timestamp_in_meeting: null,
      context_text: null
    }));

    await supabase
      .from('read_ai_action_items')
      .upsert(actionItemRecords, { onConflict: 'meeting_id,action_item_id' });
  }

  // Process topics
  if (payload.topics?.length > 0) {
    const topicRecords = payload.topics.map((topic, index) => ({
      meeting_id: meetingRecord.id,
      topic_id: `${payload.session_id}-topic-${index}`,
      title: topic.text,
      description: null,
      start_time_seconds: 0,
      end_time_seconds: durationMinutes * 60,
      duration_seconds: durationMinutes * 60,
      importance_score: null,
      keywords: [],
      participant_involvement: {},
      sentiment: null
    }));

    await supabase
      .from('read_ai_topics')
      .upsert(topicRecords, { onConflict: 'meeting_id,topic_id' });
  }

  // NEW: Call transcript-processor to store transcript in knowledge base
  if (userId && transcriptText) {
    try {
      console.log(`🔄 Calling transcript-processor for user ${userId} and session ${payload.session_id}`);
      
      const transcriptProcessorUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/transcript-processor`;
      const response = await fetch(transcriptProcessorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          owner: {
            email: payload.owner.email
          },
          transcript: {
            speakers: payload.transcript?.speakers || [],
            speaker_blocks: payload.transcript?.speaker_blocks || []
          },
          session_id: payload.session_id,
          title: payload.title,
          start_time: payload.start_time,
          end_time: payload.end_time
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Transcript processed successfully:`, result);
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Transcript processing failed: ${response.status} - ${errorText}`);
      }
    } catch (transcriptError) {
      console.warn(`⚠️ Failed to call transcript-processor:`, transcriptError);
      // Don't fail the entire webhook if transcript processing fails
    }
  }

  console.log(`Processed Read.ai meeting: ${payload.title} (${payload.session_id})`);
  
  return {
    success: true,
    message: `Read.ai meeting data processed successfully`,
    meetingId: meetingRecord.id
  };
}

// Process meeting started event (for real-time updates)
async function processMeetingStarted(supabase: any, payload: ReadAIWebhookPayload, userId: string | null) {
  // Store basic meeting info when started
  const { data: meetingRecord } = await supabase
    .from('read_ai_meetings')
    .upsert({
      user_id: userId,
      meeting_id: payload.session_id,
      title: payload.title,
      start_time: payload.start_time,
      end_time: payload.end_time,
      duration_minutes: 0, // Will be updated when completed
      platform: 'unknown',
      host_email: payload.owner.email,
      host_name: payload.owner.name,
      webhook_data: payload
    }, { onConflict: 'meeting_id' })
    .select()
    .single();

  console.log(`Read.ai meeting started: ${payload.title} (${payload.session_id})`);
  
  return {
    success: true,
    message: `Read.ai meeting started event processed`,
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
