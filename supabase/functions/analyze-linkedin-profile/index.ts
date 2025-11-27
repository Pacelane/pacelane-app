import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Request received - Method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Handling CORS preflight`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Parsing request body`);
    const { name, email, linkedinUrl, goal } = await req.json();
    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Received request`, { name, email, linkedinUrl, goal });

    // Validate required fields
    if (!name || !email || !linkedinUrl || !goal) {
      console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: ERROR - Missing required fields`);
      return new Response(
        JSON.stringify({ error: 'All fields are required: name, email, linkedinUrl, goal' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate goal
    const validGoals = ['Get Hired', 'Hire Talent', 'Build Personal Brand', 'Generate Leads', 'Network'];
    if (!validGoals.includes(goal)) {
      console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: ERROR - Invalid goal: ${goal}`);
      return new Response(
        JSON.stringify({ error: `Invalid goal. Must be one of: ${validGoals.join(', ')}` }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get API keys
    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Checking API keys`, {
      apifyApiKey: !!apifyApiKey,
      anthropicApiKey: !!anthropicApiKey,
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey
    });
    
    if (!apifyApiKey) {
      console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: ERROR - Apify API key not configured`);
      return new Response(
        JSON.stringify({ error: 'Apify API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!anthropicApiKey) {
      console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: ERROR - Anthropic API key not configured`);
      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '');

    // STEP 1: Scrape LinkedIn profile with Apify
    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Starting LinkedIn profile scraping for: ${linkedinUrl}`);

    // Extract username from LinkedIn URL
    const usernameMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/]+)/);
    const username = usernameMatch ? usernameMatch[1] : linkedinUrl;
    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Extracted username: ${username}`);

    // Prepare Actor input
    const input = {
      "username": username,
      "usernames": [username]
    };

    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Actor input:`, JSON.stringify(input, null, 2));

    // Run the Actor
    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Starting Apify actor...`);
    const runResponse = await fetch(`https://api.apify.com/v2/acts/5fajYOBUfeb6fgKlB/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apifyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Apify actor response status: ${runResponse.status}`);

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error(`[${new Date().toISOString()}] LinkedIn Analyzer: ERROR starting Apify actor:`, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to start LinkedIn scraping' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const runData = await runResponse.json();
    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Full runData response:`, JSON.stringify(runData, null, 2));
    
    if (!runData.data || !runData.data.id) {
      console.error(`[${new Date().toISOString()}] LinkedIn Analyzer: ERROR - Invalid response from Apify API:`, runData);
      return new Response(
        JSON.stringify({ error: 'Failed to start LinkedIn scraping - invalid API response' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const runId = runData.data.id;
    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Actor run started with ID: ${runId}`);

    // Wait for the run to complete
    let attempts = 0;
    const maxAttempts = 12; // 2 minutes max
    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Starting polling loop with max ${maxAttempts} attempts`);
    
    let profileData = null;
    
    while (attempts < maxAttempts) {
      console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Polling attempt ${attempts + 1}/${maxAttempts}`);
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/5fajYOBUfeb6fgKlB/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
        },
      });

      if (!statusResponse.ok) {
        console.error(`[${new Date().toISOString()}] LinkedIn Analyzer: ERROR checking run status:`, statusResponse.status);
        return new Response(
          JSON.stringify({ error: 'Failed to check scraping status' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const statusData = await statusResponse.json();
      const runStatus = statusData.data?.status;
      console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Run status (attempt ${attempts + 1}): ${runStatus}`);

      if (runStatus === 'SUCCEEDED') {
        console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: SUCCESS - Actor run completed successfully`);
        
        const datasetId = statusData.data?.defaultDatasetId;
        console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Dataset ID: ${datasetId}`);
        
        if (!datasetId) {
          console.error(`[${new Date().toISOString()}] LinkedIn Analyzer: ERROR - No dataset ID found in successful run`);
          return new Response(
            JSON.stringify({ error: 'No dataset found for scraping results' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Fetch results from the dataset
        console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Fetching results from dataset...`);
        const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
          headers: {
            'Authorization': `Bearer ${apifyApiKey}`,
          },
        });

        console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Dataset response status: ${datasetResponse.status}`);

        if (!datasetResponse.ok) {
          console.error(`[${new Date().toISOString()}] LinkedIn Analyzer: ERROR fetching dataset results:`, datasetResponse.status);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch scraping results' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const results = await datasetResponse.json();
        console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Scraping completed successfully, items found: ${results.length}`);
        
        profileData = results[0] || null;
        break;
        
      } else if (runStatus === 'FAILED') {
        console.error(`[${new Date().toISOString()}] LinkedIn Analyzer: ERROR - Actor run failed`);
        return new Response(
          JSON.stringify({ error: 'LinkedIn profile scraping failed' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (runStatus === 'RUNNING') {
        console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Still running, waiting 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } else {
        console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Waiting for status: ${runStatus}, waiting 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
      }
    }

    if (!profileData) {
      console.error(`[${new Date().toISOString()}] LinkedIn Analyzer: ERROR - Actor run timed out after ${maxAttempts} attempts`);
      return new Response(
        JSON.stringify({ error: 'LinkedIn profile scraping timed out. Please try again.' }),
        { 
          status: 408, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // STEP 2: Analyze with Anthropic AI
    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Starting AI analysis...`);
    
    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    // Build analysis prompt based on goal
    const goalPrompts = {
      'Get Hired': 'The user wants to optimize their LinkedIn profile to get hired. Focus on: recruiter appeal, keyword optimization, clear value proposition, quantifiable achievements, and professional presentation.',
      'Hire Talent': 'The user wants to optimize their LinkedIn profile for hiring talent. Focus on: company branding, leadership presence, team culture signals, and attracting top candidates.',
      'Build Personal Brand': 'The user wants to build their personal brand on LinkedIn. Focus on: thought leadership, content strategy, unique value proposition, storytelling, and audience engagement.',
      'Generate Leads': 'The user wants to generate business leads through LinkedIn. Focus on: credibility signals, social proof, clear service offerings, and call-to-action elements.',
      'Network': 'The user wants to expand their professional network on LinkedIn. Focus on: approachability, shared interests, conversation starters, and community engagement.'
    };

    const systemPrompt = `You are a LinkedIn profile optimization expert. Analyze the provided LinkedIn profile data and give specific, actionable feedback to help the user achieve their goal.

${goalPrompts[goal as keyof typeof goalPrompts]}

Provide your analysis in a clear, structured format with:
1. Overall Assessment (2-3 sentences)
2. Key Strengths (2-3 bullet points)
3. Areas for Improvement (3-5 specific, actionable recommendations)
4. Quick Wins (2-3 easy changes they can make today)

Be specific, reference actual content from their profile, and provide concrete examples of improvements.`;

    const userMessage = `Please analyze this LinkedIn profile:

**Profile Data:**
${JSON.stringify(profileData, null, 2)}

**User's Goal:** ${goal}

Provide specific, actionable feedback to help them optimize their profile for this goal.`;

    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Calling Anthropic API...`);
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: AI analysis complete`);

    // Extract analysis text
    let analysis = '';
    if (response.content && response.content.length > 0) {
      const textBlocks = response.content.filter((block: any) => block.type === 'text');
      if (textBlocks.length > 0) {
        analysis = textBlocks.map((block: any) => block.text || '').join('\n\n').trim();
      }
    }

    if (!analysis || analysis.length === 0) {
      console.error(`[${new Date().toISOString()}] LinkedIn Analyzer: ERROR - No analysis generated`);
      return new Response(
        JSON.stringify({ error: 'Failed to generate analysis' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Analysis generated successfully, length: ${analysis.length} characters`);

    // STEP 3: Store in database
    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Storing results in database...`);
    
    const { data: savedRecord, error: insertError } = await supabase
      .from('linkedin_profile_analysis')
      .insert({
        name,
        email,
        linkedin_url: linkedinUrl,
        goal,
        profile_data: profileData,
        analysis,
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[${new Date().toISOString()}] LinkedIn Analyzer: ERROR saving to database:`, insertError);
      // Don't fail the request - still return the analysis to the user
      console.warn(`[${new Date().toISOString()}] LinkedIn Analyzer: WARNING - Failed to save to database but continuing with response`);
    } else {
      console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Saved to database with ID: ${savedRecord.id}`);
    }

    // Return success response
    console.log(`[${new Date().toISOString()}] LinkedIn Analyzer: Request completed successfully`);
    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        message: 'Analysis completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`[${new Date().toISOString()}] LinkedIn Analyzer: FATAL ERROR:`, error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
