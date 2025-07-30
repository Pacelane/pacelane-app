import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/api/useProfile';
import { useToast } from '@/components/ui/use-toast';

const ContentPillars = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { saveContentPillars, saving } = useProfile();
  const { toast } = useToast();
  const [selectedPillars, setSelectedPillars] = useState<string[]>([]);

  const pillars = [
    'Insights', 'Trends', 'Reflections On News',
    'How-Tos', 'Opinions', 'Personal Stories',
    'Career Lessons', 'BTS', 'Culture & Teamwork',
    'Strategies', 'Innovation', 'Networking',
    'Client Stories', 'Work Hacks', 'Lifelong Learning',
    'Memes & Humor'
  ];

  const handleGoBack = () => {
    navigate('/onboarding/guides');
  };

  const togglePillar = (pillar: string) => {
    setSelectedPillars(prev => 
      prev.includes(pillar)
        ? prev.filter(p => p !== pillar)
        : [...prev, pillar]
    );
  };

  const handleContinue = async () => {
    if (!user) return;
    
    try {
      // Use our clean content pillars API
      const result = await saveContentPillars({
        selectedPillars
      });

      if (result.error) {
        throw new Error(result.error);
      }

      navigate('/onboarding/pacing');
    } catch (error: any) {
      console.error('Error saving content pillars:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save content pillars. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Go Back Button */}
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Go Back
          </button>

          {/* Red flower icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center relative overflow-hidden">
              <div className="w-8 h-8 bg-red-500 rounded-full relative">
                <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full"></div>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-500 rounded-full"></div>
              <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full"></div>
              <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-4 h-4 bg-red-500 rounded-full"></div>
            </div>
          </div>

          <h1 className="text-4xl font-bold font-playfair text-[#111115] mb-2 text-center">
            Content Pillars
          </h1>

          <p className="text-[#4E4E55] text-sm text-center leading-relaxed mb-8">
            These pillars will help us create your content plan<br />
            so we stay on formats you like to use
          </p>

          {/* Pillars Selection */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {pillars.map((pillar) => (
              <button
                key={pillar}
                onClick={() => togglePillar(pillar)}
                className={`px-3 py-2 rounded-full border text-center text-sm font-medium transition-all ${
                  selectedPillars.includes(pillar)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {pillar}
              </button>
            ))}
          </div>

          <p className="text-[#4E4E55] text-sm text-center mb-8">
            We'll ask a few questions to tailor your strategy.
          </p>

          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <Button 
            onClick={handleContinue}
                          disabled={selectedPillars.length === 0 || saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg disabled:opacity-50"
          >
                          {saving ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContentPillars;