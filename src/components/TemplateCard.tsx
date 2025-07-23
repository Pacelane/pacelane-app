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
        className="justify-center items-center border flex min-h-[140px] w-48 flex-col text-sm text-[#4E4E55] font-medium leading-none gap-3 bg-white px-2.5 py-8 rounded-2xl border-dashed border-[rgba(39,39,42,0.15)] hover:bg-gray-50 transition-colors"
      >
        <img
          src={icon}
          alt=""
          className="aspect-[1] object-contain w-12"
        />
        <div className="text-[#4E4E55] text-sm font-medium leading-5 mt-4">
          {title}
        </div>
      </button>
    );
  }

  return (
    <article
      className="border shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.10)_inset,0px_1px_2px_0px_rgba(0,0,0,0.05)] w-48 min-h-[140px] gap-3 bg-white p-4 rounded-2xl border-solid border-[rgba(39,39,42,0.10)] cursor-pointer hover:shadow-lg transition-shadow"
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
        className="aspect-[1] object-contain w-7"
      />
      <div className="w-full gap-2 mt-3">
        <h3 className="text-[#111115] text-xl font-medium leading-7">
          {title}
        </h3>
        <p className="text-[#4E4E55] text-sm font-normal leading-5 mt-2">
          {description}
        </p>
      </div>
    </article>
  );
};
