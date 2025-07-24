import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { linkedinUrl } = await req.json();

    if (!linkedinUrl) {
      return new Response(
        JSON.stringify({ error: 'LinkedIn URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    if (!apifyApiKey) {
      return new Response(
        JSON.stringify({ error: 'Apify API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Starting LinkedIn profile scraping for:', linkedinUrl);

    // Extract username from LinkedIn URL
    const usernameMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/]+)/);
    const username = usernameMatch ? usernameMatch[1] : linkedinUrl;

    // Prepare Actor input
    const input = {
      "username": username,
      "usernames": [username]
    };

    console.log('Actor input:', input);

    // Run the Actor
    const runResponse = await fetch(`https://api.apify.com/v2/acts/5fajYOBUfeb6fgKlB/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apifyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Error starting Apify actor:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to start LinkedIn scraping' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const runData = await runResponse.json();
    console.log('Actor run started:', runData.id);

    // Wait for the run to complete
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes max (30 * 10 seconds)
    
    while (attempts < maxAttempts) {
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/5fajYOBUfeb6fgKlB/runs/${runData.id}`, {
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
        },
      });

      const statusData = await statusResponse.json();
      console.log(`Run status (attempt ${attempts + 1}):`, statusData.status);

      if (statusData.status === 'SUCCEEDED') {
        // Fetch results from the dataset
        const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${statusData.defaultDatasetId}/items`, {
          headers: {
            'Authorization': `Bearer ${apifyApiKey}`,
          },
        });

        if (!datasetResponse.ok) {
          console.error('Error fetching dataset results');
          return new Response(
            JSON.stringify({ error: 'Failed to fetch scraping results' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const results = await datasetResponse.json();
        console.log('Scraping completed successfully, items found:', results.length);

        return new Response(
          JSON.stringify({ 
            success: true, 
            data: results[0] || null,
            profileData: results[0] || null
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (statusData.status === 'FAILED') {
        console.error('Actor run failed');
        return new Response(
          JSON.stringify({ error: 'LinkedIn profile scraping failed' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (statusData.status === 'RUNNING') {
        // Wait 10 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      } else {
        // Wait 5 seconds for other statuses
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }

    // Timeout
    console.error('Actor run timed out');
    return new Response(
      JSON.stringify({ error: 'LinkedIn profile scraping timed out. Please try again.' }),
      { 
        status: 408, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in scrape-linkedin-profile function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});