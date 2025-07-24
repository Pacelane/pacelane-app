import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const FirstThingsFirst = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const [linkedinProfile, setLinkedinProfile] = useState('');
  const [loading, setLoading] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scrapingComplete, setScrapingComplete] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const handleGoBack = () => {
    navigate('/onboarding/welcome');
  };

  const handleScrapeProfile = async () => {
    if (!linkedinProfile.trim()) {
      toast.error('Please enter your LinkedIn profile URL');
      return;
    }

    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    setScraping(true);
    setScrapingComplete(false);
    
    try {
      const fullUrl = linkedinProfile.startsWith('http') 
        ? linkedinProfile 
        : `https://${linkedinProfile}`;

      const { data, error } = await supabase.functions.invoke('scrape-linkedin-profile', {
        body: { linkedinUrl: fullUrl }
      });

      if (error) throw error;

      if (data.success && data.profileData) {
        setProfileData(data.profileData);
        
        // Save LinkedIn data to database
        const { error: saveError } = await supabase
          .from('profiles')
          .update({
            linkedin_data: data.profileData,
            linkedin_name: data.profileData.fullName || null,
            linkedin_company: data.profileData.company || null,
            linkedin_about: data.profileData.about || null,
            linkedin_location: data.profileData.location || null,
            linkedin_headline: data.profileData.headline || null,
            linkedin_scraped_at: new Date().toISOString()
          })
          .eq('user_id', user.id);

        if (saveError) {
          console.error('Error saving LinkedIn data:', saveError);
          toast.error('Failed to save LinkedIn data');
          return;
        }

        setScrapingComplete(true);
        toast.success('LinkedIn profile scraped and saved successfully!');
      } else {
        throw new Error('No profile data found');
      }
    } catch (error: any) {
      console.error('Error scraping LinkedIn profile:', error);
      toast.error(error.message || 'Failed to scrape LinkedIn profile');
    } finally {
      setScraping(false);
    }
  };

  const handleContinue = async () => {
    if (!user) {
      toast.error('Please sign in to continue');
      return;
    }

    setLoading(true);
    try {
      // Update the user's profile with onboarding data
      const { error } = await supabase
        .from('profiles')
        .update({
          linkedin_profile: linkedinProfile.trim(),
          onboarding_completed: true
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Refresh the profile in context
      await refreshProfile();
      
      toast.success('Profile updated successfully!');
      navigate('/product-home');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
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

            {/* Scrape Profile Button */}
            <div className="pt-4">
              <Button 
                onClick={handleScrapeProfile}
                disabled={!linkedinProfile.trim() || scraping}
                variant="outline"
                className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                {scraping ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scraping Profile...
                  </>
                ) : (
                  'Analyze LinkedIn Profile'
                )}
              </Button>
            </div>

            {/* Profile Data Preview */}
            {scrapingComplete && profileData && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-medium text-[#111115] mb-3">Profile Preview:</h3>
                <div className="space-y-2 text-sm">
                  {profileData.fullName && (
                    <p><span className="font-medium">Name:</span> {profileData.fullName}</p>
                  )}
                  {profileData.headline && (
                    <p><span className="font-medium">Headline:</span> {profileData.headline}</p>
                  )}
                  {profileData.location && (
                    <p><span className="font-medium">Location:</span> {profileData.location}</p>
                  )}
                  {profileData.about && (
                    <p><span className="font-medium">About:</span> {profileData.about.substring(0, 150)}...</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <p className="text-[#4E4E55] text-sm text-center mt-8 mb-8">
            We'll ask a few questions to tailor your strategy.
          </p>

          <Button 
            onClick={handleContinue}
            disabled={!linkedinProfile.trim() || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg"
          >
            {loading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FirstThingsFirst;