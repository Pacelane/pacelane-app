import React from 'react';
import { SearchBar } from './SearchBar';
import { TemplateGrid } from './TemplateGrid';

interface Template {
  id: string;
  title: string;
  description: string;
  icon: string;
}

interface MainContentProps {
  templates: Template[];
  onSearch: (query: string) => void;
  onTemplateSelect: (templateId: string) => void;
  onStartFromScratch: () => void;
  onNotificationClick: () => void;
  onSettingsClick: () => void;
}

export const MainContent: React.FC<MainContentProps> = ({
  templates,
  onSearch,
  onTemplateSelect,
  onStartFromScratch,
  onNotificationClick,
  onSettingsClick
}) => {
  return (
    <main className="flex-1 bg-neutral-50">
      <div className="justify-between items-center flex min-h-16 w-full gap-[40px_100px] flex-wrap bg-neutral-50 px-10 py-4 max-md:max-w-full max-md:px-5">
        <SearchBar onSearch={onSearch} />
        <div className="items-center self-stretch flex gap-2 my-auto">
          <button
            onClick={onNotificationClick}
            className="aspect-[1] object-contain w-8 self-stretch shrink-0 my-auto hover:opacity-80 transition-opacity"
            aria-label="Notifications"
          >
            <img
              src="https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/4fa1654e534654ffcc11adb83392c17100b988e0?placeholderIfAbsent=true"
              alt=""
              className="aspect-[1] object-contain w-8"
            />
          </button>
          <button
            onClick={onSettingsClick}
            className="min-w-8 justify-center items-center border shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.08)_inset,0px_1px_2px_0px_rgba(0,0,0,0.05)] self-stretch flex min-h-8 overflow-hidden w-8 h-8 bg-white my-auto p-0 rounded-md border-solid border-[rgba(39,39,42,0.15)] hover:bg-gray-50 transition-colors"
            aria-label="Settings"
          >
            <img
              src="https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/2a73fb32db8bc987033a356860095c237815ea0d?placeholderIfAbsent=true"
              alt=""
              className="aspect-[1] object-contain w-5 self-stretch my-auto"
            />
          </button>
        </div>
      </div>
      
      <div className="justify-center items-stretch flex w-full flex-col flex-1 gap-9 bg-neutral-50 px-40 py-0 max-md:max-w-full max-md:px-5">
        <div className="gap-3 max-md:max-w-full">
          <h1 className="text-[#111115] text-5xl font-normal leading-[48px] tracking-[-0.96px] max-md:max-w-full max-md:text-[40px]">
            How do you want to start?
          </h1>
          <p className="text-[#4E4E55] text-sm font-normal leading-5 mt-3">
            Select a template or start from scratch.
          </p>
        </div>
        
        <TemplateGrid
          templates={templates}
          onTemplateSelect={onTemplateSelect}
          onStartFromScratch={onStartFromScratch}
        />
      </div>
    </main>
  );
};
