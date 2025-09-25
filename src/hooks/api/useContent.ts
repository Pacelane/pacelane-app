// useContent Hook - Content State Management
// This hook provides comprehensive content-related state and operations
// Frontend developers can use this for all content functionality

import { useState, useEffect, useCallback } from 'react';
import { contentApi } from '@/api/content';
import { useAuth } from '@/hooks/api/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type {
  ContentState,
  ContentActions,
  KnowledgeFile,
  SavedDraft,
  ContentSuggestion,
  ChatMessage,
  DraftUpdateData,
  FileFilter,
  DraftFilter
} from '@/types/content';

/**
 * Custom React hook for content operations
 * Provides comprehensive content state management and actions
 * @returns Content state and action functions
 */
export const useContent = (): ContentState & ContentActions => {
  // ========== STATE MANAGEMENT ==========
  
  const { user } = useAuth();
  
  // Knowledge Base State
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Drafts State
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Content Suggestions State
  const [contentSuggestions, setContentSuggestions] = useState<ContentSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // AI Assistant State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
  
  // General State
  const [error, setError] = useState<string | undefined>();

  // ========== HELPER FUNCTIONS ==========

  /**
   * Execute a content operation with loading state management
   * @param operation - The content operation to execute
   * @param loadingState - Which loading state to manage
   * @param successMessage - Optional success message for logging
   * @returns Promise with operation result
   */
  const executeContentOperation = async (
    operation: () => Promise<any>,
    loadingState: 'loadingFiles' | 'uploading' | 'loadingDrafts' | 'saving' | 'loadingSuggestions' | 'aiLoading',
    successMessage?: string
  ) => {
    if (!user) {
      const errorMsg = 'User must be logged in to perform this operation';
      setError(errorMsg);
      return { error: errorMsg };
    }

    // Set appropriate loading state
    switch (loadingState) {
      case 'loadingFiles': setLoadingFiles(true); break;
      case 'uploading': setUploading(true); break;
      case 'loadingDrafts': setLoadingDrafts(true); break;
      case 'saving': setSaving(true); break;
      case 'loadingSuggestions': setLoadingSuggestions(true); break;
      case 'aiLoading': setAiLoading(true); break;
    }
    setError(undefined);

    try {
      const result = await operation();
      
      if (result.error) {
        console.error('Content operation error:', result.error);
        setError(result.error);
        return result;
      }

      if (successMessage) {
        console.log('useContent:', successMessage);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Content operation failed';
      console.error('useContent: Operation failed:', error);
      setError(errorMessage);
      return { error: errorMessage };
    } finally {
      // Reset appropriate loading state
      switch (loadingState) {
        case 'loadingFiles': setLoadingFiles(false); break;
        case 'uploading': setUploading(false); break;
        case 'loadingDrafts': setLoadingDrafts(false); break;
        case 'saving': setSaving(false); break;
        case 'loadingSuggestions': setLoadingSuggestions(false); break;
        case 'aiLoading': setAiLoading(false); break;
      }
    }
  };

  // ========== KNOWLEDGE BASE ACTIONS ==========

  /**
   * Load all knowledge files for the current user
   * @returns Promise with operation result
   */
  const loadKnowledgeFiles = useCallback(async () => {
    return executeContentOperation(
      async () => {
        const result = await contentApi.loadKnowledgeFiles(user!.id);
        
        if (result.data) {
          setKnowledgeFiles(result.data);
        }
        
        return result;
      },
      'loadingFiles',
      'Knowledge files loaded successfully'
    );
  }, [user]);

  /**
   * Upload a single file to knowledge base
   * @param fileData - File upload data containing file and userId
   * @returns Promise with operation result
   */
  const uploadFile = async (fileData: { file: File; userId: string }) => {
    return executeContentOperation(
      async () => {
        const result = await contentApi.uploadFile(fileData.userId, fileData.file);
        
        if (result.data) {
          // Add the new file to the knowledge files list
          setKnowledgeFiles(prev => [result.data!, ...prev]);
        }
        
        return result;
      },
      'uploading',
      'File uploaded successfully'
    );
  };

  /**
   * Upload multiple files to knowledge base
   * @param files - Array of files to upload
   * @returns Promise with operation result
   */
  const uploadFiles = async (files: File[]) => {
    return executeContentOperation(
      async () => {
        console.log('useContent: Starting upload for', files.length, 'files');
        const result = await contentApi.uploadFiles(user!.id, files);
        
        console.log('useContent: Upload result:', result);
        
        if (result.data) {
          console.log('useContent: Adding files to state:', result.data);
          // Add all new files to the knowledge files list
          setKnowledgeFiles(prev => {
            const newState = [...result.data!, ...prev];
            console.log('useContent: New knowledge files state:', newState);
            return newState;
          });
        } else {
          console.error('useContent: No data in upload result');
        }
        
        return result;
      },
      'uploading',
      'Files uploaded successfully'
    );
  };

  /**
   * Delete a knowledge file
   * @param fileId - ID of the file to delete
   * @returns Promise with operation result
   */
  const deleteKnowledgeFile = async (fileId: string) => {
    return executeContentOperation(
      async () => {
        // Find the file to get its name
        const file = knowledgeFiles.find(f => f.id === fileId);
        if (!file) {
          return { error: 'File not found' };
        }

        const result = await contentApi.deleteKnowledgeFile(user!.id, file.name);
        
        if (!result.error) {
          // Remove the file from the local state
          setKnowledgeFiles(prev => prev.filter(f => f.id !== fileId));
        }
        
        return result;
      },
      'loadingFiles',
      'Knowledge file deleted successfully'
    );
  };

  /**
   * Add a link to knowledge base
   * @param linkData - Link data
   * @returns Promise with operation result
   */
  const addLink = async (linkData: { url: string }) => {
    return executeContentOperation(
      async () => {
        const result = await contentApi.addLink(user!.id, linkData.url);
        
        // Reload knowledge files after adding link
        if (!result.error) {
          loadKnowledgeFiles();
        }
        
        return result;
      },
      'uploading',
      'Link added successfully'
    );
  };

  // ========== DRAFTS ACTIONS ==========

  /**
   * Load all saved drafts for the current user
   * @returns Promise with operation result
   */
  const loadSavedDrafts = useCallback(async () => {
    return executeContentOperation(
      async () => {
        const result = await contentApi.loadSavedDrafts(user!.id);
        
        if (result.data) {
          setSavedDrafts(result.data);
        }
        
        return result;
      },
      'loadingDrafts',
      'Saved drafts loaded successfully'
    );
  }, [user]);

  /**
   * Save a new draft
   * @param draftData - Draft creation data
   * @returns Promise with operation result
   */
  const saveDraft = async (draftData: { title: string; content: string; suggestionId?: string }) => {
    return executeContentOperation(
      async () => {
        const result = await contentApi.saveDraft(
          user!.id, 
          draftData.title, 
          draftData.content, 
          draftData.suggestionId
        );
        
        if (result.data) {
          // Add the new draft to the drafts list
          setSavedDrafts(prev => [result.data!, ...prev]);
        }
        
        return result;
      },
      'saving',
      'Draft saved successfully'
    );
  };

  /**
   * Update an existing draft
   * @param draftId - Draft ID to update
   * @param updates - Draft update data
   * @returns Promise with operation result
   */
  const updateDraft = async (draftId: string, updates: DraftUpdateData) => {
    return executeContentOperation(
      async () => {
        const result = await contentApi.updateDraft(user!.id, draftId, updates);
        
        if (result.data) {
          // Update the draft in the local state
          setSavedDrafts(prev => 
            prev.map(draft => 
              draft.id === draftId ? result.data! : draft
            )
          );
        }
        
        return result;
      },
      'saving',
      'Draft updated successfully'
    );
  };

  /**
   * Delete a draft
   * @param draftId - Draft ID to delete
   * @returns Promise with operation result
   */
  const deleteDraft = async (draftId: string) => {
    return executeContentOperation(
      async () => {
        const result = await contentApi.deleteDraft(user!.id, draftId);
        
        if (!result.error) {
          // Remove the draft from the local state
          setSavedDrafts(prev => prev.filter(draft => draft.id !== draftId));
        }
        
        return result;
      },
      'loadingDrafts',
      'Draft deleted successfully'
    );
  };

  // ========== CONTENT SUGGESTIONS ACTIONS ==========

  /**
   * Load active content suggestions for the current user
   * @returns Promise with operation result
   */
  const loadContentSuggestions = useCallback(async () => {
    return executeContentOperation(
      async () => {
        const result = await contentApi.loadContentSuggestions(user!.id);
        
        if (result.data) {
          setContentSuggestions(result.data);
        }
        
        return result;
      },
      'loadingSuggestions',
      'Content suggestions loaded successfully'
    );
  }, [user]);

  /**
   * Mark a content suggestion as used
   * @param suggestionId - Suggestion ID to mark as used
   * @returns Promise with operation result
   */
  const markSuggestionAsUsed = async (suggestionId: string) => {
    return executeContentOperation(
      async () => {
        const result = await contentApi.markSuggestionAsUsed(user!.id, suggestionId);
        
        if (result.data) {
          // Update the suggestion in the local state
          setContentSuggestions(prev => 
            prev.map(suggestion => 
              suggestion.id === suggestionId ? result.data! : suggestion
            )
          );
        }
        
        return result;
      },
      'loadingSuggestions',
      'Content suggestion marked as used'
    );
  };

  // ========== AI ASSISTANT ACTIONS ==========

  /**
   * Send a message to AI assistant
   * @param messageData - AI message data
   * @returns Promise with operation result
   */
  const sendMessage = async (messageData: { message: string; selectedFiles?: KnowledgeFile[]; currentContent?: string }) => {
    return executeContentOperation(
      async () => {
        // Add user message to chat
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: messageData.message,
          timestamp: new Date()
        };
        setChatMessages(prev => [...prev, userMessage]);

        const result = await contentApi.sendAIMessage(
          messageData.message,
          messageData.selectedFiles || [],
          currentConversationId,
          messageData.currentContent
        );
        
        if (result.data) {
          // Update conversation ID if this was the first message
          if (!currentConversationId && result.data.conversationId) {
            setCurrentConversationId(result.data.conversationId);
          }

          // Add assistant message to chat
          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: result.data.message,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, assistantMessage]);
        } else {
          // Remove user message if AI response failed
          setChatMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
        }
        
        return result;
      },
      'aiLoading',
      'AI message sent successfully'
    );
  };

  /**
   * Clear the current conversation
   */
  const clearConversation = () => {
    setChatMessages([]);
    setCurrentConversationId(undefined);
  };

  /**
   * Load messages for a specific conversation
   */
  const loadConversationMessages = async (conversationId: string) => {
    return executeContentOperation(
      async () => {
        setCurrentConversationId(conversationId);
        
        // Load messages for this conversation
        const { data, error } = await supabase
          .from('messages')
          .select('id, role, content, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          throw error;
        }

        // Convert to ChatMessage format
        const messages: ChatMessage[] = (data || []).map(msg => ({
          id: msg.id,
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
          timestamp: new Date(msg.created_at)
        }));

        setChatMessages(messages);
        return { data: messages };
      },
      'aiLoading'
    );
  };

  // ========== UTILITY ACTIONS ==========

  /**
   * Clear any content errors
   */
  const clearError = () => {
    setError(undefined);
  };

  /**
   * Get file type from filename
   * @param filename - Name of the file
   * @returns File type category
   */
  const getFileTypeFromName = (filename: string) => {
    return contentApi.getFileTypeFromName(filename);
  };

  /**
   * Validate file type for upload
   * @param file - File to validate
   * @returns Validation result
   */
  const validateFileType = (file: File) => {
    return contentApi.validateFileType(file);
  };

  /**
   * Select/deselect a knowledge file
   * @param fileId - File ID to select/deselect
   * @param selected - Whether to select or deselect
   */
  const selectKnowledgeFile = (fileId: string, selected: boolean) => {
    setKnowledgeFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, selected } : file
      )
    );
  };

  /**
   * Get all selected knowledge files
   * @returns Array of selected files
   */
  const getSelectedFiles = (): KnowledgeFile[] => {
    return knowledgeFiles.filter(file => file.selected);
  };

  // ========== UI CONTENT ORDER ACTIONS ==========

  const createUIContentOrder = async (orderData: {
    platform: string;
    length: string;
    tone: string;
    angle: string;
    refs?: string[];
    original_content?: string;
    context?: string;
    topic?: string;
  }) => {
    if (!user) {
      setError('User not authenticated');
      return { error: 'User not authenticated' };
    }

    return await executeContentOperation(
      async () => {
        const result = await contentApi.createUIContentOrder(orderData);
        if (result.data) {
          console.log('UI content order created successfully:', result.data);
          // Optionally reload drafts after a delay to show the new content
          setTimeout(() => {
            loadSavedDrafts();
          }, 5000); // Wait 5 seconds for agent pipeline to complete
        }
        return result;
      },
      'aiLoading',
      'Content order created successfully'
    );
  };

  // ========== SIDE EFFECTS ==========

  // Load all content data when user changes or component mounts
  useEffect(() => {
    if (user) {
      // Load all content data in parallel - create inline functions to avoid dependency issues
      Promise.all([
        executeContentOperation(
          async () => {
            const result = await contentApi.loadKnowledgeFiles(user.id);
            if (result.data) {
              setKnowledgeFiles(result.data);
            }
            return result;
          },
          'loadingFiles'
        ),
        executeContentOperation(
          async () => {
            const result = await contentApi.loadSavedDrafts(user.id);
            if (result.data) {
              setSavedDrafts(result.data);
            }
            return result;
          },
          'loadingDrafts'
        ),
        executeContentOperation(
          async () => {
            const result = await contentApi.loadContentSuggestions(user.id);
            if (result.data) {
              setContentSuggestions(result.data);
            }
            return result;
          },
          'loadingSuggestions'
        )
      ]);
    } else {
      // Clear all content when user logs out
      setKnowledgeFiles([]);
      setSavedDrafts([]);
      setContentSuggestions([]);
      setChatMessages([]);
      setCurrentConversationId(undefined);
      setError(undefined);
    }
  }, [user]);

  // ========== RETURN STATE & ACTIONS ==========
  
  return {
    // Knowledge Base State
    knowledgeFiles,
    loadingFiles,
    uploading,
    
    // Drafts State
    savedDrafts,
    loadingDrafts,
    saving,
    
    // Content Suggestions State
    contentSuggestions,
    loadingSuggestions,
    
    // AI Assistant State
    chatMessages,
    aiLoading,
    currentConversationId,
    
    // General State
    error,

    // Knowledge Base Actions
    loadKnowledgeFiles,
    uploadFile,
    uploadFiles,
    deleteKnowledgeFile,
    addLink,
    getFilePreviewUrl: contentApi.getFilePreviewUrl,
    getFileContent: contentApi.getFileContent,
    
    // Drafts Actions
    loadSavedDrafts,
    saveDraft,
    updateDraft,
    deleteDraft,
    
    // Content Suggestions Actions
    loadContentSuggestions,
    markSuggestionAsUsed,
    
    // AI Assistant Actions
    sendMessage,
    clearConversation,
    loadConversationMessages,
    
    // UI Content Order Actions
    createUIContentOrder,
    
    // Utility Actions
    clearError,
    getFileTypeFromName,
    validateFileType,
    selectKnowledgeFile,
    getSelectedFiles
  };
}; 