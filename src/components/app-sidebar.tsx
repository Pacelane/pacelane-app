import React from 'react';
import { Plus, Home, User, Book, Calendar, HelpCircle, FileText } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
}

interface AppSidebarProps {
  userName: string;
  userAvatar: string;
  navigationItems: NavigationItem[];
  onCreateNew: () => void;
  onUserMenuClick: () => void;
  onNavigationClick: (itemId: string) => void;
  onFinishOnboarding: () => void;
  onHelpClick: () => void;
}

const iconMap = {
  home: Home,
  profile: User,
  knowledge: Book,
  calendar: Calendar,
  'file-text': FileText,
};

export function AppSidebar({
  userName,
  userAvatar,
  navigationItems,
  onCreateNew,
  onUserMenuClick,
  onNavigationClick,
  onFinishOnboarding,
  onHelpClick
}: AppSidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar className="bg-neutral-50 border-r border-[rgba(39,39,42,0.10)]">
      <SidebarHeader className="p-4 border-b border-[rgba(39,39,42,0.10)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-6 h-6">
            <img
              src={userAvatar}
              alt={`${userName} avatar`}
              className="w-6 h-6 rounded-full object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="text-[#111115] text-sm font-medium leading-5 flex-1">
              {userName}
            </div>
          )}
          <button
            onClick={onUserMenuClick}
            className="flex items-center justify-center w-5 h-5 hover:opacity-80 transition-opacity"
            aria-label="User menu"
          >
            <img
              src="https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/965b9229e671f1a9e024794010b2561698facefc?placeholderIfAbsent=true"
              alt=""
              className="w-4 h-4"
            />
          </button>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="px-4 pt-3">
            <button
              onClick={onCreateNew}
              className="flex items-center justify-center w-full min-h-8 gap-1 px-2.5 py-1.5 bg-white border border-[rgba(39,39,42,0.15)] rounded-md shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.08)_inset,0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {!isCollapsed && (
                <span className="text-[#111115] text-sm font-medium">
                  Create New
                </span>
              )}
            </button>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent className="px-4 pt-4">
            <SidebarMenu>
              {navigationItems.map((item) => {
                const IconComponent = iconMap[item.id as keyof typeof iconMap];
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => onNavigationClick(item.id)}
                      className={`flex items-center min-h-8 w-full gap-1.5 p-1.5 rounded-md transition-colors ${
                        item.isActive
                          ? 'bg-[rgba(83,210,190,0.10)] border border-[rgba(83,210,190,0.50)] shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.10)_inset,0px_1px_2px_0px_rgba(0,0,0,0.05)]'
                          : 'hover:bg-[rgba(39,39,42,0.05)]'
                      }`}
                    >
                      <div className="flex items-center justify-center w-5 h-5">
                        {IconComponent ? (
                          <IconComponent className="w-[18px] h-[18px]" />
                        ) : (
                          <img
                            src={item.icon}
                            alt=""
                            className="w-[18px] h-[18px] object-contain"
                          />
                        )}
                      </div>
                      {!isCollapsed && (
                        <span
                          className={`text-sm leading-5 ${
                            item.isActive
                              ? 'text-[#234E4A] font-bold'
                              : 'text-[#4E4E55] font-medium'
                          }`}
                        >
                          {item.label}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent className="px-5 py-4">
            <div className="border bg-[rgba(39,39,42,0.04)] p-3 rounded-lg border-[rgba(39,39,42,0.10)]">
              <h3 className="text-[#111115] text-2xl font-normal leading-8">
                Integrations
              </h3>
              <p className="text-[#4E4E55] text-sm font-normal leading-5 mt-2.5">
                We need your integrations in place to remind you.
              </p>
              <button
                onClick={onFinishOnboarding}
                className="flex items-center justify-center w-full gap-1 px-2 py-1 mt-2.5 bg-white border border-[rgba(39,39,42,0.15)] rounded-md shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.08)_inset,0px_1px_2px_0px_rgba(0,0,0,0.05)] hover:bg-gray-50 transition-colors"
              >
                <span className="text-[#111115] text-sm font-medium leading-5">
                  Finish Onboarding
                </span>
              </button>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-[rgba(39,39,42,0.10)]">
        <div className="flex items-center justify-between gap-2">
          <img
            src="https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/5b855089b85ea60c28ec2e191f4176fe5f0ca9a2?placeholderIfAbsent=true"
            alt="Logo"
            className="w-[84px] h-auto object-contain"
          />
          <button
            onClick={onHelpClick}
            className="flex items-center gap-1 px-2 py-1 bg-white border border-dashed border-[rgba(39,39,42,0.15)] rounded-md hover:bg-gray-50 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            {!isCollapsed && (
              <span className="text-[#111115] text-sm font-medium">
                Help
              </span>
            )}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}