import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Search" }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '/') {
      e.preventDefault();
      const input = e.currentTarget as HTMLInputElement;
      input.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="self-stretch min-w-60 text-[#6F6F77] whitespace-nowrap w-[420px] gap-2 my-auto p-0">
      <div className="justify-center items-center flex w-full overflow-hidden bg-[rgba(39,39,42,0.06)] rounded-lg">
        <div className="justify-center items-center self-stretch flex min-w-60 w-full gap-1.5 overflow-hidden flex-1 shrink basis-[0%] my-auto px-2 py-1.5">
          <div className="items-center self-stretch flex min-w-60 gap-0.5 text-sm font-normal leading-none flex-1 shrink basis-[0%] my-auto">
            <div className="items-center self-stretch flex min-w-60 w-full flex-1 shrink basis-[0%] my-auto px-1 py-0">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="text-[#6F6F77] text-sm font-normal leading-5 self-stretch my-auto bg-transparent border-none outline-none w-full"
                aria-label="Search templates"
              />
            </div>
          </div>
          <div className="min-w-5 justify-center items-center rounded border self-stretch flex min-h-5 text-xs font-medium leading-none w-5 h-5 my-auto px-1 py-0 border-solid border-[rgba(39,39,42,0.10)]">
            <div className="text-[#6F6F77] text-xs font-medium leading-4 self-stretch my-auto">
              /
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
