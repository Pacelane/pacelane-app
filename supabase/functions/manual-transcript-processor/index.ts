import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ManualTranscriptRequest {
  title: string;
  transcript: string;
  source: string; // 'manual_paste'
  meeting_date?: string;
  participants?: string[];
  duration_minutes?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    // Parse request body
    const body: ManualTranscriptRequest = await req.json();
    const { title, transcript, source, meeting_date, participants = [], duration_minutes } = body;

    // Validate required fields
    if (!title || !transcript || !source) {
      throw new Error('Missing required fields: title, transcript, source');
    }

    // Validate transcript content
    if (transcript.length < 100) {
      throw new Error('Transcript is too short. Minimum 100 characters required.');
    }

    if (transcript.length > 50000) {
      throw new Error('Transcript is too long. Maximum 50,000 characters allowed.');
    }

    console.log(`📝 Processing manual transcript for user ${user.id}: "${title}"`);

    // Generate a unique meeting_id for this manual transcript
    const meetingId = `manual-${Date.now()}-${user.id.slice(0, 8)}`;
    
    // Calculate meeting times
    const now = new Date();
    const startTime = meeting_date ? new Date(meeting_date) : now;
    const endTime = new Date(startTime.getTime() + (duration_minutes || 60) * 60 * 1000);

    // Parse transcript to extract speaker blocks (simple format)
    const speakerBlocks = parseTranscriptToSpeakerBlocks(transcript);
    const extractedParticipants = extractParticipantsFromTranscript(transcript, participants);

    // Calculate actual duration from transcript if not provided
    const calculatedDuration = duration_minutes || Math.max(estimateDurationFromTranscript(transcript), 30);

    // Store in read_ai_meetings table (same structure as webhook)
    const { data: meetingRecord, error: meetingError } = await supabaseClient
      .from('read_ai_meetings')
      .insert({
        user_id: user.id,
        meeting_id: meetingId,
        title: title,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: calculatedDuration,
        platform: 'manual_upload',
        recording_url: null,
        transcript_url: null,
        summary_url: null,
        meeting_url: null,
        host_email: user.email || null,
        host_name: extractedParticipants.length > 0 ? extractedParticipants[0] : 'Host',
        participants: extractedParticipants.map(name => ({
          name: name,
          email: null,
          role: 'participant'
        })),
        topics: extractTopicsFromTranscript(transcript),
        action_items: extractActionItemsFromTranscript(transcript),
        insights: { manual_upload: true },
        analytics: { 
          speakers: extractedParticipants.map(name => ({ name, speaking_time: 0 })),
          total_speakers: extractedParticipants.length
        },
        transcript_text: transcript,
        summary_text: generateSummaryFromTranscript(transcript, title),
        key_moments: [],
        sentiment_analysis: {},
        webhook_data: {
          source: 'manual_upload',
          uploaded_by: user.id,
          uploaded_at: now.toISOString(),
          original_title: title,
          processing_method: 'manual_transcript_processor'
        }
      })
      .select()
      .single();

    if (meetingError) {
      console.error('❌ Error storing meeting record:', meetingError);
      throw new Error(`Failed to store meeting: ${meetingError.message}`);
    }

    console.log(`✅ Meeting record stored with ID: ${meetingRecord.id}`);

    // Call transcript-processor to also store in knowledge_files table
    // This ensures it appears in the knowledge base like webhook transcripts
    try {
      console.log(`🔄 Calling transcript-processor for knowledge base storage`);
      
      const transcriptProcessorUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/transcript-processor`;
      const response = await fetch(transcriptProcessorUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        },
        body: JSON.stringify({
          owner: {
            email: user.email || 'unknown@manual.upload'
          },
          transcript: {
            speakers: extractedParticipants.map(name => ({ name })),
            speaker_blocks: speakerBlocks
          },
          session_id: meetingId,
          title: title,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Transcript processed for knowledge base:`, result);
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Knowledge base processing failed: ${response.status} - ${errorText}`);
      }
    } catch (transcriptError) {
      console.warn(`⚠️ Failed to call transcript-processor:`, transcriptError);
      // Don't fail the whole request if knowledge base storage fails
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Meeting transcript processed successfully',
      data: {
        meeting_id: meetingRecord.id,
        meeting_title: title,
        duration_minutes: calculatedDuration,
        participants: extractedParticipants.length,
        storage: {
          meetings_table: true,
          knowledge_base: true
        }
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Error in manual-transcript-processor:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Parse transcript text into speaker blocks similar to Read.ai format
 */
function parseTranscriptToSpeakerBlocks(transcript: string): Array<{ speaker: { name: string }, words: string }> {
  const blocks: Array<{ speaker: { name: string }, words: string }> = [];
  const lines = transcript.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try different speaker patterns
    let match = trimmed.match(/^([^:]+):\s*(.+)$/); // Speaker: Text
    if (!match) {
      match = trimmed.match(/^\[[\d:]+\]\s*([^:]+):\s*(.+)$/); // [timestamp] Speaker: Text
    }
    if (!match) {
      match = trimmed.match(/^([^(]+)\s*\([\d:]+\):\s*(.+)$/); // Speaker (timestamp): Text
    }

    if (match) {
      const speakerName = match[1].trim();
      const words = match[2].trim();
      
      if (speakerName && words) {
        blocks.push({
          speaker: { name: speakerName },
          words: words
        });
      }
    }
  }

  return blocks;
}

/**
 * Extract participant names from transcript
 */
function extractParticipantsFromTranscript(transcript: string, providedParticipants: string[]): string[] {
  const participants = new Set<string>(providedParticipants);
  const speakerBlocks = parseTranscriptToSpeakerBlocks(transcript);

  for (const block of speakerBlocks) {
    participants.add(block.speaker.name);
  }

  return Array.from(participants).slice(0, 20); // Limit to 20 participants max
}

/**
 * Extract topics from transcript content
 */
function extractTopicsFromTranscript(transcript: string): Array<{ text: string }> {
  const topics = new Set<string>();
  const text = transcript.toLowerCase();

  // Common business/meeting keywords that might indicate topics
  const topicKeywords = [
    'project', 'strategy', 'goals', 'objectives', 'timeline', 'budget', 'revenue',
    'growth', 'market', 'customer', 'product', 'feature', 'launch', 'team',
    'hiring', 'performance', 'metrics', 'analytics', 'roadmap', 'vision',
    'quarterly', 'monthly', 'weekly', 'planning', 'review', 'update'
  ];

  for (const keyword of topicKeywords) {
    if (text.includes(keyword)) {
      topics.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  }

  return Array.from(topics).slice(0, 10).map(topic => ({ text: topic }));
}

/**
 * Extract action items from transcript
 */
function extractActionItemsFromTranscript(transcript: string): Array<{ text: string, assignee?: string }> {
  const actionItems: Array<{ text: string, assignee?: string }> = [];
  const lines = transcript.split('\n');

  for (const line of lines) {
    const text = line.toLowerCase().trim();
    
    // Look for action-oriented language
    if (text.includes('action item') || 
        text.includes('todo') || 
        text.includes('follow up') ||
        text.includes('will do') ||
        text.includes('needs to') ||
        text.includes('should') ||
        text.includes('must')) {
      
      // Clean up the line and extract action
      const cleanLine = line.trim().replace(/^[^:]*:\s*/, ''); // Remove speaker prefix
      if (cleanLine.length > 10 && cleanLine.length < 200) {
        actionItems.push({ text: cleanLine });
      }
    }
  }

  return actionItems.slice(0, 10); // Limit to 10 action items
}

/**
 * Generate a summary from transcript content
 */
function generateSummaryFromTranscript(transcript: string, title: string): string {
  const words = transcript.split(/\s+/);
  const wordCount = words.length;
  
  // Take first few meaningful sentences as summary
  const sentences = transcript.split(/[.!?]+/);
  const meaningfulSentences = sentences
    .filter(sentence => sentence.trim().length > 20)
    .slice(0, 3)
    .map(sentence => sentence.trim())
    .join('. ');

  return `${title}: ${meaningfulSentences}${meaningfulSentences.endsWith('.') ? '' : '.'} [${wordCount} words total]`;
}

/**
 * Estimate meeting duration from transcript content
 */
function estimateDurationFromTranscript(transcript: string): number {
  const wordCount = transcript.split(/\s+/).length;
  // Assume ~150 words per minute of speaking
  return Math.max(Math.ceil(wordCount / 150), 5); // Minimum 5 minutes
}
