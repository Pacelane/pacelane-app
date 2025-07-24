import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const Ready = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoBack = () => {
    navigate('/onboarding/contact');
  };

  const handleStart = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Mark onboarding as completed
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Animated confetti background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="animate-pulse absolute top-10 left-10 w-4 h-4 bg-yellow-400 rounded-full opacity-70"></div>
        <div className="animate-bounce absolute top-20 right-20 w-3 h-3 bg-red-400 rounded-full opacity-60" style={{animationDelay: '0.5s'}}></div>
        <div className="animate-pulse absolute top-40 left-1/4 w-2 h-2 bg-blue-400 rounded-full opacity-80" style={{animationDelay: '1s'}}></div>
        <div className="animate-bounce absolute top-60 right-1/3 w-3 h-3 bg-green-400 rounded-full opacity-70" style={{animationDelay: '1.5s'}}></div>
        <div className="animate-pulse absolute bottom-40 left-20 w-4 h-4 bg-purple-400 rounded-full opacity-60" style={{animationDelay: '2s'}}></div>
        <div className="animate-bounce absolute bottom-20 right-10 w-2 h-2 bg-pink-400 rounded-full opacity-80" style={{animationDelay: '2.5s'}}></div>
        <div className="animate-pulse absolute top-32 right-1/2 w-3 h-3 bg-orange-400 rounded-full opacity-70" style={{animationDelay: '3s'}}></div>
        <div className="animate-bounce absolute bottom-32 left-1/3 w-4 h-4 bg-cyan-400 rounded-full opacity-60" style={{animationDelay: '3.5s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Go Back Button */}
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Go Back
          </button>

          {/* Green blob icon with eyes */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center relative overflow-hidden animate-pulse">
              {/* Main blob shape */}
              <div className="w-14 h-14 bg-green-500 rounded-full relative">
                {/* Eyes */}
                <div className="absolute top-4 left-3 w-2 h-2 bg-white rounded-full"></div>
                <div className="absolute top-4 right-3 w-2 h-2 bg-white rounded-full"></div>
                {/* Smile */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 w-4 h-2 border-b-2 border-white rounded-full"></div>
              </div>
              {/* Side protrusions */}
              <div className="absolute -top-2 -left-2 w-7 h-7 bg-green-500 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-5 h-5 bg-green-500 rounded-full"></div>
              <div className="absolute top-2 -right-2 w-6 h-6 bg-green-500 rounded-full"></div>
              <div className="absolute bottom-4 -left-1 w-4 h-4 bg-green-500 rounded-full"></div>
            </div>
          </div>

          <h1 className="text-4xl font-bold font-playfair text-[#111115] mb-2 text-center">
            You Are<br />Ready!
          </h1>

          <p className="text-[#4E4E55] text-sm text-center leading-relaxed mb-8">
            Congratulations! Your content strategy is now<br />
            personalized and ready to help you achieve<br />
            your goals.
          </p>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 mb-8 border border-green-100">
            <div className="text-center">
              <div className="text-2xl mb-2">🎉</div>
              <p className="text-sm text-gray-700 font-medium">
                Your personalized content plan is ready!
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Let's start creating amazing content together.
              </p>
            </div>
          </div>

          {/* Progress indicator - all complete */}
          <div className="flex justify-center gap-2 mb-8">
            <div className="w-8 h-1 bg-green-500 rounded-full"></div>
            <div className="w-8 h-1 bg-green-500 rounded-full"></div>
            <div className="w-8 h-1 bg-green-500 rounded-full"></div>
            <div className="w-8 h-1 bg-green-500 rounded-full"></div>
            <div className="w-8 h-1 bg-green-500 rounded-full"></div>
            <div className="w-8 h-1 bg-green-500 rounded-full"></div>
            <div className="w-8 h-1 bg-green-500 rounded-full"></div>
            <div className="w-8 h-1 bg-green-500 rounded-full"></div>
            <div className="w-8 h-1 bg-green-500 rounded-full"></div>
          </div>

          <Button 
            onClick={handleStart}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg disabled:opacity-50 shadow-lg transform transition-transform hover:scale-105"
          >
            {isLoading ? "Getting Started..." : "Let's Start! 🚀"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Ready;