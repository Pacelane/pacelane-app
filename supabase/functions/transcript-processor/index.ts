import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface GCSConfig {
  bucketPrefix: string;
  projectId: string;
  clientEmail: string;
  privateKey: string;
  privateKeyId: string;
}

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

interface TranscriptFile {
  fileName: string;
  content: string;
  metadata: {
    meetingId: string;
    title: string;
    date: string;
    duration: number;
    participants: string[];
    topics: string[];
    actionItems: string[];
    summary: string;
  };
}

class TranscriptProcessor {
  private gcsConfig: GCSConfig;
  private supabase: any;

  constructor(serviceRoleKey: string) {
    this.gcsConfig = {
      bucketPrefix: Deno.env.get('GCS_BUCKET_PREFIX') ?? 'pacelane-whatsapp',
      projectId: Deno.env.get('GCS_PROJECT_ID') ?? '',
      clientEmail: Deno.env.get('GCS_CLIENT_EMAIL') ?? '',
      privateKey: Deno.env.get('GCS_PRIVATE_KEY') ?? '',
      privateKeyId: Deno.env.get('GCS_PRIVATE_KEY_ID') ?? '',
    };

    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  /**
   * Main method to process transcript and store in knowledge base
   */
  async processTranscript(payload: ReadAIWebhookPayload): Promise<{ success: boolean; message: string; userId?: string; filePath?: string }> {
    try {
      console.log('🔍 Starting transcript processing...');
      console.log('Meeting:', { title: payload.title, sessionId: payload.session_id, ownerEmail: payload.owner.email });

      // 1. Find user by email from auth.users table
      const userId = await this.findUserByEmail(payload.owner.email);
      if (!userId) {
        console.warn(`❌ No user found for email: ${payload.owner.email}`);
        return { 
          success: false, 
          message: `No user found for email: ${payload.owner.email}` 
        };
      }

      console.log(`✅ User found: ${userId}`);

      // 2. Get user's bucket using the existing user-bucket-service
      const bucketName = await this.getUserBucket(userId);
      if (!bucketName) {
        console.error(`❌ Failed to get bucket for user: ${userId}`);
        return { 
          success: false, 
          message: `Failed to get bucket for user: ${userId}` 
        };
      }

      console.log(`✅ Using bucket: ${bucketName}`);

      // 3. Process transcript into searchable text
      const transcriptFile = this.createTranscriptFile(payload);
      console.log(`✅ Transcript processed: ${transcriptFile.fileName}`);

      // 4. Store transcript in GCS
      const filePath = await this.storeTranscriptInGCS(bucketName, transcriptFile);
      if (!filePath) {
        console.error(`❌ Failed to store transcript in GCS`);
        return { 
          success: false, 
          message: `Failed to store transcript in GCS` 
        };
      }

      console.log(`✅ Transcript stored: ${filePath}`);

      // 5. Store file metadata in knowledge_files table
      await this.storeFileMetadata(userId, transcriptFile, filePath);

      console.log(`✅ Transcript processing complete for user: ${userId}`);
      
      return {
        success: true,
        message: `Transcript processed and stored successfully`,
        userId,
        filePath
      };

    } catch (error) {
      console.error('❌ Error processing transcript:', error);
      return {
        success: false,
        message: `Error processing transcript: ${error.message}`
      };
    }
  }

  /**
   * Find user by email from profiles table
   */
  private async findUserByEmail(email: string): Promise<string | null> {
    try {
      console.log(`🔍 Looking for user with email: ${email}`);
      
      // Query profiles table for user with matching email
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .single();
      
      if (error) {
        console.error('❌ Error querying profiles:', error);
        return null;
      }

      if (profile && profile.user_id) {
        console.log(`✅ Found user: ${profile.user_id}`);
        return profile.user_id;
      }

      console.log(`❌ No user found for email: ${email}`);
      return null;

    } catch (error) {
      console.error('❌ Error in findUserByEmail:', error);
      return null;
    }
  }

  /**
   * Get user's bucket name using the existing user-bucket-service
   */
  private async getUserBucket(userId: string): Promise<string | null> {
    try {
      console.log(`🔍 Getting bucket for user: ${userId}`);
      
      // Call the existing user-bucket-service
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/user-bucket-service`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'identify-and-ensure-bucket',
          userId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ User-bucket service error:', response.status, errorText);
        return null;
      }

      const result = await response.json();
      console.log('✅ User-bucket service result:', result);
      
      if (result.success && result.data.bucketName) {
        return result.data.bucketName;
      }

      return null;

    } catch (error) {
      console.error('❌ Error calling user-bucket service:', error);
      return null;
    }
  }

  /**
   * Create transcript file with processed content
   */
  private createTranscriptFile(payload: ReadAIWebhookPayload): TranscriptFile {
    const startTime = new Date(payload.start_time);
    const endTime = new Date(payload.end_time);
    const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));
    const date = startTime.toISOString().split('T')[0];

    // Build transcript text from speaker blocks
    const transcriptText = payload.transcript?.speaker_blocks
      ?.map(block => `${block.speaker.name}: ${block.words}`)
      .join('\n') || '';

    // Create searchable content
    const content = this.createSearchableContent(payload, transcriptText);

    // Create filename
    const fileName = `transcript_${payload.session_id}_${date}.txt`;

    return {
      fileName,
      content,
      metadata: {
        meetingId: payload.session_id,
        title: payload.title,
        date,
        duration: durationMinutes,
        participants: payload.participants?.map(p => p.name) || [],
        topics: payload.topics?.map(t => t.text) || [],
        actionItems: payload.action_items?.map(a => a.text) || [],
        summary: payload.summary
      }
    };
  }

  /**
   * Create searchable content optimized for RAG
   */
  private createSearchableContent(payload: ReadAIWebhookPayload, transcriptText: string): string {
    const lines: string[] = [];
    
    // Header with meeting info
    lines.push(`MEETING TRANSCRIPT`);
    lines.push(`==================`);
    lines.push(`Title: ${payload.title}`);
    lines.push(`Date: ${new Date(payload.start_time).toLocaleDateString()}`);
    lines.push(`Duration: ${Math.round((new Date(payload.end_time).getTime() - new Date(payload.start_time).getTime()) / (1000 * 60))} minutes`);
    lines.push(`Participants: ${payload.participants?.map(p => p.name).join(', ') || 'Unknown'}`);
    lines.push(``);

    // Summary section
    if (payload.summary) {
      lines.push(`SUMMARY`);
      lines.push(`=======`);
      lines.push(payload.summary);
      lines.push(``);
    }

    // Topics section
    if (payload.topics && payload.topics.length > 0) {
      lines.push(`KEY TOPICS`);
      lines.push(`===========`);
      payload.topics.forEach((topic, index) => {
        lines.push(`${index + 1}. ${topic.text}`);
      });
      lines.push(``);
    }

    // Action items section
    if (payload.action_items && payload.action_items.length > 0) {
      lines.push(`ACTION ITEMS`);
      lines.push(`============`);
      payload.action_items.forEach((item, index) => {
        lines.push(`${index + 1}. ${item.text}`);
      });
      lines.push(``);
    }

    // Key questions section
    if (payload.key_questions && payload.key_questions.length > 0) {
      lines.push(`KEY QUESTIONS`);
      lines.push(`==============`);
      payload.key_questions.forEach((question, index) => {
        lines.push(`${index + 1}. ${question.text}`);
      });
      lines.push(``);
    }

    // Full transcript
    lines.push(`FULL TRANSCRIPT`);
    lines.push(`================`);
    lines.push(transcriptText);

    return lines.join('\n');
  }

  /**
   * Store transcript file in GCS
   */
  private async storeTranscriptInGCS(bucketName: string, transcriptFile: TranscriptFile): Promise<string | null> {
    try {
      console.log(`📁 Storing transcript in GCS: ${bucketName}`);
      
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        console.error('❌ Failed to get GCS access token');
        return null;
      }

      // Create file path following existing structure: knowledge-base/{date}/{filename}
      const date = transcriptFile.metadata.date;
      const filePath = `knowledge-base/${date}/${transcriptFile.fileName}`;
      const gcsPath = `gs://${bucketName}/${filePath}`;

      console.log(`📂 File path: ${filePath}`);

      // Upload to GCS
      const response = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(filePath)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain',
        },
        body: transcriptFile.content,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to upload transcript: ${response.status} ${errorText}`);
        return null;
      }

      console.log(`✅ Transcript uploaded to GCS: ${gcsPath}`);
      return gcsPath;

    } catch (error) {
      console.error('❌ Error storing transcript in GCS:', error);
      return null;
    }
  }

  /**
   * Store file metadata in knowledge_files table
   */
  private async storeFileMetadata(userId: string, transcriptFile: TranscriptFile, gcsPath: string): Promise<void> {
    try {
      console.log(`💾 Storing file metadata for user: ${userId}`);
      
      const { error } = await this.supabase
        .from('knowledge_files')
        .insert({
          user_id: userId,
          name: transcriptFile.fileName,
          type: 'file',
          size: transcriptFile.content.length,
          url: gcsPath,
          storage_path: gcsPath,
          gcs_bucket: gcsPath.split('/')[2], // Extract bucket name from gs://bucket/path
          gcs_path: gcsPath,
          file_hash: await this.calculateFileHash(transcriptFile.content),
          metadata: {
            meeting_id: transcriptFile.metadata.meetingId,
            meeting_title: transcriptFile.metadata.title,
            meeting_date: transcriptFile.metadata.date,
            duration_minutes: transcriptFile.metadata.duration,
            participants: transcriptFile.metadata.participants,
            topics: transcriptFile.metadata.topics,
            action_items: transcriptFile.metadata.actionItems,
            summary: transcriptFile.metadata.summary,
            content_extracted: true,
            extracted_content: transcriptFile.content,
            extraction_metadata: {
              extracted_at: new Date().toISOString(),
              method: 'transcript_processor',
              source: 'read_ai_webhook'
            }
          },
        });

      if (error) {
        console.error('❌ Error storing file metadata:', error);
        throw error;
      }

      console.log(`✅ File metadata stored successfully`);

    } catch (error) {
      console.error('❌ Error in storeFileMetadata:', error);
      throw error;
    }
  }

  /**
   * Calculate file hash for deduplication
   */
  private async calculateFileHash(content: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Get GCS access token using service account credentials
   */
  private async getGCSAccessToken(): Promise<string | null> {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      const header = { alg: 'RS256', typ: 'JWT' };
      const payload = {
        iss: this.gcsConfig.clientEmail,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      };

      const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      
      const message = `${headerB64}.${payloadB64}`;
      
      const privateKeyPem = this.gcsConfig.privateKey.replace(/\\n/g, '\n');
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        this.pemToArrayBuffer(privateKeyPem),
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        new TextEncoder().encode(message)
      );

      const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      const jwt = `${message}.${signatureB64}`;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        return tokenData.access_token;
      } else {
        const errorText = await tokenResponse.text();
        console.error('❌ Token request failed:', errorText);
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting access token:', error);
      return null;
    }
  }

  /**
   * Convert PEM private key to ArrayBuffer
   */
  private pemToArrayBuffer(pem: string): ArrayBuffer {
    const pemContents = pem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    
    const binaryString = atob(pemContents);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    console.log('📥 Transcript processor received payload:', { 
      trigger: payload.trigger, 
      session_id: payload.session_id,
      owner_email: payload.owner.email 
    });

    // Initialize processor with service role key
    const processor = new TranscriptProcessor(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    // Process transcript
    const result = await processor.processTranscript(payload);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error in transcript processor:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
