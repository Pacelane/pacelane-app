import React, { useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { MainContent } from '@/components/MainContent';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

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

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNavItem, setActiveNavItem] = useState('home');

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

  const templates: Template[] = [
    {
      id: 'personal-story-1',
      title: 'Personal Story',
      description: 'Create connection with your audience telling a story about your personal life',
      icon: 'https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/03bdf692d22293308983a6affc1ce250d82f8ebf?placeholderIfAbsent=true'
    },
    {
      id: 'personal-story-2',
      title: 'Personal Story',
      description: 'Create connection with your audience telling a story about your personal life',
      icon: 'https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/29cecf9aeb93adfc682992d12fc2eacdfa96ffd5?placeholderIfAbsent=true'
    },
    {
      id: 'challenge-week-1',
      title: 'Challenge of The Week',
      description: 'Tell about what was the most challenging thing you did this week and what you did to overcome it',
      icon: 'https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/8c9ca2642ebaffcc8667925dfc334dedfe589f65?placeholderIfAbsent=true'
    },
    {
      id: 'personal-story-3',
      title: 'Personal Story',
      description: 'Create connection with your audience telling a story about your personal life',
      icon: 'https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/9aa0ba25748d53cebcb3b92152c392efc324056d?placeholderIfAbsent=true'
    },
    {
      id: 'personal-story-4',
      title: 'Personal Story',
      description: 'Create connection with your audience telling a story about your personal life',
      icon: 'https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/26bc652ac3f23f23c6c4f0858bf491e86b046b94?placeholderIfAbsent=true'
    },
    {
      id: 'challenge-week-2',
      title: 'Challenge of The Week',
      description: 'Tell about what was the most challenging thing you did this week and what you did to overcome it',
      icon: 'https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/5f3092ff4e0e76087438a7c421ee41482b395ad4?placeholderIfAbsent=true'
    }
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log('Searching for:', query);
  };

  const handleTemplateSelect = (templateId: string) => {
    console.log('Selected template:', templateId);
  };

  const handleStartFromScratch = () => {
    console.log('Starting from scratch');
  };

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
          <MainContent
            templates={templates}
            onSearch={handleSearch}
            onTemplateSelect={handleTemplateSelect}
            onStartFromScratch={handleStartFromScratch}
            onNotificationClick={handleNotificationClick}
            onSettingsClick={handleSettingsClick}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Home;
