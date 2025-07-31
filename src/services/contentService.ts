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
   * Load all knowledge files for a user from storage
   * @param userId - The user's ID
   * @returns Promise with knowledge files list or error
   */
  static async loadUserKnowledgeFiles(userId: string): Promise<ApiResponse<KnowledgeFile[]>> {
    try {
      console.log('ContentService: Loading knowledge files for user:', userId);
      
      const { data: files, error } = await supabase.storage
        .from('knowledge-base')
        .list(userId, {
          limit: 100,
          offset: 0
        });

      if (error) {
        console.error('ContentService: Load knowledge files error:', error);
        throw error;
      }

      const knowledgeFiles: KnowledgeFile[] = files?.map(file => ({
        id: file.id || file.name,
        name: file.name,
        type: this.getFileTypeFromName(file.name),
        size: file.metadata?.size,
        user_id: userId,
        created_at: file.created_at || new Date().toISOString(),
        updated_at: file.updated_at || new Date().toISOString(),
        url: this.generateFileUrl(userId, file.name)
      })) || [];

      console.log('ContentService: Loaded', knowledgeFiles.length, 'knowledge files');
      return { data: knowledgeFiles };
    } catch (error: any) {
      console.error('ContentService: loadUserKnowledgeFiles failed:', error);
      return { error: error.message || 'Failed to load knowledge files' };
    }
  }

  /**
   * Upload a single file to knowledge base storage
   * @param fileData - File upload data
   * @returns Promise with upload result or error
   */
  static async uploadFile(fileData: FileUploadData): Promise<ApiResponse<KnowledgeFile>> {
    try {
      console.log('ContentService: Uploading file:', fileData.file.name);

      // Validate file type
      const validation = this.validateFileType(fileData.file);
      if (!validation.valid) {
        return { error: validation.error };
      }

      // Generate unique filename
      const fileExt = fileData.file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileData.userId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('knowledge-base')
        .upload(filePath, fileData.file);

      if (uploadError) {
        console.error('ContentService: File upload error:', uploadError);
        throw uploadError;
      }

      // Create knowledge file object
      const knowledgeFile: KnowledgeFile = {
        id: fileName,
        name: fileName,
        type: this.getFileTypeFromName(fileName),
        size: fileData.file.size,
        user_id: fileData.userId,
        created_at: new Date().toISOString(),
        url: this.generateFileUrl(fileData.userId, fileName)
      };

      console.log('ContentService: File uploaded successfully');
      return { data: knowledgeFile };
    } catch (error: any) {
      console.error('ContentService: uploadFile failed:', error);
      return { error: error.message || 'Failed to upload file' };
    }
  }

  /**
   * Delete a knowledge file from storage
   * @param userId - The user's ID
   * @param fileName - Name of the file to delete
   * @returns Promise with deletion result or error
   */
  static async deleteKnowledgeFile(userId: string, fileName: string): Promise<ApiResponse<void>> {
    try {
      console.log('ContentService: Deleting file:', fileName, 'for user:', userId);

      const filePath = `${userId}/${fileName}`;
      
      const { error } = await supabase.storage
        .from('knowledge-base')
        .remove([filePath]);

      if (error) {
        console.error('ContentService: Delete file error:', error);
        throw error;
      }

      console.log('ContentService: File deleted successfully');
      return { data: undefined };
    } catch (error: any) {
      console.error('ContentService: deleteKnowledgeFile failed:', error);
      return { error: error.message || 'Failed to delete file' };
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
      console.log('ContentService: Loading content suggestions for user:', userId);

      const { data: suggestions, error } = await supabase
        .from('content_suggestions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .is('used_at', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('ContentService: Load content suggestions error:', error);
        throw error;
      }

      console.log('ContentService: Loaded', suggestions?.length || 0, 'content suggestions');
      return { data: suggestions || [] };
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
          fileContexts: messageData.fileContexts || []
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
    
    return 'file';
  }

  /**
   * Validate if file type is allowed for upload
   * @param file - File to validate
   * @returns Validation result
   */
  static validateFileType(file: File): FileValidationResult {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'image/png'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported. Only PDF, Word documents (.docx), and PNG images are allowed.'
      };
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return {
        valid: false,
        error: 'File size too large. Maximum size is 10MB.'
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
} 