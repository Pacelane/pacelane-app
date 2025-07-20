import React, { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Upload, ChevronDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface KnowledgeItem {
  id: string;
  title: string;
  type: 'file' | 'image' | 'audio' | 'video' | 'link' | 'transcript';
  addedDate: string;
  thumbnail?: string;
  color?: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
}

const KnowledgeBase = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavItem, setActiveNavItem] = useState('knowledge');
  const [linkInput, setLinkInput] = useState('');

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

  const knowledgeItems: KnowledgeItem[] = [
    {
      id: '1',
      title: 'My Content Title Here',
      type: 'file',
      addedDate: 'March 13, 2025',
      color: 'bg-purple-500'
    },
    {
      id: '2',
      title: 'My Content Title Here',
      type: 'file',
      addedDate: 'March 13, 2025',
      color: 'bg-red-500'
    },
    {
      id: '3',
      title: 'My Content Title Here',
      type: 'image',
      addedDate: 'March 13, 2025',
      thumbnail: '/lovable-uploads/c7f1a80c-3321-4aef-9af4-dcfd4ecdf9a5.png'
    },
    {
      id: '4',
      title: 'My Content Title Here',
      type: 'file',
      addedDate: 'March 13, 2025',
      color: 'bg-red-500'
    },
    {
      id: '5',
      title: 'My Content Title Here',
      type: 'file',
      addedDate: 'March 13, 2025',
      color: 'bg-purple-500'
    }
  ];

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'files', label: 'Files' },
    { id: 'images', label: 'Images' },
    { id: 'audios', label: 'Audios' },
    { id: 'videos', label: 'Videos' },
    { id: 'links', label: 'Links' },
    { id: 'transcripts', label: 'Transcripts' }
  ];

  const handleCreateNew = () => {
    console.log('Create new clicked');
  };

  const handleUserMenuClick = () => {
    console.log('User menu clicked');
  };

  const handleNavigationClick = (itemId: string) => {
    setActiveNavItem(itemId);
    console.log('Navigation clicked:', itemId);
  };

  const handleFinishOnboarding = () => {
    console.log('Finish onboarding clicked');
  };

  const handleHelpClick = () => {
    console.log('Help clicked');
  };

  const handleFileUpload = () => {
    console.log('File upload clicked');
  };

  const handleLinkSubmit = () => {
    console.log('Link submitted:', linkInput);
  };

  const filteredItems = knowledgeItems.filter(item => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'files') return item.type === 'file';
    if (activeFilter === 'images') return item.type === 'image';
    if (activeFilter === 'audios') return item.type === 'audio';
    if (activeFilter === 'videos') return item.type === 'video';
    if (activeFilter === 'links') return item.type === 'link';
    if (activeFilter === 'transcripts') return item.type === 'transcript';
    return true;
  });

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
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-2">
                    Drop your files here, or{' '}
                    <button 
                      onClick={handleFileUpload}
                      className="text-blue-600 hover:underline"
                    >
                      click to browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-400">Up to 10 files, 100MB total limit</p>
                </div>

                <div className="flex items-center justify-center my-6">
                  <div className="flex-1 border-t border-gray-200"></div>
                  <span className="px-4 text-gray-500">or</span>
                  <div className="flex-1 border-t border-gray-200"></div>
                </div>

                <div className="text-center">
                  <p className="text-gray-600 mb-4">Drop a link to a website</p>
                  <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
                    <span className="text-gray-500">https://</span>
                    <Input
                      placeholder="Search"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-gray-500">.com</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video relative">
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className={`w-full h-full ${item.color} flex items-center justify-center`}>
                          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <div className="w-8 h-8 bg-white rounded-full"></div>
                          </div>
                        </div>
                      )}
                      <Badge className="absolute top-3 right-3 bg-green-100 text-green-800 hover:bg-green-100">
                        ✓ Ready to Use
                      </Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-500">Added {item.addedDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default KnowledgeBase;