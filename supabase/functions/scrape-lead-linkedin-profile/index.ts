import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.20.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Request received - Method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Handling CORS preflight`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Parsing request body`);
    const { name, email, linkedinUrl, goal } = await req.json();
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Received request`, { name, email, linkedinUrl, goal });

    // Validate required fields
    if (!name || !email || !linkedinUrl) {
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: ERROR - Missing required fields`);
      return new Response(
        JSON.stringify({ error: 'Required fields: name, email, linkedinUrl' }),
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
    
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Checking API keys`, {
      apifyApiKey: !!apifyApiKey,
      anthropicApiKey: !!anthropicApiKey,
      supabaseUrl: !!supabaseUrl,
      supabaseServiceKey: !!supabaseServiceKey
    });
    
    if (!apifyApiKey) {
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: ERROR - Apify API key not configured`);
      return new Response(
        JSON.stringify({ error: 'Apify API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!anthropicApiKey) {
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: ERROR - Anthropic API key not configured`);
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

    // Create lead record with pending status
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Creating lead record...`);
    const { data: leadRecord, error: insertError } = await supabase
      .from('leads')
      .insert({
        name,
        email,
        linkedin_url: linkedinUrl,
        lead_source: 'linkedin_analyzer',
        status: 'processing',
        metadata: { goal: goal || null }
      })
      .select()
      .single();

    if (insertError) {
      console.error(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: ERROR creating lead record:`, insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to create lead record' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const leadId = leadRecord.id;
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Lead record created with ID: ${leadId}`);

    // STEP 1: Scrape LinkedIn profile with Apify
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Starting LinkedIn profile scraping for: ${linkedinUrl}`);

    // Extract username from LinkedIn URL
    const usernameMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/);
    const username = usernameMatch ? usernameMatch[1] : linkedinUrl;
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Extracted username: ${username}`);

    // Prepare Actor input
    const input = {
      "username": username,
      "usernames": [username]
    };

    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Actor input:`, JSON.stringify(input, null, 2));

    // Run the Actor
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Starting Apify actor...`);
    const runResponse = await fetch(`https://api.apify.com/v2/acts/5fajYOBUfeb6fgKlB/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apifyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Apify actor response status: ${runResponse.status}`);

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: ERROR starting Apify actor:`, errorText);
      
      // Update lead status to failed
      await supabase.from('leads').update({ 
        status: 'failed', 
        error_message: 'Failed to start LinkedIn scraping' 
      }).eq('id', leadId);
      
      return new Response(
        JSON.stringify({ error: 'Failed to start LinkedIn scraping', leadId }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const runData = await runResponse.json();
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Full runData response:`, JSON.stringify(runData, null, 2));
    
    if (!runData.data || !runData.data.id) {
      console.error(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: ERROR - Invalid response from Apify API:`, runData);
      
      await supabase.from('leads').update({ 
        status: 'failed', 
        error_message: 'Invalid API response from scraper' 
      }).eq('id', leadId);
      
      return new Response(
        JSON.stringify({ error: 'Failed to start LinkedIn scraping - invalid API response', leadId }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const runId = runData.data.id;
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Actor run started with ID: ${runId}`);

    // Wait for the run to complete
    let attempts = 0;
    const maxAttempts = 24; // 2 minutes max (24 * 5 seconds)
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Starting polling loop with max ${maxAttempts} attempts`);
    
    let profileData = null;
    
    while (attempts < maxAttempts) {
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Polling attempt ${attempts + 1}/${maxAttempts}`);
      
      const statusResponse = await fetch(`https://api.apify.com/v2/acts/5fajYOBUfeb6fgKlB/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${apifyApiKey}`,
        },
      });

      if (!statusResponse.ok) {
        console.error(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: ERROR checking run status:`, statusResponse.status);
        
        await supabase.from('leads').update({ 
          status: 'failed', 
          error_message: 'Failed to check scraping status' 
        }).eq('id', leadId);
        
        return new Response(
          JSON.stringify({ error: 'Failed to check scraping status', leadId }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const statusData = await statusResponse.json();
      const runStatus = statusData.data?.status;
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Run status (attempt ${attempts + 1}): ${runStatus}`);

      if (runStatus === 'SUCCEEDED') {
        console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: SUCCESS - Actor run completed successfully`);
        
        const datasetId = statusData.data?.defaultDatasetId;
        console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Dataset ID: ${datasetId}`);
        
        if (!datasetId) {
          console.error(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: ERROR - No dataset ID found in successful run`);
          
          await supabase.from('leads').update({ 
            status: 'failed', 
            error_message: 'No dataset found for scraping results' 
          }).eq('id', leadId);
          
          return new Response(
            JSON.stringify({ error: 'No dataset found for scraping results', leadId }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Fetch results from the dataset
        console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Fetching results from dataset...`);
        const datasetResponse = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items`, {
          headers: {
            'Authorization': `Bearer ${apifyApiKey}`,
          },
        });

        console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Dataset response status: ${datasetResponse.status}`);

        if (!datasetResponse.ok) {
          console.error(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: ERROR fetching dataset results:`, datasetResponse.status);
          
          await supabase.from('leads').update({ 
            status: 'failed', 
            error_message: 'Failed to fetch scraping results' 
          }).eq('id', leadId);
          
          return new Response(
            JSON.stringify({ error: 'Failed to fetch scraping results', leadId }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const results = await datasetResponse.json();
        console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Scraping completed successfully, items found: ${results.length}`);
        
        profileData = results[0] || null;
        break;
        
      } else if (runStatus === 'FAILED') {
        console.error(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: ERROR - Actor run failed`);
        
        await supabase.from('leads').update({ 
          status: 'failed', 
          error_message: 'LinkedIn profile scraping failed' 
        }).eq('id', leadId);
        
        return new Response(
          JSON.stringify({ error: 'LinkedIn profile scraping failed', leadId }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (runStatus === 'RUNNING') {
        console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Still running, waiting 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } else {
        console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Waiting for status: ${runStatus}, waiting 3 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
      }
    }

    if (!profileData) {
      console.error(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: ERROR - Actor run timed out after ${maxAttempts} attempts`);
      
      await supabase.from('leads').update({ 
        status: 'failed', 
        error_message: 'LinkedIn profile scraping timed out' 
      }).eq('id', leadId);
      
      return new Response(
        JSON.stringify({ error: 'LinkedIn profile scraping timed out. Please try again.', leadId }),
        { 
          status: 408, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // STEP 2: Analyze with Anthropic AI
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Starting AI analysis...`);
    
    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    // Build analysis prompt based on goal
    const goalPrompts: Record<string, string> = {
      'Get Hired': 'The user wants to optimize their LinkedIn profile to get hired. Focus on: recruiter appeal, keyword optimization, clear value proposition, quantifiable achievements, and professional presentation.',
      'Hire Talent': 'The user wants to optimize their LinkedIn profile for hiring talent. Focus on: company branding, leadership presence, team culture signals, and attracting top candidates.',
      'Build Personal Brand': 'The user wants to build their personal brand on LinkedIn. Focus on: thought leadership, content strategy, unique value proposition, storytelling, and audience engagement.',
      'Generate Leads': 'The user wants to generate business leads through LinkedIn. Focus on: credibility signals, social proof, clear service offerings, and call-to-action elements.',
      'Network': 'The user wants to expand their professional network on LinkedIn. Focus on: approachability, shared interests, conversation starters, and community engagement.'
    };

    const goalContext = goal && goalPrompts[goal] 
      ? goalPrompts[goal] 
      : 'Provide general profile optimization advice focusing on professional presentation and engagement.';

    const systemPrompt = `You are a LinkedIn profile optimization expert. Analyze the provided LinkedIn profile data and give specific, actionable feedback.

${goalContext}

Provide your analysis in a clear, structured format with:
1. Overall Assessment (2-3 sentences)
2. Key Strengths (2-3 bullet points)
3. Areas for Improvement (3-5 specific, actionable recommendations)
4. Quick Wins (2-3 easy changes they can make today)

Be specific, reference actual content from their profile, and provide concrete examples of improvements. Use markdown formatting for better readability.`;

    const userMessage = `Please analyze this LinkedIn profile:

**Profile Data:**
${JSON.stringify(profileData, null, 2)}

${goal ? `**User's Goal:** ${goal}` : ''}

Provide specific, actionable feedback to help them optimize their profile.`;

    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Calling Anthropic API...`);
    
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: AI analysis complete`);

    // Extract analysis text
    let analysis = '';
    if (response.content && response.content.length > 0) {
      const textBlocks = response.content.filter((block: any) => block.type === 'text');
      if (textBlocks.length > 0) {
        analysis = textBlocks.map((block: any) => block.text || '').join('\n\n').trim();
      }
    }

    if (!analysis || analysis.length === 0) {
      console.error(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: ERROR - No analysis generated`);
      
      await supabase.from('leads').update({ 
        status: 'failed', 
        error_message: 'Failed to generate analysis',
        scraped_data: profileData 
      }).eq('id', leadId);
      
      return new Response(
        JSON.stringify({ error: 'Failed to generate analysis', leadId }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Analysis generated successfully, length: ${analysis.length} characters`);

    // STEP 3: Update lead record with results
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Updating lead record with results...`);
    
    const { error: updateError } = await supabase
      .from('leads')
      .update({
        status: 'completed',
        scraped_data: {
          profileData,
          analysis,
          analyzedAt: new Date().toISOString()
        }
      })
      .eq('id', leadId);

    if (updateError) {
      console.error(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: ERROR updating lead record:`, updateError);
      // Don't fail the request - still return the analysis to the user
    } else {
      console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Lead record updated successfully`);
    }

    // Return success response
    console.log(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: Request completed successfully`);
    return new Response(
      JSON.stringify({ 
        success: true,
        leadId,
        data: {
          profileData,
          analysis
        },
        message: 'Analysis completed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Lead LinkedIn Analyzer: FATAL ERROR:`, error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

