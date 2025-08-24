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
   * Generate user-specific bucket name for knowledge base
   */
  private generateUserBucketName(userId: string): string {
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
        console.error('❌ Error storing bucket mapping:', error);
      } else {
        console.log(`✅ Stored bucket mapping for user ${userId}: ${bucketName}`);
      }
    } catch (error) {
      console.error('❌ Error storing bucket mapping:', error);
    }
  }

  /**
   * Check if bucket exists and create mapping if it does
   */
  private async checkAndMapExistingBucket(userId: string, bucketName: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking if bucket exists in GCS: ${bucketName}`);
      
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
        console.log(`✅ Found existing bucket ${bucketName} for user ${userId}, creating mapping`);
        await this.storeUserBucketMapping(userId, bucketName);
        return true;
      } else if (response.status === 404) {
        console.log(`❌ Bucket ${bucketName} does not exist in GCS`);
        return false;
      } else {
        const errorText = await response.text();
        console.error(`❌ Error checking bucket: ${response.status} ${response.statusText} - ${errorText}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking and mapping existing bucket:', error);
      return false;
    }
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
      console.log(`🔍 Ensuring bucket exists: ${bucketName}`);
      
      // First, check if this bucket name is already mapped to a user in our database
      // This is a faster check than querying GCS
      try {
        const { data: existingMapping, error } = await this.supabase
          .from('user_bucket_mapping')
          .select('bucket_name')
          .eq('bucket_name', bucketName)
          .single();

        if (!error && existingMapping) {
          console.log(`✅ Bucket ${bucketName} is already mapped in database, assuming it exists`);
          return true;
        }
      } catch (error) {
        console.log(`📋 No existing mapping found for bucket ${bucketName}, checking GCS...`);
      }
      
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        console.error('❌ Failed to get GCS access token');
        return false;
      }

      // Check if bucket exists in GCS
      const checkResponse = await fetch(`https://storage.googleapis.com/storage/v1/b/${bucketName}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      console.log(`🔍 Bucket check response status: ${checkResponse.status}`);

      if (checkResponse.status === 200) {
        console.log(`✅ Bucket ${bucketName} exists in GCS`);
        return true;
      }

      if (checkResponse.status === 404) {
        console.log(`❌ Bucket ${bucketName} does not exist, creating...`);
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

        if (createResponse.status === 200 || createResponse.status === 201) {
          console.log(`✅ Successfully created bucket: ${bucketName}`);
          return true;
        } else {
          const errorText = await createResponse.text();
          console.error(`❌ Error creating bucket: ${createResponse.status} ${createResponse.statusText} - ${errorText}`);
          return false;
        }
      }

      // Handle other status codes
      const errorText = await checkResponse.text();
      console.error(`❌ Error checking bucket: ${checkResponse.status} ${checkResponse.statusText} - ${errorText}`);
      return false;
    } catch (error) {
      console.error('❌ Error ensuring bucket exists:', error);
      return false;
    }
  }

  /**
   * Upload file to GCS
   */
  async uploadFile(userId: string, file: File, metadata: any = {}): Promise<UploadResponse> {
    try {
      console.log(`📁 Starting file upload for user: ${userId}`);
      
      // Use centralized user-bucket service to ensure bucket exists
      const bucketResult = await this.ensureUserBucketViaService(userId);
      if (!bucketResult.success) {
        return { success: false, error: bucketResult.error || 'Failed to ensure bucket exists' };
      }

      const bucketName = bucketResult.data.bucketName;
      console.log(`✅ Using bucket: ${bucketName} for user: ${userId}`);

      const date = new Date().toISOString().split('T')[0];
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `knowledge-base/${date}/${fileName}`;
      const gcsPath = `gs://${bucketName}/${filePath}`;

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
      const fileInfo = {
        id: fileName, // Use the generated filename as ID
        name: file.name,
        type: this.getFileTypeFromName(file.name),
        size: file.size,
        url: gcsPath,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: insertedFile, error: dbError } = await this.supabase
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
        })
        .select()
        .single();

      if (dbError || !insertedFile) {
        console.error('Error storing file metadata:', dbError);
        return { success: false, error: 'Failed to store file metadata' };
      }

      // Trigger content extraction automatically after upload using the file data we already have
      console.log(`🔄 Triggering content extraction for ${file.name}`);
      const extractionSuccess = await this.extractContentFromFileData(insertedFile.id, file);

      // Trigger RAG processing for the uploaded file
      console.log(`🚀 Triggering RAG processing for ${file.name}`);
      try {
        await this.triggerRAGProcessing(userId, bucketName, fileName, filePath, file.type, file.size, metadata);
        console.log(`✅ RAG processing triggered successfully for ${file.name}`);
      } catch (ragError) {
        console.error(`⚠️ RAG processing failed for ${file.name}:`, ragError);
        // Don't fail the upload if RAG processing fails
      }

      return { 
        success: true, 
        data: {
          ...fileInfo,
          contentExtracted: extractionSuccess
        },
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
   * Get file type from filename
   */
  private getFileTypeFromName(filename: string): string {
    const extension = filename.toLowerCase().split('.').pop();
    
    if (!extension) return 'file';
    
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) {
      return 'image';
    }
    if (['mp4', 'avi', 'mov', 'webm', 'mkv'].includes(extension)) {
      return 'video';
    }
    if (['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(extension)) {
      return 'audio';
    }
    
    return 'file';
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
        id: file.id,
        name: file.name,
        type: this.getFileTypeFromName(file.name), // Use the same type detection logic
        size: file.size,
        url: file.url || file.gcs_path,
        user_id: file.user_id,
        created_at: file.created_at,
        updated_at: file.updated_at,
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
   * Use centralized user-bucket service to ensure bucket exists
   */
  private async ensureUserBucketViaService(userId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🔍 Using centralized user-bucket service for knowledge base...');
      
      // Call the centralized user-bucket service
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
   * Trigger RAG processing for uploaded file
   */
  private async triggerRAGProcessing(
    userId: string, 
    bucketName: string, 
    fileName: string, 
    filePath: string, 
    fileType: string, 
    fileSize: number, 
    metadata: any
  ): Promise<void> {
    try {
      console.log(`🚀 Triggering RAG processing for file: ${fileName}`);
      
      // Call the vertex-ai-rag-processor edge function
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/vertex-ai-rag-processor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          bucketName,
          fileName,
          filePath,
          fileType,
          fileSize,
          metadata
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RAG processor error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(`RAG processing failed: ${result.error}`);
      }

      console.log(`✅ RAG processing completed successfully for ${fileName}`);
      
    } catch (error) {
      console.error(`❌ Error triggering RAG processing for ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Download file from GCS as buffer
   */
  private async downloadFileFromGCS(bucketName: string, filePath: string): Promise<Uint8Array | null> {
    try {
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get GCS access token');
      }
      
      const downloadUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`;
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      console.error('Error downloading file from GCS:', error);
      return null;
    }
  }

  /**
   * ✅ NEW: Store temporary text file in GCS for RAG processing
   */
  private async storeTemporaryFile(userId: string, fileName: string, content: string): Promise<string | null> {
    try {
      const bucketName = await this.getUserBucketName(userId);
      if (!bucketName) {
        console.error('No bucket found for user:', userId);
        return null;
      }

      // Create temporary file path
      const date = new Date().toISOString().split('T')[0];
      const tempFilePath = `whatsapp-notes/${date}/${userId}_${Date.now()}_${fileName}`;
      const gcsPath = `gs://${bucketName}/${tempFilePath}`;

      // Convert content to buffer
      const contentBuffer = new TextEncoder().encode(content);

      // Upload to GCS
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get GCS access token');
      }

      const uploadUrl = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(tempFilePath)}`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain',
        },
        body: contentBuffer,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload temporary file: ${response.status} - ${errorText}`);
      }

      console.log(`✅ Temporary file stored in GCS: ${gcsPath}`);
      return gcsPath;

    } catch (error) {
      console.error('Error storing temporary file:', error);
      return null;
    }
  }

  /**
   * Get MIME type from file name
   */
  private getMimeTypeFromName(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop() || '';
    const mimeTypes: { [key: string]: string } = {
      'txt': 'text/plain',
      'md': 'text/markdown',
      'csv': 'text/csv',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'rtf': 'application/rtf',
      'json': 'application/json'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * Extract text content from plain text files
   */
  private extractTextContent(fileBuffer: Uint8Array): string {
    try {
      const decoder = new TextDecoder('utf-8');
      return decoder.decode(fileBuffer);
    } catch (error) {
      console.error('Error extracting text content:', error);
      return '[Error: Could not decode text content]';
    }
  }

  /**
   * Extract text content from PDF files - simplified approach for MVP
   */
  private async extractPDFContent(fileBuffer: Uint8Array): Promise<string> {
    try {
      // For MVP: Use filename-based semantic matching instead of complex PDF parsing
      // This is much more reliable than trying to extract garbled binary content
      
      return '[PDF content extraction not available in MVP - using filename for semantic matching. For better text extraction, please upload files in these formats: .txt, .md, .docx, .csv, or .json. Alternatively, copy text content from the PDF and save as a .txt file.]';
      
    } catch (error) {
      console.error('Error handling PDF:', error);
      return '[PDF processing not available - please use text-based formats for content extraction]';
    }
  }

  /**
   * Extract text content from DOCX files - simplified approach for MVP
   */
  private async extractDocxContent(fileBuffer: Uint8Array): Promise<string> {
    try {
      // DOCX files are complex ZIP archives with XML content
      // For MVP: Use filename-based semantic matching instead of complex parsing
      
      return '[DOCX content extraction not available in MVP - using filename for semantic matching. For better text extraction, please save the document as .txt, .md, or copy the text content to a plain text file.]';
      
    } catch (error) {
      console.error('Error handling DOCX:', error);
      return '[DOCX processing not available - please use text-based formats for content extraction]';
    }
  }

  /**
   * Extract text content from PPTX files - simplified approach for MVP
   */
  private async extractPptxContent(fileBuffer: Uint8Array): Promise<string> {
    try {
      // PPTX files are complex ZIP archives with XML content
      // For MVP: Use filename-based semantic matching instead of complex parsing
      
      return '[PPTX content extraction not available in MVP - using filename for semantic matching. For better text extraction, please export slides as .txt or copy the text content to a plain text file.]';
      
    } catch (error) {
      console.error('Error handling PPTX:', error);
      return '[PPTX processing not available - please use text-based formats for content extraction]';
    }
  }

  /**
   * Extract text content from XLSX files - simplified approach for MVP
   */
  private async extractXlsxContent(fileBuffer: Uint8Array): Promise<string> {
    try {
      // XLSX files are complex ZIP archives with XML content
      // For MVP: Use filename-based semantic matching instead of complex parsing
      
      return '[XLSX content extraction not available in MVP - using filename for semantic matching. For better text extraction, please export the spreadsheet as .csv or copy relevant data to a .txt file.]';
      
    } catch (error) {
      console.error('Error handling XLSX:', error);
      return '[XLSX processing not available - please use text-based formats for content extraction]';
    }
  }

  /**
   * Clean and normalize extracted text
   */
  private cleanExtractedText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\r/g, '\n')    // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')  // Reduce multiple newlines
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')  // Remove control characters
      .trim();
  }

  /**
   * Extract text content from file data directly (used during upload)
   */
  async extractContentFromFileData(fileId: string, file: File): Promise<boolean> {
    try {
      const mimeType = this.getMimeTypeFromName(file.name);
      console.log(`📄 Extracting content from ${file.name} (${mimeType})`);

      // Get file buffer
      const fileBuffer = new Uint8Array(await file.arrayBuffer());

      let extractedContent = '';
      let extractionMethod = 'unknown';

      // Extract content based on file type
      switch (mimeType) {
        case 'text/plain':
        case 'text/markdown':
        case 'text/csv':
          extractedContent = this.extractTextContent(fileBuffer);
          extractionMethod = 'text_direct';
          break;
          
        case 'application/pdf':
          extractedContent = await this.extractPDFContent(fileBuffer);
          extractionMethod = 'pdf_parser';
          break;
          
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          extractedContent = await this.extractDocxContent(fileBuffer);
          extractionMethod = 'docx_parser';
          break;
          
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        case 'application/vnd.ms-powerpoint':
          extractedContent = await this.extractPptxContent(fileBuffer);
          extractionMethod = 'pptx_parser';
          break;
          
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
          extractedContent = await this.extractXlsxContent(fileBuffer);
          extractionMethod = 'xlsx_parser';
          break;
          
        default:
          // Try generic text extraction for unknown types
          extractedContent = this.extractTextContent(fileBuffer);
          extractionMethod = 'generic_text';
          break;
      }

      // Clean and validate extracted content
      extractedContent = this.cleanExtractedText(extractedContent);
      
      if (extractedContent.length < 10) {
        console.warn(`⚠️ Very little content extracted from ${file.name}`);
        extractedContent = `[Unable to extract meaningful content from ${file.name}]`;
        extractionMethod = 'failed_extraction';
      }

      // Update database with extracted content
      const { error } = await this.supabase
        .from('knowledge_files')
        .update({
          content_extracted: true,
          extracted_content: extractedContent,
          extraction_metadata: {
            extracted_at: new Date().toISOString(),
            method: extractionMethod,
            content_length: extractedContent.length,
            original_file_size: file.size
          }
        })
        .eq('id', fileId);

      if (error) {
        console.error('Error updating extracted content:', error);
        return false;
      }

      console.log(`✅ Content extracted from ${file.name}: ${extractedContent.length} characters`);
      return true;

    } catch (error) {
      console.error('Error extracting content:', error);
      
      // Mark extraction as failed but don't throw
      await this.supabase
        .from('knowledge_files')
        .update({
          content_extracted: false,
          extracted_content: `[Extraction failed: ${error.message}]`,
          extraction_metadata: {
            extracted_at: new Date().toISOString(),
            method: 'failed',
            error: error.message
          }
        })
        .eq('id', fileId);
      
      return false;
    }
  }

  /**
   * Extract text content from file based on file type (downloads from GCS)
   */
  async extractContent(fileId: string): Promise<boolean> {
    try {
      // Get file information from database
      const { data: fileRecord, error: fileError } = await this.supabase
        .from('knowledge_files')
        .select('name, gcs_path, gcs_bucket, size')
        .eq('id', fileId)
        .single();

      if (fileError || !fileRecord) {
        console.error('File not found:', fileError);
        return false;
      }

      const fileType = this.getFileTypeFromName(fileRecord.name);
      const mimeType = this.getMimeTypeFromName(fileRecord.name);
      
      console.log(`📄 Extracting content from ${fileRecord.name} (${mimeType})`);

      // Download file from GCS
      const fileBuffer = await this.downloadFileFromGCS(fileRecord.gcs_bucket, fileRecord.gcs_path);
      if (!fileBuffer) {
        console.error('Failed to download file from GCS');
        return false;
      }

      let extractedContent = '';
      let extractionMethod = 'unknown';

      // Extract content based on file type
      switch (mimeType) {
        case 'text/plain':
        case 'text/markdown':
        case 'text/csv':
          extractedContent = this.extractTextContent(fileBuffer);
          extractionMethod = 'text_direct';
          break;
          
        case 'application/pdf':
          extractedContent = await this.extractPDFContent(fileBuffer);
          extractionMethod = 'pdf_parser';
          break;
          
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        case 'application/msword':
          extractedContent = await this.extractDocxContent(fileBuffer);
          extractionMethod = 'docx_parser';
          break;
          
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        case 'application/vnd.ms-powerpoint':
          extractedContent = await this.extractPptxContent(fileBuffer);
          extractionMethod = 'pptx_parser';
          break;
          
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        case 'application/vnd.ms-excel':
          extractedContent = await this.extractXlsxContent(fileBuffer);
          extractionMethod = 'xlsx_parser';
          break;
          
        default:
          // Try generic text extraction for unknown types
          extractedContent = this.extractTextContent(fileBuffer);
          extractionMethod = 'generic_text';
          break;
      }

      // Clean and validate extracted content
      extractedContent = this.cleanExtractedText(extractedContent);
      
      if (extractedContent.length < 10) {
        console.warn(`⚠️ Very little content extracted from ${fileRecord.name}`);
        extractedContent = `[Unable to extract meaningful content from ${fileRecord.name}]`;
        extractionMethod = 'failed_extraction';
      }

      // Update database with extracted content
      const { error } = await this.supabase
        .from('knowledge_files')
        .update({
          content_extracted: true,
          extracted_content: extractedContent,
          extraction_metadata: {
            extracted_at: new Date().toISOString(),
            method: extractionMethod,
            content_length: extractedContent.length,
            original_file_size: fileRecord.size
          }
        })
        .eq('id', fileId);

      if (error) {
        console.error('Error updating extracted content:', error);
        return false;
      }

      console.log(`✅ Content extracted from ${fileRecord.name}: ${extractedContent.length} characters`);
      return true;

    } catch (error) {
      console.error('Error extracting content:', error);
      
      // Mark extraction as failed but don't throw
      await this.supabase
        .from('knowledge_files')
        .update({
          content_extracted: false,
          extracted_content: `[Extraction failed: ${error.message}]`,
          extraction_metadata: {
            extracted_at: new Date().toISOString(),
            method: 'failed',
            error: error.message
          }
        })
        .eq('id', fileId);
      
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // For testing, we'll accept userId directly in the request body
    const body = await req.json();
    const { userId, action, file: fileData, metadata = {} } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const storage = new GCSKnowledgeBaseStorage(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    if (req.method === 'POST') {
      if (action === 'upload') {
        if (!fileData) {
          return new Response(JSON.stringify({ error: 'No file provided' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Convert base64 back to File object
        const fileBuffer = Uint8Array.from(atob(fileData.content), c => c.charCodeAt(0));
        const file = new File([fileBuffer], fileData.name, { type: fileData.type });

        const result = await storage.uploadFile(userId, file, metadata);

        return new Response(JSON.stringify({ data: result.fileInfo, success: result.success, error: result.error }), {
          status: result.success ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (action === 'list') {
        // Handle file listing
        const files = await storage.listFiles(userId);
        return new Response(JSON.stringify({ data: files }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (action === 'extract') {
        // Handle manual content extraction
        const { fileId } = body;
        if (!fileId) {
          return new Response(JSON.stringify({ error: 'File ID required for extraction' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const extractionSuccess = await storage.extractContent(fileId);
        return new Response(JSON.stringify({ 
          success: extractionSuccess,
          message: extractionSuccess ? 'Content extracted successfully' : 'Content extraction failed'
        }), {
          status: extractionSuccess ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (action === 'delete') {
        // Handle file deletion
        const { fileName } = body;
        if (!fileName) {
          return new Response(JSON.stringify({ error: 'File name required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Find file by name in database and delete
        const { data: file, error: fetchError } = await supabaseClient
          .from('knowledge_files')
          .select('*')
          .eq('user_id', userId)
          .eq('name', fileName)
          .single();

        if (fetchError || !file) {
          return new Response(JSON.stringify({ error: 'File not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const success = await storage.deleteFile(userId, file.id);
        
        return new Response(JSON.stringify({ 
          success,
          message: success ? 'File deleted successfully' : 'File deletion failed'
        }), {
          status: success ? 200 : 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (action === 'whatsapp_content') {
        // ✅ NEW: Handle WhatsApp content (notes and audio transcripts)
        const { file_name, file_type, content, gcs_path, metadata } = body;
        
        if (!file_name || !content) {
          return new Response(JSON.stringify({ error: 'File name and content are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        try {
          // ✅ MODIFIED: For audio files, don't create duplicate entry in knowledge_files
          // Just trigger RAG processing since audio is already stored in audio_files table
          if (file_type === 'audio' && gcs_path) {
            console.log(`🎤 Audio file detected, skipping knowledge_files creation, triggering RAG directly`);
            
            // Trigger RAG processing directly for audio files
            await storage.triggerRAGProcessing(
              userId,
              gcs_path.split('/')[2], // Extract bucket name
              file_name,
              gcs_path,
              'audio',
              content.length,
              metadata
            );

            return new Response(JSON.stringify({ 
              success: true,
              message: 'WhatsApp audio processed and RAG processing triggered',
              file_name: file_name,
              note: 'Audio file already exists in audio_files table, RAG processing triggered directly'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // ✅ NEW: For image files, create knowledge_files entry and trigger RAG processing
          if (file_type === 'image' && gcs_path) {
            console.log(`📷 Image file detected, creating knowledge_files entry and triggering RAG`);
            
            // Create knowledge file record for images
            const knowledgeFileData = {
              user_id: userId,
              name: file_name,
              type: 'image', // Use 'image' type for image files
              size: content.length,
              gcs_bucket: gcs_path.split('/')[2], // Extract bucket from GCS path
              gcs_path: gcs_path,
              file_hash: `whatsapp_image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              content_extracted: true,
              extracted_content: content, // Placeholder content for images
              extraction_metadata: {
                ...metadata,
                source: 'whatsapp_image',
                processed_at: new Date().toISOString()
              },
              url: gcs_path,
              created_at: new Date().toISOString()
            };

            const { data: knowledgeFile, error: insertError } = await supabaseClient
              .from('knowledge_files')
              .insert([knowledgeFileData])
              .select()
              .single();

            if (insertError) {
              throw new Error(`Failed to insert image knowledge file: ${insertError.message}`);
            }

            // Trigger RAG processing for the image
            await storage.triggerRAGProcessing(
              userId,
              gcs_path.split('/')[2], // Extract bucket name
              file_name,
              gcs_path,
              'image',
              content.length,
              metadata
            );

            return new Response(JSON.stringify({ 
              success: true,
              message: 'WhatsApp image processed and added to knowledge base',
              file_id: knowledgeFile.id,
              file_name: file_name
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          // For text notes, create knowledge file record
          const knowledgeFileData = {
            user_id: userId,
            name: file_name,
            type: 'file', // ✅ FIXED: Use 'file' instead of 'text' to match database constraint
            size: content.length,
            gcs_bucket: gcs_path ? gcs_path.split('/')[2] : null, // Extract bucket from GCS path
            gcs_path: gcs_path,
            file_hash: `whatsapp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content_extracted: true,
            extracted_content: content,
            extraction_metadata: {
              ...metadata,
              source: 'whatsapp',
              processed_at: new Date().toISOString()
            },
            url: gcs_path || null,
            created_at: new Date().toISOString()
          };

          const { data: knowledgeFile, error: insertError } = await supabaseClient
            .from('knowledge_files')
            .insert([knowledgeFileData])
            .select()
            .single();

          if (insertError) {
            throw new Error(`Failed to insert knowledge file: ${insertError.message}`);
          }

          console.log(`✅ WhatsApp content stored in knowledge base: ${knowledgeFile.id}`);

          // Trigger RAG processing for the WhatsApp content
          if (gcs_path) {
            // For audio files with GCS path
            await storage.triggerRAGProcessing(
              userId,
              gcs_path.split('/')[2], // Extract bucket name
              file_name,
              gcs_path,
              file_type || 'audio',
              content.length,
              metadata
            );
          } else {
            // For text notes without GCS path, create a temporary file for RAG processing
            const tempFileName = `whatsapp_note_${Date.now()}.txt`;
            const tempContent = content;
            
            // Store temporary file in GCS for RAG processing
            const tempGcsPath = await storage.storeTemporaryFile(userId, tempFileName, tempContent);
            
            if (tempGcsPath) {
              await storage.triggerRAGProcessing(
                userId,
                tempGcsPath.split('/')[2], // Extract bucket name
                tempFileName,
                tempGcsPath,
                'file', // ✅ FIXED: Use 'file' instead of 'text' for RAG processing
                content.length,
                metadata
              );
            }
          }

          return new Response(JSON.stringify({ 
            success: true,
            message: 'WhatsApp content processed and RAG processing triggered',
            file_id: knowledgeFile.id,
            file_name: file_name
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });

        } catch (error) {
          console.error('❌ Error processing WhatsApp content:', error);
          return new Response(JSON.stringify({ 
            success: false,
            error: `Failed to process WhatsApp content: ${error.message}` 
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

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