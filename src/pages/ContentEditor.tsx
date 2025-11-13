import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useContent } from '@/hooks/api/useContent';
import { useTheme } from '@/services/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHelp } from '../services/help-context';
import { useTranslation } from '@/services/i18n-context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/design-system/components/Toast';

// Design System Components
import EditorNav from '@/design-system/components/EditorNav';
import Button from '@/design-system/components/Button';
import ButtonGroup from '@/design-system/components/ButtonGroup';
import SidebarMenuItem from '@/design-system/components/SidebarMenuItem';
import Input from '@/design-system/components/Input';
import TextArea from '@/design-system/components/TextArea';
import LinkedInPostEditor from '@/design-system/components/LinkedInPostEditor';
import Checkbox from '@/design-system/components/Checkbox';
import Modal from '@/design-system/components/Modal';
import SubtleLoadingSpinner from '@/design-system/components/SubtleLoadingSpinner';
import Bichaurinho from '@/design-system/components/Bichaurinho';
import EmptyState from '@/design-system/components/EmptyState';
import FileUpload from '@/design-system/components/FileUpload';

import Tabs from '@/design-system/components/Tabs';
import SelectionToolbar from '@/design-system/components/SelectionToolbar';
import InlinePromptInput from '@/design-system/components/InlinePromptInput';
import InlineDiffView from '@/design-system/components/InlineDiffView';

// Design System Tokens
import { spacing } from '@/design-system/tokens/spacing';
import { stroke } from '@/design-system/tokens/stroke';
import { cornerRadius } from '@/design-system/tokens/corner-radius';
import { textStyles } from '@/design-system/styles/typography/typography-styles';
import { getShadow, shadows } from '@/design-system/tokens/shadows';
import { typography } from '@/design-system/tokens/typography';

// Icons
import { 
  FileText, 
  Folder, 
  FolderOpen,
  DotsThree as MoreHorizontal, 
  Trash as Trash2, 
  Clock,
  Sun,
  Moon,
  Monitor,
  Question as HelpCircle,
  PaperPlaneTilt as Send,
  User,
  FloppyDisk as Save,
  ArrowLeft,
  BookOpen as Book,
  MagnifyingGlass as Search,
  Image,
  File,
  CaretDown as ChevronDown,
  Plus,
  X,
  Copy
} from '@phosphor-icons/react';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  icon?: string;
  children?: FileItem[];
  isOpen?: boolean;
}

