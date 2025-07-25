import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Trash2, Bell, Settings, FileText, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SavedDraft {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
  suggestion_id?: string;
}

interface ContentSuggestion {
  id: string;
  title: string;
  description?: string;
  suggested_outline?: string;
  is_active: boolean;
  used_at?: string;
}

const Posts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeNavItem, setActiveNavItem] = useState('posts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
  const [savedDrafts, setSavedDrafts] = useState<SavedDraft[]>([]);
  const [contentSuggestions, setContentSuggestions] = useState<ContentSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Note: saved_drafts table needs to be created first
      // For now, we'll use mock data
      setSavedDrafts([]);

      // Fetch unused content suggestions
      const { data: suggestions, error: suggestionsError } = await supabase
        .from('content_suggestions')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .is('used_at', null)
        .order('created_at', { ascending: false });

      if (suggestionsError) throw suggestionsError;
      setContentSuggestions(suggestions || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDrafts = savedDrafts.filter(draft => {
    const matchesSearch = draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         draft.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'all' || draft.status === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleEditDraft = (draft: SavedDraft) => {
    navigate('/content-editor', { 
      state: { 
        draftId: draft.id,
        title: draft.title,
        content: draft.content
      } 
    });
  };

  const handleDeleteDraft = async (draftId: string) => {
    // Note: This will be implemented when saved_drafts table is created
    setSavedDrafts(prev => prev.filter(draft => draft.id !== draftId));
  };

  const handleCreateFromSuggestion = (suggestion: ContentSuggestion) => {
    navigate('/content-editor', { 
      state: { suggestion } 
    });
  };

  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home',
      isActive: activeNavItem === 'home'
    },
    {
      id: 'posts',
      label: 'Posts',
      icon: 'file-text',
      isActive: activeNavItem === 'posts'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: 'profile',
      isActive: activeNavItem === 'profile'
    },
    {
      id: 'knowledge',
      label: 'Knowledge',
      icon: 'knowledge',
      isActive: activeNavItem === 'knowledge'
    },
    {
      id: 'calendar',
      label: 'Calendar',
      icon: 'calendar',
      isActive: activeNavItem === 'calendar'
    }
  ];

  const handleCreateNew = () => {
    navigate('/content-editor');
  };

  const handleUserMenuClick = () => {
    navigate('/profile');
  };

  const handleNavigationClick = (itemId: string) => {
    setActiveNavItem(itemId);
    if (itemId === 'home') {
      navigate('/product-home');
    } else if (itemId === 'profile') {
      navigate('/profile');
    } else if (itemId === 'knowledge') {
      navigate('/knowledge');
    } else if (itemId === 'posts') {
      navigate('/posts');
    }
  };

  const handleFinishOnboarding = () => {
    console.log('Finish onboarding clicked');
  };

  const handleHelpClick = () => {
    console.log('Help clicked');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar
          userName="Simon Alt"
          userAvatar="https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/75fe1b108c00417d7dc855be81d3b2879bf7e2f0?placeholderIfAbsent=true"
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
            
            <div className="flex-1 flex items-center justify-between">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-gray-200"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                  /
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    1
                  </span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>
          
          <div className="flex-1 bg-gray-50">
            <div className="w-full max-w-4xl mx-auto p-4">
              <div className="mb-6">
                <h1 className="text-4xl font-bold font-playfair text-gray-900 mb-2">Posts</h1>
                <p className="text-gray-600">Manage your saved drafts and content suggestions</p>
              </div>

              {/* Filter buttons */}
              <div className="flex gap-2 mb-6">
                {(['all', 'draft', 'published', 'archived'] as const).map((filter) => (
                  <Button
                    key={filter}
                    variant={selectedFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedFilter(filter)}
                    className="capitalize"
                  >
                    {filter}
                  </Button>
                ))}
              </div>

              {isLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <div className="space-y-8">
                  {/* Saved Drafts Section */}
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Saved Drafts</h2>
                    {filteredDrafts.length === 0 ? (
                      <Card className="border border-gray-200 shadow-sm rounded-lg">
                        <CardContent className="p-8 text-center">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600">No drafts found. Start writing to create your first draft!</p>
                          <Button onClick={handleCreateNew} className="mt-4">
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Post
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {filteredDrafts.map((draft) => (
                          <Card key={draft.id} className="border border-gray-200 shadow-sm rounded-lg">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold text-gray-900 text-lg">
                                      {draft.title || 'Untitled'}
                                    </h3>
                                    <Badge className={getStatusColor(draft.status)}>
                                      {draft.status}
                                    </Badge>
                                  </div>
                                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                                    {draft.content.substring(0, 150)}...
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Last updated: {new Date(draft.updated_at).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditDraft(draft)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteDraft(draft.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Content Suggestions Section */}
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Unused Content Suggestions</h2>
                    {contentSuggestions.length === 0 ? (
                      <Card className="border border-gray-200 shadow-sm rounded-lg">
                        <CardContent className="p-8 text-center">
                          <p className="text-gray-600">No unused suggestions available.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-4">
                        {contentSuggestions.map((suggestion) => (
                          <Card key={suggestion.id} className="border border-gray-200 shadow-sm rounded-lg">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 text-lg mb-2">
                                    {suggestion.title}
                                  </h3>
                                  {suggestion.description && (
                                    <p className="text-gray-600 text-sm mb-2">
                                      {suggestion.description}
                                    </p>
                                  )}
                                  {suggestion.suggested_outline && (
                                    <p className="text-gray-500 text-xs">
                                      Outline: {suggestion.suggested_outline.substring(0, 100)}...
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCreateFromSuggestion(suggestion)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Create Post
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Posts;