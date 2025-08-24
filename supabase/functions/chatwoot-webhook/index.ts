import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for webhook endpoint
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Supported Chatwoot events for WhatsApp
const SUPPORTED_EVENTS = ['message_created'];
const WHATSAPP_CHANNEL = 'Channel::Whatsapp';

// Chatwoot API configuration
const CHATWOOT_API_VERSION = 'v1';

// Intent detection types
type MessageIntent = 'NOTE' | 'ORDER' | 'CONVERSATION_RESPONSE';

interface IntentResult {
  intent: MessageIntent;
  confidence: number;
  parsedParams?: OrderParams;
}

interface OrderParams {
  platform?: string;
  length?: string;
  tone?: string;
  angle?: string;
  refs?: string[];
  topic?: string;
}

// Chatwoot message templates for minimal policy
interface ChatwootMessageTemplate {
  content: string;
  message_type: 'outgoing';
  content_type?: 'text' | 'template';
  content_attributes?: {
    quick_reply?: {
      type: 'quick_reply';
      values: Array<{
        title: string;
        value: string;
      }>;
    };
  };
}

interface ChatwootWebhookPayload {
  event: string;
  id: string;
  content: string;
  created_at: string;
  message_type: 'incoming' | 'outgoing' | 'template';
  content_type?: string; // For audio, image, video, file, text, etc.
  content_attributes?: Record<string, any>; // Additional content metadata
  source_id?: string;
  attachments?: AudioAttachment[]; // Audio and media attachments
  sender: {
    id: number;
    name: string;
    type: 'contact' | 'user';
    phone_number?: string;
    additional_attributes?: Record<string, any>;
  };
  conversation: {
    id: number;
    channel: string;
    status: string;
    additional_attributes?: Record<string, any>;
    contact_inbox?: {
      source_id?: string;
    };
  };
  account: {
    id: number;
    name: string;
  };
  inbox?: {
    id: number;
    name: string;
  };
}

interface GCSConfig {
  bucketPrefix: string;
  projectId: string;
  clientEmail: string;
  privateKey: string;
  privateKeyId: string;
}

interface OpenAIConfig {
  apiKey: string;
  model: string;
}

interface ChatwootConfig {
  baseUrl: string;
  apiAccessToken: string;
  accountId: string;
}

interface AudioAttachment {
  id: number;
  message_id: number;
  file_type: string;
  data_url: string;
  file_size: number;
  meta?: {
    is_recorded_audio?: boolean;
  };
  transcribed_text?: string;
}

class ChatwootWebhookProcessor {
  private supabase: any;
  private gcsConfig: GCSConfig;
  private openaiConfig: OpenAIConfig;
  private chatwootConfig: ChatwootConfig;
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

    // Initialize GCS configuration
    this.gcsConfig = {
      bucketPrefix: Deno.env.get('GCS_BUCKET_PREFIX') ?? 'pacelane-whatsapp',
      projectId: Deno.env.get('GCS_PROJECT_ID') ?? '',
      clientEmail: Deno.env.get('GCS_CLIENT_EMAIL') ?? '',
      privateKey: Deno.env.get('GCS_PRIVATE_KEY') ?? '',
      privateKeyId: Deno.env.get('GCS_PRIVATE_KEY_ID') ?? '',
    };

    // Initialize OpenAI configuration
    this.openaiConfig = {
      apiKey: Deno.env.get('OPENAI_API_KEY') ?? '',
      model: 'whisper-1'
    };

