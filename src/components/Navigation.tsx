import React from 'react';

interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  isActive?: boolean;
}

interface NavigationProps {
  items: NavigationItem[];
  onItemClick: (itemId: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ items, onItemClick }) => {
  return (
    <nav className="w-full gap-0.5 pt-4 pb-2 px-4">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onItemClick(item.id)}
          className={`items-center flex min-h-8 w-full gap-1.5 p-1.5 rounded-md transition-colors ${
            item.isActive
              ? 'border shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.10)_inset,0px_1px_2px_0px_rgba(0,0,0,0.05)] bg-[rgba(83,210,190,0.10)] border-solid border-[rgba(83,210,190,0.50)]'
              : 'bg-[rgba(39,39,42,0.00)] hover:bg-[rgba(39,39,42,0.05)]'
          }`}
        >
          <div className="self-stretch flex min-h-5 items-center justify-center w-5 my-auto">
            <img
              src={item.icon}
              alt=""
              className="aspect-[1] object-contain w-[18px] self-stretch my-auto"
            />
          </div>
          <div className="items-center self-stretch flex text-sm whitespace-nowrap leading-none flex-1 shrink basis-[0%] my-auto px-1 py-0">
            <div
              className={`text-sm leading-5 self-stretch my-auto ${
                item.isActive
                  ? 'text-[#234E4A] font-bold'
                  : 'text-[#4E4E55] font-medium'
              }`}
            >
              {item.label}
            </div>
          </div>
        </button>
      ))}
    </nav>
  );
};
