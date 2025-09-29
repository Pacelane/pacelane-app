// Content Service - Business Logic Layer
// This is where all content-related operations happen
// Backend developers will mainly work in this file

import { supabase } from '@/integrations/supabase/client';
import type { ApiResponse } from '@/types/api';
import type {
  KnowledgeFile,
  SavedDraft,
  ContentSuggestion,
  DraftCreateData,
  DraftUpdateData,
  FileUploadData,
  LinkData,
  AIMessageData,
  AIResponseData,
  FileType,
  FileValidationResult
} from '@/types/content';

export class ContentService {
  // ========== KNOWLEDGE BASE OPERATIONS ==========

  /**
   * Load all knowledge files for a user directly from Supabase database (fast)
   * @param userId - The user's ID
   * @returns Promise with knowledge files list or error
   */
  static async loadUserKnowledgeFiles(userId: string): Promise<ApiResponse<KnowledgeFile[]>> {
    try {
      console.log('🚀 ContentService: Loading knowledge files from DATABASE (FAST) for user:', userId);
      
      // Query directly from Supabase database for fast loading
      const { data, error } = await supabase
        .from('knowledge_files')
        .select(`
          id,
          name,
          type,
          size,
          created_at,
          updated_at,
          content_extracted,
          extracted_content,
          extraction_metadata,
          metadata
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ ContentService: Database query error:', error);
        return { error: error.message || 'Failed to load knowledge files' };
      }

      console.log('✅ ContentService: Loaded', data?.length || 0, 'knowledge files from DATABASE (FAST)');
      return { data: data || [] };
    } catch (error: any) {
      console.error('❌ ContentService: loadUserKnowledgeFiles failed:', error);
      return { error: error.message || 'Failed to load knowledge files' };
    }
  }

  /**
   * Load all knowledge files for a user from GCS via edge function (legacy - for reference)
   * @param userId - The user's ID
   * @returns Promise with knowledge files list or error
   */
  static async loadUserKnowledgeFilesFromGCS(userId: string): Promise<ApiResponse<KnowledgeFile[]>> {
    try {
      console.log('🐌 ContentService: Loading knowledge files from GCS (SLOW) for user:', userId);
      
      // Get user's JWT token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { error: 'User not authenticated' };
      }

      // Call the GCS edge function to list files
      const { data, error } = await supabase.functions.invoke('knowledge-base-storage', {
        body: {
          userId: userId, // Add missing userId field
          action: 'list'
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('ContentService: GCS list files error:', error);
        return { error: error.message || 'Failed to load knowledge files' };
      }

      if (!data || data.error) {
        console.error('ContentService: GCS list files failed:', data?.error);
        return { error: data?.error || 'Failed to load knowledge files' };
      }

      console.log('ContentService: Loaded', data.data?.length || 0, 'knowledge files from GCS');
      return { data: data.data || [] };
    } catch (error: any) {
      console.error('ContentService: loadUserKnowledgeFilesFromGCS failed:', error);
      return { error: error.message || 'Failed to load knowledge files' };
    }
  }

  /**
   * Upload a single file to knowledge base storage using GCS edge function
   * @param fileData - File upload data
   * @returns Promise with upload result or error
   */
  static async uploadFile(fileData: FileUploadData): Promise<ApiResponse<KnowledgeFile>> {
    try {
      console.log('ContentService: Uploading file to GCS:', fileData.file.name);

      // Validate file type
      const validation = this.validateFileType(fileData.file);
      if (!validation.valid) {
        return { error: validation.error };
      }

      // Get user's JWT token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { error: 'User not authenticated' };
      }

      // Call the GCS edge function
      const { data, error } = await supabase.functions.invoke('knowledge-base-storage', {
        body: {
          userId: fileData.userId, // Add missing userId field
          action: 'upload',
          file: {
            name: fileData.file.name,
            size: fileData.file.size,
            type: fileData.file.type,
            content: await this.fileToBase64(fileData.file)
          },
          metadata: {
            originalName: fileData.file.name,
            uploadedAt: new Date().toISOString()
          }
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('ContentService: GCS upload error:', error);
        return { error: error.message || 'Failed to upload file to GCS' };
      }

      if (!data || data.error) {
        console.error('ContentService: GCS upload failed:', data?.error);
        return { error: data?.error || 'Failed to upload file to GCS' };
      }

      console.log('ContentService: File uploaded successfully to GCS:', data);
      return { data: data.data };
    } catch (error: any) {
      console.error('ContentService: uploadFile failed:', error);
      return { error: error.message || 'Failed to upload file' };
    }
  }

  /**
   * Delete a knowledge file from GCS via edge function
   * @param userId - The user's ID
   * @param fileName - Name of the file to delete
   * @returns Promise with deletion result or error
   */
  static async deleteKnowledgeFile(userId: string, fileName: string): Promise<ApiResponse<void>> {
    try {
      console.log('ContentService: Deleting file from GCS:', fileName, 'for user:', userId);

      // Get user's JWT token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { error: 'User not authenticated' };
      }

      // Call the GCS edge function to delete file
      const { data, error } = await supabase.functions.invoke('knowledge-base-storage', {
        body: {
          userId: userId, // Add missing userId field
          action: 'delete',
          fileName: fileName
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('ContentService: GCS delete file error:', error);
        return { error: error.message || 'Failed to delete file' };
      }

      if (!data || data.error) {
        console.error('ContentService: GCS delete file failed:', data?.error);
        return { error: data?.error || 'Failed to delete file' };
      }

      console.log('ContentService: File deleted successfully from GCS');
      return { data: data.data };
    } catch (error: any) {
      console.error('ContentService: deleteKnowledgeFile failed:', error);
      return { error: error.message || 'Failed to delete file' };
    }
  }

  /**
   * Get file preview URL for secure access
   * @param fileId - The file ID to get preview URL for
   * @returns Promise with preview URL or error
   */
  static async getFilePreviewUrl(fileId: string): Promise<ApiResponse<string>> {
    try {
      console.log('ContentService: Getting file preview URL:', fileId);
      
      // Get user's JWT token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { error: 'User not authenticated' };
      }

      // Get user ID from session
      const userId = session.user?.id;
      if (!userId) {
        return { error: 'User ID not found' };
      }

      // Call the GCS edge function to get preview URL
      const { data, error } = await supabase.functions.invoke('knowledge-base-storage', {
        body: {
          userId: userId,
          action: 'preview',
          fileId: fileId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('ContentService: GCS preview URL error:', error);
        return { error: error.message || 'Failed to get file preview URL' };
      }

      if (!data || !data.success) {
        console.error('ContentService: GCS preview URL failed:', data?.error);
        return { error: data?.error || 'Failed to get file preview URL' };
      }

      console.log('ContentService: File preview URL generated successfully');
      return { data: data.url };
    } catch (error: any) {
      console.error('ContentService: getFilePreviewUrl failed:', error);
      return { error: error.message || 'Failed to get file preview URL' };
    }
  }

  /**
   * Stream file directly from GCS for preview/download
   * @param fileId - The file ID to stream
   * @returns Promise with file stream URL or error
   */
  static async streamFile(fileId: string): Promise<ApiResponse<Response>> {
    try {
      console.log('ContentService: Streaming file:', fileId);
      
      // Get user's JWT token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { error: 'User not authenticated' };
      }

      // Get user ID from session
      const userId = session.user?.id;
      if (!userId) {
        return { error: 'User ID not found' };
      }

      // Call the GCS edge function to stream file
      const { data, error } = await supabase.functions.invoke('knowledge-base-storage', {
        body: {
          userId: userId,
          action: 'stream',
          fileId: fileId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('ContentService: GCS file stream error:', error);
        return { error: error.message || 'Failed to stream file' };
      }

      if (!data || !data.success) {
        console.error('ContentService: GCS file stream failed:', data?.error);
        return { error: data?.error || 'Failed to stream file' };
      }

      console.log('ContentService: File stream initiated successfully');
      return { data: data.response };
    } catch (error: any) {
      console.error('ContentService: streamFile failed:', error);
      return { error: error.message || 'Failed to stream file' };
    }
  }

  /**
   * Get file content for text-based previews
   * @param fileId - The file ID to get content for
   * @returns Promise with file content or error
   */
  static async getFileContent(fileId: string): Promise<ApiResponse<{ content: string; contentType: string }>> {
    try {
      console.log('ContentService: Getting file content:', fileId);
      
      // Get user's JWT token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        return { error: 'User not authenticated' };
      }

      // Get user ID from session
      const userId = session.user?.id;
      if (!userId) {
        return { error: 'User ID not found' };
      }

      // Call the GCS edge function to get file content
      const { data, error } = await supabase.functions.invoke('knowledge-base-storage', {
        body: {
          userId: userId,
          action: 'content',
          fileId: fileId
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('ContentService: GCS file content error:', error);
        return { error: error.message || 'Failed to get file content' };
      }

      if (!data || !data.success) {
        console.error('ContentService: GCS file content failed:', data?.error);
        return { error: data?.error || 'Failed to get file content' };
      }

      console.log('ContentService: File content retrieved successfully');
      return { 
        data: {
          content: data.content,
          contentType: data.contentType
        }
      };
    } catch (error: any) {
      console.error('ContentService: getFileContent failed:', error);
      return { error: error.message || 'Failed to get file content' };
    }
  }

  // ========== DRAFTS OPERATIONS ==========

  /**
   * Load all saved drafts for a user
   * @param userId - The user's ID
   * @returns Promise with drafts list or error
   */
  static async loadUserDrafts(userId: string): Promise<ApiResponse<SavedDraft[]>> {
    try {
      console.log('ContentService: Loading drafts for user:', userId);

      const { data: drafts, error } = await supabase
        .from('saved_drafts' as any)
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('ContentService: Load drafts error:', error);
        throw error;
      }

      console.log('ContentService: Loaded', drafts?.length || 0, 'drafts');
      return { data: drafts || [] };
    } catch (error: any) {
      console.error('ContentService: loadUserDrafts failed:', error);
      return { error: error.message || 'Failed to load drafts' };
    }
  }

  /**
   * Create a new draft
   * @param userId - The user's ID
   * @param draftData - Draft creation data
   * @returns Promise with new draft or error
   */
  static async createDraft(userId: string, draftData: DraftCreateData): Promise<ApiResponse<SavedDraft>> {
    try {
      console.log('ContentService: Creating draft for user:', userId);

      const insertData = {
        ...draftData,
        user_id: userId,
        status: draftData.status || 'draft'
      };

      const { data: draft, error } = await supabase
        .from('saved_drafts' as any)
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('ContentService: Create draft error:', error);
        throw error;
      }

      console.log('ContentService: Draft created successfully');
      return { data: draft };
    } catch (error: any) {
      console.error('ContentService: createDraft failed:', error);
      return { error: error.message || 'Failed to create draft' };
    }
  }

  /**
   * Update an existing draft
   * @param draftId - The draft's ID
   * @param userId - The user's ID (for security)
   * @param updates - Draft update data
   * @returns Promise with updated draft or error
   */
  static async updateDraft(
    draftId: string, 
    userId: string, 
    updates: DraftUpdateData
  ): Promise<ApiResponse<SavedDraft>> {
    try {
      console.log('ContentService: Updating draft:', draftId, 'for user:', userId);

      const { data: draft, error } = await supabase
        .from('saved_drafts' as any)
        .update(updates)
        .eq('id', draftId)
        .eq('user_id', userId) // Security: ensure user owns draft
        .select()
        .single();

      if (error) {
        console.error('ContentService: Update draft error:', error);
        throw error;
      }

      console.log('ContentService: Draft updated successfully');
      return { data: draft };
    } catch (error: any) {
      console.error('ContentService: updateDraft failed:', error);
      return { error: error.message || 'Failed to update draft' };
    }
  }

  /**
   * Delete a draft
   * @param draftId - The draft's ID
   * @param userId - The user's ID (for security)
   * @returns Promise with deletion result or error
   */
  static async deleteDraft(draftId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      console.log('ContentService: Deleting draft:', draftId, 'for user:', userId);

      const { error } = await supabase
        .from('saved_drafts' as any)
        .delete()
        .eq('id', draftId)
        .eq('user_id', userId); // Security: ensure user owns draft

      if (error) {
        console.error('ContentService: Delete draft error:', error);
        throw error;
      }

      console.log('ContentService: Draft deleted successfully');
      return { data: undefined };
    } catch (error: any) {
      console.error('ContentService: deleteDraft failed:', error);
      return { error: error.message || 'Failed to delete draft' };
    }
  }

  // ========== CONTENT SUGGESTIONS OPERATIONS ==========

  /**
   * Load active content suggestions for a user
   * @param userId - The user's ID
   * @returns Promise with content suggestions or error
   */
  static async loadContentSuggestions(userId: string): Promise<ApiResponse<ContentSuggestion[]>> {
    try {
      console.log('ContentService: Loading enhanced content suggestions for user:', userId);

      // First try to load from enhanced_content_suggestions table
      const { data: enhancedSuggestions, error: enhancedError } = await supabase
        .from('enhanced_content_suggestions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (enhancedError) {
        console.error('ContentService: Load enhanced content suggestions error:', enhancedError);
        throw enhancedError;
      }

      if (enhancedSuggestions && enhancedSuggestions.length > 0) {
        console.log('ContentService: Loaded', enhancedSuggestions.length, 'enhanced content suggestions');
        
        // Transform enhanced suggestions to match ContentSuggestion interface
        const transformedSuggestions = enhancedSuggestions.map(suggestion => ({
          id: suggestion.id,
          user_id: suggestion.user_id,
          title: suggestion.title,
          description: suggestion.description,
          suggested_outline: suggestion.full_content, // Use full_content as outline
          full_content: suggestion.full_content,
          hashtags: suggestion.hashtags || [],
          call_to_action: suggestion.call_to_action,
          estimated_engagement: suggestion.estimated_engagement,
          quality_score: suggestion.quality_score,
          context_sources: suggestion.context_sources,
          generation_metadata: suggestion.generation_metadata,
          is_active: suggestion.is_active,
          created_at: suggestion.created_at,
          updated_at: suggestion.updated_at
        }));
        
        return { data: transformedSuggestions };
      }

      // Fallback to old content_suggestions table if no enhanced suggestions found
      console.log('ContentService: No enhanced suggestions found, falling back to old table');
      const { data: oldSuggestions, error: oldError } = await supabase
        .from('content_suggestions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .is('used_at', null)
        .order('created_at', { ascending: false });

      if (oldError) {
        console.error('ContentService: Load old content suggestions error:', oldError);
        throw oldError;
      }

      console.log('ContentService: Loaded', oldSuggestions?.length || 0, 'old content suggestions');
      return { data: oldSuggestions || [] };
    } catch (error: any) {
      console.error('ContentService: loadContentSuggestions failed:', error);
      return { error: error.message || 'Failed to load content suggestions' };
    }
  }

  /**
   * Mark a content suggestion as used
   * @param suggestionId - The suggestion's ID
   * @param userId - The user's ID (for security)
   * @returns Promise with update result or error
   */
  static async markSuggestionAsUsed(
    suggestionId: string, 
    userId: string
  ): Promise<ApiResponse<ContentSuggestion>> {
    try {
      console.log('ContentService: Marking suggestion as used:', suggestionId);

      const { data: suggestion, error } = await supabase
        .from('content_suggestions')
        .update({ used_at: new Date().toISOString() })
        .eq('id', suggestionId)
        .eq('user_id', userId) // Security: ensure user owns suggestion
        .select()
        .single();

      if (error) {
        console.error('ContentService: Mark suggestion as used error:', error);
        throw error;
      }

      console.log('ContentService: Suggestion marked as used successfully');
      return { data: suggestion };
    } catch (error: any) {
      console.error('ContentService: markSuggestionAsUsed failed:', error);
      return { error: error.message || 'Failed to mark suggestion as used' };
    }
  }

  // ========== AI ASSISTANT OPERATIONS ==========

  /**
   * Send a message to the AI assistant
   * @param messageData - AI message data with context
   * @returns Promise with AI response or error
   */
  static async sendAIMessage(messageData: AIMessageData): Promise<ApiResponse<AIResponseData>> {
    try {
      console.log('ContentService: Sending AI message');

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: messageData.message,
          conversationId: messageData.conversationId,
          fileContexts: messageData.fileContexts || [],
          currentContent: messageData.currentContent
        }
      });

      if (error) {
        console.error('ContentService: AI message error:', error);
        throw error;
      }

      console.log('ContentService: AI message sent successfully');
      return { data };
    } catch (error: any) {
      console.error('ContentService: sendAIMessage failed:', error);
      return { error: error.message || 'Failed to send AI message' };
    }
  }

  // ========== UI CONTENT ORDER OPERATIONS ==========

  /**
   * Create a content order from UI to trigger the agent pipeline
   * @param orderData - Content order parameters
   * @returns Promise with order creation result
   */
  static async createUIContentOrder(orderData: {
    platform: string;
    length: string;
    tone: string;
    angle: string;
    refs?: string[];
    original_content?: string;
    context?: string;
    topic?: string;
  }): Promise<ApiResponse<{
    orderId: string;
    jobId: string;
    message: string;
  }>> {
    try {
      console.log('ContentService: Creating UI content order');

      const { data, error } = await supabase.functions.invoke('ui-content-order', {
        body: orderData
      });

      if (error) {
        console.error('ContentService: UI content order error:', error);
        throw error;
      }

      console.log('ContentService: UI content order created successfully');
      return { data };
    } catch (error: any) {
      console.error('ContentService: createUIContentOrder failed:', error);
      return { error: error.message || 'Failed to create content order' };
    }
  }

  // ========== LINKEDIN POST SCRAPING & TONE ANALYSIS ==========

  /**
   * Scrape LinkedIn posts using Apify actor
   * @param username - LinkedIn username (without @)
   * @param limit - Number of posts to scrape (default 50)
   * @returns Promise with scraping result
   */
  static async scrapeLinkedInPosts(username: string, limit: number = 50): Promise<ApiResponse<{
    success: boolean;
    message: string;
    postsCount: number;
  }>> {
    try {
      console.log('ContentService: Scraping LinkedIn posts with Apify');

      const { data, error } = await supabase.functions.invoke('linkedin-post-scraper', {
        body: {
          action: 'scrape_posts',
          userId: (await supabase.auth.getUser()).data.user?.id,
          data: { username, limit }
        }
      });

      if (error) {
        console.error('ContentService: LinkedIn posts scraping error:', error);
        throw error;
      }

      console.log('ContentService: LinkedIn posts scraped successfully');
      return { data };
    } catch (error: any) {
      console.error('ContentService: scrapeLinkedInPosts failed:', error);
      return { error: error.message || 'Failed to scrape LinkedIn posts' };
    }
  }

  /**
   * Add LinkedIn posts manually for tone analysis
   * @param posts - Array of LinkedIn post content strings
   * @returns Promise with operation result
   */
  static async addLinkedInPostsManually(posts: string[]): Promise<ApiResponse<{
    success: boolean;
    message: string;
    postsCount: number;
  }>> {
    try {
      console.log('ContentService: Adding LinkedIn posts manually');

      const { data, error } = await supabase.functions.invoke('linkedin-post-scraper', {
        body: {
          action: 'add_posts_manually',
          userId: (await supabase.auth.getUser()).data.user?.id,
          data: { posts }
        }
      });

      if (error) {
        console.error('ContentService: LinkedIn posts manual add error:', error);
        throw error;
      }

      console.log('ContentService: LinkedIn posts added successfully');
      return { data };
    } catch (error: any) {
      console.error('ContentService: addLinkedInPostsManually failed:', error);
      return { error: error.message || 'Failed to add LinkedIn posts' };
    }
  }

  /**
   * Analyze writing tone from existing LinkedIn posts
   * @returns Promise with tone analysis result
   */
  static async analyzeWritingTone(): Promise<ApiResponse<{
    success: boolean;
    analysis: any;
    postsAnalyzed: number;
  }>> {
    try {
      console.log('ContentService: Analyzing writing tone');

      const { data, error } = await supabase.functions.invoke('linkedin-post-scraper', {
        body: {
          action: 'analyze_tone',
          userId: (await supabase.auth.getUser()).data.user?.id,
          data: {}
        }
      });

      if (error) {
        console.error('ContentService: Tone analysis error:', error);
        throw error;
      }

      console.log('ContentService: Tone analysis completed successfully');
      return { data };
    } catch (error: any) {
      console.error('ContentService: analyzeWritingTone failed:', error);
      return { error: error.message || 'Failed to analyze writing tone' };
    }
  }

  /**
   * Get existing LinkedIn posts for user
   * @returns Promise with user's LinkedIn posts
   */
  static async getLinkedInPosts(): Promise<ApiResponse<{
    posts: any[];
    count: number;
  }>> {
    try {
      console.log('ContentService: Getting LinkedIn posts');

      const { data, error } = await supabase.functions.invoke('linkedin-post-scraper', {
        body: {
          action: 'get_posts',
          userId: (await supabase.auth.getUser()).data.user?.id,
          data: {}
        }
      });

      if (error) {
        console.error('ContentService: Get LinkedIn posts error:', error);
        throw error;
      }

      console.log('ContentService: LinkedIn posts retrieved successfully');
      return { data };
    } catch (error: any) {
      console.error('ContentService: getLinkedInPosts failed:', error);
      return { error: error.message || 'Failed to get LinkedIn posts' };
    }
  }

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Determine file type from filename extension
   * @param filename - Name of the file
   * @returns File type category
   */
  static getFileTypeFromName(filename: string): FileType {
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
    if (['pdf', 'docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'txt', 'md', 'csv', 'json'].includes(extension)) {
      return 'document';
    }
    
    return 'file';
  }

  /**
   * Validate if file type is allowed for upload
   * @param file - File to validate
   * @returns Validation result
   */
  static validateFileType(file: File): FileValidationResult {
    const allowedTypes = [
      // Text-based formats (best for content extraction)
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      // Document formats
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      // Image formats
      'image/png',
      'image/jpeg',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Audio formats
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/m4a',
      'audio/flac',
      // Video formats
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/webm'
    ];
    
    // Also check file extension as fallback
    const fileName = file.name.toLowerCase();
    const allowedExtensions = [
      // Text-based formats (best for content extraction)
      '.txt', '.md', '.csv', '.json',
      // Document formats
      '.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls',
      // Image formats
      '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
      // Audio formats
      '.mp3', '.wav', '.ogg', '.m4a', '.flac',
      // Video formats
      '.mp4', '.avi', '.mov', '.webm'
    ];
    
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!allowedTypes.includes(file.type) && !hasValidExtension) {
      return {
        valid: false,
        error: 'File type not supported. Allowed types: Text files (TXT, MD, CSV, JSON), PDF, Word documents (DOCX, DOC), PowerPoint (PPTX, PPT), Excel (XLSX, XLS), images (PNG, JPG, GIF, WebP, SVG), audio (MP3, WAV, OGG, M4A, FLAC), and video (MP4, AVI, MOV, WebM).'
      };
    }

    // Check file size (25MB limit for audio/video files, 10MB for others)
    const isAudioOrVideo = file.type.startsWith('audio/') || file.type.startsWith('video/') || 
                          ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.mp4', '.avi', '.mov', '.webm'].some(ext => fileName.endsWith(ext));
    
    const maxSize = isAudioOrVideo ? 25 * 1024 * 1024 : 10 * 1024 * 1024; // 25MB for audio/video, 10MB for others
    
    if (file.size > maxSize) {
      const maxSizeMB = isAudioOrVideo ? 25 : 10;
      return {
        valid: false,
        error: `File size too large. Maximum size is ${maxSizeMB}MB for ${isAudioOrVideo ? 'audio/video' : 'document/image'} files.`
      };
    }

    return { valid: true };
  }

  /**
   * Generate file URL for storage access
   * @param userId - User's ID
   * @param fileName - Name of the file
   * @returns File URL
   */
  static generateFileUrl(userId: string, fileName: string): string {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://plbgeabtrkdhbrnjonje.supabase.co';
    return `${supabaseUrl}/storage/v1/object/knowledge-base/${userId}/${fileName}`;
  }

  /**
   * Add a link to knowledge base (placeholder implementation)
   * @param userId - User's ID
   * @param linkData - Link data
   * @returns Promise with operation result
   */
  static async addLink(userId: string, linkData: LinkData): Promise<ApiResponse<void>> {
    try {
      console.log('ContentService: Adding link for user:', userId, linkData.url);
      
      // TODO: Implement link storage in database
      // For now, this is a placeholder that simulates success
      console.log('ContentService: Link processing completed (placeholder)');
      
      return { data: undefined };
    } catch (error: any) {
      console.error('ContentService: addLink failed:', error);
      return { error: error.message || 'Failed to add link' };
    }
  }

  /**
   * Convert a File object to base64 string for transmission
   * @param file - File to convert
   * @returns Promise with base64 string
   */
  private static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
} 