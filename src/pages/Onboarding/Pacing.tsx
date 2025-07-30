import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/api/useProfile';
import { useToast } from '@/components/ui/use-toast';

const Pacing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { savePacingPreferences, saving } = useProfile();
  const { toast } = useToast();

  // Form state
  const [intensity, setIntensity] = useState('2-3 pieces of content per week');
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday']);
  const [dailySummaryTime, setDailySummaryTime] = useState('9:00 AM');
  const [followupsFrequency, setFollowupsFrequency] = useState('Daily');  
  const [recommendationsTime, setRecommendationsTime] = useState('2:00 PM');
  const [contextSessionsTime, setContextSessionsTime] = useState('5:00 PM');

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleGoBack = () => {
    navigate('/onboarding/content-pillars');
  };

  const toggleDay = (dayIndex: number) => {
    const dayName = dayNames[dayIndex];
    setSelectedDays(prev => 
      prev.includes(dayName)
        ? prev.filter(d => d !== dayName)
        : [...prev, dayName]
    );
  };

  const handleContinue = async () => {
    if (!user) return;
    
    try {
      // Use our clean pacing preferences API
      const result = await savePacingPreferences({
        intensity,
        frequency: selectedDays,
        daily_summary_time: dailySummaryTime,
        followups_frequency: followupsFrequency,
        recommendations_time: recommendationsTime,
        context_sessions_time: contextSessionsTime
      });

      if (result.error) {
        throw new Error(result.error);
      }

      navigate('/onboarding/contact');
    } catch (error: any) {
      console.error('Error saving pacing preferences:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save pacing preferences. Please try again.",
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

          {/* Clock icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center relative">
              <div className="w-8 h-8 rounded-full border-2 border-white relative">
                <div className="absolute top-1 left-3 w-0.5 h-3 bg-white rounded-full origin-bottom transform rotate-90"></div>
                <div className="absolute top-3 left-1 w-2 h-0.5 bg-white rounded-full origin-left transform rotate-0"></div>
                <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute top-2 left-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
              </div>
            </div>
          </div>

          <h1 className="text-4xl font-bold font-playfair text-[#111115] mb-2 text-center">
            Your Pacing
          </h1>

          <p className="text-[#4E4E55] text-sm text-center leading-relaxed mb-8">
            How often do you want to post? We'll create a<br />
            schedule that fits your lifestyle.
          </p>

          {/* Intensity Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Intensity</h3>
            <div className="space-y-2">
              {[
                '1 piece of content per week',
                '2-3 pieces of content per week', 
                '4-5 pieces of content per week',
                'Daily content'
              ].map((option) => (
                <label key={option} className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="intensity"
                    value={option}
                    checked={intensity === option}
                    onChange={(e) => setIntensity(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Days Selection */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Days</h3>
            <div className="flex gap-2">
              {days.map((day, index) => (
                <button
                  key={index}
                  onClick={() => toggleDay(index)}
                  className={`w-10 h-10 rounded-full border text-sm font-medium transition-all ${
                    selectedDays.includes(dayNames[index])
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time Settings */}
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Daily Summary</span>
              <select 
                value={dailySummaryTime}
                onChange={(e) => setDailySummaryTime(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                {['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM'].map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Followups</span>
              <select 
                value={followupsFrequency}
                onChange={(e) => setFollowupsFrequency(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                {['Daily', 'Weekly', 'Bi-weekly', 'Monthly'].map(freq => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Recommendations</span>
              <select 
                value={recommendationsTime}
                onChange={(e) => setRecommendationsTime(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                {['2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'].map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700">Context Sessions</span>
              <select 
                value={contextSessionsTime}
                onChange={(e) => setContextSessionsTime(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                {['5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM'].map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
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
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>

          <Button 
            onClick={handleContinue}
                            disabled={selectedDays.length === 0 || saving}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg disabled:opacity-50"
          >
                          {saving ? "Saving..." : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Pacing;