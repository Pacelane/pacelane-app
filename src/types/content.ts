// Content Type Definitions
// This file defines all content-related data structures and operations

// ========== KNOWLEDGE BASE TYPES ==========

export type FileType = 'file' | 'image' | 'audio' | 'video' | 'link';

export interface KnowledgeFile {
  id: string;
  name: string;
  type: FileType;
  size?: number;
  url?: string;
  user_id: string;
  created_at: string;
  updated_at?: string;
  selected?: boolean; // For UI selection state
}

export interface FileUploadData {
  file: File;
  userId: string;
}

export interface LinkData {
  url: string;
  title?: string;
  description?: string;
}

// ========== DRAFTS TYPES ==========

export type DraftStatus = 'draft' | 'published' | 'archived';

export interface SavedDraft {
  id: string;
  title: string;
  content: string;
  status: DraftStatus;
  user_id: string;
  created_at: string;
  updated_at: string;
  suggestion_id?: string; // Link to content suggestion if created from one
}

export interface DraftCreateData {
  title: string;
  content: string;
  status?: DraftStatus;
  suggestion_id?: string;
}

export interface DraftUpdateData {
  title?: string;
  content?: string;
  status?: DraftStatus;
}

// ========== CONTENT SUGGESTIONS TYPES ==========

export interface ContentSuggestion {
  id: string;
  title: string;
  description?: string;
  suggested_outline?: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  used_at?: string; // When the suggestion was used to create content
}

// ========== AI ASSISTANT TYPES ==========

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface FileContext {
  name: string;
  type: FileType;
  url?: string;
}

export interface AIMessageData {
  message: string;
  conversationId?: string;
  fileContexts?: FileContext[];
  currentContent?: string; // Current editor content for context
}

export interface AIResponseData {
  message: string;
  conversationId?: string;
}

// ========== STATE MANAGEMENT TYPES ==========

export interface ContentState {
  // Knowledge Base State
  knowledgeFiles: KnowledgeFile[];
  loadingFiles: boolean;
  uploading: boolean;
  
  // Drafts State
  savedDrafts: SavedDraft[];
  loadingDrafts: boolean;
  saving: boolean;
  
  // Content Suggestions State
  contentSuggestions: ContentSuggestion[];
  loadingSuggestions: boolean;
  
  // AI Assistant State
  chatMessages: ChatMessage[];
  aiLoading: boolean;
  currentConversationId?: string;
  
  // General State
  error?: string;
}

export interface ContentActions {
  // Knowledge Base Actions
  loadKnowledgeFiles: () => Promise<any>;
  uploadFile: (fileData: FileUploadData) => Promise<any>;
  uploadFiles: (files: File[]) => Promise<any>;
  deleteKnowledgeFile: (fileId: string) => Promise<any>;
  addLink: (linkData: LinkData) => Promise<any>;
  
  // Drafts Actions
  loadSavedDrafts: () => Promise<any>;
  saveDraft: (draftData: DraftCreateData) => Promise<any>;
  updateDraft: (draftId: string, updates: DraftUpdateData) => Promise<any>;
  deleteDraft: (draftId: string) => Promise<any>;
  
  // Content Suggestions Actions
  loadContentSuggestions: () => Promise<any>;
  markSuggestionAsUsed: (suggestionId: string) => Promise<any>;
  
  // AI Assistant Actions
  sendMessage: (messageData: { message: string; selectedFiles?: KnowledgeFile[]; currentContent?: string }) => Promise<any>;
  clearConversation: () => void;
  loadConversationMessages: (conversationId: string) => Promise<any>;
  
  // UI Content Order Actions
  createUIContentOrder: (orderData: {
    platform: string;
    length: string;
    tone: string;
    angle: string;
    refs?: string[];
    original_content?: string;
    context?: string;
    topic?: string;
  }) => Promise<any>;
  
  // Utility Actions
  clearError: () => void;
  getFileTypeFromName: (filename: string) => FileType;
  validateFileType: (file: File) => boolean;
  selectKnowledgeFile: (fileId: string, selected: boolean) => void;
  getSelectedFiles: () => KnowledgeFile[];
}

// ========== OPERATION RESULT TYPES ==========

export interface ContentOperationResult<T> {
  data?: T;
  error?: string;
}

// ========== FILTER AND SEARCH TYPES ==========

export type FileFilter = 'all' | 'files' | 'images' | 'audios' | 'videos' | 'links';
export type DraftFilter = 'all' | 'draft' | 'published' | 'archived';

export interface ContentFilters {
  fileFilter: FileFilter;
  draftFilter: DraftFilter;
  searchQuery: string;
}

// ========== FILE VALIDATION TYPES ==========

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export interface FileTypeConfig {
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  maxSizeBytes: number;
}

// ========== CONTENT EDITOR SPECIFIC TYPES ==========

export interface EditorState {
  content: string;
  title: string;
  draftId?: string;
  lastSaved?: Date;
  autoSaveEnabled: boolean;
}

export interface ContentEditorData {
  content?: string;
  title?: string;
  draftId?: string;
  suggestions?: ContentSuggestion;
}

// ========== EXPORT CONVENIENCE TYPES ==========

export type ContentData = {
  knowledgeFiles: KnowledgeFile[];
  savedDrafts: SavedDraft[];
  contentSuggestions: ContentSuggestion[];
};

export type ContentManagement = ContentState & ContentActions; 