import React, { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { ChatInterface } from '@/components/ChatInterface';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Settings, Search } from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
}

const ProductHome = () => {
  const [activeNavItem, setActiveNavItem] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');

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
            <ChatInterface onSendMessage={handleSendMessage} />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ProductHome;