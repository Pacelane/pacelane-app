import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

interface GCSConfig {
  bucketPrefix: string;
  projectId: string;
  clientEmail: string;
  privateKey: string;
  privateKeyId: string;
}

interface FileInfo {
  name: string;
  size: number;
  type: string;
  gcsPath: string;
  contentExtracted: boolean;
  extractedContent?: string;
  createdAt: string;
}

interface UploadResponse {
  success: boolean;
  fileInfo?: FileInfo;
  error?: string;
  gcsPath?: string;
}

class GCSKnowledgeBaseStorage {
  private gcsConfig: GCSConfig;
  private supabase: any;

  constructor(userToken: string) {
    this.gcsConfig = {
      bucketPrefix: Deno.env.get('GCS_BUCKET_PREFIX') ?? 'pacelane-storage',
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
   * Generate user-specific bucket name for knowledge base
   */
  private generateUserBucketName(userId: string): string {
    const userHash = this.hashUserId(userId);
    return `${this.gcsConfig.bucketPrefix}-user-${userHash}`.toLowerCase();
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
   * Ensure user bucket exists
   */
  private async ensureUserBucket(bucketName: string): Promise<boolean> {
    try {
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        console.error('Failed to get GCS access token');
        return false;
      }

      // Check if bucket exists
      const checkResponse = await fetch(`https://storage.googleapis.com/storage/v1/b/${bucketName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (checkResponse.status === 200) {
        return true;
      }

      if (checkResponse.status === 404) {
        // Create bucket
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

        const createResponse = await fetch(`https://storage.googleapis.com/storage/v1/b?project=${this.gcsConfig.projectId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bucketConfig),
        });

        return createResponse.status === 200 || createResponse.status === 201;
      }

      return false;
    } catch (error) {
      console.error('Error ensuring bucket exists:', error);
      return false;
    }
  }

  /**
   * Upload file to GCS
   */
  async uploadFile(userId: string, file: File, metadata: any = {}): Promise<UploadResponse> {
    try {
      const bucketName = this.generateUserBucketName(userId);
      const date = new Date().toISOString().split('T')[0];
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `knowledge-base/${date}/${fileName}`;
      const gcsPath = `gs://${bucketName}/${filePath}`;

      // Ensure bucket exists
      const bucketReady = await this.ensureUserBucket(bucketName);
      if (!bucketReady) {
        return { success: false, error: 'Failed to ensure bucket exists' };
      }

      // Upload to GCS
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        return { success: false, error: 'Failed to get GCS access token' };
      }

      const response = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(filePath)}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': file.type,
        },
        body: await file.arrayBuffer(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { success: false, error: `Failed to upload file: ${errorText}` };
      }

      // Store metadata in Supabase
      const fileInfo: FileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        gcsPath,
        contentExtracted: false,
        createdAt: new Date().toISOString(),
      };

      const { error: dbError } = await this.supabase
        .from('knowledge_files')
        .insert({
          user_id: userId,
          name: file.name,
          type: 'file',
          size: file.size,
          url: gcsPath,
          storage_path: gcsPath,
          gcs_bucket: bucketName,
          gcs_path: gcsPath,
          file_hash: await this.calculateFileHash(file),
          metadata: {
            ...metadata,
            gcs_path: gcsPath,
            uploaded_at: new Date().toISOString(),
            content_extracted: false,
          },
        });

      if (dbError) {
        console.error('Error storing file metadata:', dbError);
        return { success: false, error: 'Failed to store file metadata' };
      }

      return { 
        success: true, 
        fileInfo,
        gcsPath
      };

    } catch (error) {
      console.error('Error uploading file:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate file hash for deduplication
   */
  private async calculateFileHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * List knowledge base files for user
   */
  async listFiles(userId: string): Promise<FileInfo[]> {
    try {
      const { data: files, error } = await this.supabase
        .from('knowledge_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error listing files:', error);
        return [];
      }

      return files.map((file: any) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        gcsPath: file.gcs_path,
        contentExtracted: file.content_extracted,
        extractedContent: file.extracted_content,
        createdAt: file.created_at,
      }));

    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  }

  /**
   * Delete file from GCS and database
   */
  async deleteFile(userId: string, fileId: string): Promise<boolean> {
    try {
      // Get file info from database
      const { data: file, error: fetchError } = await this.supabase
        .from('knowledge_files')
        .select('*')
        .eq('id', fileId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !file) {
        return false;
      }

      // Delete from GCS
      const accessToken = await this.getGCSAccessToken();
      if (accessToken && file.gcs_path) {
        const bucketName = file.gcs_bucket;
        const objectName = file.gcs_path.replace(`gs://${bucketName}/`, '');

        const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(objectName)}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          console.error('Failed to delete file from GCS:', response.statusText);
        }
      }

      // Delete from database
      const { error: deleteError } = await this.supabase
        .from('knowledge_files')
        .delete()
        .eq('id', fileId)
        .eq('user_id', userId);

      return !deleteError;

    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Extract text content from file (placeholder for future implementation)
   */
  async extractContent(fileId: string): Promise<boolean> {
    try {
      // This would integrate with OCR services, PDF parsers, etc.
      // For now, we'll mark it as extracted
      const { error } = await this.supabase
        .from('knowledge_files')
        .update({
          content_extracted: true,
          extracted_content: '[Content extraction to be implemented]',
          extraction_metadata: {
            extracted_at: new Date().toISOString(),
            method: 'placeholder'
          }
        })
        .eq('id', fileId);

      return !error;

    } catch (error) {
      console.error('Error extracting content:', error);
      return false;
    }
  }
}

// Main handler
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const storage = new GCSKnowledgeBaseStorage(req.headers.get('Authorization')!.replace('Bearer ', ''));

    if (req.method === 'POST') {
      // Handle file upload
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const metadata = JSON.parse(formData.get('metadata') as string || '{}');

      if (!file) {
        return new Response(JSON.stringify({ error: 'No file provided' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await storage.uploadFile(user.id, file, metadata);

      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (req.method === 'GET') {
      // Handle file listing
      const files = await storage.listFiles(user.id);

      return new Response(JSON.stringify({ files }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (req.method === 'DELETE') {
      // Handle file deletion
      const { fileId } = await req.json();
      const success = await storage.deleteFile(user.id, fileId);

      return new Response(JSON.stringify({ success }), {
        status: success ? 200 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error in knowledge-base-storage function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 