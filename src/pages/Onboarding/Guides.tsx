import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft, Trash2 } from 'lucide-react';

const Guides = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [guides, setGuides] = useState<string[]>([
    'Be Honest About Challenges',
    'Promote Ideas, Not Just Myself',
    'Avoid buzzwords and empty phrases'
  ]);
  const [newGuide, setNewGuide] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoBack = () => {
    navigate('/onboarding/goals');
  };

  const handleAddGuide = () => {
    if (newGuide.trim()) {
      setGuides([...guides, newGuide.trim()]);
      setNewGuide('');
    }
  };

  const handleRemoveGuide = (index: number) => {
    setGuides(guides.filter((_, i) => i !== index));
  };

  const handleContinue = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ content_guides: guides })
        .eq('user_id', user.id);

      if (error) throw error;

      navigate('/onboarding/content-pillars');
    } catch (error) {
      console.error('Error saving guides:', error);
      toast({
        title: "Error",
        description: "Failed to save guides. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddGuide();
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

          {/* Blue blob icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center relative overflow-hidden">
              <div className="w-12 h-12 bg-blue-400 rounded-full relative">
                <div className="absolute top-3 left-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="absolute top-3 right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              <div className="absolute -top-2 -left-1 w-6 h-6 bg-blue-400 rounded-full"></div>
              <div className="absolute -bottom-1 -right-2 w-4 h-4 bg-blue-400 rounded-full"></div>
              <div className="absolute top-1 -right-1 w-5 h-5 bg-blue-400 rounded-full"></div>
            </div>
          </div>

          <h1 className="text-4xl font-bold font-playfair text-[#111115] mb-2 text-center">
            What Are<br />Your Guides?
          </h1>

          <p className="text-[#4E4E55] text-sm text-center leading-relaxed mb-8">
            What values guide the way you want to create<br />
            content? (For example: be authentic, share your<br />
            experience, avoid hype)
          </p>

          {/* Guides List */}
          <div className="space-y-3 mb-6">
            {guides.map((guide, index) => (
              <div
                key={index}
                className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg"
              >
                <span className="text-sm text-gray-700">{guide}</span>
                <button
                  onClick={() => handleRemoveGuide(index)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Guide */}
          <div className="flex gap-2 mb-8">
            <Input
              type="text"
              placeholder="Add a principle..."
              value={newGuide}
              onChange={(e) => setNewGuide(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 border-gray-200"
            />
            <Button
              onClick={handleAddGuide}
              variant="outline"
              className="px-4 border-gray-300 hover:bg-gray-100"
            >
              + Add Principle
            </Button>
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
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <Button 
            onClick={handleContinue}
            disabled={guides.length === 0 || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Guides;