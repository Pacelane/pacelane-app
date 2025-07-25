import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Edit3, Trash2, FileText, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface SavedDraft {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
  suggestion_id?: string;
  user_id: string;
}

interface ContentSuggestion {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

const Posts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState<SavedDraft[]>([]);
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDrafts();
      loadUnusedSuggestions();
    }
  }, [user]);

  const loadDrafts = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_drafts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (error) {
      console.error('Error loading drafts:', error);
      toast.error('Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  const loadUnusedSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('content_suggestions')
        .select('*')
        .is('used_at', null)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSuggestions(data || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const deleteDraft = async (draftId: string) => {
    try {
      const { error } = await supabase
        .from('saved_drafts')
        .delete()
        .eq('id', draftId);

      if (error) throw error;
      
      setDrafts(drafts.filter(draft => draft.id !== draftId));
      toast.success('Draft deleted successfully');
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast.error('Failed to delete draft');
    }
  };

  const editDraft = (draft: SavedDraft) => {
    navigate('/content-editor', { 
      state: { 
        draftId: draft.id,
        title: draft.title,
        content: draft.content 
      } 
    });
  };

  const createFromSuggestion = (suggestion: ContentSuggestion) => {
    navigate('/content-editor', { 
      state: { 
        suggestionId: suggestion.id,
        title: suggestion.title,
        content: suggestion.description || ''
      } 
    });
  };

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = draft.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         draft.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || draft.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sidebarProps = {
    userName: user?.email || '',
    userAvatar: '',
    navigationItems: [
      { id: 'home', label: 'Product Home', icon: 'home', isActive: false },
      { id: 'posts', label: 'Posts', icon: 'file-text', isActive: true },
      { id: 'content-editor', label: 'Content Editor', icon: 'edit', isActive: false },
      { id: 'knowledge-base', label: 'Knowledge Base', icon: 'book', isActive: false },
      { id: 'profile', label: 'Profile', icon: 'user', isActive: false },
    ],
    onCreateNew: () => navigate('/content-editor'),
    onUserMenuClick: () => navigate('/profile'),
    onNavigationClick: (id: string) => {
      const routeMap: Record<string, string> = {
        'home': '/product-home',
        'posts': '/posts',
        'content-editor': '/content-editor',
        'knowledge-base': '/knowledge-base',
        'profile': '/profile'
      };
      if (routeMap[id]) navigate(routeMap[id]);
    },
    onFinishOnboarding: () => {},
    onHelpClick: () => {}
  };

  if (loading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar {...sidebarProps} />
          <SidebarInset>
            <header className="flex h-16 items-center gap-4 border-b bg-neutral-50 px-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold">Posts</h1>
            </header>
            <div className="flex-1 bg-gray-50 p-8">
              <div className="text-center">Loading...</div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar {...sidebarProps} />
        
        <SidebarInset>
          <header className="flex h-16 items-center gap-4 border-b bg-neutral-50 px-4">
            <SidebarTrigger />
            <div className="flex-1 flex items-center justify-between">
              <h1 className="text-xl font-semibold">Posts</h1>
              <Button onClick={() => navigate('/content-editor')} className="gap-2">
                <Plus className="h-4 w-4" />
                New Post
              </Button>
            </div>
          </header>
          
          <div className="flex-1 bg-gray-50">
            <div className="w-full max-w-6xl mx-auto p-8">
              <div className="space-y-6">
                {/* Search and Filters */}
                <div className="flex items-center justify-between">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      type="text"
                      placeholder="Search posts..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-white border-gray-200"
                    />
                  </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="all">All Posts</TabsTrigger>
                    <TabsTrigger value="draft">Drafts</TabsTrigger>
                    <TabsTrigger value="published">Published</TabsTrigger>
                    <TabsTrigger value="archived">Archived</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-6">
                    {/* Drafts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredDrafts.map((draft) => (
                        <Card key={draft.id} className="border border-gray-200 shadow-sm rounded-lg hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-gray-900 text-lg line-clamp-2">
                                  {draft.title}
                                </h3>
                                <Badge className={getStatusColor(draft.status)}>
                                  {draft.status}
                                </Badge>
                              </div>
                              
                              <p className="text-gray-600 text-sm line-clamp-3">
                                {draft.content.slice(0, 150)}...
                              </p>
                              
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>Updated {formatDate(draft.updated_at)}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 pt-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => editDraft(draft)}
                                  className="flex-1"
                                >
                                  <Edit3 className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => deleteDraft(draft.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {filteredDrafts.length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                        <p className="text-gray-600 mb-4">
                          {searchQuery ? 'No posts match your search.' : 'Start by creating your first post.'}
                        </p>
                        <Button onClick={() => navigate('/content-editor')}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Post
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Unused Suggestions Section */}
                {suggestions.length > 0 && (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900">Unused Suggestions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {suggestions.map((suggestion) => (
                        <Card key={suggestion.id} className="border border-gray-200 shadow-sm rounded-lg hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-900 line-clamp-2">
                                {suggestion.title}
                              </h4>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {suggestion.description}
                              </p>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => createFromSuggestion(suggestion)}
                                className="w-full"
                              >
                                Write This
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Posts;