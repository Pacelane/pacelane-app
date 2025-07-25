import React, { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { ContentSuggestions } from '@/components/ContentSuggestions';
import { TemplateGrid } from '@/components/TemplateGrid';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Settings, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Template {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
}

const ProductHome = () => {
  const navigate = useNavigate();
  const [activeNavItem, setActiveNavItem] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

  const navigationItems: NavigationItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home',
      isActive: activeNavItem === 'home'
    },
    {
      id: 'posts',
      label: 'Posts',
      icon: 'knowledge',
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

  const templates: Template[] = [
    {
      id: 'personal-story-1',
      title: 'Personal Story',
      description: 'Create connection with your audience telling a story about your personal life',
      icon: 'https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/03bdf692d22293308983a6affc1ce250d82f8ebf?placeholderIfAbsent=true'
    },
    {
      id: 'challenge-week-1',
      title: 'Challenge of The Week',
      description: 'Tell about what was the most challenging thing you did this week and what you did to overcome it',
      icon: 'https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/8c9ca2642ebaffcc8667925dfc334dedfe589f65?placeholderIfAbsent=true'
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
    if (itemId === 'profile') {
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

  const handleNotificationClick = () => {
    console.log('Notification clicked');
  };

  const handleSettingsClick = () => {
    console.log('Settings clicked');
  };

  const handleSendMessage = (message: string) => {
    console.log('Message sent:', message);
    // Here you would typically send the message to your backend
  };

  const handleWriteContent = (suggestion: { id: string; title: string; description?: string; suggested_outline?: string }) => {
    navigate('/content-editor', { 
      state: { suggestion } 
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    navigate('/content-editor');
  };

  const handleStartFromScratch = () => {
    navigate('/content-editor');
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
                  placeholder="Search"
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
                  onClick={handleNotificationClick}
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
                  onClick={handleSettingsClick}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </header>
          
          <div className="flex-1 bg-gray-50">
            <div className="flex flex-col min-h-[calc(100vh-4rem)]">
              <div className="pt-8">
                <ContentSuggestions onWriteContent={handleWriteContent} />
              </div>
              <div className="flex-1">
                <ChatInterface onSendMessage={handleSendMessage} />
              </div>
              <div className="w-full max-w-2xl mx-auto p-4 pb-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-normal text-gray-900 mb-2 font-playfair">or choose from templates</h2>
                  <p className="text-gray-600">Get started quickly with our pre-designed templates</p>
                </div>
                <TemplateGrid
                  templates={templates}
                  onTemplateSelect={handleTemplateSelect}
                  onStartFromScratch={handleStartFromScratch}
                />
              </div>
            </div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ProductHome;