import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
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

interface UserIdentificationResult {
  userId: string | null;
  contactId: string;
  bucketName: string;
  isNewBucket: boolean;
  whatsappNumber?: string;
  normalizedNumber?: string;
}

interface BucketInfo {
  bucketName: string;
  exists: boolean;
  created: boolean;
}

class UserBucketService {
  private gcsConfig: GCSConfig;
  private supabase: any;

  constructor(serviceRoleKey?: string) {
    this.gcsConfig = {
      bucketPrefix: Deno.env.get('GCS_BUCKET_PREFIX') ?? 'pacelane-whatsapp',
      projectId: Deno.env.get('GCS_PROJECT_ID') ?? '',
      clientEmail: Deno.env.get('GCS_CLIENT_EMAIL') ?? '',
      privateKey: Deno.env.get('GCS_PRIVATE_KEY') ?? '',
      privateKeyId: Deno.env.get('GCS_PRIVATE_KEY_ID') ?? '',
    };

    // Use service role key for admin operations, otherwise use anon key
    const supabaseKey = serviceRoleKey || (Deno.env.get('SUPABASE_ANON_KEY') ?? '');
    
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      supabaseKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  /**
   * Main method to identify user and ensure bucket exists
   */
  async identifyUserAndEnsureBucket(
    whatsappNumber?: string,
    contactId?: string,
    userId?: string
  ): Promise<UserIdentificationResult> {
    try {
      console.log('🔍 Starting user identification and bucket setup...');
      console.log('Inputs:', { whatsappNumber, contactId, userId });

      let identifiedUserId: string | null = userId || null;
      let normalizedNumber: string | undefined;

      // If we have a WhatsApp number, try to identify the user
      if (whatsappNumber && !identifiedUserId) {
        const identification = await this.identifyUserByWhatsAppNumber(whatsappNumber);
        identifiedUserId = identification.userId;
        normalizedNumber = identification.normalizedNumber;
        console.log(`📱 User identification result:`, { userId: identifiedUserId, normalizedNumber });
      }

      // Generate contact ID if not provided
      const finalContactId = contactId || `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get or create bucket for the user
      const bucketInfo = await this.ensureUserBucket(identifiedUserId, finalContactId);
      
      console.log(`✅ Bucket setup complete:`, bucketInfo);

      return {
        userId: identifiedUserId,
        contactId: finalContactId,
        bucketName: bucketInfo.bucketName,
        isNewBucket: bucketInfo.created,
        whatsappNumber,
        normalizedNumber
      };

    } catch (error) {
      console.error('❌ Error in identifyUserAndEnsureBucket:', error);
      throw error;
    }
  }

  /**
   * Identify user by WhatsApp number with comprehensive matching
   */
  private async identifyUserByWhatsAppNumber(whatsappNumber: string): Promise<{ userId: string | null; normalizedNumber: string }> {
    try {
      console.log(`🔍 Identifying user by WhatsApp number: ${whatsappNumber}`);
      
      // Normalize the phone number
      const normalizedNumber = this.normalizeWhatsAppNumber(whatsappNumber);
      console.log(`📱 Normalized number: ${normalizedNumber}`);

      // Generate all possible variations for matching
      const numberVariations = this.generateNumberVariations(normalizedNumber);
      console.log(`🔢 Number variations for matching:`, numberVariations);

      // 1. First, check existing WhatsApp mappings
      for (const variation of numberVariations) {
        const { data: mapping, error } = await this.supabase
          .from('whatsapp_user_mapping')
          .select('user_id')
          .eq('whatsapp_number', variation)
          .single();

        if (!error && mapping) {
          console.log(`✅ Found existing WhatsApp mapping: ${mapping.user_id} for number: ${variation}`);
          return { userId: mapping.user_id, normalizedNumber };
        }
      }

      // 2. Check user profiles for WhatsApp number
      for (const variation of numberVariations) {
        const { data: profile, error } = await this.supabase
          .from('profiles')
          .select('user_id, whatsapp_number, phone_number')
          .eq('whatsapp_number', variation)
          .single();

        if (!error && profile) {
          console.log(`✅ Found user profile by whatsapp_number: ${profile.user_id} for number: ${variation}`);
          
          // Create mapping for future use
          await this.createWhatsAppMapping(profile.user_id, normalizedNumber);
          
          return { userId: profile.user_id, normalizedNumber };
        }
      }

      // 2b. Fallback: Check user profiles by phone_number (some users only set phone_number)
      for (const variation of numberVariations) {
        const { data: profileByPhone, error: phoneErr } = await this.supabase
          .from('profiles')
          .select('user_id, whatsapp_number, phone_number')
          .eq('phone_number', variation)
          .single();

        if (!phoneErr && profileByPhone) {
          console.log(`✅ Found user profile by phone_number: ${profileByPhone.user_id} for number: ${variation}`);

          // Best-effort: persist whatsapp_number so future lookups hit directly
          try {
            if (!profileByPhone.whatsapp_number || profileByPhone.whatsapp_number.length === 0) {
              await this.supabase
                .from('profiles')
                .update({ whatsapp_number: normalizedNumber })
                .eq('user_id', profileByPhone.user_id);
            }
          } catch (_e) {
            // ignore non-critical update errors
          }

          // Create mapping for future use
          await this.createWhatsAppMapping(profileByPhone.user_id, normalizedNumber);
          
          return { userId: profileByPhone.user_id, normalizedNumber };
        }
      }

      // 3. Check meeting notes for existing contact mappings
      const { data: meetingNotes, error } = await this.supabase
        .from('meeting_notes')
        .select('user_id, contact_identifier')
        .not('user_id', 'is', null)
        .limit(10);

      if (!error && meetingNotes && meetingNotes.length > 0) {
        // Look for patterns in contact identifiers that might match
        for (const note of meetingNotes) {
          if (note.contact_identifier && note.contact_identifier.includes(whatsappNumber.replace(/\D/g, ''))) {
            console.log(`✅ Found existing meeting note mapping: ${note.user_id}`);
            return { userId: note.user_id, normalizedNumber };
          }
        }
      }

      console.log(`❌ No user found for WhatsApp number: ${normalizedNumber}`);
      return { userId: null, normalizedNumber };

    } catch (error) {
      console.error('❌ Error identifying user by WhatsApp number:', error);
      return { userId: null, normalizedNumber: this.normalizeWhatsAppNumber(whatsappNumber) };
    }
  }

  /**
   * Normalize WhatsApp number for consistent comparison
   */
  private normalizeWhatsAppNumber(number: string): string {
    console.log('📱 Normalizing WhatsApp number:', number);
    
    // Remove all non-digit characters except +
    let normalized = number.replace(/[^\d+]/g, '');
    
    // Handle different formats
    if (normalized.startsWith('00')) {
      // Convert 00 to +
      normalized = '+' + normalized.substring(2);
    } else if (!normalized.startsWith('+') && normalized.length > 10) {
      // Add + for international numbers
      normalized = '+' + normalized;
    } else if (!normalized.startsWith('+') && normalized.length === 10) {
      // Brazilian number without country code, add +55
      normalized = '+55' + normalized;
    } else if (!normalized.startsWith('+') && normalized.length === 11 && normalized.startsWith('0')) {
      // Brazilian number with 0, remove 0 and add +55
      normalized = '+55' + normalized.substring(1);
    }
    
    console.log('📱 Final normalized number:', normalized);
    return normalized;
  }

  /**
   * Generate all possible number variations for matching
   */
  private generateNumberVariations(number: string): string[] {
    const variations: string[] = [];
    
    // Add the normalized number
    variations.push(number);
    
    // For Brazilian numbers, add variations
    if (number.startsWith('+55')) {
      // Without country code
      const withoutCountry = number.substring(3);
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
    if (!number.startsWith('+')) {
      variations.push('+' + number);
    }
    
    // For numbers with +, add without +
    if (number.startsWith('+')) {
      variations.push(number.substring(1));
    }
    
    // Remove duplicates
    return [...new Set(variations)];
  }

  /**
   * Create WhatsApp mapping for future use
   */
  private async createWhatsAppMapping(userId: string, whatsappNumber: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('whatsapp_user_mapping')
        .insert({
          user_id: userId,
          whatsapp_number: whatsappNumber,
          is_verified: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error creating WhatsApp mapping:', error);
      } else {
        console.log(`✅ Created WhatsApp mapping for user ${userId}`);
      }
    } catch (error) {
      console.error('❌ Error creating WhatsApp mapping:', error);
    }
  }

  /**
   * Ensure user bucket exists and is properly mapped
   */
  private async ensureUserBucket(userId: string | null, contactId: string): Promise<BucketInfo> {
    try {
      console.log(`🔍 Ensuring bucket for user: ${userId || 'anonymous'}, contact: ${contactId}`);

      let bucketName: string;
      let isNewBucket = false;

      if (userId) {
        // Generate bucket name deterministically
        bucketName = this.generateUserBucketName(userId);
        console.log(`📦 Generated bucket name: ${bucketName}`);
      } else {
        // Generate contact-based bucket for anonymous users
        bucketName = this.generateContactBucketName(contactId);
        console.log(`👤 Using contact-based bucket: ${bucketName}`);
      }

      // Check if bucket exists in GCS
      const bucketExistsInGCS = await this.bucketExists(bucketName);
      
      if (!bucketExistsInGCS) {
        console.log(`🆕 Creating bucket in GCS: ${bucketName}`);
        const created = await this.createBucket(bucketName);
        if (!created) {
          throw new Error(`Failed to create bucket: ${bucketName}`);
        }
        isNewBucket = true;
        console.log(`✅ Created NEW bucket: ${bucketName}`);
      } else {
        console.log(`✅ Bucket already exists in GCS: ${bucketName}`);
        isNewBucket = false;
      }

      return {
        bucketName,
        exists: true,
        created: isNewBucket
      };

    } catch (error) {
      console.error('❌ Error ensuring user bucket:', error);
      throw error;
    }
  }



  /**
   * Generate user-specific bucket name
   */
  private generateUserBucketName(userId: string): string {
    const userHash = this.hashUserId(userId);
    return `${this.gcsConfig.bucketPrefix}-user-${userHash}`.toLowerCase();
  }

  /**
   * Generate contact-based bucket name
   */
  private generateContactBucketName(contactId: string): string {
    return `${this.gcsConfig.bucketPrefix}-contact-${contactId.replace(/[^a-z0-9-]/g, '-')}`.toLowerCase();
  }

  /**
   * Hash user ID for bucket naming
   */
  private hashUserId(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if bucket exists in GCS
   */
  private async bucketExists(bucketName: string): Promise<boolean> {
    try {
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        console.error('❌ Failed to get GCS access token');
        return false;
      }

      const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${bucketName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.status === 200) {
        console.log(`✅ Bucket ${bucketName} exists`);
        return true;
      } else if (response.status === 404) {
        console.log(`❌ Bucket ${bucketName} does not exist`);
        return false;
      } else {
        const errorText = await response.text();
        console.error(`❌ Error checking bucket: ${response.status} ${response.statusText} - ${errorText}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking bucket existence:', error);
      return false;
    }
  }

  /**
   * Create bucket in GCS
   */
  private async createBucket(bucketName: string): Promise<boolean> {
    try {
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        console.error('❌ Failed to get GCS access token');
        return false;
      }

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
        console.log(`✅ Bucket ${bucketName} created successfully`);
        return true;
      } else {
        const errorText = await response.text();
        console.error(`❌ Error creating bucket: ${response.status} ${response.statusText} - ${errorText}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error creating bucket:', error);
      return false;
    }
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
    // Initialize service with service role key for admin operations
    const service = new UserBucketService(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));

    if (req.method === 'POST') {
      const body = await req.json();
      const { action, whatsappNumber, contactId, userId } = body;

      if (action === 'identify-and-ensure-bucket') {
        const result = await service.identifyUserAndEnsureBucket(whatsappNumber, contactId, userId);
        
        return new Response(
          JSON.stringify({ success: true, data: result }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('❌ User bucket service error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
