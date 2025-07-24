import React, { useState, useEffect, useRef } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Upload, FileText, Image, Film, Music, Link, FileSpreadsheet, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface KnowledgeItem {
  id: string;
  name: string;
  type: 'file' | 'image' | 'audio' | 'video' | 'link';
  size?: number;
  url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
}

const KnowledgeBase = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavItem, setActiveNavItem] = useState('knowledge');
  const [linkInput, setLinkInput] = useState('');
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: 'https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/0c1bb78985544c9ca924ecccb7d81902f1371722?placeholderIfAbsent=true',
      isActive: activeNavItem === 'home'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/d8364849850f2a2fc435e11f52d1453ebc7def9b?placeholderIfAbsent=true',
      isActive: activeNavItem === 'profile'
    },
    {
      id: 'knowledge',
      label: 'Knowledge',
      icon: 'https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/37597e47a501549c19c0227f7570a0090e8eefde?placeholderIfAbsent=true',
      isActive: activeNavItem === 'knowledge'
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: 'https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/54893a5cd62f99839478ff82093b736496144b3f?placeholderIfAbsent=true',
      isActive: activeNavItem === 'calendar'
    }
  ];

  // Load user's knowledge items on component mount
  useEffect(() => {
    if (user) {
      loadKnowledgeItems();
    }
  }, [user]);

  const loadKnowledgeItems = async () => {
    try {
      setLoading(true);
      // For now, we'll simulate loading from database
      // In the future, this will connect to a real database table
      setKnowledgeItems([]);
    } catch (error) {
      console.error('Error loading knowledge items:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'files', label: 'Files' },
    { id: 'images', label: 'Images' },
    { id: 'audios', label: 'Audios' },
    { id: 'videos', label: 'Videos' },
    { id: 'links', label: 'Links' }
  ];

  const handleCreateNew = () => {
    navigate('/content-editor');
  };

  const handleUserMenuClick = () => {
    navigate('/profile');
  };

  const handleNavigationClick = (itemId: string) => {
    setActiveNavItem(itemId);
    if (itemId === 'home' || itemId === 'profile') {
      navigate(`/${itemId === 'home' ? 'product-home' : itemId}`);
    }
  };

  const handleFinishOnboarding = () => {
    console.log('Finish onboarding clicked');
  };

  const handleHelpClick = () => {
    console.log('Help clicked');
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadFile(file);
      }
      toast.success('Files uploaded successfully');
      loadKnowledgeItems();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const uploadFile = async (file: File) => {
    // For now, this is a placeholder for file upload functionality
    // In the future, this will handle actual file uploads to Supabase storage
    console.log('Uploading file:', file.name);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate upload
  };

  const handleLinkSubmit = async () => {
    if (!linkInput.trim()) return;

    try {
      // For now, this is a placeholder for link processing
      // In the future, this will save the link to the database
      console.log('Processing link:', linkInput);
      toast.success('Link added successfully');
      setLinkInput('');
      loadKnowledgeItems();
    } catch (error) {
      console.error('Error adding link:', error);
      toast.error('Failed to add link');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      // For now, this is a placeholder for delete functionality
      setKnowledgeItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Film;
      case 'audio': return Music;
      case 'link': return Link;
      default: return FileText;
    }
  };

  const filteredItems = knowledgeItems.filter(item => {
    // Filter by type
    const typeMatch = activeFilter === 'all' || 
      (activeFilter === 'files' && item.type === 'file') ||
      (activeFilter === 'images' && item.type === 'image') ||
      (activeFilter === 'audios' && item.type === 'audio') ||
      (activeFilter === 'videos' && item.type === 'video') ||
      (activeFilter === 'links' && item.type === 'link');

    // Filter by search query
    const searchMatch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase());

    return typeMatch && searchMatch;
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          userName={user?.email?.split('@')[0] || 'User'}
          userAvatar="/lovable-uploads/fe97b466-2c78-4c2a-baeb-f2e13105460d.png"
          navigationItems={navigationItems}
          onCreateNew={handleCreateNew}
          onUserMenuClick={handleUserMenuClick}
          onNavigationClick={handleNavigationClick}
          onFinishOnboarding={handleFinishOnboarding}
          onHelpClick={handleHelpClick}
        />
        
        <SidebarInset>
          <header className="flex h-16 items-center gap-4 border-b bg-neutral-50 px-4">
            <SidebarTrigger />
          </header>
          
          <main className="flex-1 p-6">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Knowledge Base</h1>
                  <p className="text-gray-600">Here you can find all the files, links, and images to use as reference to the AI</p>
                </div>
                <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                  Manage Integrations
                </Button>
              </div>

              {/* Upload Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  multiple
                  accept="*/*"
                  className="hidden"
                />
                
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Upload className={`w-8 h-8 ${uploading ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <p className="text-gray-600 mb-2">
                    {uploading ? 'Uploading files...' : 'Drop your files here, or'}{' '}
                    {!uploading && (
                      <button 
                        onClick={handleFileUpload}
                        className="text-blue-600 hover:underline"
                        disabled={uploading}
                      >
                        click to browse
                      </button>
                    )}
                  </p>
                  <p className="text-sm text-gray-400">Support for all file types</p>
                </div>

                <div className="flex items-center justify-center my-6">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-4 text-gray-500">or</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                <div className="text-center">
                  <p className="text-gray-600 mb-4">Add a link to a website</p>
                  <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
                    <span className="text-gray-500">https://</span>
                    <Input
                      placeholder="example.com"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && handleLinkSubmit()}
                    />
                    <Button 
                      onClick={handleLinkSubmit}
                      disabled={!linkInput.trim()}
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              {/* Filters and Search */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-1">
                  {filterTabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeFilter === tab.id ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveFilter(tab.id)}
                      className={`px-4 py-2 ${
                        activeFilter === tab.id 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select defaultValue="last-edited">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-edited">Last Edited</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="date-added">Date Added</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Content Grid */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your files...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">No files found</p>
                  <p className="text-sm text-gray-400">
                    {searchQuery 
                      ? 'Try adjusting your search or filters' 
                      : 'Upload your first file to get started'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => {
                    const IconComponent = getFileIcon(item.type);
                    return (
                      <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
                        <div className="aspect-video relative bg-gray-50 flex items-center justify-center">
                          <IconComponent className="w-12 h-12 text-gray-400" />
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteItem(item.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 mb-1 truncate">{item.name}</h3>
                          <p className="text-sm text-gray-500">
                            Added {new Date(item.created_at).toLocaleDateString()}
                          </p>
                          {item.size && (
                            <p className="text-xs text-gray-400 mt-1">
                              {(item.size / 1024).toFixed(1)} KB
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default KnowledgeBase;