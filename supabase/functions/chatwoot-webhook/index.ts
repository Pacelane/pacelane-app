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

  constructor() {
    // Initialize Supabase client with service role key for admin access
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
      baseUrl: Deno.env.get('CHATWOOT_BASE_URL') ?? ''
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
      // Check if bucket exists in GCS
      const exists = await this.bucketExists(bucketName);
      if (exists) {
        console.log(`Found existing bucket ${bucketName} for user ${userId}, creating mapping`);
        
        // Create the mapping in our database
        await this.storeUserBucketMapping(userId, bucketName);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking and mapping existing bucket:', error);
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

      // If no mapping exists, try to find user by WhatsApp number in profiles
      for (const variation of numberVariations) {
        const { data: userProfile, error: profileError } = await this.supabase
          .from('profiles')
          .select('user_id, whatsapp_number')
          .eq('whatsapp_number', variation)
          .single();

        if (!profileError && userProfile) {
          console.log(`Found user ${userProfile.user_id} for WhatsApp number: ${variation}`);
          
          // Create mapping for future use with the original normalized number
          const normalizedNumber = this.normalizeWhatsAppNumber(whatsappNumber);
          await this.createWhatsAppMapping(userProfile.user_id, normalizedNumber, payload);
          
          return { userId: userProfile.user_id, contactId };
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

      console.log(`No user found for WhatsApp number: ${normalizedNumber}`);
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

    // 5. From account metadata (fallback)
    if (payload.account && payload.account.additional_attributes) {
      const whatsappNumber = payload.account.additional_attributes.phone_number;
      if (whatsappNumber) {
        console.log('Found WhatsApp number in account.additional_attributes:', whatsappNumber);
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
   * Process incoming webhook payload
   */
  async processWebhook(payload: ChatwootWebhookPayload): Promise<{ success: boolean; message: string }> {
    console.log('Processing Chatwoot webhook:', payload.event, payload.id);

    // Validate payload
    if (!this.validatePayload(payload)) {
      return { success: false, message: 'Invalid webhook payload structure' };
    }

    // Check if this is a WhatsApp message
    if (!this.isWhatsAppMessage(payload)) {
      return { success: true, message: 'Event not applicable for WhatsApp processing' };
    }

    // Find user by WhatsApp number
    const { userId, contactId } = await this.findUserByWhatsAppNumber(payload);
    
    // Debug: List existing buckets to help with troubleshooting
    console.log('Listing existing buckets for debugging...');
    await this.listBucketsWithPrefix();
    
    // Determine bucket name based on user identification
    let bucketName: string;
    if (userId) {
      // First, try to get existing bucket for this user
      const existingBucket = await this.getUserBucketName(userId);
      if (existingBucket) {
        bucketName = existingBucket;
        console.log(`Using existing bucket: ${bucketName} for user: ${userId}`);
      } else {
        // Generate new bucket name
        bucketName = this.generateUserBucketName(userId);
        console.log(`Generated bucket name: ${bucketName} for user: ${userId}`);
        
        // Check if this bucket already exists in GCS (from previous runs)
        const existingBucketFound = await this.checkAndMapExistingBucket(userId, bucketName);
        if (!existingBucketFound) {
          // Only store mapping if we're going to create a new bucket
          console.log(`No existing bucket found, will create new bucket: ${bucketName}`);
        }
      }
    } else {
      bucketName = this.generateContactBucketName(contactId);
      console.log(`Using contact-based bucket: ${bucketName} for contact: ${contactId}`);
    }
    
    // Ensure bucket exists (create if necessary)
    console.log(`Ensuring bucket exists: ${bucketName}`);
    const bucketReady = await this.ensureUserBucket(bucketName);
    if (!bucketReady) {
      console.error(`Failed to ensure bucket exists: ${bucketName}`);
      return { success: false, message: 'Failed to ensure bucket exists' };
    }
    console.log(`Bucket is ready: ${bucketName}`);

    // Generate GCS storage path with user bucket
    const gcsPath = this.generateGCSPath(payload, bucketName);

    // Attempt to store in GCS
    const gcsSuccess = await this.storeInGCS(gcsPath, payload);
    if (!gcsSuccess) {
      return { success: false, message: 'Failed to store message in GCS' };
    }

    // Store in database with contact identifier
    const dbSuccess = await this.storeInDatabase(payload, gcsPath, userId, contactId);
    if (!dbSuccess) {
      return { success: false, message: 'Failed to store message in database' };
    }

    // Process audio attachments if present
    if (this.hasAudioAttachments(payload)) {
      const audioSuccess = await this.processAudioAttachments(payload, bucketName, userId, contactId, gcsPath);
      if (!audioSuccess) {
        console.warn('Audio processing failed, but message was stored successfully');
      }
    }

    return { 
      success: true, 
      message: `WhatsApp message ${payload.id} processed and stored in bucket ${bucketName}`,
      userId: userId || null,
      bucketName,
      whatsappNumber: this.extractWhatsAppNumber(payload) || null
    };
  }

  /**
   * Check if message has audio attachments
   */
  private hasAudioAttachments(payload: ChatwootWebhookPayload): boolean {
    return payload.attachments && payload.attachments.some(att => att.file_type === 'audio');
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
    
    return `gs://${bucketName}/whatsapp-audio/${date}/${conversationId}/${messageId}_${attachmentId}.mp3`;
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
      // Generate a descriptive filename
      const timestamp = new Date(payload.created_at).toISOString().split('T')[0];
      const fileName = `WhatsApp Audio - ${timestamp} - ${contactId}.mp3`;
      
      // Create knowledge file record
      const knowledgeFileData = {
        user_id: userId,
        name: fileName,
        type: 'audio',
        size: attachment.file_size,
        gcs_bucket: audioGcsPath.split('/')[0], // Extract bucket name from path
        gcs_path: audioGcsPath,
        file_hash: `audio_${attachment.id}_${Date.now()}`, // Generate unique hash
        content_extracted: transcription?.text ? true : false,
        extracted_content: transcription?.text || null,
        extraction_metadata: {
          source: 'whatsapp_audio',
          contact_id: contactId,
          chatwoot_attachment_id: attachment.id,
          transcription_status: transcription?.error ? 'error' : (transcription?.text ? 'completed' : 'error'),
          openai_model: this.openaiConfig.model,
          original_message_id: payload.id,
          recorded_at: payload.created_at
        },
        metadata: {
          original_name: fileName,
          source: 'whatsapp',
          contact_identifier: contactId,
          chatwoot_attachment_id: attachment.id,
          file_type: 'audio',
          duration_seconds: null, // Could be extracted if needed
          uploaded_at: new Date().toISOString()
        }
      };

      const { data: knowledgeFile, error: knowledgeError } = await this.supabase
        .from('knowledge_files')
        .insert([knowledgeFileData])
        .select();

      if (knowledgeError) {
        console.error('Error adding audio to knowledge base:', knowledgeError);
      } else {
        console.log('Audio file added to knowledge base:', knowledgeFile?.[0]?.id);
      }

    } catch (error) {
      console.error('Error adding audio to knowledge base:', error);
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