    // Initialize Chatwoot configuration
    this.chatwootConfig = {
      baseUrl: Deno.env.get('CHATWOOT_BASE_URL') ?? '',
      apiAccessToken: Deno.env.get('CHATWOOT_API_ACCESS_TOKEN') ?? '',
      accountId: Deno.env.get('CHATWOOT_ACCOUNT_ID') ?? '',
    };
  }

  /**
   * Validate webhook payload structure and event type
   */
  private validatePayload(payload: any): payload is ChatwootWebhookPayload {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    const required = ['event', 'id', 'content', 'message_type', 'sender', 'conversation', 'account'];
    return required.every(field => payload.hasOwnProperty(field));
  }

  /**
   * Check if this is a WhatsApp message we should process
   */
  private isWhatsAppMessage(payload: ChatwootWebhookPayload): boolean {
    return (
      SUPPORTED_EVENTS.includes(payload.event) &&
      payload.conversation.channel === WHATSAPP_CHANNEL
    );
  }

  /**
   * Generate user-specific bucket name
   */
  private generateUserBucketName(userId: string): string {
    // Bucket names must be globally unique and follow GCS naming rules
    // Use a combination of prefix, user ID hash for uniqueness
    const userHash = this.hashUserId(userId);
    return `${this.gcsConfig.bucketPrefix}-user-${userHash}`.toLowerCase();
  }

  /**
   * Get existing bucket name for user from database
   */
  private async getUserBucketName(userId: string): Promise<string | null> {
    try {
      // Check if user already has a bucket mapping in the database
      const { data: bucketMapping, error } = await this.supabase
        .from('user_bucket_mapping')
        .select('bucket_name')
        .eq('user_id', userId)
        .single();

      if (!error && bucketMapping) {
        console.log(`Found existing bucket mapping for user ${userId}: ${bucketMapping.bucket_name}`);
        return bucketMapping.bucket_name;
      }

      return null;
    } catch (error) {
      console.error('Error getting user bucket name:', error);
      return null;
    }
  }

  /**
   * Store bucket mapping for user in database
   */
  private async storeUserBucketMapping(userId: string, bucketName: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_bucket_mapping')
        .insert({
          user_id: userId,
          bucket_name: bucketName,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing bucket mapping:', error);
      } else {
        console.log(`Stored bucket mapping for user ${userId}: ${bucketName}`);
      }
    } catch (error) {
      console.error('Error storing bucket mapping:', error);
    }
  }

  /**
   * Check if bucket exists and create mapping if it does
   */
  private async checkAndMapExistingBucket(userId: string, bucketName: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking if bucket exists in GCS: ${bucketName}`);
      
      // Check if bucket exists in GCS
      const exists = await this.bucketExists(bucketName);
      if (exists) {
        console.log(`✅ Found existing bucket ${bucketName} for user ${userId}, creating mapping`);
        
        // Create the mapping in our database
        await this.storeUserBucketMapping(userId, bucketName);
        console.log(`✅ Successfully created mapping for bucket ${bucketName}`);
        return true;
      } else {
        console.log(`❌ Bucket ${bucketName} does not exist in GCS`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking and mapping existing bucket:', error);
      return false;
    }
  }

  /**
   * List buckets with our prefix to help with debugging
   */
  private async listBucketsWithPrefix(): Promise<string[]> {
    try {
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        console.error('Failed to get GCS access token for listing buckets');
        return [];
      }

      const response = await fetch(`https://storage.googleapis.com/storage/v1/b?prefix=${this.gcsConfig.bucketPrefix}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const bucketNames = data.items?.map((item: any) => item.name) || [];
        console.log(`Found ${bucketNames.length} buckets with prefix ${this.gcsConfig.bucketPrefix}:`, bucketNames);
        return bucketNames;
      } else {
        console.error(`Error listing buckets: ${response.status} ${response.statusText}`);
        return [];
      }
    } catch (error) {
      console.error('Error listing buckets:', error);
      return [];
    }
  }

  /**
   * Generate contact-based bucket name (fallback)
   */
  private generateContactBucketName(contactId: string): string {
    return `${this.gcsConfig.bucketPrefix}-contact-${contactId.replace(/[^a-z0-9-]/g, '-')}`.toLowerCase();
  }

  /**
   * Hash user ID for bucket naming (to avoid exposing actual user IDs)
   */
  private hashUserId(userId: string): string {
    // Simple hash function for bucket naming - in production consider using crypto
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get GCS access token using service account credentials
   */
  private async getGCSAccessToken(): Promise<string | null> {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      // Create JWT header and payload
      const header = { alg: 'RS256', typ: 'JWT' };
      const payload = {
        iss: this.gcsConfig.clientEmail,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      };

      // Base64URL encode header and payload
      const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      
      // Create message to sign
      const message = `${headerB64}.${payloadB64}`;
      
      // Import private key for signing
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

      // Sign the message
      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        new TextEncoder().encode(message)
      );

      // Base64URL encode signature
      const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      // Create JWT
      const jwt = `${message}.${signatureB64}`;

      // Request access token
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
        console.error('Token request failed:', errorText);
        return null;
      }
    } catch (error) {
      console.error('Error getting access token:', error);
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

  /**
   * Check if GCS bucket exists
   */
  private async bucketExists(bucketName: string): Promise<boolean> {
    try {
      console.log(`Checking if bucket exists: ${bucketName}`);
      
      // Get access token for GCS API
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        console.error('Failed to get GCS access token');
        return false;
      }

      // Check if bucket exists using GCS API
      const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${bucketName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      console.log(`Bucket check response status: ${response.status}`);

      if (response.status === 200) {
        console.log(`Bucket ${bucketName} exists`);
        return true;
      } else if (response.status === 404) {
        console.log(`Bucket ${bucketName} does not exist`);
        return false;
      } else {
        const errorText = await response.text();
        console.error(`Error checking bucket: ${response.status} ${response.statusText} - ${errorText}`);
        
        // If we get a 403 (Forbidden), it might mean the bucket exists but we don't have access
        // or there's a permissions issue. Let's assume it exists to avoid creating duplicates.
        if (response.status === 403) {
          console.log(`Got 403 for bucket ${bucketName}, assuming it exists to avoid duplicates`);
          return true;
        }
        
        return false;
      }
    } catch (error) {
      console.error('Error checking bucket existence:', error);
      
      // If there's a network error or other issue, assume bucket exists to avoid duplicates
      console.log(`Error occurred, assuming bucket ${bucketName} exists to avoid duplicates`);
      return true;
    }
  }

  /**
   * Create GCS bucket for user
   */
  private async createUserBucket(bucketName: string): Promise<boolean> {
    try {
      console.log(`Creating bucket: ${bucketName}`);
      
      // Get access token for GCS API
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        console.error('Failed to get GCS access token');
        return false;
      }

      // Create bucket with lifecycle policies
      const bucketConfig = {
        name: bucketName,
        location: 'US-CENTRAL1',
        storageClass: 'STANDARD',
        lifecycle: {
          rule: [
            {
              action: { type: 'SetStorageClass', storageClass: 'NEARLINE' },
              condition: { age: 30 }
            },
            {
              action: { type: 'SetStorageClass', storageClass: 'COLDLINE' },
              condition: { age: 90 }
            },
            {
              action: { type: 'SetStorageClass', storageClass: 'ARCHIVE' },
              condition: { age: 365 }
            }
          ]
        }
      };

      const response = await fetch(`https://storage.googleapis.com/storage/v1/b?project=${this.gcsConfig.projectId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bucketConfig),
      });

      if (response.status === 200 || response.status === 201) {
        console.log(`Bucket ${bucketName} created successfully`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`Error creating bucket: ${response.status} ${response.statusText} - ${errorText}`);
        return false;
      }
    } catch (error) {
      console.error('Error creating bucket:', error);
      return false;
    }
  }

  /**
   * Ensure user bucket exists (create if necessary)
   */
  private async ensureUserBucket(bucketName: string): Promise<boolean> {
    console.log(`Ensuring bucket exists: ${bucketName}`);
    
    // First, check if this bucket name is already mapped to a user in our database
    // This is a faster check than querying GCS
    try {
      const { data: existingMapping, error } = await this.supabase
        .from('user_bucket_mapping')
        .select('bucket_name')
        .eq('bucket_name', bucketName)
        .single();

      if (!error && existingMapping) {
        console.log(`Bucket ${bucketName} is already mapped in database, assuming it exists`);
        return true;
      }
    } catch (error) {
      console.log(`No existing mapping found for bucket ${bucketName}, checking GCS...`);
    }
    
    // If no mapping exists, check GCS
    const exists = await this.bucketExists(bucketName);
    if (exists) {
      console.log(`Bucket already exists in GCS: ${bucketName}`);
      return true;
    }

    console.log(`Bucket does not exist, creating: ${bucketName}`);
    const created = await this.createUserBucket(bucketName);
    if (created) {
      console.log(`Successfully created bucket: ${bucketName}`);
    } else {
      console.error(`Failed to create bucket: ${bucketName}`);
    }
    return created;
  }

  /**
   * Generate GCS object path for message storage
   */
  private generateGCSPath(payload: ChatwootWebhookPayload, bucketName: string): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const conversationId = payload.conversation.id;
    const messageId = payload.id;
    
    return `gs://${bucketName}/whatsapp-messages/${date}/${conversationId}/${messageId}.json`;
  }

    /**
   * Store message in Google Cloud Storage
   */
  private async storeInGCS(gcsPath: string, payload: ChatwootWebhookPayload): Promise<boolean> {
    try {
      // Prepare message data for storage
      const messageData = {
        webhook_payload: payload,
        processed_at: new Date().toISOString(),
        message_metadata: {
          account_id: payload.account.id,
          conversation_id: payload.conversation.id,
          message_id: payload.id,
          message_type: payload.message_type,
          sender_type: payload.sender.type,
          sender_id: payload.sender.id,
        }
      };

      // Extract bucket name from gs://bucket-name/path format
      const bucketName = gcsPath.split('/')[2];
      
      console.log('User bucket:', bucketName);
      console.log('GCS storage path generated:', gcsPath);

      // Get access token for GCS API
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        console.error('Failed to get GCS access token');
        return false;
      }

      // Extract object name from the full path (gs://bucket/path -> path)
      const objectName = gcsPath.replace(`gs://${bucketName}/`, '');

      // Upload to GCS
      const response = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(objectName)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.status === 200 || response.status === 201) {
        console.log(`Message stored successfully in GCS: ${gcsPath}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`Error storing in GCS: ${response.status} ${response.statusText} - ${errorText}`);
        return false;
      }

    } catch (error) {
      console.error('GCS storage error:', error);
      return false;
    }
  }

  /**
   * Find user by WhatsApp number from incoming message
   */
  private async findUserByWhatsAppNumber(payload: ChatwootWebhookPayload): Promise<{ userId: string | null, contactId: string }> {
    try {
      const contactId = `contact_${payload.sender.id}_account_${payload.account.id}`;
      
      // Extract WhatsApp number from sender
      const whatsappNumber = this.extractWhatsAppNumber(payload);
      
      if (!whatsappNumber) {
        console.log('No WhatsApp number found in payload, using contact-based bucket');
        return { userId: null, contactId };
      }

      // Generate all possible number variations for matching
      const numberVariations = this.generateNumberVariations(whatsappNumber);
      console.log(`Looking for user with WhatsApp number variations:`, numberVariations);
      
      // First, try to find existing mapping in whatsapp_user_mapping table
      for (const variation of numberVariations) {
      const { data: existingMapping, error: mappingError } = await this.supabase
        .from('whatsapp_user_mapping')
        .select('user_id')
          .eq('whatsapp_number', variation)
        .single();

      if (!mappingError && existingMapping) {
          console.log(`Found existing WhatsApp mapping: ${existingMapping.user_id} for number: ${variation}`);
        return { userId: existingMapping.user_id, contactId };
        }
      }

      // If no mapping exists, try to find user by WhatsApp number in profiles (whatsapp_number or phone_number)
      for (const variation of numberVariations) {
        // profiles.whatsapp_number
        const { data: profileByWhatsApp, error: profileWhatsAppError } = await this.supabase
          .from('profiles')
          .select('user_id, whatsapp_number, phone_number')
          .eq('whatsapp_number', variation)
          .single();

        if (!profileWhatsAppError && profileByWhatsApp) {
          console.log(`Found user ${profileByWhatsApp.user_id} for WhatsApp number: ${variation}`);
          const normalizedNumber = this.normalizeWhatsAppNumber(whatsappNumber);
          await this.createWhatsAppMapping(profileByWhatsApp.user_id, normalizedNumber, payload);
          return { userId: profileByWhatsApp.user_id, contactId };
        }

        // profiles.phone_number fallback
        const { data: profileByPhone, error: profilePhoneError } = await this.supabase
          .from('profiles')
          .select('user_id, whatsapp_number, phone_number')
          .eq('phone_number', variation)
          .single();

        if (!profilePhoneError && profileByPhone) {
          console.log(`Found user ${profileByPhone.user_id} via phone_number: ${variation}`);
          const normalizedNumber = this.normalizeWhatsAppNumber(whatsappNumber);
          // Best-effort: persist whatsapp_number for future direct matches
          try {
            if (!profileByPhone.whatsapp_number || profileByPhone.whatsapp_number.length === 0) {
              await this.supabase
                .from('profiles')
                .update({ whatsapp_number: normalizedNumber })
                .eq('user_id', profileByPhone.user_id);
            }
          } catch (_e) {}
          await this.createWhatsAppMapping(profileByPhone.user_id, normalizedNumber, payload);
          return { userId: profileByPhone.user_id, contactId };
        }
      }

      // Fallback: try to find existing user mapping in meeting_notes
      const { data: existingMeetingMapping, error: meetingError } = await this.supabase
        .from('meeting_notes')
        .select('user_id')
        .eq('contact_identifier', contactId)
        .not('user_id', 'is', null)
        .limit(1);

      if (!meetingError && existingMeetingMapping && existingMeetingMapping.length > 0) {
        console.log(`Found existing meeting mapping: ${existingMeetingMapping[0].user_id}`);
        return { userId: existingMeetingMapping[0].user_id, contactId };
      }

      console.log(`No user found for WhatsApp number: ${whatsappNumber}`);
      return { userId: null, contactId };

    } catch (error) {
      console.error('Error finding user by WhatsApp number:', error);
      const contactId = `contact_${payload.sender.id}_account_${payload.account.id}`;
      return { userId: null, contactId };
    }
  }

  /**
   * Extract WhatsApp number from Chatwoot payload
   */
  private extractWhatsAppNumber(payload: ChatwootWebhookPayload): string | null {
    console.log('Extracting WhatsApp number from payload...');
    
    // 1. From sender.phone_number (most common location)
    if (payload.sender && payload.sender.phone_number) {
      console.log('Found WhatsApp number in sender.phone_number:', payload.sender.phone_number);
      return payload.sender.phone_number;
    }

    // 2. From conversation.contact_inbox.source_id
    if (payload.conversation && payload.conversation.contact_inbox && payload.conversation.contact_inbox.source_id) {
      console.log('Found WhatsApp number in conversation.contact_inbox.source_id:', payload.conversation.contact_inbox.source_id);
      return payload.conversation.contact_inbox.source_id;
    }

    // 3. From sender metadata (fallback)
    if (payload.sender && payload.sender.additional_attributes) {
      const whatsappNumber = payload.sender.additional_attributes.phone_number;
      if (whatsappNumber) {
        console.log('Found WhatsApp number in sender.additional_attributes:', whatsappNumber);
        return whatsappNumber;
      }
    }

    // 4. From conversation metadata (fallback)
    if (payload.conversation && payload.conversation.additional_attributes) {
      const whatsappNumber = payload.conversation.additional_attributes.phone_number;
      if (whatsappNumber) {
        console.log('Found WhatsApp number in conversation.additional_attributes:', whatsappNumber);
        return whatsappNumber;
      }
    }

    // 6. Try to extract from sender name (fallback)
    if (payload.sender && payload.sender.name) {
      const phoneMatch = payload.sender.name.match(/\+?[\d\s\-\(\)]+/);
      if (phoneMatch) {
        console.log('Extracted WhatsApp number from sender name:', phoneMatch[0]);
        return phoneMatch[0];
      }
    }

    // 7. Try to extract from source_id (another common location)
    if (payload.source_id) {
      console.log('Found source_id:', payload.source_id);
      return payload.source_id;
    }

    console.log('No WhatsApp number found in payload');
    return null;
  }

  /**
   * Normalize WhatsApp number for consistent comparison
   */
  private normalizeWhatsAppNumber(number: string): string {
    console.log('Normalizing WhatsApp number:', number);
    
    // Remove all non-digit characters except +
    let normalized = number.replace(/[^\d+]/g, '');
    
    console.log('After removing non-digits:', normalized);
    
    // Handle different formats
    if (normalized.startsWith('00')) {
      // Convert 00 to +
      normalized = '+' + normalized.substring(2);
      console.log('Converted 00 to +:', normalized);
    } else if (!normalized.startsWith('+') && normalized.length > 10) {
      // Add + for international numbers
      normalized = '+' + normalized;
      console.log('Added + for international number:', normalized);
    } else if (!normalized.startsWith('+') && normalized.length === 10) {
      // Brazilian number without country code, add +55
      normalized = '+55' + normalized;
      console.log('Added +55 for Brazilian number:', normalized);
    } else if (!normalized.startsWith('+') && normalized.length === 11 && normalized.startsWith('0')) {
      // Brazilian number with 0, remove 0 and add +55
      normalized = '+55' + normalized.substring(1);
      console.log('Converted Brazilian number with 0:', normalized);
    }
    
    console.log('Final normalized number:', normalized);
    return normalized;
  }

  /**
   * Generate all possible number variations for matching
   */
  private generateNumberVariations(number: string): string[] {
    const variations: string[] = [];
    
    // Add the normalized number
    const normalized = this.normalizeWhatsAppNumber(number);
    variations.push(normalized);
    
    // For Brazilian numbers, add variations
    if (normalized.startsWith('+55')) {
      // Without country code
      const withoutCountry = normalized.substring(3);
      variations.push(withoutCountry);
      
      // With 0 prefix
      if (!withoutCountry.startsWith('0')) {
        variations.push('0' + withoutCountry);
      }
      
      // Without 0 prefix
      if (withoutCountry.startsWith('0')) {
        variations.push(withoutCountry.substring(1));
      }
    }
    
    // For numbers without +, add with +
    if (!normalized.startsWith('+')) {
      variations.push('+' + normalized);
    }
    
    // For numbers with +, add without +
    if (normalized.startsWith('+')) {
      variations.push(normalized.substring(1));
    }
    
    // Remove duplicates
    return [...new Set(variations)];
  }

  /**
   * Create WhatsApp mapping for future use
   */
  private async createWhatsAppMapping(userId: string, whatsappNumber: string, payload: ChatwootWebhookPayload): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('whatsapp_user_mapping')
        .insert({
          user_id: userId,
          whatsapp_number: whatsappNumber,
          chatwoot_contact_id: payload.sender.id.toString(),
          chatwoot_account_id: payload.account.id.toString(),
          is_verified: false
        });

      if (error) {
        console.error('Error creating WhatsApp mapping:', error);
      } else {
        console.log(`Created WhatsApp mapping for user ${userId}`);
      }
    } catch (error) {
      console.error('Error creating WhatsApp mapping:', error);
    }
  }

  /**
   * Store message record in Supabase database
   */
  private async storeInDatabase(
    payload: ChatwootWebhookPayload, 
    gcsPath: string, 
    userId?: string,
    contactId?: string
  ): Promise<boolean> {
    try {
      // Handle different content types (text, audio, images, etc.)
      let messageContent = payload.content;
      
      // For audio messages or other media without text content
      if (!messageContent || messageContent.trim() === '') {
        if (payload.content_type === 'audio') {
          messageContent = '[Audio Message]';
        } else if (payload.content_type === 'image') {
          messageContent = '[Image Message]';
        } else if (payload.content_type === 'video') {
          messageContent = '[Video Message]';
        } else if (payload.content_type === 'file') {
          messageContent = '[File Attachment]';
        } else {
          messageContent = '[Media Message]';
        }
      }

      // ✅ NEW: For image messages, append image count to content
      if (this.hasImageAttachments(payload)) {
        const imageCount = payload.attachments?.filter(att => att.file_type === 'image').length || 0;
        if (imageCount > 0) {
          messageContent += ` [${imageCount} image${imageCount > 1 ? 's' : ''} attached]`;
        }
      }

      const insertData = {
        user_id: userId || null, // Will be null for Phase 1
        contact_identifier: contactId, // New field for contact tracking
        chatwoot_conversation_id: payload.conversation.id.toString(),
        chatwoot_message_id: payload.id,
        chatwoot_contact_id: payload.sender.id.toString(),
        content: messageContent,
        source_type: 'whatsapp',
        message_type: payload.message_type,
        gcs_storage_path: gcsPath,
        processing_status: 'stored',
        metadata: {
          chatwoot_payload: payload,
          sender_name: payload.sender.name,
          conversation_status: payload.conversation.status,
          account_id: payload.account.id,
          inbox_id: payload.inbox?.id,
          content_type: payload.content_type,
          original_content: payload.content,
        },
        processed_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('meeting_notes')
        .insert([insertData])
        .select();

      if (error) {
        console.error('Database insert error:', error);
        return false;
      }

      console.log('Message stored in database:', data?.[0]?.id);
      return true;

    } catch (error) {
      console.error('Database storage error:', error);
      return false;
    }
  }

  /**
   * Detect message intent using AI: NOTE (casual input) vs ORDER (content request)
   */
  private async detectIntent(content: string): Promise<IntentResult> {
    try {
      // Try AI-powered detection first
      const aiResult = await this.detectIntentWithAI(content);
      if (aiResult) {
        return aiResult;
      }
    } catch (error) {
      console.warn('AI intent detection failed, falling back to rules:', error.message);
    }

    // Fallback to rule-based detection
    return this.detectIntentWithRules(content);
  }

  /**
   * AI-powered intent detection using OpenAI
   */
  private async detectIntentWithAI(content: string): Promise<IntentResult | null> {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.warn('OPENAI_API_KEY not found, skipping AI detection');
      return null;
    }

    const prompt = `Classify this WhatsApp message intent and extract parameters.

Message: "${content}"

Classify as:
- NOTE: Casual sharing, updates, thoughts, information for knowledge base
- ORDER: Explicit request to create content (posts, articles, etc.)

Return only valid JSON:
{
  "intent": "NOTE" | "ORDER",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "params": {
    "platform": "linkedin|twitter|instagram" or null,
    "length": "short|medium|long" or null,
    "tone": "professional|casual|formal|friendly" or null,
    "angle": "story|tip|insight|announcement|question" or null,
    "topic": "extracted main topic" or null,
    "refs": ["hashtag1", "hashtag2"] or []
  }
}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert at classifying WhatsApp messages for a content creation system. Always return valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (!aiResponse) {
        throw new Error('No response from OpenAI');
      }

      // Parse AI response
      const parsed = JSON.parse(aiResponse);
      
      // Validate response structure
      if (!parsed.intent || !['NOTE', 'ORDER'].includes(parsed.intent)) {
        throw new Error('Invalid intent in AI response');
      }

      console.log(`🤖 AI Intent: ${parsed.intent} (${parsed.confidence}) - ${parsed.reasoning}`);

      return {
        intent: parsed.intent as MessageIntent,
        confidence: parsed.confidence || 0.8,
        parsedParams: parsed.params ? {
          platform: parsed.params.platform,
          length: parsed.params.length,
          tone: parsed.params.tone,
          angle: parsed.params.angle,
          refs: parsed.params.refs || [],
          topic: parsed.params.topic
        } : undefined
      };

    } catch (error) {
      console.error('Error in AI intent detection:', error);
      throw error;
    }
  }

  /**
   * Fallback rule-based intent detection
   */
  private detectIntentWithRules(content: string): IntentResult {
    const normalizedContent = content.toLowerCase().trim();
    
    // High-confidence ORDER patterns
    const orderPatterns = [
      /\b(write|draft|create|make|generate)\s+(a\s+)?(linkedin\s+)?post/i,
      /\bturn\s+this\s+into\s+(a\s+)?(post|content|article)/i,
      /\bpost\s+about/i,
      /\bcreate\s+content/i,
      /\bdraft\s+(something|a post)/i,
      /\bmake\s+(me\s+)?(a\s+)?post/i,
      /\bgenerate\s+(a\s+)?(post|content)/i
    ];

    // Check for ORDER patterns
    for (const pattern of orderPatterns) {
      if (pattern.test(normalizedContent)) {
        const parsedParams = this.parseOrderParams(content);
        return {
          intent: 'ORDER',
          confidence: 0.7, // Lower confidence for rule-based
          parsedParams
        };
      }
    }

    // Default to NOTE
    return {
      intent: 'NOTE',
      confidence: 0.8
    };
  }

  /**
   * Parse parameters from ORDER content
   */
  private parseOrderParams(content: string): OrderParams {
    const params: OrderParams = {};
    const normalizedContent = content.toLowerCase();

    // Platform detection
    if (normalizedContent.includes('linkedin')) {
      params.platform = 'linkedin';
    } else if (normalizedContent.includes('twitter') || normalizedContent.includes('x.com')) {
      params.platform = 'twitter';
    }

    // Length detection
    if (normalizedContent.includes('short') || normalizedContent.includes('brief')) {
      params.length = 'short';
    } else if (normalizedContent.includes('long') || normalizedContent.includes('detailed')) {
      params.length = 'long';
    }

    // Tone detection
    if (normalizedContent.includes('professional')) {
      params.tone = 'professional';
    } else if (normalizedContent.includes('casual') || normalizedContent.includes('friendly')) {
      params.tone = 'casual';
    } else if (normalizedContent.includes('formal')) {
      params.tone = 'formal';
    }

    // Angle detection
    if (normalizedContent.includes('story') || normalizedContent.includes('experience')) {
      params.angle = 'story';
    } else if (normalizedContent.includes('tip') || normalizedContent.includes('advice')) {
      params.angle = 'tip';
    } else if (normalizedContent.includes('insight') || normalizedContent.includes('lesson')) {
      params.angle = 'insight';
    }

    // Simple refs detection (tags or keywords mentioned)
    const refMatches = content.match(/#\w+/g) || [];
    if (refMatches.length > 0) {
      params.refs = refMatches;
    }

    return params;
  }

  /**
   * Process NOTE intent - store in meeting_notes
   */
  private async processNoteIntent(
    payload: ChatwootWebhookPayload, 
    userId: string | null, 
    contactId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get text content (from main content or transcription)
      let textContent = payload.content || '';
      
      // For audio messages, try to get transcription
      if (this.hasAudioAttachments(payload)) {
        // We'll use the transcription if available, otherwise just store the fact it's audio
        textContent = textContent || '[Audio message - transcription will be processed separately]';
      }

      if (!textContent.trim()) {
        return { success: true, message: 'Empty content, skipping NOTE processing' };
      }

      // Store in meeting_notes
      const noteData = {
        user_id: userId,
        chatwoot_conversation_id: payload.conversation.id.toString(),
        content: textContent,
        source_type: 'whatsapp',
        metadata: {
          chatwoot_message_id: payload.id,
          contact_id: contactId,
          sender_name: payload.sender.name,
          created_at: payload.created_at,
          content_type: payload.content_type || 'text',
          processed_at: new Date().toISOString()
        }
      };

      const { error } = await this.supabase
        .from('meeting_notes')
        .insert([noteData]);

      if (error) {
        console.error('Error storing NOTE in meeting_notes:', error);
        return { success: false, message: 'Failed to store note in knowledge base' };
      }

      console.log('✅ NOTE stored in meeting_notes');

      // ✅ NEW: Trigger RAG processing for text notes
      if (userId && textContent.trim()) {
        await this.triggerRAGProcessing(userId, {
          file_name: `WhatsApp Note - ${new Date(payload.created_at).toLocaleDateString()}`,
          file_type: 'file', // ✅ FIXED: Use 'file' instead of 'text' to match database constraint
          content: textContent,
          gcs_path: null, // Text notes don't have GCS path
          metadata: {
            source: 'whatsapp_text',
            contact_id: contactId,
            message_id: payload.id,
            conversation_id: payload.conversation.id,
            content_type: payload.content_type || 'text',
            has_transcription: this.hasAudioAttachments(payload), // Check if it has audio attachments
            processed_at: new Date().toISOString()
          }
        });
      }

      return { success: true, message: 'Note stored in knowledge base' };

    } catch (error) {
      console.error('Error processing NOTE intent:', error);
      return { success: false, message: 'Failed to process note' };
    }
  }

  /**
   * Process NOTE intent with transcription - store in meeting_notes with actual transcribed content
   */
  private async processNoteIntentWithTranscription(
    payload: ChatwootWebhookPayload, 
    userId: string | null, 
    contactId: string,
    transcriptionResult: { text: string; error?: string } | null
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get text content - prioritize transcription for audio messages
      let textContent = payload.content || '';
      
      if (this.hasAudioAttachments(payload) && transcriptionResult?.text) {
        textContent = transcriptionResult.text;
        console.log(`📝 Using transcribed content for NOTE: "${textContent.substring(0, 100)}..."`);
      } else if (this.hasAudioAttachments(payload)) {
        textContent = textContent || '[Audio message - transcription failed or empty]';
      }

      if (!textContent.trim()) {
        return { success: true, message: 'Empty content, skipping NOTE processing' };
      }

      // Store in meeting_notes with transcribed content
      const noteData = {
        user_id: userId,
        chatwoot_conversation_id: payload.conversation.id.toString(),
        content: textContent,
        source_type: 'whatsapp',
        metadata: {
          chatwoot_message_id: payload.id,
          contact_id: contactId,
          sender_name: payload.sender.name,
          created_at: payload.created_at,
          content_type: payload.content_type || 'text',
          has_transcription: !!transcriptionResult?.text,
          transcription_status: transcriptionResult?.error ? 'error' : (transcriptionResult?.text ? 'completed' : 'none'),
          processed_at: new Date().toISOString()
        }
      };

      const { error } = await this.supabase
        .from('meeting_notes')
        .insert([noteData]);

      if (error) {
        console.error('Error storing NOTE in meeting_notes:', error);
        return { success: false, message: 'Failed to store note in knowledge base' };
      }

      console.log('✅ NOTE with transcription stored in meeting_notes');

      // ✅ NEW: Trigger RAG processing for text notes
      if (userId && textContent.trim()) {
        await this.triggerRAGProcessing(userId, {
          file_name: `WhatsApp Note - ${new Date(payload.created_at).toLocaleDateString()}`,
          file_type: 'file', // ✅ FIXED: Use 'file' instead of 'text' to match database constraint
          content: textContent,
          gcs_path: null, // Text notes don't have GCS path
          metadata: {
            source: 'whatsapp_text',
            contact_id: contactId,
            message_id: payload.id,
            conversation_id: payload.conversation.id,
            content_type: payload.content_type || 'text',
            has_transcription: !!transcriptionResult?.text,
            processed_at: new Date().toISOString()
          }
        });
      }

      return { success: true, message: 'Note with transcription stored in knowledge base' };

    } catch (error) {
      console.error('Error processing NOTE intent with transcription:', error);
      return { success: false, message: 'Failed to process note' };
    }
  }

  /**
   * Process ORDER intent - create content_order and agent_job
   */
  private async processOrderIntent(
    payload: ChatwootWebhookPayload, 
    userId: string | null, 
    contactId: string,
    parsedParams: OrderParams
  ): Promise<{ success: boolean; message: string; orderId?: string }> {
    try {
      if (!userId) {
        // Cannot process ORDER without identified user
        const clarificationMessage = "I need to know who you are to create content for you. Please make sure your WhatsApp number is linked to your Pacelane account.";
        await this.sendClarificationMessage(payload, clarificationMessage);
        return { success: false, message: 'User not identified for ORDER processing' };
      }

      // Check for missing non-defaultable fields
      const missingFields: string[] = [];
      const requiredFields = ['platform', 'length', 'tone', 'topic'];
      
      for (const field of requiredFields) {
        if (!parsedParams[field as keyof OrderParams]) {
          missingFields.push(field);
        }
      }

      // If critical fields are missing, log and continue processing with defaults
      if (missingFields.length > 0) {
        console.log(`⚠️ Missing required fields for ORDER: ${missingFields.join(', ')}, using defaults`);
        // Note: Smart defaults will be applied in the mergeOrderParameters step
      }

      // Create content_order with complete parameters
      const orderData = {
        user_id: userId,
        source: 'whatsapp',
        params_json: {
          platform: parsedParams.platform!,
          length: parsedParams.length!,
          tone: parsedParams.tone!,
          angle: parsedParams.angle,
          topic: parsedParams.topic!,
          refs: parsedParams.refs || [],
          original_content: payload.content,
          context: {
            chatwoot_message_id: payload.id,
            contact_id: contactId,
            sender_name: payload.sender.name,
            created_at: payload.created_at
          }
        },
        triggered_by: 'whatsapp'
      };

      // First, insert content_order
      const { data: orderResult, error: orderError } = await this.supabase
        .from('content_order')
        .insert([orderData])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating content_order:', orderError);
        // Send ingestion failure notification
        await this.sendIngestionFailureNotification(payload, 'Failed to create content order');
        return { success: false, message: 'Failed to create content order' };
      }

      // Then, create agent_job to process the order with simplified flow
      const jobData = {
        type: 'process_order',
        payload_json: {
          order_id: orderResult.id
        },
        user_id: userId,
        status: 'pending',
        attempts: 0,
        run_at: new Date().toISOString(),
        user_message: payload.content || '', // Store original WhatsApp message
        simplified_flow: true // Use simplified flow (retrieval -> writer)
      };

      const { error: jobError } = await this.supabase
        .from('agent_job')
        .insert([jobData]);

      if (jobError) {
        console.error('Error creating agent_job:', jobError);
        // Send ingestion failure notification
        await this.sendIngestionFailureNotification(payload, 'Failed to enqueue processing job');
        return { success: false, message: 'Failed to enqueue processing job' };
      }

      console.log('✅ ORDER created and job enqueued:', orderResult.id);
      
      // Minimal policy: Only send confirmation for successful ORDER creation
      // No extraneous messages for smooth ORDER flows
      return { 
        success: true, 
        message: `Content order created and processing started`,
        orderId: orderResult.id
      };

    } catch (error) {
      console.error('Error processing ORDER intent:', error);
      // Send ingestion failure notification
      await this.sendIngestionFailureNotification(payload, 'Failed to process content order');
      return { success: false, message: 'Failed to process content order' };
    }
  }

  /**
   * Send clarification message via WhatsApp (minimal use)
   */
  private async sendClarificationMessage(payload: ChatwootWebhookPayload, message: string): Promise<boolean> {
    try {
      // Use the new Chatwoot API method
      const messageTemplate: ChatwootMessageTemplate = {
        content: message,
        message_type: 'outgoing',
        content_type: 'text'
      };

      console.log(`📤 Sending clarification message: ${message}`);
      return await this.sendChatwootMessage(payload.conversation.id, messageTemplate);

    } catch (error) {
      console.error('❌ Error sending clarification message:', error);
      return false;
    }
  }

  /**
   * Send message via Chatwoot API
   */
  private async sendChatwootMessage(
    conversationId: number, 
    message: ChatwootMessageTemplate
  ): Promise<boolean> {
    try {
      if (!this.chatwootConfig.baseUrl || !this.chatwootConfig.apiAccessToken || !this.chatwootConfig.accountId) {
        console.error('❌ Chatwoot API configuration missing');
        return false;
      }

      const url = `${this.chatwootConfig.baseUrl}/api/${CHATWOOT_API_VERSION}/accounts/${this.chatwootConfig.accountId}/conversations/${conversationId}/messages`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_access_token': this.chatwootConfig.apiAccessToken,
        },
        body: JSON.stringify(message),
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
   * Ensure conversation exists for WhatsApp notifications
   * FIXED: Now properly handles duplicate conversation IDs
   */
  private async ensureConversationExists(userId: string, chatwootConversationId: number): Promise<void> {
    try {
      console.log(`🔗 Ensuring conversation exists for user ${userId} with Chatwoot ID ${chatwootConversationId}`);
      
      // First, check if conversation with this Chatwoot ID already exists
      const { data: existingByChatwootId, error: findByIdError } = await this.supabase
        .from('conversations')
        .select('id, user_id')
        .eq('chatwoot_conversation_id', chatwootConversationId)
        .single();

      if (!findByIdError && existingByChatwootId) {
        // Conversation with this Chatwoot ID already exists
        if (existingByChatwootId.user_id === userId) {
          // Same user, just update timestamp
          const { error: updateError } = await this.supabase
            .from('conversations')
            .update({ 
              updated_at: new Date().toISOString()
            })
            .eq('id', existingByChatwootId.id);

          if (updateError) {
            console.error('❌ Error updating conversation timestamp:', updateError);
          } else {
            console.log(`✅ Updated existing conversation timestamp for user ${userId}`);
          }
        } else {
          // Different user - this shouldn't happen, but log it
          console.warn(`⚠️ Chatwoot conversation ${chatwootConversationId} already exists for different user ${existingByChatwootId.user_id}, skipping creation for user ${userId}`);
        }
        return; // Exit early, conversation already exists
      }

      // Check if user already has a conversation entry
      const { data: existingByUserId, error: findByUserError } = await this.supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!findByUserError && existingByUserId) {
        // User has existing conversation, update the Chatwoot ID
        const { error: updateError } = await this.supabase
          .from('conversations')
          .update({ 
            chatwoot_conversation_id: chatwootConversationId,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingByUserId.id);

        if (updateError) {
          console.error('❌ Error updating conversation Chatwoot ID:', updateError);
        } else {
          console.log(`✅ Updated existing conversation for user ${userId} with new Chatwoot ID ${chatwootConversationId}`);
        }
      } else {
        // Create new conversation entry
        const { error: insertError } = await this.supabase
          .from('conversations')
          .insert({
            user_id: userId,
            chatwoot_conversation_id: chatwootConversationId,
            context_json: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error('❌ Error creating conversation:', insertError);
        } else {
          console.log(`✅ Created new conversation for user ${userId} with Chatwoot ID ${chatwootConversationId}`);
        }
      }
    } catch (error) {
      console.error('❌ Error ensuring conversation exists:', error);
    }
  }

  // Removed old conversation management methods - replaced with smart AI + preferences approach

  /**
   * Send ingestion failure notification
   */
  private async sendIngestionFailureNotification(
    payload: ChatwootWebhookPayload, 
    error: string
  ): Promise<boolean> {
    try {
      const messageTemplate: ChatwootMessageTemplate = {
        content: `❌ Sorry, I couldn't process your message: ${error}\n\n💡 Try sending it again or contact support if the issue persists.`,
        message_type: 'outgoing',
        content_type: 'text'
      };

      console.log(`📤 Sending ingestion failure notification`);
      return await this.sendChatwootMessage(payload.conversation.id, messageTemplate);

    } catch (error) {
      console.error('❌ Error sending ingestion failure notification:', error);
      return false;
    }
  }

  /**
   * Send ready notice (only when opted-in)
   */
  private async sendReadyNotice(
    payload: ChatwootWebhookPayload, 
    orderId: string
  ): Promise<boolean> {
    try {
      // Check if user has opted in for ready notices
      const { data: userPrefs } = await this.supabase
        .from('user_bucket_mapping')
        .select('notify_on_ready')
        .eq('contact_id', `contact_${payload.sender.id}_account_${payload.account.id}`)
        .single();

      if (!userPrefs?.notify_on_ready) {
        console.log(`📱 User not opted in for ready notices, skipping`);
        return true;
      }

      const messageTemplate: ChatwootMessageTemplate = {
        content: `✅ Your content is ready!\n\n📱 Open the Pacelane app to view and edit your draft.\n\n🆔 Order ID: ${orderId}`,
        message_type: 'outgoing',
        content_type: 'text'
      };

      console.log(`📤 Sending ready notice for order ${orderId}`);
      return await this.sendChatwootMessage(payload.conversation.id, messageTemplate);

    } catch (error) {
      console.error('❌ Error sending ready notice:', error);
      return false;
    }
  }

  /**
   * Handle quick reply responses to complete missing order parameters
   */
  private async handleQuickReplyResponse(
    payload: ChatwootWebhookPayload,
    quickReplyValue: string,
    conversationId: number
  ): Promise<boolean> {
    try {
      // Get the conversation context to see what we're clarifying
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select('context_json')
        .eq('chatwoot_conversation_id', conversationId)
        .single();

      if (!conversation?.context_json?.clarifyingField) {
        console.log('❌ No clarification context found for conversation');
        return false;
      }

      const { clarifyingField, orderParams } = conversation.context_json;
      
      // Update the order parameters based on the quick reply
      const updatedParams = { ...orderParams };
      
      switch (clarifyingField) {
        case 'platform':
          updatedParams.platform = quickReplyValue;
          break;
        case 'length':
          updatedParams.length = quickReplyValue;
          break;
        case 'tone':
          updatedParams.tone = quickReplyValue;
          break;
        case 'topic':
          updatedParams.topic = quickReplyValue;
          break;
        default:
          console.log(`❌ Unknown clarifying field: ${clarifyingField}`);
          return false;
      }

      // Check if we now have all required fields
      const requiredFields = ['platform', 'length', 'tone', 'topic'];
      const missingFields = requiredFields.filter(field => !updatedParams[field as keyof OrderParams]);

      if (missingFields.length === 0) {
        // All fields complete, create the order
        console.log('✅ All required fields complete, creating order');
        
        // Clear the clarification context
        await this.supabase
          .from('conversations')
          .update({ 
            context_json: { ...conversation.context_json, clarifyingField: null },
            updated_at: new Date().toISOString()
          })
          .eq('chatwoot_conversation_id', conversationId);

        // Create the order with complete parameters
        const orderResult = await this.processOrderIntent(payload, conversation.context_json.userId, conversation.context_json.contactId, updatedParams);
        
        if (orderResult.success) {
          // Send confirmation that order was created
          const messageTemplate: ChatwootMessageTemplate = {
            content: `✅ Perfect! Your content order has been created and is being processed.\n\n📱 Check the Pacelane app for updates.`,
            message_type: 'outgoing',
            content_type: 'text'
          };
          
          return await this.sendChatwootMessage(conversationId, messageTemplate);
        } else {
          // Send error notification
          return await this.sendIngestionFailureNotification(payload, 'Failed to create order after clarification');
        }
      } else {
        // Still missing fields, use defaults for now
        console.log(`⚠️ Still missing fields: ${missingFields.join(', ')}, using defaults`);
        
        // Update conversation context with new parameters
        await this.supabase
          .from('conversations')
          .update({ 
            context_json: { ...conversation.context_json, orderParams: updatedParams },
            updated_at: new Date().toISOString()
          })
          .eq('chatwoot_conversation_id', conversationId);
        
        return true;
      }

    } catch (error) {
      console.error('❌ Error handling quick reply response:', error);
      return false;
    }
  }

  // Removed all conversation management methods - replaced with smart AI + preferences approach

  /**
   * Process incoming webhook payload
   */
  async processWebhook(payload: ChatwootWebhookPayload): Promise<{ success: boolean; message: string; intent?: string; userId?: string | null; bucketName?: string; whatsappNumber?: string | null; orderId?: string | null }> {
    console.log('Processing Chatwoot webhook:', payload.event, payload.id);

    // Validate payload
    if (!this.validatePayload(payload)) {
      return { success: false, message: 'Invalid webhook payload structure' };
    }

    // CRITICAL FIX: Only process INCOMING messages to prevent infinite loops
    if (payload.message_type !== 'incoming') {
      console.log(`⏭️ Skipping ${payload.message_type} message to prevent infinite loop`);
      return { success: true, message: `Skipped ${payload.message_type} message` };
    }

    // Check if this is a WhatsApp message
    if (!this.isWhatsAppMessage(payload)) {
      return { success: true, message: 'Event not applicable for WhatsApp processing' };
    }

    // Extract WhatsApp number and contact ID
    const whatsappNumber = this.extractWhatsAppNumber(payload);
    const contactId = `contact_${payload.sender.id}_account_${payload.account.id}`;

    // Use centralized user-bucket service for identification and bucket setup
    const bucketResult = await this.identifyUserAndSetupBucket(whatsappNumber, contactId);
    
    if (!bucketResult.success) {
      // Send ingestion failure notification for bucket setup issues
      await this.sendIngestionFailureNotification(payload, 'Failed to setup storage bucket');
      return { success: false, message: bucketResult.error || 'Failed to setup bucket' };
    }

    const { userId, bucketName, contactId: finalContactId } = bucketResult.data;

    // CRITICAL: Create or update conversation entry for WhatsApp notifications
    if (userId) {
      await this.ensureConversationExists(userId, payload.conversation.id);
    }

    // AUDIO FIX: For audio messages, transcribe first, then detect intent
    let contentForIntent = payload.content || '';
    let transcriptionResult: { text: string; error?: string } | null = null;
    
    if (this.hasAudioAttachments(payload)) {
      console.log('📢 Audio message detected - processing transcription first for intent detection');
      transcriptionResult = await this.transcribeAudioForIntent(payload);
      
      if (transcriptionResult?.text) {
        contentForIntent = transcriptionResult.text;
        console.log(`🎤 Using transcribed text for intent: "${contentForIntent.substring(0, 100)}..."`);
      } else {
        console.log('⚠️ Transcription failed or empty, using original content for intent');
      }
    }

    // AI-powered intent detection and routing with proper content
    const intentResult = await this.detectIntent(contentForIntent);
    console.log(`🎯 Intent detected: ${intentResult.intent} (confidence: ${intentResult.confidence})`);

    // Store in GCS and database first (needed for audio processing)
    const gcsPath = this.generateGCSPath(payload, bucketName);
    await this.storeInGCS(gcsPath, payload);
    await this.storeInDatabase(payload, gcsPath, userId, finalContactId);

    // Route based on intent
    if (intentResult.intent === 'ORDER') {
      console.log('🎯 Processing as ORDER');
      
      // Process as content order with smart defaults from user preferences
      const orderResult = await this.processOrderWithSmartDefaults(payload, userId, finalContactId, intentResult.parsedParams || {});
      
      // ❌ FIXED: Don't process audio attachments for ORDER intent
      // Audio content is already included in the order via transcription
      // This prevents duplicate posts from being created
      // if (this.hasAudioAttachments(payload)) {
      //   await this.processAudioAttachmentsWithTranscription(payload, bucketName, userId, finalContactId, gcsPath, transcriptionResult);
      // }

      // ✅ NEW: Process image attachments for ORDER intent (adds to knowledge base)
      // Images can provide additional context for content creation
      if (this.hasImageAttachments(payload)) {
        await this.processImageAttachments(payload, bucketName, userId, finalContactId, gcsPath);
      }

      return {
        success: orderResult.success,
        message: orderResult.message,
        intent: 'ORDER',
        userId: userId || null,
        bucketName,
        whatsappNumber: whatsappNumber || null,
        orderId: orderResult.orderId || null
      };

    } else {
      console.log('📝 Processing as NOTE');
      
      // Process as NOTE (default) - NO messages sent for NOTES
      const noteResult = await this.processNoteIntentWithTranscription(payload, userId, finalContactId, transcriptionResult);
      
      // ✅ Audio processing is allowed for NOTES (adds to knowledge base)
      // This is different from ORDER intent where audio is already captured in the order
      if (this.hasAudioAttachments(payload)) {
        await this.processAudioAttachmentsWithTranscription(payload, bucketName, userId, finalContactId, gcsPath, transcriptionResult);
      }

      // ✅ NEW: Process image attachments for NOTES (adds to knowledge base)
      if (this.hasImageAttachments(payload)) {
        await this.processImageAttachments(payload, bucketName, userId, finalContactId, gcsPath);
      }

      // Minimal policy: NOTES are processed silently, no WhatsApp messages sent
      console.log(`📝 NOTE processed silently (minimal policy)`);
      return {
        success: noteResult.success,
        message: noteResult.message,
        intent: 'NOTE',
        userId: userId || null,
        bucketName,
        whatsappNumber: whatsappNumber || null
      };
    }
  }

  /**
   * Use centralized user-bucket service for identification and bucket setup
   */
  private async identifyUserAndSetupBucket(
    whatsappNumber?: string, 
    contactId?: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔍 Using centralized user-bucket service...');
      
      // Call the centralized user-bucket service
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
        return { 
          success: false, 
          error: `User-bucket service error: ${response.status} ${errorText}` 
        };
      }

      const result = await response.json();
      console.log('✅ User-bucket service result:', result);
      
      return { success: true, data: result.data };

    } catch (error) {
      console.error('❌ Error calling user-bucket service:', error);
      return { 
        success: false, 
        error: `Error calling user-bucket service: ${error.message}` 
      };
    }
  }

  /**
   * Check if message has audio attachments
   */
  private hasAudioAttachments(payload: ChatwootWebhookPayload): boolean {
    return payload.attachments && payload.attachments.some(att => att.file_type === 'audio');
  }

  /**
   * Transcribe audio specifically for intent detection (fast path)
   */
  private async transcribeAudioForIntent(payload: ChatwootWebhookPayload): Promise<{ text: string; error?: string } | null> {
    try {
      if (!payload.attachments) return null;

      const audioAttachment = payload.attachments.find(att => att.file_type === 'audio');
      if (!audioAttachment) return null;

      console.log(`🎤 Transcribing audio for intent detection: ${audioAttachment.data_url}`);

      // Download audio file
      const audioBlob = await this.downloadAudioFile(audioAttachment.data_url);
      if (!audioBlob) {
        console.error('Failed to download audio for transcription');
        return null;
      }

      // Transcribe with OpenAI
      const transcription = await this.transcribeWithOpenAI(audioBlob);
      
      if (transcription?.text) {
        console.log(`✅ Transcription completed for intent: "${transcription.text.substring(0, 100)}..."`);
      }

      return transcription;

    } catch (error) {
      console.error('Error transcribing audio for intent:', error);
      return null;
    }
  }

  /**
   * Process all audio attachments in a message
   */
  private async processAudioAttachments(
    payload: ChatwootWebhookPayload, 
    bucketName: string, 
    userId: string | null, 
    contactId: string,
    messageGcsPath: string
  ): Promise<boolean> {
    if (!payload.attachments) return true;

    const audioAttachments = payload.attachments.filter(att => att.file_type === 'audio');
    console.log(`Processing ${audioAttachments.length} audio attachments`);

    let allSuccessful = true;

    for (const attachment of audioAttachments) {
      try {
        const audioSuccess = await this.processSingleAudioAttachment(
          attachment, 
          payload, 
          bucketName, 
          userId, 
          contactId,
          messageGcsPath
        );
        if (!audioSuccess) {
          allSuccessful = false;
        }
      } catch (error) {
        console.error(`Error processing audio attachment ${attachment.id}:`, error);
        allSuccessful = false;
      }
    }

    return allSuccessful;
  }

  /**
   * Process audio attachments with pre-computed transcription (avoids re-transcribing)
   */
  private async processAudioAttachmentsWithTranscription(
    payload: ChatwootWebhookPayload, 
    bucketName: string, 
    userId: string | null, 
    contactId: string,
    messageGcsPath: string,
    transcriptionResult: { text: string; error?: string } | null
  ): Promise<boolean> {
    if (!payload.attachments) return true;

    const audioAttachments = payload.attachments.filter(att => att.file_type === 'audio');
    console.log(`Processing ${audioAttachments.length} audio attachments with pre-computed transcription`);

    let allSuccessful = true;

    for (const attachment of audioAttachments) {
      try {
        const audioSuccess = await this.processSingleAudioAttachmentWithTranscription(
          attachment, 
          payload, 
          bucketName, 
          userId, 
          contactId,
          messageGcsPath,
          transcriptionResult
        );
        if (!audioSuccess) {
          allSuccessful = false;
        }
      } catch (error) {
        console.error(`Error processing audio attachment ${attachment.id}:`, error);
        allSuccessful = false;
      }
    }

    return allSuccessful;
  }

  /**
   * Process a single audio attachment
   */
  private async processSingleAudioAttachment(
    attachment: AudioAttachment,
    payload: ChatwootWebhookPayload,
    bucketName: string,
    userId: string | null,
    contactId: string,
    messageGcsPath: string
  ): Promise<boolean> {
    try {
      console.log(`Processing audio attachment ${attachment.id} from ${attachment.data_url}`);

      // Download audio file from Chatwoot
      const audioBlob = await this.downloadAudioFile(attachment.data_url);
      if (!audioBlob) {
        console.error(`Failed to download audio file: ${attachment.data_url}`);
        return false;
      }

      // Generate GCS path for audio file
      const audioGcsPath = this.generateAudioGCSPath(payload, bucketName, attachment);

      // Store audio file in GCS
      const audioStored = await this.storeAudioInGCS(audioGcsPath, audioBlob);
      if (!audioStored) {
        console.error(`Failed to store audio in GCS: ${audioGcsPath}`);
        return false;
      }

      // Transcribe audio with OpenAI
      const transcription = await this.transcribeWithOpenAI(audioBlob);

      // Store audio record in database
      const audioRecordStored = await this.storeAudioRecord(
        attachment,
        payload,
        audioGcsPath,
        transcription,
        userId,
        contactId,
        messageGcsPath
      );

      if (!audioRecordStored) {
        console.error(`Failed to store audio record in database`);
        return false;
      }

      console.log(`Successfully processed audio attachment ${attachment.id}`);
      return true;

    } catch (error) {
      console.error(`Error in processSingleAudioAttachment:`, error);
      return false;
    }
  }

  /**
   * Process a single audio attachment with pre-computed transcription
   */
  private async processSingleAudioAttachmentWithTranscription(
    attachment: AudioAttachment,
    payload: ChatwootWebhookPayload,
    bucketName: string,
    userId: string | null,
    contactId: string,
    messageGcsPath: string,
    transcriptionResult: { text: string; error?: string } | null
  ): Promise<boolean> {
    try {
      console.log(`Processing audio attachment ${attachment.id} with pre-computed transcription`);

      // Download audio file from Chatwoot
      const audioBlob = await this.downloadAudioFile(attachment.data_url);
      if (!audioBlob) {
        console.error(`Failed to download audio file: ${attachment.data_url}`);
        return false;
      }

      // Generate GCS path for audio file
      const audioGcsPath = this.generateAudioGCSPath(payload, bucketName, attachment);

      // Store audio file in GCS
      const audioStored = await this.storeAudioInGCS(audioGcsPath, audioBlob);
      if (!audioStored) {
        console.error(`Failed to store audio in GCS: ${audioGcsPath}`);
        return false;
      }

      // Use pre-computed transcription (avoid re-transcribing)
      console.log(`📝 Using pre-computed transcription for storage`);

      // Store audio record in database with existing transcription
      const audioRecordStored = await this.storeAudioRecord(
        attachment,
        payload,
        audioGcsPath,
        transcriptionResult,
        userId,
        contactId,
        messageGcsPath
      );

      if (!audioRecordStored) {
        console.error(`Failed to store audio record in database`);
        return false;
      }

      console.log(`Successfully processed audio attachment ${attachment.id} with pre-computed transcription`);
      return true;

    } catch (error) {
      console.error(`Error in processSingleAudioAttachmentWithTranscription:`, error);
      return false;
    }
  }

  /**
   * Download audio file from Chatwoot URL
   */
  private async downloadAudioFile(dataUrl: string): Promise<Blob | null> {
    try {
      // Fix relative URLs from Chatwoot by prepending the base URL
      let fullUrl = dataUrl;
      if (dataUrl.startsWith('http:///') || dataUrl.startsWith('https:///')) {
        // Remove the triple slash and construct full URL
        const path = dataUrl.replace(/^https?:\/\/\//, '/');
        fullUrl = `${this.chatwootConfig.baseUrl}${path}`;
      }
      
      console.log(`Downloading audio from: ${fullUrl}`);
      
      const response = await fetch(fullUrl);
      if (!response.ok) {
        console.error(`Failed to download audio: ${response.status} ${response.statusText}`);
        return null;
      }

      const blob = await response.blob();
      console.log(`Downloaded audio file: ${blob.size} bytes, type: ${blob.type}`);
      return blob;

    } catch (error) {
      console.error('Error downloading audio file:', error);
      return null;
    }
  }

  /**
   * Generate GCS path for audio file storage
   */
  private generateAudioGCSPath(payload: ChatwootWebhookPayload, bucketName: string, attachment: AudioAttachment): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const conversationId = payload.conversation.id;
    const messageId = payload.id;
    const attachmentId = attachment.id;
    
    // ✅ FIXED: Remove the gs:// prefix since bucketName already includes it
    return `${bucketName}/whatsapp-audio/${date}/${conversationId}/${messageId}_${attachmentId}.mp3`;
  }

  /**
   * Store audio file in Google Cloud Storage
   */
  private async storeAudioInGCS(gcsPath: string, audioBlob: Blob): Promise<boolean> {
    try {
      // Extract bucket name from gs://bucket-name/path format
      const bucketName = gcsPath.split('/')[2];
      
      console.log(`Storing audio in GCS: ${gcsPath}`);

      // Get access token for GCS API
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        console.error('Failed to get GCS access token for audio upload');
        return false;
      }

      // Extract object name from the full path (gs://bucket/path -> path)
      const objectName = gcsPath.replace(`gs://${bucketName}/`, '');

      // Convert blob to array buffer
      const audioBuffer = await audioBlob.arrayBuffer();

      // Upload to GCS
      const response = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(objectName)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': audioBlob.type || 'audio/mpeg',
        },
        body: audioBuffer,
      });

      if (response.ok) {
        console.log(`Audio stored successfully in GCS: ${gcsPath}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`Error storing audio in GCS: ${response.status} ${response.statusText} - ${errorText}`);
        return false;
      }

    } catch (error) {
      console.error('Error storing audio in GCS:', error);
      return false;
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   */
  private async transcribeWithOpenAI(audioBlob: Blob): Promise<{ text: string; error?: string } | null> {
    try {
      if (!this.openaiConfig.apiKey) {
        console.error('OpenAI API key not configured');
        return { text: '', error: 'OpenAI API key not configured' };
      }

      console.log(`Transcribing audio with OpenAI Whisper (${audioBlob.size} bytes)`);

      // Prepare form data for OpenAI API
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.mp3');
      formData.append('model', this.openaiConfig.model);

      // Call OpenAI Whisper API
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiConfig.apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
        return { text: '', error: `OpenAI API error: ${response.status} ${response.statusText}` };
      }

      const result = await response.json();
      console.log(`Transcription completed: ${result.text?.substring(0, 100)}...`);
      
      return { text: result.text || '' };

    } catch (error) {
      console.error('Error transcribing audio:', error);
      return { text: '', error: error.message };
    }
  }

  /**
   * Store audio record in database
   */
  private async storeAudioRecord(
    attachment: AudioAttachment,
    payload: ChatwootWebhookPayload,
    audioGcsPath: string,
    transcription: { text: string; error?: string } | null,
    userId: string | null,
    contactId: string,
    messageGcsPath: string
  ): Promise<boolean> {
    try {
      // First, get the meeting_note_id by finding the stored message
      const { data: meetingNote, error: findError } = await this.supabase
        .from('meeting_notes')
        .select('id')
        .eq('chatwoot_message_id', payload.id)
        .eq('contact_identifier', contactId)
        .single();

      if (findError || !meetingNote) {
        console.error('Failed to find meeting note for audio attachment:', findError);
        return false;
      }

      const insertData = {
        user_id: userId,
        contact_identifier: contactId,
        meeting_note_id: meetingNote.id,
        chatwoot_attachment_id: attachment.id,
        chatwoot_attachment_url: attachment.data_url,
        file_path: audioGcsPath,
        transcription: transcription?.text || null,
        transcription_status: transcription?.error ? 'error' : (transcription?.text ? 'completed' : 'error'),
        transcription_error: transcription?.error || null,
        openai_model: this.openaiConfig.model,
        original_file_size: attachment.file_size,
        duration_seconds: null, // Could be extracted from audio metadata if needed
        processed_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('audio_files')
        .insert([insertData])
        .select();

      if (error) {
        console.error('Database insert error for audio file:', error);
        return false;
      }

      console.log('Audio record stored in database:', data?.[0]?.id);

      // Also add to knowledge_files table so it appears in the knowledge base
      if (userId) {
        await this.addAudioToKnowledgeBase(
          attachment,
          audioGcsPath,
          transcription,
          userId,
          contactId,
          payload
        );
      }

      return true;

    } catch (error) {
      console.error('Error storing audio record:', error);
      return false;
    }
  }

  /**
   * Add audio file to knowledge base so users can access it
   */
  private async addAudioToKnowledgeBase(
    attachment: AudioAttachment,
    audioGcsPath: string,
    transcription: { text: string; error?: string } | null,
    userId: string,
    contactId: string,
    payload: ChatwootWebhookPayload
  ): Promise<void> {
    try {
      // ✅ MODIFIED: Don't create duplicate entry in knowledge_files table
      // Audio files are already stored in audio_files table
      // Just trigger RAG processing for the transcribed content
      
      if (transcription?.text) {
        console.log(`🎤 Audio transcription available, triggering RAG processing`);
        
        // Generate a descriptive filename for RAG processing
        const timestamp = new Date(payload.created_at).toISOString().split('T')[0];
        const fileName = `WhatsApp Audio - ${timestamp} - ${contactId}.mp3`;
        
        // ✅ NEW: Trigger RAG processing for the transcribed content
        await this.triggerRAGProcessing(userId, {
          file_name: fileName,
          file_type: 'audio',
          content: transcription.text,
          gcs_path: audioGcsPath,
          metadata: {
            source: 'whatsapp_audio',
            contact_id: contactId,
            message_id: payload.id,
            conversation_id: payload.conversation.id,
            transcription_model: this.openaiConfig.model,
            processed_at: new Date().toISOString()
          }
        });
      } else {
        console.log(`⚠️ No transcription available for audio, skipping RAG processing`);
      }

    } catch (error) {
      console.error('Error processing audio for knowledge base:', error);
    }
  }

  /**
   * ✅ NEW: Trigger RAG processing for WhatsApp content
   */
  private async triggerRAGProcessing(userId: string, fileData: any): Promise<void> {
    try {
      console.log(`🚀 Triggering RAG processing for WhatsApp content: ${fileData.file_name}`);
      
      // Call knowledge-base-storage function with whatsapp_content action
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/knowledge-base-storage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          userId: userId,
          action: 'whatsapp_content',
          file_name: fileData.file_name,
          file_type: fileData.file_type,
          content: fileData.content,
          gcs_path: fileData.gcs_path,
          metadata: fileData.metadata
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ RAG processing triggered successfully:`, result);
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Failed to trigger RAG processing: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error triggering RAG processing:', error);
    }
  }

  /**
   * Determine the intent of the incoming message
   */
  private async determineIntent(content: string, userId: string): Promise<{ intent: 'NOTE' | 'ORDER' | 'CONVERSATION_RESPONSE'; confidence: number }> {
    try {
      // First, check if this is a response to an active clarification
      // We'll do this by checking if there's an active conversation context
      // This check will be done in the main webhook processing
      
      // For now, use the existing AI intent detection
      const response = await fetch(`${this.supabaseUrl}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
        },
        body: JSON.stringify({
          message: content,
          userId: userId,
          context: 'intent_detection'
        })
      });

      if (!response.ok) {
        console.error('❌ AI intent detection failed:', response.statusText);
        // Default to NOTE if AI detection fails
        return { intent: 'NOTE', confidence: 0.5 };
      }

      const result = await response.json();
      console.log(`🤖 AI Intent Detection Result:`, result);
      
      return {
        intent: result.intent || 'NOTE',
        confidence: result.confidence || 0.5
      };
    } catch (error) {
      console.error('❌ Error determining intent:', error);
      return { intent: 'NOTE', confidence: 0.5 };
    }
  }

  /**
   * Process order with smart defaults from user preferences
   */
  private async processOrderWithSmartDefaults(
    payload: ChatwootWebhookPayload,
    userId: string,
    contactId: string,
    providedParams: any
  ): Promise<{ success: boolean; message: string; orderId?: string }> {
    try {
      console.log(`🤖 Processing order with smart defaults for user ${userId}`);
      
      // Step 1: Get user preferences from onboarding
      const userPreferences = await this.getUserPreferences(userId);
      console.log(`👤 User preferences:`, userPreferences);
      
      // Step 2: Analyze message content with AI to extract any provided parameters
      const aiAnalysis = await this.analyzeMessageContent(payload.content || '');
      console.log(`🧠 AI analysis:`, aiAnalysis);
      
      // Step 3: Merge provided params, AI analysis, and user preferences
      const finalParams = this.mergeOrderParameters(providedParams, aiAnalysis, userPreferences);
      console.log(`🔧 Final order parameters:`, finalParams);
      
      // Step 4: Create the order
      const orderResult = await this.processOrderIntent(payload, userId, contactId, finalParams);
      
      if (orderResult.success) {
        // Step 5: Send confirmation message with what was understood
        const confirmationMessage = this.buildConfirmationMessage(finalParams, aiAnalysis);
        await this.sendOrderConfirmation(payload, confirmationMessage);
        
        return {
          success: true,
          message: 'Order created successfully with smart defaults',
          orderId: orderResult.orderId
        };
      } else {
        // Send error notification
        await this.sendIngestionFailureNotification(payload, orderResult.message);
        return {
          success: false,
          message: orderResult.message
        };
      }
      
    } catch (error) {
      console.error('❌ Error processing order with smart defaults:', error);
      await this.sendIngestionFailureNotification(payload, 'Failed to process order with smart defaults');
      return {
        success: false,
        message: `Internal error: ${error.message}`
      };
    }
  }

  /**
   * Get user preferences from onboarding data
   */
  private async getUserPreferences(userId: string): Promise<any> {
    try {
      console.log(`👤 Getting preferences for user: ${userId}`);
      
      // Get user profile data
      const { data: profile, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors

      if (profileError) {
        console.log(`⚠️ Profile lookup error (using defaults):`, profileError.message);
      } else if (profile) {
        console.log(`✅ Found user profile:`, profile);
      } else {
        console.log(`📝 No profile found, using defaults`);
      }

      // Get user goals and preferences
      const { data: goals, error: goalsError } = await this.supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (goalsError) {
        console.log(`⚠️ Goals lookup error (using defaults):`, goalsError.message);
      } else if (goals) {
        console.log(`✅ Found user goals:`, goals);
      } else {
        console.log(`📝 No goals found, using defaults`);
      }

      // Get user pacing preferences
      const { data: pacing, error: pacingError } = await this.supabase
        .from('pacing_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (pacingError) {
        console.log(`⚠️ Pacing lookup error (using defaults):`, pacingError.message);
      } else if (pacing) {
        console.log(`✅ Found user pacing:`, pacing);
      } else {
        console.log(`📝 No pacing found, using defaults`);
      }

      // Extract key preferences with sensible defaults
      const preferences = {
        profile: profile || {},
        goals: goals || {},
        pacing: pacing || {},
        // Extract key preferences with fallbacks
        preferredPlatform: goals?.content_platform || 'linkedin',
        preferredTone: goals?.content_tone || 'professional',
        preferredLength: pacing?.content_length || 'medium',
        preferredFrequency: pacing?.posting_frequency || 'weekly',
        industry: profile?.industry || 'technology'
      };

      console.log(`🔧 Final preferences object:`, preferences);
      return preferences;
      
    } catch (error) {
      console.error('❌ Error getting user preferences:', error);
      // Return sensible defaults if everything fails
      return {
        profile: {},
        goals: {},
        pacing: {},
        preferredPlatform: 'linkedin',
        preferredTone: 'professional',
        preferredLength: 'medium',
        preferredFrequency: 'weekly',
        industry: 'technology'
      };
    }
  }

  /**
   * Analyze message content with AI to extract parameters
   */
  private async analyzeMessageContent(content: string): Promise<any> {
    try {
      // Use the correct Supabase URL from environment
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || 'https://plbgeabtrkdhbrnjonje.supabase.co';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/ai-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseServiceKey}`,
        },
        body: JSON.stringify({
          message: content,
          context: 'order_parameter_extraction',
          task: 'Extract content creation parameters from user message'
        })
      });

      if (!response.ok) {
        console.error('❌ AI analysis failed:', response.statusText);
        return {};
      }

      const result = await response.json();
      console.log(`🧠 AI analysis result:`, result);
      
      return {
        platform: result.platform || null,
        topic: result.topic || null,
        length: result.length || null,
        tone: result.tone || null,
        format: result.format || null,
        urgency: result.urgency || null
      };
      
    } catch (error) {
      console.error('❌ Error analyzing message content:', error);
      return {};
    }
  }

  /**
   * Merge provided parameters, AI analysis, and user preferences
   */
  private mergeOrderParameters(provided: any, aiAnalysis: any, preferences: any): any {
    const merged = {
      platform: provided.platform || aiAnalysis.platform || preferences.preferredPlatform || 'linkedin',
      topic: provided.topic || aiAnalysis.topic || 'general',
      length: provided.length || aiAnalysis.length || preferences.preferredLength || 'medium',
      tone: provided.tone || aiAnalysis.tone || preferences.preferredTone || 'professional',
      format: provided.format || aiAnalysis.format || 'post',
      urgency: provided.urgency || aiAnalysis.urgency || 'normal'
    };

    console.log(`🔧 Merged parameters:`, merged);
    return merged;
  }

  /**
   * Build confirmation message showing what was understood
   */
  private buildConfirmationMessage(params: any, aiAnalysis: any): string {
    const platform = params.platform.charAt(0).toUpperCase() + params.platform.slice(1);
    const tone = params.tone.charAt(0).toUpperCase() + params.tone.slice(1);
    const length = params.length.charAt(0).toUpperCase() + params.length.slice(1);
    
    let message = `✅ Order created successfully!\n\n`;
    message += `📱 Platform: ${platform}\n`;
    message += `📏 Length: ${length}\n`;
    message += `🎭 Tone: ${tone}\n`;
    message += `💡 Topic: ${params.topic}\n\n`;
    message += `📱 Check the Pacelane app for updates and to edit your draft.`;
    
    // If AI filled in some fields, mention it
    if (aiAnalysis.platform || aiAnalysis.tone || aiAnalysis.length) {
      message += `\n\n💡 I used your preferred settings for missing details.`;
    }
    
    return message;
  }

  /**
   * Send order confirmation message
   */
  private async sendOrderConfirmation(payload: ChatwootWebhookPayload, message: string): Promise<boolean> {
    try {
      const messageTemplate: ChatwootMessageTemplate = {
        content: message,
        message_type: 'outgoing',
        content_type: 'text'
      };

      console.log(`📤 Sending order confirmation`);
      return await this.sendChatwootMessage(payload.conversation.id, messageTemplate);
      
    } catch (error) {
      console.error('❌ Error sending order confirmation:', error);
      return false;
    }
  }

  /**
   * Check if message has image attachments
   */
  private hasImageAttachments(payload: ChatwootWebhookPayload): boolean {
    return payload.attachments && payload.attachments.some(att => att.file_type === 'image');
  }

  /**
   * Process all image attachments in a message
   */
  private async processImageAttachments(
    payload: ChatwootWebhookPayload, 
    bucketName: string, 
    userId: string | null, 
    contactId: string,
    messageGcsPath: string
  ): Promise<boolean> {
    if (!payload.attachments) return true;

    const imageAttachments = payload.attachments.filter(att => att.file_type === 'image');
    console.log(`Processing ${imageAttachments.length} image attachments`);

    let allSuccessful = true;

    for (const attachment of imageAttachments) {
      try {
        const imageSuccess = await this.processSingleImageAttachment(
          attachment, 
          payload, 
          bucketName, 
          userId, 
          contactId,
          messageGcsPath
        );
        if (!imageSuccess) {
          allSuccessful = false;
        }
      } catch (error) {
        console.error(`Error processing image attachment ${attachment.id}:`, error);
        allSuccessful = false;
      }
    }

    return allSuccessful;
  }

  /**
   * Process a single image attachment
   */
  private async processSingleImageAttachment(
    attachment: AudioAttachment, // Reuse AudioAttachment interface for images
    payload: ChatwootWebhookPayload,
    bucketName: string,
    userId: string | null,
    contactId: string,
    messageGcsPath: string
  ): Promise<boolean> {
    try {
      console.log(`Processing image attachment ${attachment.id} from ${attachment.data_url}`);

      // Download image file from Chatwoot
      const imageBlob = await this.downloadImageFile(attachment.data_url);
      if (!imageBlob) {
        console.error(`Failed to download image file: ${attachment.data_url}`);
        return false;
      }

      // Generate GCS path for image file
      const imageGcsPath = this.generateImageGCSPath(payload, bucketName, attachment);

      // Store image file in GCS
      const imageStored = await this.storeImageInGCS(imageGcsPath, imageBlob);
      if (!imageStored) {
        console.error(`Failed to store image in GCS: ${imageGcsPath}`);
        return false;
      }

      // Store image record in database and add to knowledge base
      const imageRecordStored = await this.storeImageRecord(
        attachment,
        payload,
        imageGcsPath,
        userId,
        contactId,
        messageGcsPath
      );

      if (!imageRecordStored) {
        console.error(`Failed to store image record in database`);
        return false;
      }

      console.log(`Successfully processed image attachment ${attachment.id}`);
      return true;

    } catch (error) {
      console.error(`Error in processSingleImageAttachment:`, error);
      return false;
    }
  }

  /**
   * Download image file from Chatwoot URL
   */
  private async downloadImageFile(dataUrl: string): Promise<Blob | null> {
    try {
      // Fix relative URLs from Chatwoot by prepending the base URL
      let fullUrl = dataUrl;
      if (dataUrl.startsWith('http:///') || dataUrl.startsWith('https:///')) {
        // Remove the triple slash and construct full URL
        const path = dataUrl.replace(/^https?:\/\/\//, '/');
        fullUrl = `${this.chatwootConfig.baseUrl}${path}`;
      }
      
      console.log(`Downloading image from: ${fullUrl}`);
      
      const response = await fetch(fullUrl);
      if (!response.ok) {
        console.error(`Failed to download image: ${response.status} ${response.statusText}`);
        return null;
      }

      const blob = await response.blob();
      console.log(`Downloaded image file: ${blob.size} bytes, type: ${blob.type}`);
      return blob;

    } catch (error) {
      console.error('Error downloading image file:', error);
      return null;
    }
  }

  /**
   * Generate GCS path for image file storage
   */
  private generateImageGCSPath(payload: ChatwootWebhookPayload, bucketName: string, attachment: AudioAttachment): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const conversationId = payload.conversation.id;
    const messageId = payload.id;
    const attachmentId = attachment.id;
    
    // Determine file extension from attachment or default to jpg
    const fileExtension = this.getImageFileExtension(attachment.data_url) || 'jpg';
    
    return `gs://${bucketName}/whatsapp-images/${date}/${conversationId}/${messageId}_${attachmentId}.${fileExtension}`;
  }

  /**
   * Get image file extension from URL
   */
  private getImageFileExtension(url: string): string | null {
    try {
      const urlPath = new URL(url).pathname;
      const extension = urlPath.split('.').pop()?.toLowerCase();
      
      // Common image extensions
      const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
      return validExtensions.includes(extension || '') ? extension : null;
    } catch {
      return null;
    }
  }

  /**
   * Store image file in Google Cloud Storage
   */
  private async storeImageInGCS(gcsPath: string, imageBlob: Blob): Promise<boolean> {
    try {
      // Extract bucket name from gs://bucket-name/path format
      const bucketName = gcsPath.split('/')[2];
      
      console.log(`Storing image in GCS: ${gcsPath}`);

      // Get access token for GCS API
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        console.error('Failed to get GCS access token for image upload');
        return false;
      }

      // Extract object name from the full path (gs://bucket/path -> path)
      const objectName = gcsPath.replace(`gs://${bucketName}/`, '');

      // Convert blob to array buffer
      const imageBuffer = await imageBlob.arrayBuffer();

      // Upload to GCS
      const response = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(objectName)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': imageBlob.type || 'image/jpeg',
        },
        body: imageBuffer,
      });

      if (response.ok) {
        console.log(`Image stored successfully in GCS: ${gcsPath}`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`Error storing image in GCS: ${response.status} ${response.statusText} - ${errorText}`);
        return false;
      }

    } catch (error) {
      console.error('Error storing image in GCS:', error);
      return false;
    }
  }

  /**
   * Store image record in database and add to knowledge base
   */
  private async storeImageRecord(
    attachment: AudioAttachment,
    payload: ChatwootWebhookPayload,
    imageGcsPath: string,
    userId: string | null,
    contactId: string,
    messageGcsPath: string
  ): Promise<boolean> {
    try {
      // Add image to knowledge base so users can access it
      if (userId) {
        await this.addImageToKnowledgeBase(
          attachment,
          imageGcsPath,
          userId,
          contactId,
          payload
        );
      }

      console.log('Image record processed and added to knowledge base');
      return true;

    } catch (error) {
      console.error('Error storing image record:', error);
      return false;
    }
  }

  /**
   * Add image file to knowledge base so users can access it
   */
  private async addImageToKnowledgeBase(
    attachment: AudioAttachment,
    imageGcsPath: string,
    userId: string,
    contactId: string,
    payload: ChatwootWebhookPayload
  ): Promise<void> {
    try {
      console.log(`📷 Adding image to knowledge base: ${imageGcsPath}`);
      
      // Generate a descriptive filename for the image
      const timestamp = new Date(payload.created_at).toISOString().split('T')[0];
      const fileExtension = this.getImageFileExtension(attachment.data_url) || 'jpg';
      const fileName = `WhatsApp Image - ${timestamp} - ${contactId}.${fileExtension}`;
      
      // Trigger RAG processing for the image
      await this.triggerRAGProcessing(userId, {
        file_name: fileName,
        file_type: 'image',
        content: `[Image attachment from WhatsApp conversation on ${timestamp}]`, // Placeholder content for images
        gcs_path: imageGcsPath,
        metadata: {
          source: 'whatsapp_image',
          contact_id: contactId,
          message_id: payload.id,
          conversation_id: payload.conversation.id,
          attachment_id: attachment.id,
          attachment_url: attachment.data_url,
          file_size: attachment.file_size,
          processed_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error adding image to knowledge base:', error);
    }
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
    
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));
    
    // Initialize processor
    const processor = new ChatwootWebhookProcessor();
    
    // Process the webhook
    const result = await processor.processWebhook(payload);

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
    console.error('Webhook processing error:', error);
    
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