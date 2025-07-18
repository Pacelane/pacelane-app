import React from 'react';

interface UserBarProps {
  userName: string;
  avatarUrl: string;
  onUserMenuClick: () => void;
}

export const UserBar: React.FC<UserBarProps> = ({ userName, avatarUrl, onUserMenuClick }) => {
  return (
    <div className="items-center flex w-full max-w-[280px] gap-3 bg-[rgba(39,39,42,0.00)] px-4 py-3 border-b-[rgba(39,39,42,0.10)] border-b border-solid">
      <div className="self-stretch flex items-center justify-center w-6 my-auto">
        <img
          src={avatarUrl}
          alt={`${userName} avatar`}
          className="aspect-[1/1] object-contain w-6 self-stretch my-auto p-0"
        />
      </div>
      <div className="text-[#111115] text-sm font-medium leading-5 self-stretch flex-1 shrink basis-[0%] my-auto">
        {userName}
      </div>
      <button
        onClick={onUserMenuClick}
        className="self-stretch flex min-h-5 items-center justify-center w-5 my-auto hover:opacity-80 transition-opacity"
        aria-label="User menu"
      >
        <img
          src="https://api.builder.io/api/v1/image/assets/33e5c0ee54254724b25b444ecf442f35/965b9229e671f1a9e024794010b2561698facefc?placeholderIfAbsent=true"
          alt=""
          className="aspect-[1] object-contain w-4 self-stretch my-auto"
        />
      </button>
    </div>
  );
};
