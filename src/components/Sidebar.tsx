import React from 'react';
import { UserBar } from './UserBar';
import { Navigation } from './Navigation';
import { IntegrationsBanner } from './IntegrationsBanner';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
}

interface SidebarProps {
  userName: string;
  userAvatar: string;
  navigationItems: NavigationItem[];
  onCreateNew: () => void;
  onUserMenuClick: () => void;
  onNavigationClick: (itemId: string) => void;
  onFinishOnboarding: () => void;
  onHelpClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  userName,
  userAvatar,
  navigationItems,
  onCreateNew,
  onUserMenuClick,
  onNavigationClick,
  onFinishOnboarding,
  onHelpClick
}) => {
  return (
    <aside className="min-w-60 grow shrink w-56 bg-neutral-50 border-r-[rgba(39,39,42,0.10)] border-r border-solid">
      <UserBar
        userName={userName}
        avatarUrl={userAvatar}
        onUserMenuClick={onUserMenuClick}
      />
      
      <div className="w-full text-sm text-[#111115] font-medium leading-none gap-0.5 pt-3 pb-0 px-4">
        <button
          onClick={onCreateNew}
          className="justify-center items-center border shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.08)_inset,0px_1px_2px_0px_rgba(0,0,0,0.05)] flex min-h-8 w-full gap-1 overflow-hidden bg-white px-2.5 py-1.5 rounded-md border-solid border-[rgba(39,39,42,0.15)] hover:bg-gray-50 transition-colors"
        >
          <img
            src="https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/8acb31d7a0dee5a0d8a35256e4710b9fb3b24366?placeholderIfAbsent=true"
            alt=""
            className="aspect-[1] object-contain w-4 self-stretch shrink-0 my-auto"
          />
          <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0">
            <div className="text-[#111115] text-sm font-medium leading-5 self-stretch my-auto">
              Create New
            </div>
          </div>
        </button>
      </div>
      
      <div className="w-full overflow-hidden flex-1">
        <Navigation
          items={navigationItems}
          onItemClick={onNavigationClick}
        />
      </div>
      
      <IntegrationsBanner onFinishOnboarding={onFinishOnboarding} />
      
      <footer className="justify-between items-center flex w-full gap-[40px_91px] text-sm text-[#111115] font-medium whitespace-nowrap leading-none p-4 border-t-[rgba(39,39,42,0.10)] border-t border-solid">
        <img
          src="https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/5b855089b85ea60c28ec2e191f4176fe5f0ca9a2?placeholderIfAbsent=true"
          alt="Logo"
          className="aspect-[3] object-contain w-[84px] shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.08)_inset,0px_1px_2px_0px_rgba(0,0,0,0.05)] self-stretch shrink-0 my-auto p-0"
        />
        <button
          onClick={onHelpClick}
          className="justify-center items-center border self-stretch flex gap-1 overflow-hidden bg-white my-auto px-2 py-1 rounded-md border-dashed border-[rgba(39,39,42,0.15)] hover:bg-gray-50 transition-colors"
        >
          <img
            src="https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/e0f4f49a2384e05aa145130322ccad3295028872?placeholderIfAbsent=true"
            alt=""
            className="aspect-[1] object-contain w-4 self-stretch shrink-0 my-auto"
          />
          <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0">
            <div className="text-[#111115] text-sm font-medium leading-5 self-stretch my-auto">
              Help
            </div>
          </div>
        </button>
      </footer>
    </aside>
  );
};
