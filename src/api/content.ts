// Content API Layer - Frontend Interface
// This is where frontend developers will mainly work for content operations
// It wraps the ContentService and adds frontend-specific logic

import { ContentService } from '@/services/contentService';
import type {
  DraftCreateData,
  DraftUpdateData,
  LinkData,
  AIMessageData,
  FileContext,
  FileType
} from '@/types/content';

/**
 * Frontend API for content operations
 * This layer adds frontend-specific logic and validation
 */
export const contentApi = {
  // ========== KNOWLEDGE BASE OPERATIONS ==========

  /**
   * Load knowledge files for the current user with pagination, filtering, and search
   * @param userId - User ID from auth
   * @param limit - Number of files to load (default: 12)
   * @param offset - Number of files to skip (default: 0)
   * @param filter - File type filter (optional: 'all', 'files', 'images', 'audio', 'links')
   * @param search - Search query for file names (optional)
   * @returns Promise with knowledge files list
   */
  async loadKnowledgeFiles(
    userId: string, 
    limit: number = 12, 
    offset: number = 0,
    filter?: string,
    search?: string
  ) {
    return ContentService.loadUserKnowledgeFiles(userId, limit, offset, filter, search);
  },

  /**
   * Get total count of knowledge files for the current user with filtering and search
   * @param userId - User ID from auth
   * @param filter - File type filter (optional: 'all', 'files', 'images', 'audio', 'links')
   * @param search - Search query for file names (optional)
   * @returns Promise with total count
   */
  async getKnowledgeFilesCount(userId: string, filter?: string, search?: string) {
    return ContentService.getUserKnowledgeFilesCount(userId, filter, search);
  },

  /**
   * Upload a single file to knowledge base
   * @param userId - User ID from auth
   * @param file - File to upload
   * @returns Promise with upload result
   */
  async uploadFile(userId: string, file: File) {
    // Frontend validation
    if (!file) {
      return { error: 'No file provided for upload' };
    }

    // Validate file type before upload
    const validation = ContentService.validateFileType(file);
    if (!validation.valid) {
      return { error: validation.error };
    }

    return ContentService.uploadFile({ file, userId });
  },

  /**
   * Upload multiple files to knowledge base
   * @param userId - User ID from auth
   * @param files - Files to upload
   * @returns Promise with upload results
   */
  async uploadFiles(userId: string, files: File[]) {
    if (!files || files.length === 0) {
      return { error: 'No files provided for upload' };
    }

    // Validate all files before uploading any
    for (const file of files) {
      const validation = ContentService.validateFileType(file);
      if (!validation.valid) {
        return { error: `${file.name}: ${validation.error}` };
      }
    }

    const results = [];
    const errors = [];

    // Upload files sequentially to avoid overwhelming the system
    for (const file of files) {
      const result = await ContentService.uploadFile({ file, userId });
      if (result.error) {
        errors.push(`${file.name}: ${result.error}`);
      } else {
        results.push(result.data);
      }
    }

    if (errors.length > 0) {
      return { error: `Some uploads failed: ${errors.join(', ')}` };
    }

    return { data: results };
  },

  /**
   * Delete a knowledge file
   * @param userId - User ID from auth
   * @param fileName - Name of file to delete
   * @returns Promise with deletion result
   */
  async deleteKnowledgeFile(userId: string, fileName: string) {
    if (!fileName.trim()) {
      return { error: 'File name is required for deletion' };
    }

    return ContentService.deleteKnowledgeFile(userId, fileName);
  },

  /**
   * Add a link to knowledge base
   * @param userId - User ID from auth
   * @param url - URL to add
   * @returns Promise with add result
   */
  async addLink(userId: string, url: string) {
    // Frontend validation
    if (!url.trim()) {
      return { error: 'URL is required' };
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return { error: 'Please enter a valid URL' };
    }

    const linkData: LinkData = { url: url.trim() };
    return ContentService.addLink(userId, linkData);
  },

  /**
   * Get file preview URL for secure access
   * @param fileId - File ID to get preview URL for
   * @returns Promise with preview URL
   */
  async getFilePreviewUrl(fileId: string) {
    // Frontend validation
    if (!fileId) {
      return { error: 'File ID is required' };
    }

    return ContentService.getFilePreviewUrl(fileId);
  },

  /**
   * Stream file directly for preview/download
   * @param fileId - File ID to stream
   * @returns Promise with file stream
   */
  async streamFile(fileId: string) {
    // Frontend validation
    if (!fileId) {
      return { error: 'File ID is required' };
    }

    return ContentService.streamFile(fileId);
  },

  /**
   * Get file content for text-based previews
   * @param fileId - File ID to get content for
   * @returns Promise with file content
   */
  async getFileContent(fileId: string) {
    // Frontend validation
    if (!fileId) {
      return { error: 'File ID is required' };
    }

    return ContentService.getFileContent(fileId);
  },

  // ========== DRAFTS OPERATIONS ==========

  /**
   * Load all saved drafts for the current user
   * @param userId - User ID from auth
   * @returns Promise with drafts list
   */
  async loadSavedDrafts(userId: string) {
    return ContentService.loadUserDrafts(userId);
  },

  /**
   * Save a new draft
   * @param userId - User ID from auth
   * @param title - Draft title
   * @param content - Draft content
   * @param suggestionId - Optional content suggestion ID
   * @returns Promise with new draft
   */
  async saveDraft(userId: string, title: string, content: string, suggestionId?: string) {
    // Frontend validation
    if (!title.trim()) {
      return { error: 'Draft title is required' };
    }

    if (!content.trim()) {
      return { error: 'Draft content cannot be empty' };
    }

    const draftData: DraftCreateData = {
      title: title.trim(),
      content: content.trim(),
      suggestion_id: suggestionId
    };

    return ContentService.createDraft(userId, draftData);
  },

  /**
   * Update an existing draft
   * @param userId - User ID from auth
   * @param draftId - Draft ID to update
   * @param updates - Draft updates
   * @returns Promise with updated draft
   */
  async updateDraft(userId: string, draftId: string, updates: DraftUpdateData) {
    if (!draftId.trim()) {
      return { error: 'Draft ID is required for update' };
    }

    // Validate non-empty updates
    if (updates.title !== undefined && !updates.title.trim()) {
      return { error: 'Draft title cannot be empty' };
    }

    if (updates.content !== undefined && !updates.content.trim()) {
      return { error: 'Draft content cannot be empty' };
    }

    // Trim string values
    const cleanUpdates: DraftUpdateData = {};
    if (updates.title !== undefined) cleanUpdates.title = updates.title.trim();
    if (updates.content !== undefined) cleanUpdates.content = updates.content.trim();
    if (updates.status !== undefined) cleanUpdates.status = updates.status;

    return ContentService.updateDraft(draftId, userId, cleanUpdates);
  },

  /**
   * Delete a draft
   * @param userId - User ID from auth
   * @param draftId - Draft ID to delete
   * @returns Promise with deletion result
   */
  async deleteDraft(userId: string, draftId: string) {
    if (!draftId.trim()) {
      return { error: 'Draft ID is required for deletion' };
    }

    return ContentService.deleteDraft(draftId, userId);
  },

  // ========== CONTENT SUGGESTIONS OPERATIONS ==========

  /**
   * Load active content suggestions for the current user
   * @param userId - User ID from auth
   * @returns Promise with content suggestions
   */
  async loadContentSuggestions(userId: string) {
    return ContentService.loadContentSuggestions(userId);
  },

  /**
   * Mark a content suggestion as used
   * @param userId - User ID from auth
   * @param suggestionId - Suggestion ID to mark as used
   * @returns Promise with update result
   */
  async markSuggestionAsUsed(userId: string, suggestionId: string) {
    if (!suggestionId.trim()) {
      return { error: 'Suggestion ID is required' };
    }

    return ContentService.markSuggestionAsUsed(suggestionId, userId);
  },

  // ========== AI ASSISTANT OPERATIONS ==========

  /**
   * Send a message to AI assistant with file context
   * @param message - User message
   * @param selectedFiles - Selected knowledge files for context
   * @param conversationId - Optional conversation ID
   * @returns Promise with AI response
   */
  async sendAIMessage(
    message: string, 
    selectedFiles: any[] = [], 
    conversationId?: string,
    currentContent?: string
  ) {
    // Frontend validation
    if (!message.trim()) {
      return { error: 'Message cannot be empty' };
    }

    // Convert selected files to file contexts
    const fileContexts: FileContext[] = selectedFiles.map(file => ({
      name: file.name,
      type: file.type,
      url: file.url
    }));

    const messageData: AIMessageData = {
      message: message.trim(),
      conversationId,
      fileContexts,
      currentContent
    };

    return ContentService.sendAIMessage(messageData);
  },

  /**
   * Create a content order from UI to trigger the agent pipeline
   * @param orderData - Content order parameters
   * @returns Promise with order creation result
   */
  async createUIContentOrder(orderData: {
    platform: string;
    length: string;
    tone: string;
    angle: string;
    refs?: string[];
    original_content?: string;
    context?: string;
    topic?: string;
  }) {
    return ContentService.createUIContentOrder(orderData);
  },

  // ========== UTILITY FUNCTIONS ==========

  /**
   * Get file type from filename
   * @param filename - Name of the file
   * @returns File type category
   */
  getFileTypeFromName(filename: string): FileType {
    return ContentService.getFileTypeFromName(filename);
  },

  /**
   * Validate file type for upload
   * @param file - File to validate
   * @returns Validation result
   */
  validateFileType(file: File) {
    return ContentService.validateFileType(file);
  },

  /**
   * Generate file URL for display
   * @param userId - User's ID
   * @param fileName - Name of the file
   * @returns File URL
   */
  generateFileUrl(userId: string, fileName: string): string {
    return ContentService.generateFileUrl(userId, fileName);
  },

  /**
   * Check if file type matches filter
   * @param fileType - Type of the file
   * @param filter - Filter to check against
   * @returns Boolean indicating if file matches filter
   */
  fileMatchesFilter(fileType: FileType, filter: string): boolean {
    if (filter === 'all') return true;
    
    const filterMap: Record<string, FileType[]> = {
      'files': ['file'],
      'images': ['image'],
      'audios': ['audio'],
      'videos': ['video'],
      'links': ['link']
    };

    return filterMap[filter]?.includes(fileType) || false;
  },

  /**
   * Format file size for display
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${Math.round(size * 10) / 10} ${units[unitIndex]}`;
  },

  /**
   * Validate draft title format
   * @param title - Title to validate
   * @returns Validation result
   */
  validateDraftTitle(title: string): { valid: boolean; error?: string } {
    if (!title.trim()) {
      return { valid: false, error: 'Title is required' };
    }

    if (title.length > 100) {
      return { valid: false, error: 'Title must be 100 characters or less' };
    }

    return { valid: true };
  },

  /**
   * Validate draft content format
   * @param content - Content to validate
   * @returns Validation result
   */
  validateDraftContent(content: string): { valid: boolean; error?: string } {
    if (!content.trim()) {
      return { valid: false, error: 'Content is required' };
    }

    if (content.length > 50000) {
      return { valid: false, error: 'Content must be 50,000 characters or less' };
    }

    return { valid: true };
  }
};

// Export individual functions for convenience
export const {
  loadKnowledgeFiles,
  uploadFile,
  uploadFiles,
  deleteKnowledgeFile,
  addLink,
  loadSavedDrafts,
  saveDraft,
  updateDraft,
  deleteDraft,
  loadContentSuggestions,
  markSuggestionAsUsed,
  sendAIMessage,
  createUIContentOrder,
  getFileTypeFromName,
  validateFileType,
  getFilePreviewUrl,
  streamFile,
  getFileContent,
  generateFileUrl,
  fileMatchesFilter,
  formatFileSize,
  validateDraftTitle,
  validateDraftContent
} = contentApi; 