import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UserContext {
  profile: {
    linkedin_data: any;
    goals: any;
    content_guides: any;
    pacing_preferences: any;
    linkedin_name?: string;
    linkedin_headline?: string;
    linkedin_about?: string;
    linkedin_company?: string;
  };
  inspirations: Array<{
    name?: string;
    company?: string;
    headline?: string;
    about?: string;
  }>;
  recent_conversations: Array<{
    title: string;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Generating suggestions for user:', user.id);

    // Fetch user profile data
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch inspirations
    const { data: inspirations, error: inspirationsError } = await supabaseClient
      .from('inspirations')
      .select('name, company, headline, about')
      .eq('user_id', user.id);

    if (inspirationsError) {
      console.error('Inspirations error:', inspirationsError);
    }

    // Fetch recent conversations
    const { data: conversations, error: conversationsError } = await supabaseClient
      .from('conversations')
      .select('title')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (conversationsError) {
      console.error('Conversations error:', conversationsError);
    }

    // Build context
    const userContext: UserContext = {
      profile: {
        linkedin_data: profile.linkedin_data,
        goals: profile.goals,
        content_guides: profile.content_guides,
        pacing_preferences: profile.pacing_preferences,
        linkedin_name: profile.linkedin_name,
        linkedin_headline: profile.linkedin_headline,
        linkedin_about: profile.linkedin_about,
        linkedin_company: profile.linkedin_company,
      },
      inspirations: inspirations || [],
      recent_conversations: conversations || [],
    };

    // Generate AI prompt
    const prompt = `You are a content strategy expert. Based on the following user context, generate 3 personalized content suggestions that would be valuable for their professional growth and audience engagement.

User Profile:
- Name: ${userContext.profile.linkedin_name || 'N/A'}
- Headline: ${userContext.profile.linkedin_headline || 'N/A'}
- Company: ${userContext.profile.linkedin_company || 'N/A'}
- About: ${userContext.profile.linkedin_about || 'N/A'}
- Goals: ${JSON.stringify(userContext.profile.goals) || 'N/A'}
- Content Guides: ${JSON.stringify(userContext.profile.content_guides) || 'N/A'}

Inspirations (people they admire):
${userContext.inspirations.map(i => `- ${i.name} at ${i.company}: ${i.headline}`).join('\n') || 'None'}

Recent conversations topics:
${userContext.recent_conversations.map(c => `- ${c.title}`).join('\n') || 'None'}

Generate exactly 3 content suggestions. For each suggestion, provide:
1. A compelling title (max 80 characters)
2. A brief description (max 150 characters)
3. A detailed outline with key points to cover

Format your response as a JSON array with this structure:
[
  {
    "title": "Content title here",
    "description": "Brief description here", 
    "outline": "Detailed outline with key points, structure, and approach"
  }
]

Make suggestions relevant to their industry, goals, and inspired by their role models' content style.`;

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional content strategist. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!openAIResponse.ok) {
      console.error('OpenAI API error:', await openAIResponse.text());
      throw new Error('Failed to generate suggestions');
    }

    const aiData = await openAIResponse.json();
    const suggestionsText = aiData.choices[0].message.content;
    
    let suggestions;
    try {
      suggestions = JSON.parse(suggestionsText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', suggestionsText);
      throw new Error('Invalid AI response format');
    }

    // Clear old suggestions and save new ones
    await supabaseClient
      .from('content_suggestions')
      .update({ is_active: false })
      .eq('user_id', user.id);

    // Insert new suggestions
    const suggestionsToInsert = suggestions.map((suggestion: any) => ({
      user_id: user.id,
      title: suggestion.title,
      description: suggestion.description,
      suggested_outline: suggestion.outline,
      context_used: userContext,
    }));

    const { data: newSuggestions, error: insertError } = await supabaseClient
      .from('content_suggestions')
      .insert(suggestionsToInsert)
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      throw new Error('Failed to save suggestions');
    }

    console.log('Successfully generated and saved suggestions:', newSuggestions?.length);

    return new Response(JSON.stringify({ 
      suggestions: newSuggestions,
      generated_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-content-suggestions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});