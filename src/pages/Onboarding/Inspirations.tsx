import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Inspiration {
  id: string;
  linkedin_url: string;
  name?: string;
  company?: string;
  headline?: string;
  linkedin_data?: any;
}

const Inspirations = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingInspiration, setAddingInspiration] = useState(false);

  // Load existing inspirations on component mount
  useEffect(() => {
    loadInspirations();
  }, [user]);

  const loadInspirations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('inspirations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInspirations(data || []);
    } catch (error: any) {
      console.error('Error loading inspirations:', error);
      toast.error('Failed to load inspirations');
    }
  };

  const handleGoBack = () => {
    navigate('/onboarding/first-things-first');
  };

  const handleAddBenchmark = async () => {
    if (!user || !linkedinUrl.trim()) return;

    // Check if URL already exists
    const urlExists = inspirations.some(
      inspiration => inspiration.linkedin_url === linkedinUrl.trim()
    );
    
    if (urlExists) {
      toast.error('This LinkedIn profile is already added');
      return;
    }

    setAddingInspiration(true);
    try {
      const fullUrl = linkedinUrl.startsWith('http') 
        ? linkedinUrl.trim() 
        : `https://${linkedinUrl.trim()}`;

      // First scrape the LinkedIn profile
      const { data: scrapeData, error: scrapeError } = await supabase.functions.invoke('scrape-linkedin-profile', {
        body: { linkedinUrl: fullUrl }
      });

      let profileData = null;
      let name = null;
      let company = null;
      let headline = null;

      if (!scrapeError && scrapeData?.success && scrapeData?.profileData) {
        profileData = scrapeData.profileData;
        name = profileData.basic_info?.fullname || null;
        company = profileData.basic_info?.current_company || null;
        headline = profileData.basic_info?.headline || null;
        toast.success('LinkedIn profile analyzed successfully!');
      } else {
        console.warn('LinkedIn scraping failed, saving URL only:', scrapeError);
        toast.warning('Could not analyze LinkedIn profile, but saved the URL');
      }

      // Save to database
      const { data: insertData, error: insertError } = await supabase
        .from('inspirations')
        .insert({
          user_id: user.id,
          linkedin_url: fullUrl,
          linkedin_data: profileData,
          name,
          company,
          headline,
          scraped_at: profileData ? new Date().toISOString() : null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setInspirations([insertData, ...inspirations]);
      setLinkedinUrl('');
      toast.success('Inspiration added successfully!');
    } catch (error: any) {
      console.error('Error adding inspiration:', error);
      toast.error(error.message || 'Failed to add inspiration');
    } finally {
      setAddingInspiration(false);
    }
  };

  const handleRemoveInspiration = async (inspiration: Inspiration) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('inspirations')
        .delete()
        .eq('id', inspiration.id)
        .eq('user_id', user.id);

      if (error) throw error;

      setInspirations(inspirations.filter(i => i.id !== inspiration.id));
      toast.success('Inspiration removed');
    } catch (error: any) {
      console.error('Error removing inspiration:', error);
      toast.error('Failed to remove inspiration');
    }
  };

  const handleContinue = () => {
    navigate('/onboarding/goals');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !addingInspiration) {
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
            disabled={!linkedinUrl.trim() || addingInspiration}
          >
            {addingInspiration ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing Profile...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Benchmark
              </>
            )}
          </Button>

          {/* Added Inspirations List */}
          {inspirations.length > 0 && (
            <div className="mb-6 space-y-2">
              {inspirations.map((inspiration) => (
                <div
                  key={inspiration.id}
                  className="flex items-start justify-between bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex-1 truncate">
                    {inspiration.name && (
                      <div className="font-medium text-sm text-gray-900 mb-1">
                        {inspiration.name}
                      </div>
                    )}
                    {inspiration.headline && (
                      <div className="text-xs text-gray-600 mb-1">
                        {inspiration.headline}
                      </div>
                    )}
                    {inspiration.company && (
                      <div className="text-xs text-gray-500 mb-1">
                        {inspiration.company}
                      </div>
                    )}
                    <div className="text-xs text-blue-600 truncate">
                      {inspiration.linkedin_url}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveInspiration(inspiration)}
                    className="ml-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
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