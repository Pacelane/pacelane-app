import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/api/useAuth';
import { useContent } from '@/hooks/api/useContent';
import { useTheme } from '@/services/theme-context';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHelp } from '../services/help-context';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/design-system/components/Toast';
import TranscriptService from '@/services/transcriptService';

// Design System Components
import EditorNav from '@/design-system/components/EditorNav';
import Button from '@/design-system/components/Button';
import ButtonGroup from '@/design-system/components/ButtonGroup';
import SidebarMenuItem from '@/design-system/components/SidebarMenuItem';
import Input from '@/design-system/components/Input';
import TextArea from '@/design-system/components/TextArea';
import Checkbox from '@/design-system/components/Checkbox';
import Modal from '@/design-system/components/Modal';
import LoadingSpinner from '@/design-system/components/LoadingSpinner';
import Bichaurinho from '@/design-system/components/Bichaurinho';
import EmptyState from '@/design-system/components/EmptyState';
import TranscriptPasteModal from '@/design-system/components/TranscriptPasteModal';

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
  MoreHorizontal, 
  Trash2, 
  Clock,
  Sun,
  Moon,
  Monitor,
  HelpCircle,
  Send,
  User,
  Save,
  ArrowLeft,
  Book,
  Search,
  Image,
  File,
  ChevronDown,
  Plus,
  X,
  Copy
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  icon?: string;
  children?: FileItem[];
  isOpen?: boolean;
}

const ContentEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { colors, themePreference, setTheme } = useTheme();
  const { openHelp } = useHelp();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // ========== CLEAN CONTENT STATE MANAGEMENT ==========
  const {
    // Knowledge Base State & Actions
    knowledgeFiles,
    loadingFiles,
    selectKnowledgeFile,
    getSelectedFiles,
    
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
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('New Post');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editorContent, setEditorContent] = useState('# New Post\n\nStart writing your content here...');
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [processingTranscript, setProcessingTranscript] = useState(false);
  
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
    if (!title || title.trim() === '') return 'Untitled Conversation';
    return title.length > 30 ? `${title.substring(0, 30)}...` : title;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
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

  // Handle content suggestions from ProductHome and draft editing
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

  // ========== HELPER FUNCTIONS ==========
  const handleNewConversation = () => {
    clearConversation();
  };

  const handleFileSelection = (fileId: string, selected: boolean) => {
    selectKnowledgeFile(fileId, selected);
  };

  const handleLoadDraft = async (draft: any) => {
    setDraftId(draft.id);
    setDraftTitle(draft.title);
    setEditorContent(draft.content);
    setLastSaved(new Date(draft.updated_at));
    
    toast.success(`"${draft.title}" has been loaded for editing.`);
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
        toast.success('Draft saved successfully');
      }
    } catch (error: any) {
      if (!silent) {
        toast.error(error.message || 'Failed to save draft');
      }
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || aiLoading) return;

    const messageText = chatInput;
    setChatInput('');

    try {
      // Send message using clean API with selected files and current content
      const result = await sendMessage({
        message: messageText,
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
          setShowEditModal(true);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    }
  };

  const handleQuickAction = async (action: string) => {
    const actionMessages = {
      'professional': 'Make this content more professional and business-focused for LinkedIn. Provide the edited version.',
      'bullet_points': 'Convert this content to use bullet points and make it more scannable. Provide the edited version.',
      'improve_hook': 'Improve the opening hook to make it more engaging and attention-grabbing. Provide the edited version.',
      'add_hashtags': 'Suggest relevant hashtags for this LinkedIn post. Provide the edited version.',
      'shorter': 'Make this content more concise and to the point. Provide the edited version.',
      'longer': 'Expand this content with more details and examples. Provide the edited version.',
      'storytelling': 'Add storytelling elements to make this more engaging. Provide the edited version.',
      'actionable': 'Make this content more actionable with specific steps or takeaways. Provide the edited version.'
    };

    const message = actionMessages[action as keyof typeof actionMessages] || action;
    setChatInput(message);
    setShowQuickActions(false);
  };

  const handleApplyAIEdit = () => {
    if (aiEditSuggestion) {
      setEditorContent(aiEditSuggestion.suggestedContent);
      setAiEditSuggestion(null);
      setShowEditModal(false);
      toast.success('AI edit applied successfully!');
    }
  };

  const handleRejectAIEdit = () => {
    setAiEditSuggestion(null);
    setShowEditModal(false);
    toast.info('AI edit rejected');
  };

  // Transcript handling functions
  const handleTranscriptPaste = () => {
    setShowTranscriptModal(true);
  };

  const handleTranscriptSubmit = async (transcriptData: { title: string; transcript: string; source: string }) => {
    try {
      setProcessingTranscript(true);

      // Validate the transcript
      const validation = TranscriptService.validateTranscript(transcriptData.transcript);
      if (!validation.isValid) {
        toast.error(validation.errors[0] || 'Invalid transcript format');
        return;
      }

      // Parse the transcript
      const parsedTranscript = TranscriptService.parseTranscript(transcriptData.transcript);
      
      // Generate content prompt
      const contentPrompt = TranscriptService.generateContentPrompt(parsedTranscript, transcriptData.title);
      
      // Set the editor content with the processed transcript
      const formattedContent = `# ${transcriptData.title}

Based on meeting transcript with ${parsedTranscript.participants.join(', ')}

## Key Discussion Points

${parsedTranscript.cleanedText.substring(0, 2000)}${parsedTranscript.cleanedText.length > 2000 ? '...' : ''}

## Content Ideas

${contentPrompt}

---

**Meeting Details:**
- Participants: ${parsedTranscript.participants.join(', ')}
- Duration: ~${Math.floor(parsedTranscript.metadata.estimatedDuration / 60)} minutes  
- Word Count: ${parsedTranscript.metadata.wordCount.toLocaleString()} words
- Key Topics: ${TranscriptService.extractKeyTopics(parsedTranscript).join(', ')}`;

      setDraftTitle(transcriptData.title);
      setEditorContent(formattedContent);
      setShowTranscriptModal(false);

      // Optionally save the transcript to knowledge base
      if (user) {
        try {
          const formattedForKB = TranscriptService.formatForKnowledgeBase(transcriptData, parsedTranscript);
          
          // This would need to be implemented - saving to knowledge base
          // For now, we'll just show success message
          toast.success(`Meeting transcript "${transcriptData.title}" loaded successfully! You can now create content from this meeting.`);
        } catch (kbError) {
          console.error('Error saving to knowledge base:', kbError);
          toast.success(`Meeting transcript loaded successfully!`);
        }
      }

    } catch (error: any) {
      console.error('Error processing transcript:', error);
      toast.error(error.message || 'Failed to process meeting transcript');
    } finally {
      setProcessingTranscript(false);
    }
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
    backgroundColor: colors.bg.default,
  };

  // Main content area styles (below nav) - responsive
  const mainContentStyles = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    flex: 1,
    overflow: 'hidden',
  };

  // Left sidebar styles - responsive
  const leftSidebarStyles: React.CSSProperties = {
    width: isMobile ? '100%' : '280px',
    backgroundColor: colors.bg.sidebar?.subtle || colors.bg.card.default,
    borderRight: isMobile ? 'none' : `${stroke.default} solid ${colors.border.default}`,
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
    borderLeft: isMobile ? 'none' : `${stroke.default} solid ${colors.border.default}`,
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

  // User message bubble styles
  const userMessageStyles = {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    backgroundColor: colors.bg.subtle,
    border: `${stroke.default} solid ${colors.border.default}`,
    borderRadius: cornerRadius.borderRadius.lg,
    padding: spacing.spacing[12],
    display: 'flex',
    gap: spacing.spacing[8],
    alignItems: 'flex-start',
  };

  // Bot message bubble styles
  const botMessageStyles = {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    backgroundColor: 'transparent',
    borderRadius: cornerRadius.borderRadius.lg,
    padding: spacing.spacing[12],
    display: 'flex',
    gap: spacing.spacing[8],
    alignItems: 'flex-start',
  };

  // Avatar styles
  const avatarStyles = {
    width: '24px',
    height: '24px',
    borderRadius: cornerRadius.borderRadius.sm,
    backgroundColor: colors.bg.state?.secondary || colors.bg.subtle,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
          display: 'flex',
          backgroundColor: colors.bg.card.default,
          borderBottom: `${stroke.default} solid ${colors.border.default}`,
        }}>
          {[
            { id: 'editor', label: 'Editor', icon: <FileText size={16} /> },
            { id: 'knowledge', label: 'Knowledge', icon: <Book size={16} /> },
            { id: 'chat', label: 'AI Chat', icon: <User size={16} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMobileTab(tab.id as 'editor' | 'knowledge' | 'chat')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: spacing.spacing[8],
                padding: spacing.spacing[16],
                border: 'none',
                backgroundColor: activeMobileTab === tab.id ? colors.bg.default : 'transparent',
                color: activeMobileTab === tab.id ? colors.text.default : colors.text.muted,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderBottom: activeMobileTab === tab.id ? `2px solid ${colors.border.highlight}` : '2px solid transparent',
              }}
            >
              {tab.icon}
              <span style={{
                ...textStyles.sm.medium,
                color: activeMobileTab === tab.id ? colors.text.default : colors.text.muted,
              }}>
                {tab.label}
              </span>
            </button>
          ))}
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
              <h3 style={{ 
                ...textStyles.sm.semibold, 
                color: colors.text.default,
                margin: 0 
              }}>
                Knowledge Base
              </h3>
            </div>
            <div style={sectionContentStyles}>
              {/* Search Input */}
              <div style={{ marginBottom: spacing.spacing[12] }}>
                <Input
            size="sm"
                  style="default"
              placeholder="Find content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
                  leadIcon={<Search size={14} />}
            />
        </div>

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
                      Knowledge Files
                    </h4>
                    <span style={{ 
                      ...textStyles.xs.normal, 
                      color: colors.text.muted 
                    }}>
                    {getSelectedFiles().length} selected
                  </span>
                </div>
                {loadingFiles ? (
                    <div style={{ textAlign: 'center', padding: spacing.spacing[16] }}>
                      <LoadingSpinner size={16} color={colors.icon.muted} />
                  </div>
                ) : (() => {
                  const filteredFiles = knowledgeFiles.filter(file => 
                    file.name.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  
                  if (knowledgeFiles.length === 0) {
                    return (
                      <p style={{ 
                        ...textStyles.xs.normal, 
                        color: colors.text.muted,
                        textAlign: 'center',
                        padding: spacing.spacing[8]
                      }}>
                        No files found. Upload files in Knowledge Base.
                      </p>
                    );
                  }
                  
                  if (filteredFiles.length === 0) {
                    return (
                      <p style={{ 
                        ...textStyles.xs.normal, 
                        color: colors.text.muted,
                        textAlign: 'center',
                        padding: spacing.spacing[8]
                      }}>
                        No files match "{searchQuery}". Try a different search term.
                      </p>
                    );
                  }
                  
                  return filteredFiles.map(file => {
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
                          <Checkbox
                            checked={file.selected || false}
                            onChange={(e) => handleFileSelection(file.id, e.target.checked)}
                          />
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
              Recent Posts
              </h3>
            </div>
                         <div style={sectionContentStyles}>
             {loadingDrafts ? (
                 <div style={{ textAlign: 'center', padding: spacing.spacing[16] }}>
                   <LoadingSpinner size={12} color={colors.icon.muted} />
               </div>
             ) : savedDrafts.length === 0 ? (
                 <p style={{ 
                   ...textStyles.xs.normal, 
                   color: colors.text.muted,
                   textAlign: 'center',
                   padding: spacing.spacing[8]
                 }}>
                 No saved drafts yet
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
                         transition: 'background-color 0.15s ease-in-out',
                         backgroundColor: draftId === draft.id ? colors.bg.state?.ghostHover || colors.bg.subtle : 'transparent',
                         border: draftId === draft.id ? `1px solid ${colors.border.highlight}` : 'none',
                       }}
                       onMouseEnter={(e) => {
                         if (draftId !== draft.id) {
                           e.currentTarget.style.backgroundColor = colors.bg.state?.ghostHover || colors.bg.subtle;
                         }
                       }}
                       onMouseLeave={(e) => {
                         if (draftId !== draft.id) {
                           e.currentTarget.style.backgroundColor = 'transparent';
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
                       {draft.title || 'Untitled'}
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
                  label="View all posts"
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
              label="Help"
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
          <div style={editorContentStyles}>
            {/* Content Textarea */}
            <TextArea
              value={editorContent}
              onChange={(e) => setEditorContent(e.target.value)}
              placeholder="Start writing your content..."
              rows={25}
              autoResize={false}
              style={{
                fontSize: typography.desktop.size.md,
                fontWeight: typography.desktop.weight.normal,
                lineHeight: '1.8',
                color: colors.text.default,
                fontFamily: typography.fontFamily.body,
                border: 'none',
                backgroundColor: 'transparent',
                padding: `${spacing.spacing[16]} 0`,
                minHeight: '600px',
              }}
            />
        </div>
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
                AI Assistant
              </h3>
              <div style={{ position: 'relative' }}>
                <Button
                  label={currentConversationId 
                    ? formatTitle(conversations.find(c => c.id === currentConversationId)?.title || 'Current Chat')
                    : 'New Conversation'
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
                          New Conversation
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
                            Recent Conversations
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
                        textAlign: 'center',
                      }}>
                        <LoadingSpinner size={16} color={colors.icon.muted} />
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
                {getSelectedFiles().length} file{getSelectedFiles().length > 1 ? 's' : ''} selected as context
              </p>
            </div>
          )}
        </div>

        {/* Chat Messages */}
          <div style={chatMessagesStyles}>
          {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: colors.text.muted, marginTop: spacing.spacing[32] }}>
                <p style={{ ...textStyles.sm.medium, margin: 0, marginBottom: spacing.spacing[8] }}>
                  👋 Hello! I'm your AI content assistant.
                </p>
                <p style={{ ...textStyles.xs.normal, margin: 0 }}>
                  Ask me anything about your content, writing tips, or ideas!
                </p>
            </div>
          ) : (
            chatMessages.map(message => (
                <div
                  key={message.id}
                  style={message.role === 'user' ? userMessageStyles : botMessageStyles}
                >
                  <div style={avatarStyles}>
                {message.role === 'user' ? (
                      <User size={12} style={{ color: colors.icon.muted }} />
                    ) : (
                      <Bichaurinho variant={12} size={24} />
                    )}
                  </div>
                  <div style={{
                    ...textStyles.sm.normal,
                    color: colors.text.default,
                    flex: 1,
                  }}>
                      {message.content}
                  </div>
              </div>
            ))
          )}
          {aiLoading && (
              <div style={botMessageStyles}>
                <div style={avatarStyles}>
                  <Bichaurinho variant={12} size={24} />
                </div>
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
          )}
        </div>

        {/* Transcript Paste Action */}
        <div style={{
          padding: spacing.spacing[12],
          borderTop: `1px solid ${colors.border.default}`,
          backgroundColor: colors.bg.card.default,
        }}>
          <Button
            label="Paste Meeting Transcript"
            style="primary"
            size="sm"
            leadIcon={<FileText size={16} />}
            onClick={handleTranscriptPaste}
            disabled={processingTranscript}
            loading={processingTranscript}
          />
          <p style={{
            ...textStyles.xs.normal,
            color: colors.text.muted,
            textAlign: 'center',
            marginTop: spacing.spacing[8],
            margin: `${spacing.spacing[8]} 0 0 0`,
          }}>
            Paste transcripts from Fireflies, Fathom, Otter.ai, or any meeting tool
          </p>
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
              Quick Actions
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
                label="Professional"
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('professional')}
                disabled={aiLoading}
              />
              <Button
                label="Bullet Points"
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('bullet_points')}
                disabled={aiLoading}
              />
              <Button
                label="Better Hook"
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('improve_hook')}
                disabled={aiLoading}
              />
              <Button
                label="Add Hashtags"
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('add_hashtags')}
                disabled={aiLoading}
              />
              <Button
                label="Make Shorter"
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('shorter')}
                disabled={aiLoading}
              />
              <Button
                label="Make Longer"
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('longer')}
                disabled={aiLoading}
              />
              <Button
                label="Add Story"
                style="secondary"
                size="xs"
                onClick={() => handleQuickAction('storytelling')}
                disabled={aiLoading}
              />
              <Button
                label="Make Actionable"
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
            <div style={{ display: 'flex', gap: spacing.spacing[8] }}>
              <div style={{ flex: 1 }}>
            <Input
                  placeholder="Ask AI anything about your content..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  style="default"
                  size="sm"
              disabled={aiLoading}
            />
              </div>
            <Button
                label=""
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

              {/* AI Edit Modal */}
        {showEditModal && aiEditSuggestion && (
         <Modal
           isOpen={showEditModal}
           onClose={() => setShowEditModal(false)}
         >
           <div style={{
             padding: spacing.spacing[24],
             display: 'flex',
             flexDirection: 'column',
             height: '100%',
           }}>
             <div style={{
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'space-between',
               marginBottom: spacing.spacing[16],
             }}>
               <h3 style={{ ...textStyles.lg.semibold, color: colors.text.default, margin: 0 }}>
                 AI Edit Suggestion
               </h3>
             </div>

             <div style={{ marginBottom: spacing.spacing[16] }}>
               <p style={{ ...textStyles.sm.normal, color: colors.text.default, margin: 0 }}>
                 {aiEditSuggestion.explanation}
               </p>
             </div>

             <div style={{
               display: 'grid',
               gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
               gap: spacing.spacing[16],
               marginBottom: spacing.spacing[24],
               flex: 1,
             }}>
               <div>
                 <h4 style={{ ...textStyles.sm.semibold, color: colors.text.default, marginBottom: spacing.spacing[8] }}>
                   Current Content
                 </h4>
                 <div style={{
                   backgroundColor: colors.bg.subtle,
                   border: `1px solid ${colors.border.default}`,
                   borderRadius: cornerRadius.borderRadius.md,
                   padding: spacing.spacing[12],
                   height: '300px',
                   overflow: 'auto',
                   fontFamily: 'monospace',
                   fontSize: '14px',
                   lineHeight: '1.5',
                 }}>
                   {aiEditSuggestion.originalContent}
                 </div>
               </div>

               <div>
                 <h4 style={{ ...textStyles.sm.semibold, color: colors.text.default, marginBottom: spacing.spacing[8] }}>
                   Suggested Edit
                 </h4>
                 <div style={{
                   backgroundColor: colors.bg.subtle,
                   border: `1px solid ${colors.border.default}`,
                   borderRadius: cornerRadius.borderRadius.md,
                   padding: spacing.spacing[12],
                   height: '300px',
                   overflow: 'auto',
                   fontFamily: 'monospace',
                   fontSize: '14px',
                   lineHeight: '1.5',
                 }}>
                   {aiEditSuggestion.suggestedContent}
                 </div>
               </div>
             </div>

             <div style={{
               display: 'flex',
               flexDirection: isMobile ? 'column' : 'row',
               gap: spacing.spacing[12],
               justifyContent: 'flex-end',
               marginTop: 'auto',
             }}>
               <Button
                 label="Reject"
                 style="secondary"
                 size="md"
                 onClick={handleRejectAIEdit}
               />
               <Button
                 label="Apply Edit"
                 style="primary"
                 size="md"
                 onClick={handleApplyAIEdit}
               />
             </div>
           </div>
         </Modal>
        )}

        {/* Transcript Paste Modal */}
        <TranscriptPasteModal
          isOpen={showTranscriptModal}
          onClose={() => setShowTranscriptModal(false)}
          onTranscriptSubmit={handleTranscriptSubmit}
          loading={processingTranscript}
        />

        
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