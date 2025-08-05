import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface GCSConfig {
  bucketPrefix: string;
  projectId: string;
  clientEmail: string;
  privateKey: string;
  privateKeyId: string;
}

class UserBucketCreator {
  private gcsConfig: GCSConfig;
  private supabase: any;

  constructor(userToken: string) {
    this.gcsConfig = {
      bucketPrefix: Deno.env.get('GCS_BUCKET_PREFIX') ?? 'pacelane-whatsapp',
      projectId: Deno.env.get('GCS_PROJECT_ID') ?? '',
      clientEmail: Deno.env.get('GCS_CLIENT_EMAIL') ?? '',
      privateKey: Deno.env.get('GCS_PRIVATE_KEY') ?? '',
      privateKeyId: Deno.env.get('GCS_PRIVATE_KEY_ID') ?? '',
    };

    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${userToken}` },
        },
      }
    );
  }

  /**
   * Hash user ID for bucket naming
   */
  private hashUserId(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate user-specific bucket name
   */
  private generateUserBucketName(userId: string): string {
    const userHash = this.hashUserId(userId);
    return `${this.gcsConfig.bucketPrefix}-user-${userHash}`.toLowerCase();
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
   * Check if bucket exists
   */
  private async bucketExists(bucketName: string): Promise<boolean> {
    try {
      console.log(`Checking if bucket exists: ${bucketName}`);
      
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        console.error('Failed to get GCS access token');
        return false;
      }

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
        return false;
      }
    } catch (error) {
      console.error('Error checking bucket existence:', error);
      return false;
    }
  }

  /**
   * Create GCS bucket for user
   */
  private async createUserBucket(bucketName: string): Promise<boolean> {
    try {
      console.log(`Creating bucket: ${bucketName}`);
      
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
   * Create bucket for user and store mapping
   */
  async createBucketForUser(userId: string): Promise<{ success: boolean; bucketName?: string; error?: string }> {
    try {
      console.log(`Creating bucket for user: ${userId}`);
      
      // Generate bucket name
      const bucketName = this.generateUserBucketName(userId);
      console.log(`Generated bucket name: ${bucketName}`);
      
      // Check if bucket already exists
      const exists = await this.bucketExists(bucketName);
      if (exists) {
        console.log(`Bucket ${bucketName} already exists for user ${userId}`);
        
        // Store mapping even if bucket exists
        await this.storeUserBucketMapping(userId, bucketName);
        
        return { 
          success: true, 
          bucketName,
          message: 'Bucket already exists, mapping stored'
        };
      }
      
      // Create new bucket
      const created = await this.createUserBucket(bucketName);
      if (!created) {
        return { 
          success: false, 
          error: 'Failed to create bucket'
        };
      }
      
      // Store mapping
      await this.storeUserBucketMapping(userId, bucketName);
      
      console.log(`Successfully created bucket ${bucketName} for user ${userId}`);
      return { 
        success: true, 
        bucketName,
        message: 'Bucket created and mapping stored'
      };
      
    } catch (error) {
      console.error('Error creating bucket for user:', error);
      return { 
        success: false, 
        error: error.message || 'Unknown error'
      };
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
    // Get user token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const userToken = authHeader.substring(7);
    
    // Initialize bucket creator
    const bucketCreator = new UserBucketCreator(userToken);
    
    // Get user ID from request body
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing userId in request body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create bucket for user
    const result = await bucketCreator.createBucketForUser(userId);

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
    console.error('Bucket creation error:', error);
    
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