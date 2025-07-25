import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ConversationSelector } from '@/components/ConversationSelector';
import { 
  ArrowLeft, 
  Search, 
  FileText, 
  Folder, 
  FolderOpen,
  Plus,
  Send,
  Save,
  File,
  Image,
  Book
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface KnowledgeFile {
  id: string;
  name: string;
  type: 'file' | 'image' | 'audio' | 'video' | 'link';
  size?: number;
  url?: string;
  user_id: string;
  created_at: string;
  selected?: boolean;
}

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  icon?: string;
  children?: FileItem[];
  isOpen?: boolean;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ContentEditor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState('New Post');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [editorContent, setEditorContent] = useState('# New Post\n\nStart writing your content here...');

  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const [fileStructure, setFileStructure] = useState<FileItem[]>([
    {
      id: 'new-content',
      name: 'New Content',
      type: 'folder',
      isOpen: true,
      children: []
    },
    {
      id: 'knowledge-base',
      name: 'Knowledge Base',
      type: 'folder',
      isOpen: true,
      children: []
    }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Load data on component mount
  useEffect(() => {
    if (user) {
      loadKnowledgeFiles();
    }
  }, [user]);

  // Handle content suggestions from ProductHome and draft editing
  useEffect(() => {
    if (location.state?.suggestion) {
      const suggestion = location.state.suggestion;
      setDraftTitle(suggestion.title);
      setEditorContent(suggestion.suggested_outline || `# ${suggestion.title}\n\n${suggestion.description || ''}\n\n`);
      
      // Clear the state to prevent re-applying on navigation
      window.history.replaceState({}, document.title);
      
      toast.success(`"${suggestion.title}" has been loaded into the editor`);
    } else if (location.state?.draftId) {
      // Load existing draft
      const { draftId, title, content } = location.state;
      setDraftId(draftId);
      setDraftTitle(title || 'Untitled');
      setEditorContent(content || '');
      
      // Clear the state to prevent re-applying on navigation
      window.history.replaceState({}, document.title);
      
      toast.success('Draft loaded successfully');
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

  const loadKnowledgeFiles = async () => {
    if (!user) return;
    
    try {
      setLoadingFiles(true);
      const { data: files, error } = await supabase.storage
        .from('knowledge-base')
        .list(user.id, {
          limit: 100,
          offset: 0
        });

      if (error) throw error;

      const knowledgeFiles: KnowledgeFile[] = files?.map(file => ({
        id: file.id || file.name,
        name: file.name,
        type: getFileTypeFromName(file.name),
        size: file.metadata?.size,
        user_id: user.id,
        created_at: file.created_at || new Date().toISOString(),
        url: `https://plbgeabtrkdhbrnjonje.supabase.co/storage/v1/object/knowledge-base/${user.id}/${file.name}`,
        selected: false
      })) || [];

      setKnowledgeFiles(knowledgeFiles);
    } catch (error) {
      console.error('Error loading knowledge files:', error);
      toast.error('Failed to load knowledge files');
    } finally {
      setLoadingFiles(false);
    }
  };

  const getFileTypeFromName = (filename: string): 'file' | 'image' | 'audio' | 'video' | 'link' => {
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
  };

  const loadMessagesForConversation = async (conversationId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('id, role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages: ChatMessage[] = messages?.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at)
      })) || [];

      setChatMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load conversation');
    }
  };

  const handleConversationChange = (conversationId: string | null) => {
    setCurrentConversationId(conversationId);
    if (conversationId) {
      loadMessagesForConversation(conversationId);
    } else {
      setChatMessages([]);
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setChatMessages([]);
  };

  const handleFileSelection = (fileId: string, selected: boolean) => {
    if (selected) {
      setSelectedFiles(prev => [...prev, fileId]);
    } else {
      setSelectedFiles(prev => prev.filter(id => id !== fileId));
    }
  };

  const handleSaveDraft = async (silent = false) => {
    if (!user || !editorContent.trim()) return;
    
    try {
      setIsSaving(true);
      
      const draftData = {
        title: draftTitle,
        content: editorContent,
        user_id: user.id,
        status: 'draft' as const
      };

      if (draftId) {
        // Update existing draft
        const { error } = await supabase
          .from('saved_drafts' as any)
          .update(draftData)
          .eq('id', draftId);
        
        if (error) throw error;
      } else {
        // Create new draft
        const { data, error } = await supabase
          .from('saved_drafts' as any)
          .insert(draftData)
          .select('id')
          .single();
        
        if (error) throw error;
        if (data) {
          setDraftId((data as any).id);
        }
      }
      
      setLastSaved(new Date());
      
      if (!silent) {
        toast.success('Draft saved successfully');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      if (!silent) {
        toast.error('Failed to save draft');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      // Get selected file contexts
      const selectedFileContexts = knowledgeFiles
        .filter(file => selectedFiles.includes(file.id))
        .map(file => ({
          name: file.name,
          type: file.type,
          url: file.url
        }));

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: chatInput,
          conversationId: currentConversationId,
          fileContexts: selectedFileContexts
        }
      });

      if (error) {
        throw error;
      }

      // Update conversation ID if this was the first message
      if (!currentConversationId && data.conversationId) {
        setCurrentConversationId(data.conversationId);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
      
      // Remove the user message that failed
      setChatMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setFileStructure(prev => prev.map(item => 
      item.id === folderId ? { ...item, isOpen: !item.isOpen } : item
    ));
  };

  const renderFileTree = (items: FileItem[], depth = 0) => {
    return items.map(item => (
      <div key={item.id}>
        <div 
          className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => item.type === 'folder' ? toggleFolder(item.id) : null}
        >
          {item.type === 'folder' ? (
            item.isOpen ? <FolderOpen className="h-4 w-4 text-blue-600" /> : <Folder className="h-4 w-4 text-blue-600" />
          ) : (
            <FileText className="h-4 w-4 text-gray-600" />
          )}
          <span className="text-sm text-gray-700 truncate">{item.name}</span>
        </div>
        {item.type === 'folder' && item.isOpen && item.children && (
          <div>
            {renderFileTree(item.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - File Explorer */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/product-home')}
            className="mb-3 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/posts')}
            className="mb-3 text-gray-600 hover:text-gray-900 w-full justify-start"
          >
            <Book className="h-4 w-4 mr-2" />
            Posts
          </Button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Find content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start mb-2 text-gray-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Content
            </Button>
            
            {renderFileTree(fileStructure)}
            {/* Show knowledge base files */}
            {fileStructure.find(item => item.id === 'knowledge-base')?.isOpen && (
              <div className="px-4 pb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">Knowledge Files</h4>
                  <span className="text-xs text-gray-500">
                    {selectedFiles.length} selected
                  </span>
                </div>
                {loadingFiles ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                  </div>
                ) : knowledgeFiles.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-2">
                    No files found. Upload files in Knowledge Base.
                  </p>
                ) : (
                  knowledgeFiles.map(file => {
                    const Icon = file.type === 'image' ? Image : 
                                file.type === 'file' ? FileText : File;
                    return (
                      <div key={file.id} className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100">
                        <Checkbox
                          checked={selectedFiles.includes(file.id)}
                          onCheckedChange={(checked) => handleFileSelection(file.id, checked as boolean)}
                          className="h-3 w-3"
                        />
                        <Icon className="h-3 w-3 text-gray-600" />
                        <span className="text-xs text-gray-700 truncate flex-1">
                          {file.name}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex-1">
            <Input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="text-xl font-semibold text-gray-900 border-0 p-0 focus-visible:ring-0 bg-transparent"
              placeholder="Enter title..."
            />
          </div>
          <div className="flex items-center gap-3">
            {lastSaved && (
              <span className="text-xs text-gray-500">
                Saved {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <Button 
              size="sm" 
              onClick={() => handleSaveDraft(false)}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
          </div>
        </div>

        {/* Editor Content */}
        <div className="flex-1 p-6">
          <Textarea
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            className="w-full h-full resize-none border-0 focus-visible:ring-0 text-base leading-relaxed"
            placeholder="Start writing your content..."
          />
        </div>
      </div>

      {/* Right Sidebar - AI Chat */}
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3">AI Assistant</h3>
          <ConversationSelector
            currentConversationId={currentConversationId}
            onConversationChange={handleConversationChange}
            onNewConversation={handleNewConversation}
          />
          {selectedFiles.length > 0 && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700">
                {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected as context
              </p>
            </div>
          )}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p className="mb-2">👋 Hello! I'm your AI content assistant.</p>
              <p className="text-sm">Ask me anything about your content, writing tips, or ideas!</p>
            </div>
          ) : (
            chatMessages.map(message => (
              <div key={message.id} className="space-y-2">
                {message.role === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white px-3 py-2 rounded-lg max-w-[80%] text-sm">
                      {message.content}
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg max-w-[80%] text-sm">
                      {message.content}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-3 py-2 rounded-lg text-sm">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask AI anything"
              className="flex-1"
              disabled={isLoading}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
              disabled={isLoading || !chatInput.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;