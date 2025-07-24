import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

const Contact = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [countryCode, setCountryCode] = useState('+55');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGoBack = () => {
    navigate('/onboarding/pacing');
  };

  const handleContinue = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      const fullPhoneNumber = `${countryCode}${phoneNumber}`;
      
      const { error } = await supabase
        .from('profiles')
        .update({ phone_number: fullPhoneNumber })
        .eq('user_id', user.id);

      if (error) throw error;

      navigate('/onboarding/ready');
    } catch (error) {
      console.error('Error saving phone number:', error);
      toast({
        title: "Error",
        description: "Failed to save phone number. Please try again.",
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

          {/* Phone icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center relative">
              <div className="w-8 h-8 relative">
                <div className="w-6 h-8 bg-white rounded-lg border-2 border-green-500 relative mx-auto">
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-green-500 rounded-full"></div>
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full"></div>
                </div>
                <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold font-playfair text-[#111115] mb-2 text-center">
            Keeping<br />Contact
          </h1>

          <p className="text-[#4E4E55] text-sm text-center leading-relaxed mb-8">
            Enter your WhatsApp number so we can send<br />
            you updates and reminders.
          </p>

          {/* Phone Number Input */}
          <div className="mb-8">
            <div className="flex gap-2">
              {/* Country Code Selector */}
              <div className="relative">
                <select 
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="appearance-none w-20 px-3 py-3 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  <option value="+55">🇧🇷 +55</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+49">🇩🇪 +49</option>
                  <option value="+33">🇫🇷 +33</option>
                  <option value="+34">🇪🇸 +34</option>
                  <option value="+39">🇮🇹 +39</option>
                  <option value="+52">🇲🇽 +52</option>
                  <option value="+54">🇦🇷 +54</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              {/* Phone Number Input */}
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="flex-1 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
            <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-8 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <Button 
            onClick={handleContinue}
            disabled={phoneNumber.trim() === '' || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Contact;