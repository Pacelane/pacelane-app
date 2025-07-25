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
  MessageCircle
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
  
  // Extract data from location state
  const draftData = location.state;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editorContent, setEditorContent] = useState(draftData?.content || '');
  const [title, setTitle] = useState(draftData?.title || 'Untitled Draft');
  const [currentDraftId, setCurrentDraftId] = useState(draftData?.draftId || null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

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

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    if (user) {
      loadKnowledgeFiles();
    }
  }, [user]);

  // Auto-save functionality
  useEffect(() => {
    if (editorContent && title && user) {
      const autoSaveTimer = setTimeout(() => {
        saveDraft(false);
      }, 30000); // Auto-save every 30 seconds

      return () => clearTimeout(autoSaveTimer);
    }
  }, [editorContent, title, user]);

  const loadKnowledgeFiles = async () => {
    if (!user) return;
    
    setLoadingFiles(true);
    try {
      const { data, error } = await supabase.storage
        .from('knowledge-base')
        .list(user.id, {
          limit: 100,
          offset: 0,
        });

      if (error) throw error;

      const files: KnowledgeFile[] = data.map(file => ({
        id: file.id || crypto.randomUUID(),
        name: file.name,
        type: 'file',
        size: file.metadata?.size,
        user_id: user.id,
        created_at: file.created_at || new Date().toISOString(),
        selected: false
      }));

      setKnowledgeFiles(files);

      // Update file structure
      setFileStructure(prev => [
        prev[0], // Keep "New Content" folder
        {
          ...prev[1],
          children: files.map(file => ({
            id: file.id,
            name: file.name,
            type: 'file' as const
          }))
        }
      ]);
    } catch (error) {
      console.error('Error loading knowledge files:', error);
      toast.error('Failed to load knowledge files');
    } finally {
      setLoadingFiles(false);
    }
  };

  const saveDraft = async (showToast = true) => {
    if (!user || !title.trim()) return;

    setIsSaving(true);
    try {
      const draftPayload = {
        user_id: user.id,
        title: title.trim(),
        content: editorContent,
        status: 'draft',
        suggestion_id: draftData?.suggestionId || null
      };

      let result;
      if (currentDraftId) {
        // Update existing draft
        result = await supabase
          .from('saved_drafts')
          .update(draftPayload)
          .eq('id', currentDraftId)
          .select()
          .single();
      } else {
        // Create new draft
        result = await supabase
          .from('saved_drafts')
          .insert([draftPayload])
          .select()
          .single();
        
        if (result.data) {
          setCurrentDraftId(result.data.id);
        }
      }

      if (result.error) throw result.error;

      setLastSaved(new Date());
      if (showToast) {
        toast.success('Draft saved successfully');
      }

      // Mark suggestion as used if this draft was created from a suggestion
      if (draftData?.suggestionId && !currentDraftId) {
        await supabase
          .from('content_suggestions')
          .update({ used_at: new Date().toISOString() })
          .eq('id', draftData.suggestionId);
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      if (showToast) {
        toast.error('Failed to save draft');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFile = (fileId: string) => {
    setKnowledgeFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, selected: !file.selected }
          : file
      )
    );
  };

  const sendMessage = async () => {
    if (!chatInput.trim() || !user || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      // Get selected files for context
      const selectedKnowledgeFiles = knowledgeFiles.filter(file => file.selected);
      const fileContexts = await Promise.all(
        selectedKnowledgeFiles.map(async (file) => {
          try {
            const { data } = await supabase.storage
              .from('knowledge-base')
              .download(`${user.id}/${file.name}`);
            
            if (data) {
              const text = await data.text();
              return { filename: file.name, content: text };
            }
          } catch (error) {
            console.error('Error reading file:', error);
          }
          return null;
        })
      );

      const validContexts = fileContexts.filter(Boolean);

      const response = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: chatInput,
          conversationId: currentConversationId,
          fileContexts: validContexts,
          userId: user.id
        }
      });

      if (response.error) throw response.error;

      const aiMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      if (response.data.conversationId) {
        setCurrentConversationId(response.data.conversationId);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFolder = (folderId: string) => {
    setFileStructure(prev =>
      prev.map(item =>
        item.id === folderId
          ? { ...item, isOpen: !item.isOpen }
          : item
      )
    );
  };

  const renderFileTree = (items: FileItem[], level = 0) => {
    return items.map((item) => (
      <div key={item.id} className="text-sm">
        <div
          className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-50 cursor-pointer ${
            level > 0 ? 'ml-4' : ''
          }`}
          onClick={() => item.type === 'folder' ? toggleFolder(item.id) : null}
        >
          {item.type === 'folder' ? (
            item.isOpen ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-500" />
            )
          ) : (
            <div className="flex items-center gap-2 flex-1">
              <Checkbox
                checked={knowledgeFiles.find(f => f.id === item.id)?.selected || false}
                onCheckedChange={() => toggleFile(item.id)}
              />
              <File className="h-4 w-4 text-gray-500" />
            </div>
          )}
          <span className="text-gray-700">{item.name}</span>
        </div>
        {item.type === 'folder' && item.isOpen && item.children && (
          <div>
            {renderFileTree(item.children, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - File Explorer */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <Button
            variant="ghost"
            onClick={() => navigate('/product-home')}
            className="mb-4 p-0 h-auto text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Product Home
          </Button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {loadingFiles ? (
              <div className="text-center text-gray-500">Loading files...</div>
            ) : (
              renderFileTree(fileStructure)
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex">
        {/* Editor Section */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          <div className="border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Content Editor</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {lastSaved && (
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              )}
            </div>
          </div>
          
          <div className="flex-1 p-6">
            <div className="space-y-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title..."
                className="text-xl font-semibold border-0 border-b border-gray-200 rounded-none px-0 focus:border-blue-500"
              />
              
              <Textarea
                value={editorContent}
                onChange={(e) => setEditorContent(e.target.value)}
                placeholder="Start writing your content here..."
                className="min-h-[400px] resize-none border-gray-200 focus:border-blue-500"
              />
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline"
                  onClick={() => navigate('/posts')}
                >
                  View All Posts
                </Button>
                <Button 
                  onClick={() => saveDraft(true)}
                  disabled={isSaving || !title.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Draft'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - AI Assistant */}
        <div className="w-80 bg-white flex flex-col">
          <div className="border-b border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              </div>
              <span className="font-semibold text-gray-900">AI Assistant</span>
            </div>
            
            <ConversationSelector
              currentConversationId={currentConversationId}
              onConversationChange={setCurrentConversationId}
              onNewConversation={() => setCurrentConversationId(null)}
            />
          </div>
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Start a conversation with your AI assistant</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-100 ml-8'
                          : 'bg-gray-100 mr-8'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          message.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                        }`}>
                          {message.role === 'user' ? 'U' : 'AI'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{message.content}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="bg-gray-100 mr-8 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gray-500 flex items-center justify-center text-xs font-bold text-white">
                          AI
                        </div>
                        <div className="flex-1">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask your AI assistant..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!chatInput.trim() || isLoading}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentEditor;