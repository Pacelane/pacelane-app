import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LinkedInProfileData {
  basic_info?: {
    about?: string;
    fullname?: string;
    headline?: string;
    current_company?: string;
    location?: {
      full?: string;
      city?: string;
    };
  };
  [key: string]: any;
}

interface ExtractBioRequest {
  userId: string;
  linkedinData: LinkedInProfileData;
  linkedinUrl: string;
}

serve(async (req) => {
  console.log(`[${new Date().toISOString()}] Extract LinkedIn Bio: Starting request processing`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[${new Date().toISOString()}] Extract LinkedIn Bio: Handling CORS preflight`);
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error(`[${new Date().toISOString()}] Extract LinkedIn Bio: ERROR - Missing Supabase configuration`);
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log(`[${new Date().toISOString()}] Extract LinkedIn Bio: Parsing request body`);
    const { userId, linkedinData, linkedinUrl }: ExtractBioRequest = await req.json();
    
    if (!userId || !linkedinData) {
      console.log(`[${new Date().toISOString()}] Extract LinkedIn Bio: ERROR - Missing required fields`);
      return new Response(
        JSON.stringify({ error: 'userId and linkedinData are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${new Date().toISOString()}] Extract LinkedIn Bio: Processing data for user: ${userId}`);
    console.log(`[${new Date().toISOString()}] Extract LinkedIn Bio: LinkedIn data structure:`, JSON.stringify(linkedinData, null, 2));

    // Extract bio from the LinkedIn data structure
    let extractedBio = '';
    
    // Try to extract bio from basic_info.about
    if (linkedinData.basic_info?.about) {
      extractedBio = linkedinData.basic_info.about;
      console.log(`[${new Date().toISOString()}] Extract LinkedIn Bio: Found bio in basic_info.about: "${extractedBio.substring(0, 100)}..."`);
    } else {
      console.log(`[${new Date().toISOString()}] Extract LinkedIn Bio: No bio found in basic_info.about`);
    }

    // Get existing profile data to merge with LinkedIn data
    console.log(`[${new Date().toISOString()}] Extract LinkedIn Bio: Fetching existing profile for user: ${userId}`);
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('linkedin_data')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error(`[${new Date().toISOString()}] Extract LinkedIn Bio: ERROR fetching existing profile:`, fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch existing profile' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Merge with existing linkedin_data to preserve other keys
    const existingLinkedinData = existingProfile?.linkedin_data || {};
    const mergedLinkedinData = {
      ...existingLinkedinData,
      last_scrape_raw: linkedinData,
      summary: {
        name: linkedinData.basic_info?.fullname || null,
        headline: linkedinData.basic_info?.headline || null,
        company: linkedinData.basic_info?.current_company || null,
        location: linkedinData.basic_info?.location?.full || linkedinData.basic_info?.location?.city || null,
        about: extractedBio || null,
        url: linkedinUrl?.trim() || null,
      },
    };

    // Prepare update data
    const updateData = {
      linkedin_data: mergedLinkedinData,
      linkedin_name: linkedinData.basic_info?.fullname || null,
      linkedin_company: linkedinData.basic_info?.current_company || null,
      linkedin_about: extractedBio || null, // This is the key field we're extracting
      linkedin_location: linkedinData.basic_info?.location?.full || linkedinData.basic_info?.location?.city || null,
      linkedin_headline: linkedinData.basic_info?.headline || null,
      linkedin_scraped_at: new Date().toISOString()
    };

    console.log(`[${new Date().toISOString()}] Extract LinkedIn Bio: Updating profile with extracted data`);
    console.log(`[${new Date().toISOString()}] Extract LinkedIn Bio: Extracted bio: "${extractedBio.substring(0, 100)}${extractedBio.length > 100 ? '...' : ''}"`);

    // Update the profile with extracted data
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error(`[${new Date().toISOString()}] Extract LinkedIn Bio: ERROR updating profile:`, updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update profile with extracted bio' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[${new Date().toISOString()}] Extract LinkedIn Bio: SUCCESS - Profile updated with extracted bio`);
    
    return new Response(
      JSON.stringify({ 
        success: true,
        extractedBio,
        updatedProfile,
        message: 'LinkedIn bio extracted and profile updated successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Extract LinkedIn Bio: FATAL ERROR:`, error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
