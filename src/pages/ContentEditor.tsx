import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Search, 
  FileText, 
  Folder, 
  FolderOpen,
  Plus,
  Send,
  Save
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [editorContent, setEditorContent] = useState(`# 5 Steps to a good LinkedIn profile

Medium is a home for human stories and ideas. Here, anyone can share knowledge and wisdom with the world—without having to build a mailing list or a following first. The internet thrives when it gets rid of gatekeepers and its democratized. It's simple, beautiful, collaborative, and helps you find the right reader for whatever you have to say.

![LinkedIn Profile Image](/lovable-uploads/48fbddaa-87e8-4da2-9ec7-f9972c3db63f.png)

## Step 1: Professional Headline
Your headline should be more than just your job title. Make it compelling and show your value proposition.

## Step 2: Profile Photo
Use a professional, high-quality headshot where you're looking directly at the camera with a genuine smile.

## Step 3: Summary Section
Write a compelling summary that tells your professional story and highlights your key achievements.

## Step 4: Experience Details
Don't just list job duties. Focus on achievements and quantify your impact with specific numbers and results.

## Step 5: Skills and Endorsements
List relevant skills and actively seek endorsements from colleagues and clients.`);

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
      children: [
        { id: 'linkedin-pdf', name: 'filename.pdf', type: 'file' },
        { id: 'resume-pdf', name: 'filename.pdf', type: 'file' },
        { id: 'guide-mov', name: 'filename.mov', type: 'file' },
        { id: 'template-pdf', name: 'filename.pdf', type: 'file' },
        { id: 'example-gif', name: 'filename.gif', type: 'file' },
        { id: 'sample-jpg', name: 'filename.jpg', type: 'file' },
        { id: 'doc-pdf', name: 'filename.pdf', type: 'file' }
      ]
    }
  ]);

  const [recentItems] = useState([
    { id: 'linkedin-pro', name: '5 Steps to a good LinkedIn pro...', type: 'Quick healthy recipes' },
    { id: 'french-basics', name: 'Learn French basics', type: 'Meditation techniques' }
  ]);

  const [yesterdayItems] = useState([
    { id: 'ai-tools', name: 'Exploring AI tools', type: '' },
    { id: 'workout', name: 'Workout plan at home', type: '' }
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'user',
      content: 'Help me with this text.',
      timestamp: new Date()
    },
    {
      id: '2',
      role: 'assistant',
      content: 'I think it sounds too cliché and unauthentic.',
      timestamp: new Date()
    },
    {
      id: '3',
      role: 'user',
      content: 'Give me three ideas of content based on things I\'ve done this week, please.',
      timestamp: new Date()
    }
  ]);

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages([...chatMessages, newMessage]);
    setChatInput('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I can help you with that! Let me analyze your content and provide suggestions.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    }, 1000);
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
          </div>

          <Separator className="my-4" />

          {/* Recent Section */}
          <div className="px-4 pb-2">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Today</h4>
            {recentItems.map(item => (
              <div key={item.id} className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer">
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                  <FileText className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.type}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 pb-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Yesterday</h4>
            {yesterdayItems.map(item => (
              <div key={item.id} className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100 cursor-pointer">
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                  <FileText className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold text-gray-900">5 Steps to a good LinkedIn profile</h1>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
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
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
          <p className="text-sm text-gray-600">Get help with your content</p>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map(message => (
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
          ))}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask AI anything"
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button
              size="icon"
              onClick={handleSendMessage}
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