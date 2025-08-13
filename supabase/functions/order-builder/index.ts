import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderBuilderRequest {
  order_id: string;
}

interface ContentBrief {
  platform: string;
  length: string;
  tone: string;
  angle: string;
  topic: string;
  refs: string[];
  content_guides: any;
  original_content?: string;
  target_audience?: string;
  key_points?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { order_id }: OrderBuilderRequest = await req.json()

    if (!order_id) {
      throw new Error('order_id is required')
    }

    const brief = await buildContentBrief(supabaseClient, order_id)

    return new Response(JSON.stringify({ success: true, brief }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Order builder error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function buildContentBrief(supabaseClient: any, orderId: string): Promise<ContentBrief> {
  console.log(`Building brief for order: ${orderId}`)

  // Get the content order
  const { data: order, error: orderError } = await supabaseClient
    .from('content_order')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    throw new Error(`Content order not found: ${orderId}`)
  }

  // Get user profile and preferences
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('pacing_preferences, content_guides, goals, content_pillars')
    .eq('user_id', order.user_id)
    .single()

  if (profileError) {
    console.warn('Could not fetch user profile:', profileError)
  }

  const preferences = profile?.pacing_preferences || {}
  const contentGuides = profile?.content_guides || {}
  const goals = profile?.goals || {}
  const contentPillars = profile?.content_pillars || []

  // Extract parameters from order
  const params = order.params_json || {}
  
  // Build the content brief
  const brief: ContentBrief = {
    platform: params.platform || preferences.prefer_platform || 'linkedin',
    length: params.length || preferences.default_length || 'medium',
    tone: params.tone || preferences.default_tone || 'professional',
    angle: params.angle || 'insight',
    topic: params.topic || 'general business insights',
    refs: params.refs || [],
    content_guides: contentGuides,
    original_content: params.original_content
  }

  // Add target audience if available
  if (goals.target_audience) {
    brief.target_audience = goals.target_audience
  }

  // Add key points from content pillars if relevant
  if (contentPillars.length > 0 && params.topic) {
    const relevantPillars = contentPillars.filter((pillar: any) => 
      pillar.name?.toLowerCase().includes(params.topic.toLowerCase()) ||
      pillar.description?.toLowerCase().includes(params.topic.toLowerCase())
    )
    
    if (relevantPillars.length > 0) {
      brief.key_points = relevantPillars.map((pillar: any) => pillar.name)
    }
  }

  // Validate and enhance the brief
  const enhancedBrief = await enhanceBriefWithAI(brief, order)

  console.log('Content brief built:', enhancedBrief)
  return enhancedBrief
}

async function enhanceBriefWithAI(brief: ContentBrief, order: any): Promise<ContentBrief> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    console.warn('OPENAI_API_KEY not found, skipping AI enhancement')
    return brief
  }

  try {
    const prompt = `Enhance this content brief for better AI content generation.

Original Brief:
- Platform: ${brief.platform}
- Length: ${brief.length}
- Tone: ${brief.tone}
- Angle: ${brief.angle}
- Topic: ${brief.topic}
- Original Content: ${brief.original_content || 'None provided'}

User Goals: ${JSON.stringify(brief.content_guides || {})}

Enhance the brief by:
1. Clarifying the topic if vague
2. Suggesting specific angles or perspectives
3. Adding target audience details if missing
4. Identifying key points to cover
5. Suggesting relevant hashtags or references

Return only valid JSON:
{
  "enhanced_topic": "clear, specific topic",
  "suggested_angle": "specific angle or perspective",
  "target_audience": "who this content is for",
  "key_points": ["point1", "point2", "point3"],
  "suggested_hashtags": ["hashtag1", "hashtag2"],
  "content_structure": "suggested structure (e.g., problem-solution, story, tips)"
}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert content strategist. Enhance content briefs for better AI content generation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from OpenAI')
    }

    const enhanced = JSON.parse(aiResponse)

    // Merge AI enhancements with original brief
    return {
      ...brief,
      topic: enhanced.enhanced_topic || brief.topic,
      angle: enhanced.suggested_angle || brief.angle,
      target_audience: enhanced.target_audience || brief.target_audience,
      key_points: enhanced.key_points || brief.key_points,
      refs: [...brief.refs, ...(enhanced.suggested_hashtags || [])],
      content_structure: enhanced.content_structure
    }

  } catch (error) {
    console.error('Error enhancing brief with AI:', error)
    return brief // Return original brief if AI enhancement fails
  }
}
