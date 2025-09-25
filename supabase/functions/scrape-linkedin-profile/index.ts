import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Request received - Method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Handling CORS preflight`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Parsing request body`);
    const { linkedinUrl } = await req.json();
    console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Received URL: ${linkedinUrl}`);

    if (!linkedinUrl) {
      console.log(`[${new Date().toISOString()}] LinkedIn Scraper: ERROR - No LinkedIn URL provided`);
      return new Response(
        JSON.stringify({ error: 'LinkedIn URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Checking Apify API key - ${apifyApiKey ? 'Found' : 'Missing'}`);
    
    if (!apifyApiKey) {
      console.log(`[${new Date().toISOString()}] LinkedIn Scraper: ERROR - Apify API key not configured`);
      return new Response(
        JSON.stringify({ error: 'Apify API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Starting LinkedIn profile scraping for: ${linkedinUrl}`);

    // Extract username from LinkedIn URL
    const usernameMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/]+)/);
    const username = usernameMatch ? usernameMatch[1] : linkedinUrl;
    console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Extracted username: ${username}`);

    // Prepare Actor input
    const input = {
      "username": username,
      "usernames": [username]
    };

    console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Actor input:`, JSON.stringify(input, null, 2));

    // Run the Actor
    console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Starting Apify actor...`);
    const runResponse = await fetch(`https://api.apify.com/v2/acts/5fajYOBUfeb6fgKlB/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apifyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Apify actor response status: ${runResponse.status}`);

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error(`[${new Date().toISOString()}] LinkedIn Scraper: ERROR starting Apify actor:`, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to start LinkedIn scraping' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const runData = await runResponse.json();
    console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Full runData response:`, JSON.stringify(runData, null, 2));
    
    if (!runData.data || !runData.data.id) {
      console.error(`[${new Date().toISOString()}] LinkedIn Scraper: ERROR - Invalid response from Apify API:`, runData);
      return new Response(
        JSON.stringify({ error: 'Failed to start LinkedIn scraping - invalid API response' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const runId = runData.data.id;
    console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Actor run started with ID: ${runId}`);

    // Wait for the run to complete (reduced timeout for edge functions)
    let attempts = 0;
    const maxAttempts = 12; // 2 minutes max (12 * 5 seconds avg)
    console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Starting polling loop with max ${maxAttempts} attempts`);
    
    while (attempts < maxAttempts) {
      console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Polling attempt ${attempts + 1}/${maxAttempts}`);
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/5fajYOBUfeb6fgKlB/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
        },
      });

      if (!statusResponse.ok) {
        console.error(`[${new Date().toISOString()}] LinkedIn Scraper: ERROR checking run status:`, statusResponse.status);
        return new Response(
          JSON.stringify({ error: 'Failed to check scraping status' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const statusData = await statusResponse.json();
      console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Run status response (attempt ${attempts + 1}):`, JSON.stringify(statusData, null, 2));
      
      // Fix: Access nested status from statusData.data.status
      const runStatus = statusData.data?.status;
      console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Run status (attempt ${attempts + 1}): ${runStatus}`);

      if (runStatus === 'SUCCEEDED') {
        console.log(`[${new Date().toISOString()}] LinkedIn Scraper: SUCCESS - Actor run completed successfully`);
        
        // Fix: Access nested defaultDatasetId from statusData.data.defaultDatasetId
        const datasetId = statusData.data?.defaultDatasetId;
        console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Dataset ID: ${datasetId}`);
        
        if (!datasetId) {
          console.error(`[${new Date().toISOString()}] LinkedIn Scraper: ERROR - No dataset ID found in successful run`);
          return new Response(
            JSON.stringify({ error: 'No dataset found for scraping results' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Fetch results from the dataset
        console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Fetching results from dataset...`);
        const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
          headers: {
            'Authorization': `Bearer ${apifyApiKey}`,
          },
        });

        console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Dataset response status: ${datasetResponse.status}`);

        if (!datasetResponse.ok) {
          console.error(`[${new Date().toISOString()}] LinkedIn Scraper: ERROR fetching dataset results:`, datasetResponse.status);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch scraping results' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const results = await datasetResponse.json();
        console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Scraping completed successfully, items found: ${results.length}`);
        console.log(`[${new Date().toISOString()}] LinkedIn Scraper: First result:`, JSON.stringify(results[0], null, 2));

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
      } else if (runStatus === 'FAILED') {
        console.error(`[${new Date().toISOString()}] LinkedIn Scraper: ERROR - Actor run failed`);
        return new Response(
          JSON.stringify({ error: 'LinkedIn profile scraping failed' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (runStatus === 'RUNNING') {
        // Wait 5 seconds before checking again
        console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Still running, waiting 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } else {
        // Wait 3 seconds for other statuses
        console.log(`[${new Date().toISOString()}] LinkedIn Scraper: Waiting for status: ${runStatus}, waiting 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
      }
    }

    // Timeout
    console.error(`[${new Date().toISOString()}] LinkedIn Scraper: ERROR - Actor run timed out after ${maxAttempts} attempts`);
    return new Response(
      JSON.stringify({ error: 'LinkedIn profile scraping timed out. Please try again.' }),
      { 
        status: 408, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`[${new Date().toISOString()}] LinkedIn Scraper: FATAL ERROR in scrape-linkedin-profile function:`, error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});