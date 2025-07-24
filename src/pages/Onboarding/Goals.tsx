import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const Goals = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
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
      // Update the profile to mark onboarding as completed
      const { error } = await supabase
        .from('profiles')
        .update({ 
          onboarding_completed: true,
          linkedin_data: {
            ...{}, // Keep existing linkedin_data if any
            goals: selectedGoals
          }
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh the profile in context
      await refreshProfile();

      toast({
        title: "Onboarding completed!",
        description: "Welcome to your product dashboard.",
      });

      navigate('/product-home');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding. Please try again.",
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

          {/* Blue blob icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center relative">
              <div className="w-8 h-8 bg-blue-600 rounded-full"></div>
              <div className="absolute top-3 left-3 w-2 h-2 bg-blue-300 rounded-full"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 bg-blue-400 rounded-full"></div>
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
          <div className="space-y-3 mb-8">
            {goals.map((goal) => (
              <button
                key={goal}
                onClick={() => toggleGoal(goal)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  selectedGoals.includes(goal)
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className="text-sm font-medium">{goal}</span>
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
          </div>

          <Button 
            onClick={handleContinue}
            disabled={selectedGoals.length === 0 || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg disabled:opacity-50"
          >
            {isLoading ? "Completing..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Goals;