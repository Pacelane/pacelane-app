import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Interfaces
interface GCSConfig {
  bucketPrefix: string;
  projectId: string;
  clientEmail: string;
  privateKey: string;
  privateKeyId: string;
}

interface FileUploadEvent {
  userId: string;
  bucketName: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  metadata?: any;
}

interface RAGCorpusInfo {
  corpusId: string;
  displayName: string;
  exists: boolean;
  created: boolean;
}

interface ProcessingResult {
  success: boolean;
  corpusInfo?: RAGCorpusInfo;
  embeddingsCreated?: boolean;
  error?: string;
  message?: string;
}

class VertexAIRAGProcessor {
  private gcsConfig: GCSConfig;
  private supabase: any;
  private projectId: string;
  private location: string;

  constructor(serviceRoleKey: string) {
    this.gcsConfig = {
      bucketPrefix: Deno.env.get('GCS_BUCKET_PREFIX') ?? 'pacelane-',
      projectId: Deno.env.get('GCS_PROJECT_ID') ?? '',
      clientEmail: Deno.env.get('GCS_CLIENT_EMAIL') ?? '',
      privateKey: Deno.env.get('GCS_PRIVATE_KEY') ?? '',
      privateKeyId: Deno.env.get('GCS_PRIVATE_KEY_ID') ?? '',
    };

    this.projectId = this.gcsConfig.projectId;
    this.location = Deno.env.get('GOOGLE_CLOUD_LOCATION') ?? 'us-central1';

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
   * Main method to process file upload and create/update RAG corpus
   */
  async processFileUpload(fileEvent: FileUploadEvent): Promise<ProcessingResult> {
    try {
      console.log(`🚀 Processing file: ${fileEvent.fileName} for user: ${fileEvent.userId}`);

      // 1. Ensure RAG corpus exists for the user
      const corpusResult = await this.ensureUserRAGCorpus(fileEvent.userId);
      if (!corpusResult.success) {
        return {
          success: false,
          error: `Failed to ensure RAG corpus: ${corpusResult.error}`
        };
      }

      console.log(`📄 Processing file: ${fileEvent.fileName} for corpus: ${corpusResult.data?.corpusId}`);

      // 2. Process and embed the file
      const embeddingResult = await this.processAndEmbedFile(fileEvent, corpusResult.data!.corpusId);
      if (!embeddingResult.success) {
        return {
          success: false,
          error: `Failed to process file: ${embeddingResult.error}`,
          corpusInfo: corpusResult.data
        };
      }

      console.log(`✅ File processed and embedded successfully`);

      return {
        success: true,
        corpusInfo: corpusResult.data,
        embeddingsCreated: true,
        message: 'File processed and added to RAG corpus successfully'
      };

    } catch (error) {
      console.error('❌ Error in RAG processing:', error);
      return {
        success: false,
        error: `RAG processing failed: ${error.message}`
      };
    }
  }

  /**
   * Ensure user has a RAG corpus, create if doesn't exist
   */
  private async ensureUserRAGCorpus(userId: string): Promise<{ success: boolean; data?: { corpusId: string; displayName: string; exists: boolean; created: boolean }; error?: string }> {
    try {
      // First, check if user already has a corpus in the database
      const { data, error } = await this.supabase
        .from('rag_corpora')
        .select('corpus_id, display_name')
        .eq('user_id', userId)
        .single();

      if (data) {
        // Validate the stored corpus ID
        if (data.corpus_id.includes('/operations/')) {
          console.warn(`⚠️ Found invalid operation ID in DB, deleting and recreating corpus`);
          
          // Delete the invalid entry
          await this.supabase.from('rag_corpora').delete().eq('corpus_id', data.corpus_id);
          
          // Create a new corpus
          return this.createRAGCorpus(userId);
        }
        
        // Verify the corpus still exists in Vertex AI
        const corpusExists = await this.verifyCorpusExists(data.corpus_id);
        if (corpusExists) {
          console.log(`✅ Using existing RAG corpus: ${data.corpus_id}`);
          return {
            success: true,
            data: {
              corpusId: data.corpus_id,
              displayName: data.display_name,
              exists: true,
              created: false
            }
          };
        } else {
          console.log(`⚠️ Stored corpus not found in Vertex AI, creating new one`);
          // Delete the invalid entry and create new
          await this.supabase.from('rag_corpora').delete().eq('corpus_id', data.corpus_id);
          return this.createRAGCorpus(userId);
        }
      }
      
      // If no corpus found, create one
      console.log(`🤷 No RAG corpus found for user, creating one...`);
      return this.createRAGCorpus(userId);

    } catch (error) {
      if (error.code === 'PGRST116') { // "single row not found"
        console.log(`🤷 No RAG corpus found for user, creating one...`);
        return this.createRAGCorpus(userId);
      }
      console.error('❌ Error checking for RAG corpus:', error);
      return { success: false, error: 'Failed to check for corpus' };
    }
  }

  /**
   * Verify that a corpus exists in Vertex AI
   */
  private async verifyCorpusExists(corpusId: string): Promise<boolean> {
    try {
      const response = await fetch(`https://${this.location}-aiplatform.googleapis.com/v1beta1/${corpusId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getGCSAccessToken()}`,
          'Content-Type': 'application/json',
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error(`❌ Error verifying corpus existence:`, error);
      return false;
    }
  }

  /**
   * Create RAG corpus using Vertex AI API
   */
  private async createRAGCorpus(userId: string): Promise<{ success: boolean; data?: RAGCorpusInfo; error?: string }> {
    try {
      console.log(`🏗️ Creating RAG corpus for user: ${userId}`);

      const displayName = `user_${userId}_corpus_${Date.now()}`;
      
      // Call Vertex AI API to create corpus with the working embedding model
      const response = await fetch(`https://${this.location}-aiplatform.googleapis.com/v1beta1/projects/${this.projectId}/locations/${this.location}/ragCorpora`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getGCSAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: displayName,
          description: `RAG corpus for user ${userId}`,
          vector_db_config: {
            rag_managed_db: {
              knn: {}
            },
            rag_embedding_model_config: {
              vertex_prediction_endpoint: {
                endpoint: `projects/${this.projectId}/locations/${this.location}/publishers/google/models/text-multilingual-embedding-002`
              }
            }
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Vertex AI API error:', response.status, errorText);
        return { success: false, error: `Vertex AI API error: ${response.status} ${errorText}` };
      }

      const corpusData = await response.json();
      console.log(`✅ RAG corpus creation started: ${corpusData.name}`);
      
      // Wait for the operation to complete
      const operationName = corpusData.name;
      const corpusId = await this.waitForOperationToComplete(operationName);
      
      if (corpusId) {
        console.log(`✅ RAG corpus created successfully: ${corpusId}`);
        
        // Store the new corpus in the database
        const { error: insertError } = await this.supabase
          .from('rag_corpora')
          .insert({
            user_id: userId,
            corpus_id: corpusId,
            display_name: displayName,
            project_id: this.projectId,
            location: this.location,
          });

        if (insertError) {
          console.error('❌ Error saving corpus to DB:', insertError);
          // Don't fail the whole process, but log the error
        } else {
          console.log(`💾 Corpus saved to database for user: ${userId}`);
        }
        
        return {
          success: true,
          data: {
            corpusId: corpusId,
            displayName: displayName,
            exists: true,
            created: true
          }
        };
      } else {
        return { success: false, error: 'Failed to get corpus ID from operation' };
      }

    } catch (error) {
      console.error('❌ Error creating RAG corpus:', error);
      return { success: false, error: `Failed to create corpus: ${error.message}` };
    }
  }

  /**
   * Wait for Vertex AI operation to complete and return the result
   */
  private async waitForOperationToComplete(operationName: string): Promise<string | null> {
    try {
      console.log(`⏳ Waiting for operation to complete...`);
      
      let attempts = 0;
      const maxAttempts = 30; // Wait up to 5 minutes (30 * 10 seconds)
      
      while (attempts < maxAttempts) {
        const response = await fetch(`https://${this.location}-aiplatform.googleapis.com/v1beta1/${operationName}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${await this.getGCSAccessToken()}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          console.error(`❌ Error checking operation status: ${response.status}`);
          return null;
        }

        const operation = await response.json();
        
        if (operation.done) {
          if (operation.error) {
            console.error(`❌ Operation failed:`, operation.error);
            return null;
          }
          
          // Extract the corpus ID from the operation result
          if (operation.response && operation.response.name) {
            console.log(`✅ Operation completed successfully`);
            return operation.response.name;
          } else if (operation.response && operation.response.ragCorpus) {
            console.log(`✅ Operation completed with ragCorpus`);
            return operation.response.ragCorpus.name;
          } else if (operation.metadata && operation.metadata.ragCorpus) {
            console.log(`✅ Found corpus ID in metadata`);
            return operation.metadata.ragCorpus;
          } else {
            console.error(`❌ Operation completed but no corpus ID found`);
            
            // Last resort: extract from operation name
            if (operationName.includes('/ragCorpora/')) {
              const parts = operationName.split('/ragCorpora/');
              if (parts.length > 1) {
                const corpusId = `projects/${this.projectId}/locations/${this.location}/ragCorpora/${parts[1]}`;
                console.log(`✅ Extracted corpus ID from operation name`);
                return corpusId;
              }
            }
            
            return null;
          }
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        }
      }
      
      console.error(`❌ Operation timed out after ${maxAttempts} attempts`);
      return null;

    } catch (error) {
      console.error(`❌ Error waiting for operation:`, error);
      return null;
    }
  }

  /**
   * Process and embed file to RAG corpus
   */
  private async processAndEmbedFile(fileEvent: FileUploadEvent, corpusId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Import the file from GCS to the RAG corpus
      const gcsUri = `gs://${fileEvent.bucketName}/${fileEvent.filePath}`;
      const originalFilePath = fileEvent.filePath;

      // Check if file has UTF-8 BOM and clean if necessary
      const debugResult = await this.debugFileContent(fileEvent.bucketName, fileEvent.filePath);
      if (debugResult && debugResult.encoding === 'UTF-8 with BOM') {
        console.log(`⚠️ File has UTF-8 BOM - cleaning before import`);
        const cleanResult = await this.cleanFileBOM(fileEvent.bucketName, fileEvent.filePath);
        if (cleanResult.success) {
          fileEvent.filePath = cleanResult.cleanFilePath;
          console.log(`✅ File BOM cleaned successfully`);
        } else {
          console.warn(`⚠️ Failed to clean BOM: ${cleanResult.error}`);
        }
      }

      // Use the potentially updated file path for the GCS URI
      const finalGcsUri = `gs://${fileEvent.bucketName}/${fileEvent.filePath}`;
      
      // Import the file to the RAG corpus
      const addResult = await this.addFileToRAGCorpus(corpusId, fileEvent.fileName, finalGcsUri);
      if (!addResult.success) {
        console.error(`❌ File import failed: ${addResult.error}`);
        
        // Provide context for code 13 errors
        if (addResult.error && addResult.error.includes('code 13')) {
          console.error(`❌ Vertex AI internal error (code 13). Common causes:`);
          console.error(`   - File format not supported by Vertex AI`);
          console.error(`   - File content contains invalid characters or encoding`);
          console.error(`   - File size too large or too small`);
          console.error(`   - GCS permissions issue`);
          console.error(`   - File content corruption`);
          console.error(`   - UTF-8 BOM (Byte Order Mark) at file start`);
        }
        
        return { success: false, error: addResult.error };
      }

      // Clean up temporary cleaned file if it was created
      if (fileEvent.filePath !== originalFilePath) {
        console.log(`🧹 Cleaning up temporary cleaned file`);
        try {
          await this.deleteFileFromGCS(fileEvent.bucketName, fileEvent.filePath);
        } catch (error) {
          console.warn(`⚠️ Failed to clean up temporary file: ${error.message}`);
        }
      }

      console.log(`✅ File import started successfully for ${fileEvent.fileName}`);
      return { success: true };
      
    } catch (error) {
      console.error(`❌ Error in processAndEmbedFile:`, error);
      return { success: false, error: `Unexpected error: ${error.message}` };
    }
  }

  /**
   * Get appropriate parsing configuration based on file type
   */
  private getParsingConfig(fileName: string, projectId: string, location: string) {
    const fileExtension = fileName.toLowerCase().split('.').pop();
    
    // Base configuration with chunking settings
    const baseConfig = {
      rag_file_chunking_config: {
        fixed_length_chunking: {
          chunk_size: 1024,
          chunk_overlap: 200
        }
      }
    };
    
    // For PDFs and complex documents, use LLM parser for better understanding
    if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExtension || '')) {
      // You can choose between LLM parser and Layout parser based on your needs
      // LLM parser: Better semantic understanding, Layout parser: Preserves document structure
      const useLayoutParser = process.env.USE_LAYOUT_PARSER === 'true';
      
      if (useLayoutParser) {
        return {
          ...baseConfig,
          rag_file_parsing_config: {
            layout_parser: {
              processor_name: `projects/${projectId}/locations/${location}/processors/processor-layout-parser`,
              max_parsing_requests_per_min: "120"
            }
          }
        };
      } else {
        return {
          ...baseConfig,
          rag_file_parsing_config: {
            llm_parser: {
              model_name: `projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash`,
              max_parsing_requests_per_min: "5000"
            }
          }
        };
      }
    }
    
    // For text-based files, use default parsing with chunking
    if (['txt', 'md', 'json', 'csv', 'html', 'xml'].includes(fileExtension || '')) {
      return baseConfig; // Use default parsing with chunking
    }
    
    // For other file types, use LLM parser as fallback with chunking
    return {
      ...baseConfig,
      rag_file_parsing_config: {
        llm_parser: {
          model_name: `projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash`,
          max_parsing_requests_per_min: "5000"
        }
      }
    };
  }

  /**
   * Add file content to RAG corpus using Vertex AI API
   */
  private async addFileToRAGCorpus(corpusId: string, fileName: string, gcsUri: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`📝 Importing file to RAG corpus: ${gcsUri}`);
      
      // Use the correct import endpoint
      const corpusIdParts = corpusId.split('/');
      const projectIdFromCorpus = corpusIdParts[1];
      const locationFromCorpus = corpusIdParts[3];
      const corpusIdShort = corpusIdParts[corpusIdParts.length - 1];
      
      const importUrl = `https://${locationFromCorpus}-aiplatform.googleapis.com/v1beta1/projects/${projectIdFromCorpus}/locations/${locationFromCorpus}/ragCorpora/${corpusIdShort}/ragFiles:import`;
      
      // Get appropriate parsing configuration based on file type
      const parsingConfig = this.getParsingConfig(fileName, projectIdFromCorpus, locationFromCorpus);
      console.log(`🔧 Using parsing config for ${fileName}:`, JSON.stringify(parsingConfig, null, 2));
      
      // Create the import request body with parsing configuration
      const importBody = {
        import_rag_files_config: {
          gcs_source: {
            uris: [gcsUri]
          },
          ...parsingConfig
        }
      };

      console.log(`📤 Sending import request to: ${importUrl}`);
      
      const response = await fetch(importUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getGCSAccessToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Import failed: ${response.status} - ${errorText}`);
        return { success: false, error: `Import failed: ${response.status} - ${errorText}` };
      }

      const result = await response.json();
      console.log(`✅ Import request successful, operation: ${result.name}`);

      // Wait for the import operation to complete
      const operationSuccess = await this.waitForImportOperationToComplete(result.name, projectIdFromCorpus, locationFromCorpus);
      if (!operationSuccess) {
        return { success: false, error: 'Import operation failed or timed out' };
      }

      // Verify the file was actually added to the corpus
      const verificationResult = await this.verifyFileInCorpus(corpusId, fileName, projectIdFromCorpus, locationFromCorpus);
      if (!verificationResult.success) {
        return { success: false, error: `File verification failed: ${verificationResult.error}` };
      }

      console.log(`✅ File successfully imported and verified in RAG corpus`);
      return { success: true };

    } catch (error) {
      console.error(`❌ Error importing file to RAG corpus:`, error);
      return { success: false, error: `Import error: ${error}` };
    }
  }

  /**
   * Debug file content to understand why it might be failing
   */
  private async debugFileContent(bucketName: string, filePath: string): Promise<any> {
    try {
      // Get file metadata first
      const metadataResponse = await fetch(`https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(filePath)}`, {
        headers: {
          'Authorization': `Bearer ${await this.getGCSAccessToken()}`,
        },
      });
      
      if (!metadataResponse.ok) {
        console.error(`❌ Failed to get file metadata: ${metadataResponse.status}`);
        return null;
      }
      
      const metadata = await metadataResponse.json();
      
      // Download a small sample of the file content
      const contentResponse = await fetch(`https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${await this.getGCSAccessToken()}`,
        },
      });
      
      if (!contentResponse.ok) {
        console.error(`❌ Failed to get file content: ${contentResponse.status}`);
        return null;
      }
      
      const arrayBuffer = await contentResponse.arrayBuffer();
      const content = new Uint8Array(arrayBuffer);
      
      // Analyze the content
      const debugInfo = {
        fileName: metadata.name,
        contentType: metadata.contentType,
        size: metadata.size,
        md5Hash: metadata.md5Hash,
        contentLength: content.length,
        firstBytes: content.slice(0, 100).toString(),
        lastBytes: content.slice(-100).toString(),
        isText: this.isTextContent(content),
        encoding: this.detectEncoding(content),
        hasNullBytes: content.includes(0),
        hasControlChars: this.hasControlCharacters(content),
        fileExtension: filePath.split('.').pop()?.toLowerCase()
      };
      
      return debugInfo;
      
    } catch (error) {
      console.error(`❌ Error debugging file content:`, error);
      return null;
    }
  }

  /**
   * Check if content appears to be text
   */
  private isTextContent(content: Uint8Array): boolean {
    const textChars = content.filter(byte => 
      (byte >= 32 && byte <= 126) || // Printable ASCII
      byte === 9 || // Tab
      byte === 10 || // Newline
      byte === 13 // Carriage return
    ).length;
    
    return textChars / content.length > 0.8; // 80% text characters
  }

  /**
   * Detect content encoding
   */
  private detectEncoding(content: Uint8Array): string {
    // Check for BOM (Byte Order Mark)
    if (content.length >= 3 && content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
      return 'UTF-8 with BOM';
    }
    if (content.length >= 2 && content[0] === 0xFF && content[1] === 0xFE) {
      return 'UTF-16 LE';
    }
    if (content.length >= 2 && content[0] === 0xFE && content[1] === 0xFF) {
      return 'UTF-16 BE';
    }
    
    // Check for common encodings
    const hasHighBytes = content.some(byte => byte > 127);
    if (hasHighBytes) {
      return 'Likely UTF-8 or other encoding';
    }
    
    return 'ASCII';
  }

  /**
   * Check for control characters that might cause issues
   */
  private hasControlCharacters(content: Uint8Array): boolean {
    return content.some(byte => 
      (byte >= 0 && byte <= 31) && 
      byte !== 9 && // Tab
      byte !== 10 && // Newline
      byte !== 13 // Carriage return
    );
  }

  /**
   * Verify that a file was actually added to the RAG corpus
   */
  private async verifyFileInCorpus(corpusId: string, fileName: string, projectId: string, location: string): Promise<{ success: boolean; error?: string }> {
    try {
      // List all files in the corpus
      const listUrl = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/ragCorpora/${corpusId.split('/').pop()}/ragFiles`;
      
      const response = await fetch(listUrl, {
        headers: {
          'Authorization': `Bearer ${await this.getGCSAccessToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error listing corpus files: ${response.status}`, errorText);
        return { success: false, error: `Failed to list corpus files: ${response.status} ${errorText}` };
      }
      
      const corpusFiles = await response.json();
      
      if (corpusFiles.ragFiles && Array.isArray(corpusFiles.ragFiles)) {
        const fileNames = corpusFiles.ragFiles.map((file: any) => file.displayName || file.name);
        
        if (fileNames.includes(fileName)) {
          return { success: true };
        } else {
          return { success: false, error: `File ${fileName} not found in corpus` };
        }
      } else {
        return { success: false, error: 'No files found in corpus or invalid response format' };
      }
      
    } catch (error) {
      console.error(`❌ Error verifying file in corpus:`, error);
      return { success: false, error: `Verification error: ${error.message}` };
    }
  }

  /**
   * Wait for file import operation to complete
   */
  private async waitForImportOperationToComplete(operationName: string, projectId: string, location: string): Promise<boolean> {
    if (!operationName) {
      console.error(`❌ Cannot wait for operation: operation name is undefined`);
      return false;
    }

    console.log(`⏳ Waiting for import operation to complete...`);

    // Handle different operation name formats
    let fullOperationUrl: string;
    if (operationName.startsWith('projects/')) {
      fullOperationUrl = `https://${location}-aiplatform.googleapis.com/v1beta1/${operationName}`;
    } else if (operationName.startsWith('operations/')) {
      fullOperationUrl = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/operations/${operationName.split('/').pop()}`;
    } else {
      fullOperationUrl = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/operations/${operationName}`;
    }

    const maxAttempts = 30; // 5 minutes max
    let attempts = 0;

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const response = await fetch(fullOperationUrl, {
          headers: {
            'Authorization': `Bearer ${await this.getGCSAccessToken()}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          console.error(`❌ Failed to check import operation status: ${response.status} ${response.statusText}`);
          return false;
        }
        
        const operation = await response.json();
        
        if (operation.done) {
          if (operation.error) {
            console.error(`❌ Import operation failed:`, operation.error);
            return false;
          }
          
          // Check if the import actually succeeded or failed
          if (operation.response && operation.response.failedRagFilesCount) {
            const failedCount = parseInt(operation.response.failedRagFilesCount);
            if (failedCount > 0) {
              console.error(`❌ Import operation completed but ${failedCount} files failed to import`);
              
              // Log detailed failure information
              if (operation.metadata && operation.metadata.genericMetadata && operation.metadata.genericMetadata.partialFailures) {
                console.error(`❌ Import failures:`, JSON.stringify(operation.metadata.genericMetadata.partialFailures, null, 2));
              }
              
              return false;
            }
          }
          
          console.log(`✅ Import operation completed successfully`);
          return true;
        }
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        }
        
      } catch (error) {
        console.error(`❌ Error checking import operation status:`, error);
        return false;
      }
    }
    
    console.error(`❌ Import operation timed out after ${maxAttempts} attempts`);
    return false;
  }

  /**
   * Download file from GCS as buffer
   */
  private async downloadFileFromGCS(bucketName: string, filePath: string): Promise<Uint8Array | null> {
    try {
      console.log(`⬇️ Downloading file from GCS: ${bucketName}/${filePath}`);

      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        console.error('❌ Failed to get GCS access token');
        return null;
      }

      const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error('❌ Failed to download file from GCS:', response.status);
        return null;
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);

    } catch (error) {
      console.error('❌ Error downloading file from GCS:', error);
      return null;
    }
  }

  /**
   * Clean UTF-8 BOM from a file.
   * This is necessary because Vertex AI RAG API can fail with code 13 if the file starts with a BOM.
   */
  private async cleanFileBOM(bucketName: string, filePath: string): Promise<{ success: boolean; cleanFilePath?: string; error?: string }> {
    try {
      const content = await this.downloadFileFromGCS(bucketName, filePath);
      if (!content) {
        return { success: false, error: 'Failed to download file for BOM cleaning' };
      }

      // Check for BOM (Byte Order Mark)
      if (content.length >= 3 && content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
        console.log(`✅ Found UTF-8 BOM, removing...`);
        const cleanContent = content.slice(3); // Remove the BOM
        const cleanFilePath = `${filePath.split('.')[0]}-cleaned.${filePath.split('.').pop()}`;
        await this.uploadFileToGCS(bucketName, cleanFilePath, cleanContent);
        return { success: true, cleanFilePath: cleanFilePath };
      }
      
      return { success: true, cleanFilePath: filePath };
    } catch (error) {
      console.error(`❌ Error cleaning UTF-8 BOM:`, error);
      return { success: false, error: `Failed to clean BOM: ${error.message}` };
    }
  }

  /**
   * Upload a buffer to GCS.
   */
  private async uploadFileToGCS(bucketName: string, filePath: string, content: Uint8Array): Promise<void> {
    try {
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get GCS access token for upload');
      }

      const url = `https://storage.googleapis.com/upload/storage/v1/b/${bucketName}/o?uploadType=media&name=${encodeURIComponent(filePath)}`;
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': content.length.toString(),
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: content,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to upload file to GCS: ${response.status}`, errorText);
        throw new Error(`Failed to upload file to GCS: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error(`❌ Error uploading file to GCS:`, error);
      throw error;
    }
  }

  /**
   * Delete a file from GCS.
   */
  private async deleteFileFromGCS(bucketName: string, filePath: string): Promise<void> {
    try {
      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get GCS access token for deletion');
      }

      const url = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(filePath)}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to delete file from GCS: ${response.status}`, errorText);
        throw new Error(`Failed to delete file from GCS: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error(`❌ Error deleting file from GCS:`, error);
      throw error;
    }
  }

  /**
   * Get GCS access token using service account
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
    console.log(`🔑 Processing PEM key, length: ${pem.length}`);
    console.log(`🔑 PEM starts with: ${pem.substring(0, 50)}...`);
    
    const pemContents = pem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    
    console.log(`🔑 PEM contents length after cleanup: ${pemContents.length}`);
    console.log(`🔑 PEM contents start: ${pemContents.substring(0, 50)}...`);
    
    try {
      const binaryString = atob(pemContents);
      console.log(`🔑 Binary string length: ${binaryString.length}`);
      
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      console.log(`🔑 ArrayBuffer created successfully, size: ${bytes.buffer.byteLength}`);
      return bytes.buffer;
    } catch (error) {
      console.error(`❌ Error in pemToArrayBuffer: ${error.message}`);
      console.error(`❌ PEM contents that failed: ${pemContents}`);
      throw error;
    }
  }
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize processor with service role key
    const processor = new VertexAIRAGProcessor(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    if (req.method === 'POST') {
      const body = await req.json();
      const { userId, bucketName, fileName, filePath, fileType, fileSize, metadata } = body;

      if (!userId || !bucketName || !fileName || !filePath) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: userId, bucketName, fileName, filePath' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const fileEvent: FileUploadEvent = {
        userId,
        bucketName,
        fileName,
        filePath,
        fileType: fileType || 'application/octet-stream',
        fileSize: fileSize || 0,
        metadata
      };

      const result = await processor.processFileUpload(fileEvent);

      return new Response(
        JSON.stringify(result),
        { 
          status: result.success ? 200 : 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

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
    console.error('❌ Vertex AI RAG processor error:', error);
    
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