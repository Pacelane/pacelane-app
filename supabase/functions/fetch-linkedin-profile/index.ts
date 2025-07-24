import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const APIFY_API_KEY = Deno.env.get('APIFY_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!APIFY_API_KEY) {
      throw new Error('APIFY_API_KEY environment variable is not set');
    }

    const { linkedinUrl } = await req.json();

    if (!linkedinUrl) {
      throw new Error('LinkedIn URL is required');
    }

    console.log('Fetching LinkedIn profile data for:', linkedinUrl);

    // Start the LinkedIn scraper actor
    const actorResponse = await fetch(`https://api.apify.com/v2/acts/apimaestro~linkedin-profile-full-sections-scraper/runs?token=${APIFY_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileUrls: [linkedinUrl],
        maxResults: 1
      }),
    });

    if (!actorResponse.ok) {
      const errorText = await actorResponse.text();
      console.error('Apify actor start error:', errorText);
      throw new Error(`Failed to start actor: ${actorResponse.status} ${errorText}`);
    }

    const runData = await actorResponse.json();
    const runId = runData.data.id;

    console.log('Actor run started with ID:', runId);

    // Poll for completion (max 60 seconds)
    let attempts = 0;
    const maxAttempts = 12; // 60 seconds with 5-second intervals
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/apimaestro~linkedin-profile-full-sections-scraper/runs/${runId}?token=${APIFY_API_KEY}`);
      
      if (!statusResponse.ok) {
        throw new Error(`Failed to check run status: ${statusResponse.status}`);
      }
      
      const statusData = await statusResponse.json();
      console.log('Run status:', statusData.data.status);
      
      if (statusData.data.status === 'SUCCEEDED') {
        // Get the results
        const resultsResponse = await fetch(`https://api.apify.com/v2/acts/apimaestro~linkedin-profile-full-sections-scraper/runs/${runId}/dataset/items?token=${APIFY_API_KEY}`);
        
        if (!resultsResponse.ok) {
          throw new Error(`Failed to get results: ${resultsResponse.status}`);
        }
        
        const results = await resultsResponse.json();
        console.log('Profile data fetched successfully');
        
        return new Response(JSON.stringify({ 
          success: true, 
          data: results[0] || null 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else if (statusData.data.status === 'FAILED') {
        throw new Error('LinkedIn profile scraping failed');
      }
      
      attempts++;
    }

    // Timeout
    throw new Error('LinkedIn profile scraping timed out');

  } catch (error: any) {
    console.error('Error in fetch-linkedin-profile function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});