import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X } from 'lucide-react';

const Inspirations = () => {
  const navigate = useNavigate();
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [inspirations, setInspirations] = useState<string[]>([]);

  const handleGoBack = () => {
    navigate('/onboarding/first-things-first');
  };

  const handleAddBenchmark = () => {
    if (linkedinUrl.trim() && !inspirations.includes(linkedinUrl.trim())) {
      setInspirations([...inspirations, linkedinUrl.trim()]);
      setLinkedinUrl('');
    }
  };

  const handleRemoveInspiration = (index: number) => {
    setInspirations(inspirations.filter((_, i) => i !== index));
  };

  const handleContinue = () => {
    navigate('/onboarding/goals');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddBenchmark();
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

          {/* Green blob icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center relative">
              <div className="w-8 h-8 bg-green-600 rounded-full"></div>
              <div className="absolute top-2 right-2 w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
          </div>

          <h1 className="text-4xl font-bold font-playfair text-[#111115] mb-4 text-center">
            Inspirations
          </h1>

          <p className="text-[#4E4E55] text-sm text-center leading-relaxed mb-8">
            Tell us what are the profiles on LinkedIn that you<br />
            admire, and want to be more like
          </p>

          {/* LinkedIn Profile Input */}
          <div className="mb-4">
            <label className="block text-[#111115] text-sm font-medium mb-2">
              LinkedIn Profile <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="www.linkedin.com/in/"
                className="w-full bg-white border-[rgba(39,39,42,0.15)] text-sm"
              />
            </div>
          </div>

          {/* Add Benchmark Button */}
          <Button
            onClick={handleAddBenchmark}
            variant="outline"
            className="w-full mb-6 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
            disabled={!linkedinUrl.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Benchmark
          </Button>

          {/* Added Inspirations List */}
          {inspirations.length > 0 && (
            <div className="mb-6 space-y-2">
              {inspirations.map((inspiration, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <span className="text-sm text-gray-700 truncate flex-1">
                    {inspiration}
                  </span>
                  <button
                    onClick={() => handleRemoveInspiration(index)}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <p className="text-[#4E4E55] text-sm text-center mb-8">
            We'll ask a few questions to tailor your strategy.
          </p>

          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <Button 
            onClick={handleContinue}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Inspirations;