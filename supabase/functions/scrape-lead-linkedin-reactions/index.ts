import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types
interface LinkedInReaction {
  id: string;
  action: string;
  postId: string;
  postContent: string;
  postUrl: string;
  postAuthor: {
    name: string;
    linkedinUrl: string;
    info?: string;
  };
  postedAt: {
    timestamp: number;
    date: string;
  };
  actor: {
    id: string;
    linkedinUrl: string;
  };
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      });
    }

    console.log(`[${new Date().toISOString()}] Reactions Scraper: Request received`);

    // Parse request body
    const { leadId, linkedinUrl } = await req.json();

    if (!leadId || !linkedinUrl) {
      throw new Error('leadId and linkedinUrl are required');
    }

    // Get environment variables
    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!apifyApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`[${new Date().toISOString()}] Reactions Scraper: Starting for lead ${leadId}`);

    // Start Apify Reactions Actor (cheaper version: FNhKFjeL8hWQtMeZI)
    const reactionsInput = {
      usernames: [linkedinUrl], // Can accept username or full URL
      maxItems: 1000
    };

    console.log(`[${new Date().toISOString()}] Reactions Scraper: Actor input:`, JSON.stringify(reactionsInput, null, 2));

    const reactionsRunResponse = await fetch(`https://api.apify.com/v2/acts/FNhKFjeL8hWQtMeZI/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apifyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reactionsInput),
    });

    if (!reactionsRunResponse.ok) {
      throw new Error(`Failed to start reactions actor: ${reactionsRunResponse.status}`);
    }

    const reactionsRunData = await reactionsRunResponse.json();
    const reactionsRunId = reactionsRunData.data?.id;

    if (!reactionsRunId) {
      throw new Error('No run ID received from Apify');
    }

    console.log(`[${new Date().toISOString()}] Reactions Scraper: Actor run started with ID: ${reactionsRunId}`);

    // Poll for completion (max 2 minutes)
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes (24 * 5s)
    let reactions: LinkedInReaction[] = [];

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[${new Date().toISOString()}] Reactions Scraper: Polling attempt ${attempts}/${maxAttempts}`);

      const statusResponse = await fetch(`https://api.apify.com/v2/actor-runs/${reactionsRunId}`, {
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
        },
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        const status = statusData.data?.status;

        console.log(`[${new Date().toISOString()}] Reactions Scraper: Run status: ${status}`);

        if (status === 'SUCCEEDED') {
          // Fetch results
          const datasetResponse = await fetch(`https://api.apify.com/v2/actor-runs/${reactionsRunId}/dataset/items`, {
            headers: {
              'Authorization': `Bearer ${apifyApiKey}`,
            },
          });

          if (datasetResponse.ok) {
            const results = await datasetResponse.json();
            console.log(`[${new Date().toISOString()}] Reactions Scraper: Items found: ${results.length}`);

            // Transform reactions
            reactions = results.map((item: any) => {
              const post = item.post || {};
              const postAuthor = post.author || {};
              const postedAt = post.postedAt || {};

              return {
                id: item.id || `reaction_${Date.now()}_${Math.random()}`,
                action: item.action || '',
                postId: item.postId || post.id || '',
                postContent: post.content || '',
                postUrl: post.linkedinUrl || item.linkedinUrl || '',
                postAuthor: {
                  name: postAuthor.name || '',
                  linkedinUrl: postAuthor.linkedinUrl || '',
                  info: postAuthor.info || '',
                },
                postedAt: {
                  timestamp: postedAt.timestamp || 0,
                  date: postedAt.date || '',
                },
                actor: {
                  id: item.actor?.id || '',
                  linkedinUrl: item.actor?.linkedinUrl || '',
                },
              };
            });
          }
          break;
        } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
          console.error(`[${new Date().toISOString()}] Reactions Scraper: Actor run failed with status: ${status}`);
          break;
        }

        // Wait 5 seconds before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        console.error(`[${new Date().toISOString()}] Reactions Scraper: Error checking status`);
        break;
      }
    }

    // Update lead with reactions data
    console.log(`[${new Date().toISOString()}] Reactions Scraper: Updating lead with ${reactions.length} reactions`);

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        reactions_data: reactions.length > 0 ? reactions : null,
      })
      .eq('id', leadId);

    if (updateError) {
      console.error(`[${new Date().toISOString()}] Reactions Scraper: Error updating lead:`, updateError);
      throw updateError;
    }

    console.log(`[${new Date().toISOString()}] Reactions Scraper: Successfully updated lead`);

    return new Response(
      JSON.stringify({
        success: true,
        reactionsCount: reactions.length,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] Reactions Scraper: Error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
