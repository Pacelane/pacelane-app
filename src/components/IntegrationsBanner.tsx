import React from 'react';

interface IntegrationsBannerProps {
  onFinishOnboarding: () => void;
}

export const IntegrationsBanner: React.FC<IntegrationsBannerProps> = ({ onFinishOnboarding }) => {
  return (
    <section className="items-stretch flex w-full flex-col text-sm text-[#111115] justify-center gap-2 px-5 py-4">
      <div className="border w-full gap-2.5 bg-[rgba(39,39,42,0.04)] p-3 rounded-lg border-solid border-[rgba(39,39,42,0.10)]">
        <h3 className="text-[#111115] text-2xl font-normal leading-8">
          Integrations
        </h3>
        <p className="text-[#4E4E55] text-sm font-normal leading-5 mt-2.5">
          We need your integrations in place to remind you.
        </p>
        <button
          onClick={onFinishOnboarding}
          className="justify-center items-center border shadow-[0px_-1px_0px_0px_rgba(0,0,0,0.08)_inset,0px_1px_2px_0px_rgba(0,0,0,0.05)] flex w-full gap-1 overflow-hidden font-medium leading-none bg-white mt-2.5 px-2 py-1 rounded-md border-solid border-[rgba(39,39,42,0.15)] hover:bg-gray-50 transition-colors"
        >
          <div className="justify-center items-center self-stretch flex my-auto px-0.5 py-0">
            <div className="text-[#111115] text-sm font-medium leading-5 self-stretch my-auto">
              Finish Onboarding
            </div>
          </div>
        </button>
      </div>
    </section>
  );
};
