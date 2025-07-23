import React from 'react';

interface TemplateCardProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
  isStartFromScratch?: boolean;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ 
  title, 
  description, 
  icon, 
  onClick, 
  isStartFromScratch = false 
}) => {
  if (isStartFromScratch) {
    return (
      <button
        onClick={onClick}
        className="justify-center items-center border flex min-h-[120px] w-40 flex-col text-sm text-[#4E4E55] font-medium leading-none gap-2 bg-white px-2 py-6 rounded-2xl border-dashed border-[rgba(39,39,42,0.15)] hover:bg-gray-50 transition-colors"
      >
        <img
          src={icon}
          alt=""
          className="aspect-[1] object-contain w-10"
        />
        <div className="text-[#4E4E55] text-xs font-medium leading-4 mt-2">
          {title}
        </div>
      </button>
    );
  }

  return (
    <article
      className="border shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.10)_inset,0px_1px_2px_0px_rgba(0,0,0,0.05)] w-40 min-h-[120px] gap-2 bg-white p-3 rounded-2xl border-solid border-[rgba(39,39,42,0.10)] cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <img
        src={icon}
        alt=""
        className="aspect-[1] object-contain w-6"
      />
      <div className="w-full gap-1 mt-2">
        <h3 className="text-[#111115] text-lg font-medium leading-6">
          {title}
        </h3>
        <p className="text-[#4E4E55] text-xs font-normal leading-4 mt-1">
          {description}
        </p>
      </div>
    </article>
  );
};
