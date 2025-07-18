import React from 'react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  image: string;
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({ 
  quote, 
  author, 
  role, 
  image 
}) => {
  return (
    <div className="items-stretch flex w-[525px] max-w-full gap-2 flex-wrap">
      <div className="items-center border shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.10)_inset,0px_1px_2px_0px_rgba(0,0,0,0.05)] flex min-w-60 gap-[38px] flex-1 shrink basis-[0%] bg-white my-auto p-8 rounded-xl border-solid border-[rgba(39,39,42,0.10)] max-md:px-5">
        <div className="self-stretch min-w-60 w-full flex-1 shrink basis-[0%] gap-2 my-auto">
          <blockquote className="text-[#2067A4] text-xl font-semibold leading-7">
            "{quote}"
          </blockquote>
          <cite className="text-[#6F6F77] text-sm font-medium leading-5 mt-2 not-italic">
            {author} • {role}
          </cite>
        </div>
      </div>
      <img
        src={image}
        alt={`${author} testimonial`}
        className="aspect-[0.94] object-contain w-[139px] shrink-0"
      />
    </div>
  );
};