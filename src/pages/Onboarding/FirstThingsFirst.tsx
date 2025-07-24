import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FirstThingsFirst = () => {
  const navigate = useNavigate();
  const [linkedinProfile, setLinkedinProfile] = useState('');
  const [companyLinkedin, setCompanyLinkedin] = useState('');

  const handleGoBack = () => {
    navigate('/onboarding/welcome');
  };

  const handleContinue = () => {
    // For now, navigate to the main app
    // Later this can be expanded to more onboarding steps
    navigate('/product-home');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Go Back button */}
        <button 
          onClick={handleGoBack}
          className="flex items-center gap-2 text-[#4E4E55] text-sm mb-6 hover:text-[#111115] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Blue blob icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </div>
          </div>

          <h1 className="text-4xl font-bold font-playfair text-[#111115] mb-4 text-center">
            First Things First
          </h1>

          <p className="text-[#4E4E55] text-sm text-center mb-8 leading-relaxed">
            Tell Us About You. We'll use this to analyze your<br />
            LinkedIn and match your style.
          </p>

          <div className="space-y-6">
            <div>
              <Label htmlFor="linkedin-profile" className="text-[#111115] text-sm font-medium mb-2 block">
                Your LinkedIn Profile <span className="text-red-500">*</span>
              </Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-[#4E4E55] bg-gray-50 border border-r-0 border-gray-200 rounded-l-md">
                  https://
                </span>
                <Input
                  id="linkedin-profile"
                  type="text"
                  placeholder="www.linkedin.com/in/"
                  value={linkedinProfile}
                  onChange={(e) => setLinkedinProfile(e.target.value)}
                  className="flex-1 rounded-l-none border-l-0"
                />
                <span className="inline-flex items-center px-3 text-sm text-[#4E4E55] bg-gray-50 border border-l-0 border-gray-200 rounded-r-md">
                  .com
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="company-linkedin" className="text-[#111115] text-sm font-medium mb-2 block">
                Your Company's LinkedIn
              </Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 text-sm text-[#4E4E55] bg-gray-50 border border-r-0 border-gray-200 rounded-l-md">
                  https://
                </span>
                <Input
                  id="company-linkedin"
                  type="text"
                  placeholder="www.linkedin.com/in/"
                  value={companyLinkedin}
                  onChange={(e) => setCompanyLinkedin(e.target.value)}
                  className="flex-1 rounded-l-none border-l-0"
                />
                <span className="inline-flex items-center px-3 text-sm text-[#4E4E55] bg-gray-50 border border-l-0 border-gray-200 rounded-r-md">
                  .com
                </span>
              </div>
            </div>
          </div>

          <p className="text-[#4E4E55] text-sm text-center mt-8 mb-8">
            We'll ask a few questions to tailor your strategy.
          </p>

          <Button 
            onClick={handleContinue}
            disabled={!linkedinProfile.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FirstThingsFirst;