const ContentEditor = () => {
  console.log('ContentEditor: Component rendering');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useAuth();
  const { colors, themePreference, setTheme } = useTheme();
  const { openHelp } = useHelp();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  console.log('ContentEditor: Location state:', location.state);
  
  // ========== CLEAN CONTENT STATE MANAGEMENT ==========
  const {
    // Knowledge Base State & Actions
    knowledgeFiles,
    loadingFiles,
    uploading,
    loadManyKnowledgeFiles,
    selectKnowledgeFile,
    getSelectedFiles,
    uploadFiles,
    addLink,
    
    // Drafts State & Actions  
    savedDrafts,
    loadingDrafts,
    saving,
    saveDraft,
    updateDraft,
    
    // AI Assistant State & Actions
    chatMessages,
    aiLoading,
    sendMessage,
    clearConversation,
    loadConversationMessages,
    currentConversationId,
    
    // General
    error,
    clearError
  } = useContent();

  // ========== LOCAL COMPONENT STATE ==========
  const [chatInput, setChatInput] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState(t('contentEditor.newPost'));
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editorContent, setEditorContent] = useState(`# ${t('contentEditor.newPost')}\n\n${t('contentEditor.placeholder')}`);
  const [sidebarSplit, setSidebarSplit] = useState(60); // Percentage for knowledge base section
  const [showConversationDropdown, setShowConversationDropdown] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [aiEditSuggestion, setAiEditSuggestion] = useState<{
    originalContent: string;
    suggestedContent: string;
    explanation: string;
  } | null>(null);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  
  // ========== INLINE EDITING STATE ==========
  const [textSelection, setTextSelection] = useState<{
    text: string;
    range: Range | null;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [showInlinePrompt, setShowInlinePrompt] = useState(false);
  const [inlineEditLoading, setInlineEditLoading] = useState(false);
  const [inlineDiff, setInlineDiff] = useState<{
    originalText: string;
    suggestedText: string;
    startOffset: number;
    endOffset: number;
  } | null>(null);

  // Refs
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  
  // Mobile-specific state
  const [activeMobileTab, setActiveMobileTab] = useState<'editor' | 'knowledge' | 'chat'>('editor');


  const [fileStructure, setFileStructure] = useState<FileItem[]>([
    {
      id: 'knowledge-base',
      name: 'Knowledge Base',
      type: 'folder',
      isOpen: true,
      children: []
    }
  ]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  // Load more files for ContentEditor sidebar (100 most recent files for selection)
  useEffect(() => {
    if (user) {
      // Load up to 100 files for better file selection experience in ContentEditor
      // This gives users access to more recent files without pagination
      loadManyKnowledgeFiles(100);
    }
  }, [user, loadManyKnowledgeFiles]);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      console.log('Loading conversations for user:', user.id);
      setLoadingConversations(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading conversations:', error);
        // Don't show error toast for conversations - they're optional
        setConversations([]);
        return;
      }

      console.log('Loaded conversations:', data);
      setConversations(data || []);
    } catch (error) {
      console.error('Error loading conversations:', error);
      // Don't show error toast for conversations - they're optional
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const formatTitle = (title: string) => {
    if (!title || title.trim() === '') return t('contentEditor.aiAssistant.untitled');
    return title.length > 30 ? `${title.substring(0, 30)}...` : title;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return t('contentEditor.aiAssistant.today');
    } else if (diffInHours < 48) {
      return t('contentEditor.aiAssistant.yesterday');
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleConversationChange = (conversationId: string | null) => {
    console.log('Switching to conversation:', conversationId);
    
    if (conversationId) {
      // Load messages for the selected conversation
      loadConversationMessages(conversationId);
    } else {
      // Clear conversation
      clearConversation();
    }
    
    setShowConversationDropdown(false);
  };

  // Handle content suggestions from Home and draft editing
  useEffect(() => {
    if (location.state?.suggestion) {
      const suggestion = location.state.suggestion;
      setDraftTitle(suggestion.title);
      setEditorContent(suggestion.suggested_outline || `# ${suggestion.title}\n\n${suggestion.description || ''}\n\n`);
      
      // Clear the state to prevent re-applying on navigation
      window.history.replaceState({}, document.title);
      
      // Removed success toast - no need to notify user when loading content
    } else if (location.state?.draftId) {
      // Load existing draft
      const { draftId, title, content } = location.state;
      setDraftId(draftId);
      setDraftTitle(title || 'Untitled');
      setEditorContent(content || '');
      
      // Clear the state to prevent re-applying on navigation
      window.history.replaceState({}, document.title);
      
      // Removed success toast - no need to notify user when loading draft
    } else {
      console.log('ContentEditor: No special state detected, using default content');
    }
  }, [location.state]);

  // Auto-save functionality
  useEffect(() => {
    if (!user || !editorContent.trim()) return;
    
    const autoSaveTimer = setTimeout(() => {
      handleSaveDraft(true); // silent save
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [editorContent, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, aiLoading, aiEditSuggestion]);

  // ========== HELPER FUNCTIONS ==========
  const handleNewConversation = () => {
    clearConversation();
  };

  const handleFileSelection = (fileId: string, selected: boolean) => {
    console.log('ContentEditor: Selecting file', fileId, 'selected:', selected);
    selectKnowledgeFile(fileId, selected);
  };

  // ========== FILE UPLOAD HANDLERS ==========
  
  const handleFileSelect = async (files: File[]) => {
    console.log('ContentEditor: Files selected for upload:', files.length);
    const result = await uploadFiles(files);
    
    if (result.error) {
      toast({
        type: 'error',
        message: result.error,
      });
    } else {
      setShowFileUploadModal(false);
      const message = files.length === 1 
        ? t('contentEditor.messages.filesUploaded')
        : `${files.length} ${t('contentEditor.messages.filesUploadedPlural')}`;
      toast({
        type: 'success',
        message: message,
      });
    }
  };

  const handleUrlSubmit = async (url: string) => {
    console.log('ContentEditor: URL submitted for processing:', url);
    const result = await addLink({ url });
    
    if (result.error) {
      toast({
        type: 'error',
        message: result.error,
      });
    } else {
      setUrlInput('');
      setShowFileUploadModal(false);
      toast({
        type: 'success',
        message: t('contentEditor.messages.linkAdded'),
      });
    }
  };

  const handleUploadModalClose = () => {
    setShowFileUploadModal(false);
    setUrlInput('');
  };

  const handleLoadDraft = async (draft: any) => {
    setDraftId(draft.id);
    setDraftTitle(draft.title);
    setEditorContent(draft.content);
    setLastSaved(new Date(draft.updated_at));
    
    toast.success(t('contentEditor.sidebar.recentPosts.loadedSuccess', { title: draft.title }));
  };

  const handleSaveDraft = async (silent = false) => {
    if (!user || !editorContent.trim()) return;
    
    try {
      let result;
      
      if (draftId) {
        // Update existing draft using clean API
        result = await updateDraft(draftId, {
          title: draftTitle,
          content: editorContent
        });
      } else {
        // Create new draft using clean API
        result = await saveDraft({
          title: draftTitle,
          content: editorContent
        });
        
        // Set the draft ID for future updates
        if (result.data) {
          setDraftId(result.data.id);
        }
      }
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setLastSaved(new Date());
      
      if (!silent) {
        toast.success(t('contentEditor.messages.draftSaved'));
      }
    } catch (error: any) {
      if (!silent) {
        toast.error(error.message || t('contentEditor.messages.draftSaveFailed'));
      }
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || aiLoading) return;

    const messageText = chatInput;
    setChatInput('');

    try {
      // Send message using clean API with selected files and current content
      const selectedFiles = getSelectedFiles();
      console.log('ContentEditor: Sending message with selected files:', selectedFiles.length);
      const result = await sendMessage({
        message: messageText,
        selectedFiles: selectedFiles, // Include selected knowledge base files
        currentContent: editorContent // Pass current editor content for context
      });

      if (result.error) {
        throw new Error(result.error);
      }

      // Check if the AI response contains an edit suggestion
      if (result.data?.message) {
        const editSuggestion = parseAIResponseForEdits(result.data.message);
        if (editSuggestion) {
          setAiEditSuggestion(editSuggestion);
        }
      }
    } catch (error: any) {
      toast.error(error.message || t('contentEditor.aiAssistant.chat.messageFailed'));
    }
  };

  const handleQuickAction = async (action: string) => {
    const actionMessages = {
      'professional': 'Torne este conteúdo mais profissional e focado em negócios para o LinkedIn. Forneça a versão editada.',
      'bullet_points': 'Converta este conteúdo para usar marcadores e torne-o mais escaneável. Forneça a versão editada.',
      'improve_hook': 'Melhore o gancho de abertura para torná-lo mais envolvente e chamativo. Forneça a versão editada.',
      'add_hashtags': 'Sugira hashtags relevantes para este post do LinkedIn. Forneça a versão editada.',
      'shorter': 'Torne este conteúdo mais conciso e direto ao ponto. Forneça a versão editada.',
      'longer': 'Expanda este conteúdo com mais detalhes e exemplos. Forneça a versão editada.',
      'storytelling': 'Adicione elementos de storytelling para tornar isso mais envolvente. Forneça a versão editada.',
      'actionable': 'Torne este conteúdo mais acionável com etapas ou conclusões específicas. Forneça a versão editada.'
    };

    const message = actionMessages[action as keyof typeof actionMessages] || action;
    setChatInput(message);
    setShowQuickActions(false);
  };

  const handleApplyAIEdit = () => {
    if (aiEditSuggestion) {
      setEditorContent(aiEditSuggestion.suggestedContent);
      setAiEditSuggestion(null);
      toast.success(t('contentEditor.aiAssistant.editSuggestion.applied'));
    }
  };

  const handleRejectAIEdit = () => {
    setAiEditSuggestion(null);
    toast.info(t('contentEditor.aiAssistant.editSuggestion.rejected'));
  };



  const parseAIResponseForEdits = (response: string) => {
    // Look for markdown code blocks that might contain edited content
    const codeBlockRegex = /```(?:markdown|md)?\n([\s\S]*?)\n```/g;
    const matches = [...response.matchAll(codeBlockRegex)];
    
    if (matches.length > 0) {
      const suggestedContent = matches[0][1].trim();
      if (suggestedContent !== editorContent) {
        return {
          originalContent: editorContent,
          suggestedContent,
          explanation: response.replace(codeBlockRegex, '').trim()
        };
      }
    }
    
    return null;
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ========== INLINE EDITING HANDLERS ==========
  
  // Handle text selection in editor
  const handleTextSelection = () => {
    const selection = window.getSelection();
    
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setTextSelection(null);
      setShowInlinePrompt(false);
      setInlineDiff(null);
      return;
    }
    
    const selectedText = selection.toString().trim();
    
    if (selectedText.length === 0) {
      setTextSelection(null);
      setShowInlinePrompt(false);
      setInlineDiff(null);
      return;
    }
    
    // Get selection range and calculate offsets in the editor content
    const range = selection.getRangeAt(0);
    
    // Find the start and end offsets in the full content
    // This is a simplified version - you might need more robust offset calculation
    const startOffset = editorContent.indexOf(selectedText);
    const endOffset = startOffset + selectedText.length;
    
    setTextSelection({
      text: selectedText,
      range: range,
      startOffset: startOffset,
      endOffset: endOffset
    });
    
    // Clear any existing prompt or diff
    setShowInlinePrompt(false);
    setInlineDiff(null);
  };

  // Handle "Ask AI" button click
  const handleAskAI = () => {
    if (!textSelection) return;
    setShowInlinePrompt(true);
  };

  // Handle quick action click
  const handleInlineQuickAction = async (actionId: string) => {
    if (!textSelection) return;
    
    const actionInstructions: Record<string, string> = {
      'expand': 'Expanda este texto com mais detalhes e exemplos mantendo o mesmo tom',
      'shorten': 'Torne este texto mais conciso e direto ao ponto mantendo a mensagem principal',
      'continue_writing': 'Continue escrevendo de onde este texto termina, mantendo o mesmo estilo e tom',
      'improve_writing': 'Melhore a qualidade da escrita, clareza e impacto deste texto'
    };
    
    const instruction = actionInstructions[actionId];
    if (instruction) {
      await handleInlineEditSubmit(instruction);
    }
  };

  // Handle canceling inline prompt
  const handleCancelInlinePrompt = () => {
    setShowInlinePrompt(false);
  };

  // Handle inline edit instruction submit
  const handleInlineEditSubmit = async (instruction: string) => {
    if (!textSelection || !user) return;
    
    try {
      setInlineEditLoading(true);
      setShowInlinePrompt(false);
      
      // Get context around the selection (2 lines before and after)
      const lines = editorContent.split('\n');
      const selectionStartLine = editorContent.substring(0, textSelection.startOffset).split('\n').length - 1;
      const selectionEndLine = editorContent.substring(0, textSelection.endOffset).split('\n').length - 1;
      
      const beforeContext = lines.slice(Math.max(0, selectionStartLine - 2), selectionStartLine).join('\n');
      const afterContext = lines.slice(selectionEndLine + 1, Math.min(lines.length, selectionEndLine + 3)).join('\n');
      
      // Call AI assistant with inline edit mode
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({
            message: instruction,
            mode: 'inline-edit',
            selection: {
              text: textSelection.text,
              startOffset: textSelection.startOffset,
              endOffset: textSelection.endOffset,
              beforeContext: beforeContext,
              afterContext: afterContext
            },
            currentContent: editorContent
          })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to get AI suggestion');
      }
      
      const result = await response.json();
      
      console.log('AI Response:', result);
      console.log('AI Message:', result.message);
      
      // Extract suggested text from AI response
      // Look for the edited content in the response
      let suggestedText = result.message;
      
      // Try to extract from markdown code block (more flexible regex)
      const codeBlockMatch = suggestedText.match(/```[\w]*\n?([\s\S]*?)\n?```/);
      if (codeBlockMatch) {
        suggestedText = codeBlockMatch[1].trim();
        console.log('Extracted from code block:', suggestedText);
      } else {
        // If no code block, use the whole response (fallback)
        suggestedText = suggestedText.trim();
        console.log('Using full response (no code block):', suggestedText);
      }
      
      console.log('Setting inline diff:', {
        originalText: textSelection.text,
        suggestedText: suggestedText,
        startOffset: textSelection.startOffset,
        endOffset: textSelection.endOffset
      });
      
      // Show diff view
      setInlineDiff({
        originalText: textSelection.text,
        suggestedText: suggestedText,
        startOffset: textSelection.startOffset,
        endOffset: textSelection.endOffset
      });
      
      // Clear text selection so toolbar doesn't interfere
      window.getSelection()?.removeAllRanges();
      setTextSelection(null);
      
      // Scroll to make diff visible after a brief delay
      setTimeout(() => {
        const diffElement = document.querySelector('[data-inline-diff]');
        if (diffElement) {
          diffElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
      
    } catch (error: any) {
      console.error('Inline edit error:', error);
      toast.error(error.message || t('contentEditor.inlineEdit.failed'));
    } finally {
      setInlineEditLoading(false);
    }
  };

  // Handle accepting inline diff
  const handleAcceptInlineDiff = () => {
    if (!inlineDiff) return;
    
    // Replace the selected text with suggested text
    const before = editorContent.substring(0, inlineDiff.startOffset);
    const after = editorContent.substring(inlineDiff.endOffset);
    const newContent = before + inlineDiff.suggestedText + after;
    
    setEditorContent(newContent);
    
    // Clear selection and diff
    setTextSelection(null);
    setInlineDiff(null);
    
    toast.success(t('contentEditor.inlineEdit.applied'));
  };

  // Handle rejecting inline diff
  const handleRejectInlineDiff = () => {
    setInlineDiff(null);
    setTextSelection(null);
    toast.info(t('contentEditor.inlineEdit.rejected'));
  };

  const toggleFolder = (folderId: string) => {
    setFileStructure(prev => prev.map(item => 
      item.id === folderId ? { ...item, isOpen: !item.isOpen } : item
    ));
  };

  // Handle theme selection
  const handleThemeSelect = (item: any, index: number) => {
    const themes = ['light', 'dark', 'system'];
    const selectedTheme = themes[index];
    setTheme(selectedTheme);
  };

  // Handle title editing
  const handleTitleChange = (newTitle: string) => {
    setDraftTitle(newTitle);
  };

  // Page container styles
  const pageStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: colors.bg.subtle,
  };

  // Main content area styles (below nav) - responsive
  const mainContentStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: (isMobile ? 'column' : 'row') as 'column' | 'row',
    flex: 1,
    overflow: 'hidden',
  };

  // Left sidebar styles - responsive
  const leftSidebarStyles: React.CSSProperties = {
    width: isMobile ? '100%' : '280px',
    backgroundColor: colors.bg.sidebar?.subtle || colors.bg.card.default,
    borderRight: `${stroke.default} solid ${colors.border.default}`,
    borderBottom: isMobile ? `${stroke.default} solid ${colors.border.default}` : 'none',
    display: isMobile ? (activeMobileTab === 'knowledge' ? 'flex' : 'none') : 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flex: isMobile ? 1 : 'none',
  };

  // Sidebar section styles
  const sidebarSectionStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  // Section header styles
  const sectionHeaderStyles = {
    padding: `${spacing.spacing[12]} ${spacing.spacing[16]}`,
    borderBottom: `${stroke.default} solid ${colors.border.default}`,
    backgroundColor: colors.bg.sidebar?.subtle || colors.bg.card.default,
  };

  // Section content styles
  const sectionContentStyles = {
    flex: 1,
    overflow: 'auto',
    padding: `${spacing.spacing[8]} ${spacing.spacing[16]}`, // Increased horizontal padding from 8px to 16px
  };

  // Resizer handle styles
  const resizerStyles: React.CSSProperties = {
    height: '4px',
    backgroundColor: colors.border.default,
    cursor: 'row-resize',
    position: 'relative',
    zIndex: 1,
  };

  // Sidebar bottom actions styles
  const sidebarActionsStyles = {
    padding: spacing.spacing[16],
    borderTop: `${stroke.default} solid ${colors.border.default}`,
    backgroundColor: colors.bg.sidebar?.subtle || colors.bg.card.default,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.spacing[8],
  };

  // Center editor styles - responsive
  const centerEditorStyles: React.CSSProperties = {
    flex: 1,
    display: isMobile ? (activeMobileTab === 'editor' ? 'flex' : 'none') : 'flex',
    flexDirection: 'column',
    backgroundColor: colors.bg.default,
    overflow: 'hidden',
    margin: isMobile ? 0 : spacing.spacing[16],
    borderRadius: isMobile ? 0 : cornerRadius.borderRadius.lg,
  };

  // Editor content styles - responsive
  const editorContentStyles = {
    flex: 1,
    padding: isMobile 
      ? `${spacing.spacing[24]} ${spacing.spacing[16]}`
      : `${spacing.spacing[48]} ${spacing.spacing[80]}`,
    overflow: 'auto',
    maxWidth: isMobile ? 'none' : '1200px',
    margin: '0 auto',
    width: '100%',
  };

  // Right chat sidebar styles - responsive
  const rightSidebarStyles: React.CSSProperties = {
    width: isMobile ? '100%' : '320px',
    backgroundColor: colors.bg.sidebar?.subtle || colors.bg.card.default,
    borderLeft: `${stroke.default} solid ${colors.border.default}`,
    borderTop: isMobile ? `${stroke.default} solid ${colors.border.default}` : 'none',
    display: isMobile ? (activeMobileTab === 'chat' ? 'flex' : 'none') : 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flex: isMobile ? 1 : 'none',
  };

  // Chat header styles
  const chatHeaderStyles = {
    padding: `${spacing.spacing[16]} ${spacing.spacing[20]}`,
    borderBottom: `${stroke.default} solid ${colors.border.default}`,
    backgroundColor: colors.bg.sidebar?.subtle || colors.bg.card.default,
  };

  // Chat messages area styles
  const chatMessagesStyles: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: spacing.spacing[16],
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[12],
  };

  // Chat input area styles
  const chatInputAreaStyles = {
    padding: spacing.spacing[16],
    borderTop: `${stroke.default} solid ${colors.border.default}`,
    backgroundColor: colors.bg.sidebar?.subtle || colors.bg.card.default,
  };

  // Message container styles
  const messageContainerStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing.spacing[8],
    width: '100%',
  };

  // Message label styles
  const messageLabelStyles = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing.spacing[6],
    marginBottom: spacing.spacing[4],
  };

  // User message bubble styles
  const userMessageStyles = {
    width: '100%',
    backgroundColor: colors.bg.card.default,
    border: `${stroke.default} solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    padding: spacing.spacing[12],
    boxShadow: getShadow('regular.card', colors, { withBorder: false }),
  };

  // Bot message bubble styles
  const botMessageStyles = {
    width: '100%',
    backgroundColor: colors.bg.subtle,
    border: `${stroke.default} solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    padding: spacing.spacing[12],
  };

  // Avatar styles
  const avatarStyles = {
    width: '20px',
    height: '20px',
    borderRadius: cornerRadius.borderRadius.full,
    backgroundColor: colors.bg.state?.secondary || colors.bg.subtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    overflow: 'hidden',
  };

  // Theme selector items
  const themeItems = [
    { id: 'light', leadIcon: <Sun />, onClick: handleThemeSelect },
    { id: 'dark', leadIcon: <Moon />, onClick: handleThemeSelect },
    { id: 'system', leadIcon: <Monitor />, onClick: handleThemeSelect },
  ];

  // Render knowledge base item
  const renderKnowledgeItem = (item: any, level = 0) => {
    if (item.type === 'folder') {
      const isExpanded = fileStructure.find(f => f.id === item.id)?.isOpen || false;
      return (
      <div key={item.id}>
          <SidebarMenuItem
            variant="default"
            label={item.name}
            leadIcon={isExpanded ? <FolderOpen /> : <Folder />}
            onClick={() => toggleFolder(item.id)}
            style={{ paddingLeft: `${12 + level * 16}px` }}
          />
          {isExpanded && item.children && (
            <div>
              {item.children.map((child: any) => renderKnowledgeItem(child, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div key={item.id} style={{ position: 'relative', paddingLeft: `${12 + level * 16}px` }}>
          <SidebarMenuItem
            variant="default"
            label={item.name}
            leadIcon={<FileText />}
            onClick={() => console.log('File clicked:', item.name)}
          />
          </div>
      );
    }
  };

  return (
    <div style={pageStyles}>
      {/* Editor Navigation */}
      <EditorNav 
        title={draftTitle}
        onGoBack={() => navigate('/product-home')}
        onTitleChange={handleTitleChange}
        onSaveDraft={handleSaveDraft}
      />
      
      {/* Mobile Tab Navigation */}
      {isMobile && (
        <div style={{
          padding: spacing.spacing[12],
          backgroundColor: colors.bg.card.default,
          borderBottom: `${stroke.default} solid ${colors.border.default}`,
          display: 'flex',
          justifyContent: 'center',
        }}>
          <Tabs
            style="segmented"
            type="fixed"
            tabs={[
              { id: 'editor', label: t('contentEditor.tabs.editor'), leadIcon: <FileText size={16} /> },
              { id: 'knowledge', label: t('contentEditor.tabs.knowledge'), leadIcon: <Book size={16} /> },
              { id: 'chat', label: t('contentEditor.tabs.chat'), leadIcon: <User size={16} /> },
            ]}
            activeTab={activeMobileTab}
            onTabChange={(tabId) => setActiveMobileTab(tabId as 'editor' | 'knowledge' | 'chat')}
          />
        </div>
      )}
      
      {/* Main Content Area */}
      <div style={mainContentStyles}>
        {/* Left Sidebar - Knowledge Base & Content History */}
        <div style={leftSidebarStyles}>
          {/* Knowledge Base Section */}
          <div style={{ 
            ...sidebarSectionStyles, 
            height: `${sidebarSplit}%` 
          }}>
            <div style={sectionHeaderStyles}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <h3 style={{ 
                  ...textStyles.sm.semibold, 
                  color: colors.text.default,
                  margin: 0 
                }}>
                  {t('contentEditor.sidebar.knowledgeBase.title')}
                </h3>
                <Button
                  size="2xs"
                  style="soft"
                  leadIcon={<Plus size={12} />}
                  onClick={() => setShowFileUploadModal(true)}
                  disabled={uploading}
                />
              </div>
            </div>
            <div style={sectionContentStyles}>
              {/* File Tree */}
              {renderFileTree(fileStructure)}
              
            {/* Show knowledge base files */}
            {fileStructure.find(item => item.id === 'knowledge-base')?.isOpen && (
                <div style={{ marginTop: spacing.spacing[16] }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    marginBottom: spacing.spacing[8]
                  }}>
                    <h4 style={{ 
                      ...textStyles.xs.semibold, 
                      color: colors.text.default,
                      margin: 0 
                    }}>
                      {t('contentEditor.sidebar.knowledgeBase.knowledgeFiles')}
                    </h4>
                    <span style={{ 
                      ...textStyles.xs.normal, 
                      color: colors.text.muted 
                    }}>
                    {getSelectedFiles().length} {getSelectedFiles().length === 1 ? t('contentEditor.sidebar.knowledgeBase.selected') : t('contentEditor.sidebar.knowledgeBase.selectedPlural')}
                  </span>
                </div>
                {loadingFiles ? (
                    <div style={{ padding: spacing.spacing[16] }}>
                      <SubtleLoadingSpinner 
                        title={t('contentEditor.sidebar.knowledgeBase.loading')}
                        size={16}
                      />
                  </div>
                ) : (() => {
                  if (knowledgeFiles.length === 0) {
                    return (
                      <p style={{ 
                        ...textStyles.xs.normal, 
                        color: colors.text.muted,
                        textAlign: 'center',
                        padding: spacing.spacing[8]
                      }}>
                        {t('contentEditor.sidebar.knowledgeBase.noFiles')}
                      </p>
                    );
                  }
                  
                  return knowledgeFiles.map(file => {
                    const Icon = file.type === 'image' ? Image : 
                                file.type === 'file' ? FileText : File;
                    return (
                        <div key={file.id} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: spacing.spacing[8],
                          padding: spacing.spacing[4],
                          borderRadius: cornerRadius.borderRadius.sm,
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease-in-out',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = colors.bg.state?.ghostHover || colors.bg.subtle;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        onClick={() => handleFileSelection(file.id, !file.selected)}
                        >
                          <div onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={file.selected || false}
                              onChange={(e) => handleFileSelection(file.id, e.target.checked)}
                            />
                          </div>
                          <Icon style={{ 
                            width: '12px', 
                            height: '12px', 
                            color: colors.icon.muted 
                          }} />
                          <span style={{ 
                            ...textStyles.xs.normal, 
                            color: colors.text.default,
                            flex: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                          {file.name}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>

          {/* Resizer Handle */}
          <div style={resizerStyles} />
          
          {/* Content History Section */}
          <div style={{ 
            ...sidebarSectionStyles, 
            height: `${100 - sidebarSplit}%` 
          }}>
            <div style={sectionHeaderStyles}>
              <h3 style={{ 
                ...textStyles.sm.semibold, 
                color: colors.text.default,
                margin: 0 
              }}>
              {t('contentEditor.sidebar.recentPosts.title')}
              </h3>
            </div>
                         <div style={sectionContentStyles}>
             {loadingDrafts ? (
                 <div style={{ padding: spacing.spacing[16] }}>
                   <SubtleLoadingSpinner 
                     title={t('contentEditor.sidebar.recentPosts.loading')}
                     size={16}
                   />
               </div>
             ) : savedDrafts.length === 0 ? (
                 <p style={{ 
                   ...textStyles.xs.normal, 
                   color: colors.text.muted,
                   textAlign: 'center',
                   padding: spacing.spacing[8]
                 }}>
                 {t('contentEditor.sidebar.recentPosts.noDrafts')}
               </p>
             ) : (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[4] }}>
                 {savedDrafts.slice(0, 5).map(draft => (
                     <div
                     key={draft.id}
                     onClick={() => handleLoadDraft(draft)}
                       style={{
                         padding: spacing.spacing[8],
                         borderRadius: cornerRadius.borderRadius.sm,
                         cursor: 'pointer',
                         transition: 'all 0.15s ease-in-out',
                         backgroundColor: colors.bg.default,
                         border: `1px solid ${colors.border.default}`,
                         boxShadow: draftId === draft.id ? shadows.regular.card : 'none',
                       }}
                       onMouseEnter={(e) => {
                         if (draftId !== draft.id) {
                           e.currentTarget.style.backgroundColor = colors.bg.state?.ghostHover || colors.bg.subtle;
                         }
                       }}
                       onMouseLeave={(e) => {
                         if (draftId !== draft.id) {
                           e.currentTarget.style.backgroundColor = colors.bg.default;
                         }
                       }}
                     >
                       <div style={{ 
                         ...textStyles.xs.semibold, 
                         color: colors.text.default,
                         overflow: 'hidden',
                         textOverflow: 'ellipsis',
                         whiteSpace: 'nowrap'
                       }}>
                       {draft.title || t('contentEditor.sidebar.recentPosts.untitled')}
                     </div>
                       <div style={{ 
                         ...textStyles.xs.normal, 
                         color: colors.text.muted,
                         marginTop: spacing.spacing[2]
                       }}>
                       {new Date(draft.updated_at).toLocaleDateString()}
                       </div>
                     </div>
                 ))}
               </div>
             )}
              <div style={{ marginTop: spacing.spacing[8] }}>
                <Button
                  label={t('contentEditor.sidebar.recentPosts.viewAll')}
                  style="dashed"
                  size="xs"
                  onClick={() => navigate('/posts')}
                />
              </div>
            </div>
          </div>
          
          {/* Sidebar Actions */}
          <div style={sidebarActionsStyles}>
            <ButtonGroup
              type="iconOnly"
              size="xs"
              items={themeItems}
            />
            <Button
              label={t('contentEditor.sidebar.actions.help')}
              style="dashed"
              size="xs"
              leadIcon={<HelpCircle size={12} />}
              onClick={() => openHelp({
                section: 'Content Editor',
                action: 'Clicked help button from content editor'
              })}
            />
        </div>
      </div>

        {/* Center Content Editor */}
        <div style={centerEditorStyles}>
          <div 
            ref={editorContainerRef}
            style={editorContentStyles}
            onMouseUp={(e) => {
              // Don't handle selection if clicking inside the inline prompt
              const target = e.target as HTMLElement;
              if (target.closest('[data-inline-prompt]')) {
                return;
              }
              handleTextSelection();
            }}
          >
            {/* LinkedIn-style Post Editor */}
            <LinkedInPostEditor
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              placeholder={t('contentEditor.editorPlaceholder')}
              user={user}
              profile={profile}
            />
            
            {/* Selection Toolbar - shows when text is selected */}
            {textSelection && !showInlinePrompt && !inlineDiff && (
              <SelectionToolbar
                selection={textSelection}
                onQuickAction={handleInlineQuickAction}
                onAskAI={handleAskAI}
                disabled={inlineEditLoading}
              />
            )}
            
            {/* Inline Prompt Input - shows when "Ask AI" is clicked */}
            {showInlinePrompt && textSelection && (
              <InlinePromptInput
                selection={textSelection}
                onSubmit={handleInlineEditSubmit}
                onCancel={handleCancelInlinePrompt}
                loading={inlineEditLoading}
              />
            )}
          </div>
          
          {/* Inline Diff View - positioned outside editor for better visibility */}
          {inlineDiff && (
            <div style={{
              padding: `0 ${isMobile ? spacing.spacing[16] : spacing.spacing[80]}`,
              maxWidth: isMobile ? 'none' : '1200px',
              margin: '0 auto',
              width: '100%',
            }}>
              <InlineDiffView
                originalText={inlineDiff.originalText}
                suggestedText={inlineDiff.suggestedText}
                onAccept={handleAcceptInlineDiff}
                onReject={handleRejectInlineDiff}
                loading={inlineEditLoading}
              />
            </div>
          )}
      </div>

        {/* Right Sidebar - Chat Bot */}
        <div style={rightSidebarStyles}>
        {/* Chat Header */}
          <div style={chatHeaderStyles}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: spacing.spacing[8]
            }}>
              <h3 style={{ 
                ...textStyles.sm.semibold, 
                color: colors.text.default,
                margin: 0 
              }}>
                {t('contentEditor.aiAssistant.title')}
              </h3>
              <div style={{ position: 'relative' }}>
                <Button
                  label={currentConversationId 
                    ? formatTitle(conversations.find(c => c.id === currentConversationId)?.title || t('contentEditor.aiAssistant.currentChat'))
                    : t('contentEditor.aiAssistant.newConversation')
                  }
                  style="secondary"
                  size="xs"
                  leadIcon={<Clock size={12} />}
                  tailIcon={<ChevronDown size={12} />}
                  onClick={() => setShowConversationDropdown(!showConversationDropdown)}
                />
                
                {showConversationDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: spacing.spacing[4],
                    backgroundColor: colors.bg.card.default,
                    border: `1px solid ${colors.border.default}`,
                    borderRadius: cornerRadius.borderRadius.lg,
                    boxShadow: getShadow('regular.card', colors, { withBorder: true }),
                    minWidth: '200px',
                    zIndex: 10,
                    overflow: 'hidden',
                  }}>
                    {/* New Conversation Option */}
                    <div
                      style={{
                        padding: spacing.spacing[12],
                        borderBottom: `1px solid ${colors.border.default}`,
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease-in-out',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = colors.bg.state?.ghostHover || colors.bg.subtle;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      onClick={() => {
                        handleNewConversation();
                        setShowConversationDropdown(false);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: spacing.spacing[8] }}>
                        <Plus size={14} style={{ color: colors.icon.highlight }} />
                        <span style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                          {t('contentEditor.aiAssistant.newConversation')}
                        </span>
                      </div>
                    </div>

                    {/* Recent Conversations */}
                    {conversations.length > 0 && (
                      <>
                        <div style={{
                          padding: `${spacing.spacing[8]} ${spacing.spacing[12]}`,
                          backgroundColor: colors.bg.subtle,
                          borderBottom: `1px solid ${colors.border.default}`,
                        }}>
                          <span style={{ ...textStyles.xs.semibold, color: colors.text.muted }}>
                            {t('contentEditor.aiAssistant.recentConversations')}
                          </span>
                        </div>
                        {conversations.map((conversation) => (
                          <div
                            key={conversation.id}
                            style={{
                              padding: spacing.spacing[12],
                              cursor: 'pointer',
                              transition: 'background-color 0.15s ease-in-out',
                              borderBottom: `1px solid ${colors.border.default}`,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = colors.bg.state?.ghostHover || colors.bg.subtle;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            onClick={() => handleConversationChange(conversation.id)}
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[2] }}>
                              <span style={{ ...textStyles.sm.medium, color: colors.text.default }}>
                                {formatTitle(conversation.title)}
                              </span>
                              <span style={{ ...textStyles.xs.normal, color: colors.text.muted }}>
                                {formatDate(conversation.updated_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {loadingConversations && (
                      <div style={{
                        padding: spacing.spacing[12],
                      }}>
                        <SubtleLoadingSpinner 
                          title={t('contentEditor.aiAssistant.loadingConversations')}
                          size={16}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          {getSelectedFiles().length > 0 && (
              <div style={{ 
                padding: spacing.spacing[8],
                backgroundColor: colors.bg.state?.secondary || colors.bg.subtle,
                borderRadius: cornerRadius.borderRadius.sm,
              }}>
                <p style={{ 
                  ...textStyles.xs.normal, 
                  color: colors.text.default,
                  margin: 0 
                }}>
                {getSelectedFiles().length === 1 
                  ? t('contentEditor.aiAssistant.filesSelected', { count: getSelectedFiles().length })
                  : t('contentEditor.aiAssistant.filesSelectedPlural', { count: getSelectedFiles().length })
                }
              </p>
            </div>
          )}
        </div>

        {/* Chat Messages */}
          <div style={chatMessagesStyles}>
          {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: colors.text.muted, marginTop: spacing.spacing[32] }}>
                <p style={{ ...textStyles.sm.medium, margin: 0, marginBottom: spacing.spacing[8] }}>
                  {t('contentEditor.aiAssistant.chat.welcome')}
                </p>
                <p style={{ ...textStyles.xs.normal, margin: 0 }}>
                  {t('contentEditor.aiAssistant.chat.welcomeSubtitle')}
                </p>
            </div>
          ) : (
            chatMessages.map((message, index) => (
                <div key={message.id} style={messageContainerStyles}>
                  {/* Message Label */}
                  <div style={messageLabelStyles}>
                    <div style={avatarStyles}>
                      {message.role === 'user' ? (
                        <User size={12} style={{ color: colors.icon.muted }} />
                      ) : (
                        <Bichaurinho variant={12} size={20} />
                      )}
                    </div>
                    <span style={{ 
                      ...textStyles.xs.semibold, 
                      color: colors.text.default 
                    }}>
                      {message.role === 'user' ? t('contentEditor.aiAssistant.chat.you') : t('contentEditor.aiAssistant.chat.assistant')}
                    </span>
                  </div>

                  {/* Message Content */}
                  <div style={message.role === 'user' ? userMessageStyles : botMessageStyles}>
                    <div style={{
                      ...textStyles.sm.normal,
                      color: colors.text.default,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {message.role === 'assistant' && message.id === chatMessages[chatMessages.length - 1]?.id && aiEditSuggestion
                        ? message.content.replace(/```(?:markdown|md)?\n[\s\S]*?\n```/g, '').trim()
                        : message.content
                      }
                    </div>
                  </div>

                  {/* Show edit suggestion if this is the latest assistant message with a suggestion */}
                  {message.role === 'assistant' && 
                   index === chatMessages.length - 1 && 
                   aiEditSuggestion && (
                    <div style={{
                      backgroundColor: colors.bg.card.default,
                      border: `${stroke.default} solid ${colors.border.default}`,
                      borderRadius: cornerRadius.borderRadius.lg,
                      overflow: 'hidden',
                      marginTop: spacing.spacing[8],
                      boxShadow: getShadow('regular.card', colors, { withBorder: false }),
                    }}>
                      {/* Suggestion Header */}
                      <div style={{
                        padding: spacing.spacing[12],
                        borderBottom: `${stroke.default} solid ${colors.border.default}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: spacing.spacing[8],
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: cornerRadius.borderRadius.full,
                          backgroundColor: colors.bg.state?.secondary || colors.bg.subtle,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <User size={16} style={{ color: colors.icon.muted }} />
                        </div>
                        <div>
                          <div style={{ 
                            ...textStyles.sm.semibold, 
                            color: colors.text.default 
                          }}>
                            {profile?.display_name || profile?.linkedin_name || 'You'}
                          </div>
                          {profile?.linkedin_headline && (
                            <div style={{ 
                              ...textStyles.xs.normal, 
                              color: colors.text.subtle 
                            }}>
                              {profile.linkedin_headline}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Suggestion Content Sections */}
                      <div style={{ padding: spacing.spacing[16] }}>
                        {/* Hook Section */}
                        <div style={{ marginBottom: spacing.spacing[16] }}>
                          <div style={{
                            ...textStyles.xs.semibold,
                            color: colors.text.muted,
                            marginBottom: spacing.spacing[6],
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}>
                            {t('contentEditor.aiAssistant.editSuggestion.hook')}
                          </div>
                          <div style={{
                            ...textStyles.sm.normal,
                            color: colors.text.default,
                            lineHeight: '1.6',
                          }}>
                            {aiEditSuggestion.suggestedContent.split('\n\n')[0]}
                          </div>
                        </div>

                        {/* Body Text Section */}
                        {aiEditSuggestion.suggestedContent.split('\n\n').length > 1 && (
                          <div>
                            <div style={{
                              ...textStyles.xs.semibold,
                              color: colors.text.muted,
                              marginBottom: spacing.spacing[6],
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                            }}>
                              {t('contentEditor.aiAssistant.editSuggestion.bodyText')}
                            </div>
                            <div style={{
                              ...textStyles.sm.normal,
                              color: colors.text.default,
                              lineHeight: '1.6',
                              whiteSpace: 'pre-wrap',
                            }}>
                              {aiEditSuggestion.suggestedContent.split('\n\n').slice(1).join('\n\n')}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div style={{
                        padding: spacing.spacing[12],
                        borderTop: `${stroke.default} solid ${colors.border.default}`,
                        display: 'flex',
                        gap: spacing.spacing[8],
                        justifyContent: 'flex-end',
                      }}>
                        <Button
                          label={t('contentEditor.aiAssistant.editSuggestion.reject')}
                          style="secondary"
                          size="xs"
                          onClick={handleRejectAIEdit}
                        />
                        <Button
                          label={t('contentEditor.aiAssistant.editSuggestion.apply')}
                          style="primary"
                          size="xs"
                          onClick={handleApplyAIEdit}
                        />
                      </div>
                    </div>
                  )}
              </div>
            ))
          )}
          {aiLoading && (
              <div style={messageContainerStyles}>
                <div style={messageLabelStyles}>
                  <div style={avatarStyles}>
                    <Bichaurinho variant={12} size={20} />
                  </div>
                  <span style={{ 
                    ...textStyles.xs.semibold, 
                    color: colors.text.default 
                  }}>
                    {t('contentEditor.aiAssistant.chat.assistant')}
                  </span>
                </div>
                <div style={botMessageStyles}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.spacing[4],
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: colors.icon.muted,
                      borderRadius: '50%',
                      animation: 'bounce 1s infinite',
                    }} />
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: colors.icon.muted,
                      borderRadius: '50%',
                      animation: 'bounce 1s infinite',
                      animationDelay: '0.1s',
                    }} />
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: colors.icon.muted,
                      borderRadius: '50%',
                      animation: 'bounce 1s infinite',
                      animationDelay: '0.2s',
                    }} />
                  </div>
                </div>
              </div>
          )}
          {/* Scroll anchor - keeps chat scrolled to bottom */}
          <div ref={chatMessagesEndRef} />
        </div>



        {/* Quick Actions */}
        <div style={{
          padding: spacing.spacing[12],
          borderTop: `1px solid ${colors.border.default}`,
          backgroundColor: colors.bg.subtle,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: spacing.spacing[8],
          }}>
            <span style={{ ...textStyles.xs.semibold, color: colors.text.muted }}>
              {t('contentEditor.aiAssistant.quickActions.title')}
            </span>
            <Button
              label=""
              style="secondary"
              size="xs"
              leadIcon={showQuickActions ? <ChevronDown size={12} /> : <ChevronDown size={12} style={{ transform: 'rotate(180deg)' }} />}
              onClick={() => setShowQuickActions(!showQuickActions)}
            />
          </div>
          
          {showQuickActions && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: spacing.spacing[6],
            }}>
              <Button
                label={t('contentEditor.aiAssistant.quickActions.professional')}
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('professional')}
                disabled={aiLoading}
              />
              <Button
                label={t('contentEditor.aiAssistant.quickActions.bulletPoints')}
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('bullet_points')}
                disabled={aiLoading}
              />
              <Button
                label={t('contentEditor.aiAssistant.quickActions.betterHook')}
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('improve_hook')}
                disabled={aiLoading}
              />
              <Button
                label={t('contentEditor.aiAssistant.quickActions.addHashtags')}
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('add_hashtags')}
                disabled={aiLoading}
              />
              <Button
                label={t('contentEditor.aiAssistant.quickActions.makeShorter')}
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('shorter')}
                disabled={aiLoading}
              />
              <Button
                label={t('contentEditor.aiAssistant.quickActions.makeLonger')}
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('longer')}
                disabled={aiLoading}
              />
              <Button
                label={t('contentEditor.aiAssistant.quickActions.addStory')}
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('storytelling')}
                disabled={aiLoading}
              />
              <Button
                label={t('contentEditor.aiAssistant.quickActions.makeActionable')}
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('actionable')}
                disabled={aiLoading}
              />
            </div>
          )}
        </div>

        {/* Chat Input */}
          <div style={chatInputAreaStyles}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.spacing[8] }}>
              <TextArea
                placeholder={t('contentEditor.aiAssistant.chat.placeholder')}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyPress}
                rows={3}
                disabled={aiLoading}
              />
              <Button
                label={t('contentEditor.aiAssistant.chat.sendMessage')}
                style="primary"
                size="sm"
                leadIcon={<Send size={16} />}
                onClick={handleSendMessage}
                disabled={aiLoading || !chatInput.trim()}
              />
            </div>
          </div>
        </div>
      </div>

        {/* File Upload Modal */}
        {showFileUploadModal && (
          <Modal
            isOpen={showFileUploadModal}
            onClose={handleUploadModalClose}
            title={t('contentEditor.uploadModal.title')}
            size="md"
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: spacing.spacing[24],
            }}>
              <FileUpload
                onFileSelect={handleFileSelect}
                onUrlSubmit={handleUrlSubmit}
                urlValue={urlInput}
                onUrlChange={setUrlInput}
                uploading={uploading}
                disabled={uploading}
                maxFiles={10}
                maxTotalSize={100 * 1024 * 1024} // 100MB
              />
            </div>
          </Modal>
        )}

        
    </div>
  );

  // Helper function to render file tree
  function renderFileTree(items: FileItem[], depth = 0) {
    return items.map(item => (
      <div key={item.id}>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.spacing[8],
            padding: spacing.spacing[4],
            paddingLeft: `${depth * 12 + 8}px`,
            borderRadius: cornerRadius.borderRadius.sm,
            cursor: 'pointer',
            transition: 'background-color 0.15s ease-in-out',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.bg.state?.ghostHover || colors.bg.subtle;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={() => item.type === 'folder' ? toggleFolder(item.id) : null}
        >
          {item.type === 'folder' ? (
            item.isOpen ? 
              <FolderOpen style={{ width: '16px', height: '16px', color: colors.icon.highlight }} /> : 
              <Folder style={{ width: '16px', height: '16px', color: colors.icon.highlight }} />
          ) : (
            <FileText style={{ width: '16px', height: '16px', color: colors.icon.muted }} />
          )}
          <span style={{ 
            ...textStyles.sm.normal, 
            color: colors.text.default,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {item.name}
          </span>
        </div>
        {item.type === 'folder' && item.isOpen && item.children && (
          <div>
            {renderFileTree(item.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  }
};

export default ContentEditor;