import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ChevronLeft } from 'lucide-react';

const Goals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const goals = [
    'Build Authority',
    'Grow Network', 
    'Attract Clients',
    'Share Ideas',
    'Attract Opportunities',
    'Stay Visible',
    'Stay Relevant',
    'Become a Thought Leader'
  ];

  const handleGoBack = () => {
    navigate('/onboarding/inspirations');
  };

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev => 
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleContinue = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ goals: selectedGoals })
        .eq('user_id', user.id);

      if (error) throw error;

      navigate('/onboarding/guides');
    } catch (error) {
      console.error('Error saving goals:', error);
      toast({
        title: "Error",
        description: "Failed to save goals. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

          {/* Blue blob icon with eyes */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-400 rounded-full flex items-center justify-center relative overflow-hidden">
              {/* Main blob shape */}
              <div className="w-12 h-12 bg-blue-400 rounded-full relative">
                {/* Eyes */}
                <div className="absolute top-3 left-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="absolute top-3 right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
              {/* Side protrusions */}
              <div className="absolute -top-2 -left-1 w-6 h-6 bg-blue-400 rounded-full"></div>
              <div className="absolute -bottom-1 -right-2 w-4 h-4 bg-blue-400 rounded-full"></div>
              <div className="absolute top-1 -right-1 w-5 h-5 bg-blue-400 rounded-full"></div>
            </div>
          </div>

          <h1 className="text-4xl font-bold font-playfair text-[#111115] mb-2 text-center">
            What Are<br />Your Goals?
          </h1>

          <p className="text-[#4E4E55] text-sm text-center leading-relaxed mb-8">
            Why Do You Want to Share Content? We'll tailor<br />
            your plan to help you reach your goals.
          </p>

          {/* Goals Selection */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {goals.map((goal) => (
              <button
                key={goal}
                onClick={() => toggleGoal(goal)}
                className={`px-4 py-3 rounded-full border text-center text-sm font-medium transition-all ${
                  selectedGoals.includes(goal)
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {goal}
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
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <Button 
            onClick={handleContinue}
            disabled={selectedGoals.length === 0 || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Goals;