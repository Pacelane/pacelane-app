import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Welcome = () => {
  const navigate = useNavigate();

  const handleLetsStart = () => {
    navigate('/onboarding/first-things-first');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          {/* Green blob icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 bg-green-600 rounded-full"></div>
            </div>
          </div>

          <h1 className="text-4xl font-bold font-playfair text-[#111115] mb-4">
            Welcome!
          </h1>

          <p className="text-[#4E4E55] text-sm leading-relaxed mb-8">
            We want to help you show up consistently on<br />
            LinkedIn with content that feels like you.
          </p>

          <p className="text-[#4E4E55] text-sm mb-8">
            We'll ask a few questions to tailor your strategy.
          </p>

          <Button 
            onClick={handleLetsStart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg"
          >
            Let's Start →
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;