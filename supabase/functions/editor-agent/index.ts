import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EditorRequest {
  draft: any;
  brief: any;
  user_id: string;
}

interface EditedDraft {
  title: string;
  content: string;
  quality_score: number;
  word_count: number;
  editing_metadata: {
    platform_optimizations: string[];
    tone_adjustments: string[];
    structure_improvements: string[];
    engagement_enhancements: string[];
  };
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

    const { draft, brief, user_id }: EditorRequest = await req.json()

    if (!draft || !brief || !user_id) {
      throw new Error('draft, brief, and user_id are required')
    }

    const editedDraft = await editContentDraft(supabaseClient, draft, brief, user_id)

    return new Response(JSON.stringify({ success: true, draft: editedDraft }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Editor agent error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function editContentDraft(
  supabaseClient: any, 
  draft: any, 
  brief: any, 
  userId: string
): Promise<EditedDraft> {
  console.log(`Editing content draft for user ${userId}`)

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required for content editing')
  }

  // Get user profile for context
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('display_name, linkedin_headline, company_linkedin')
    .eq('user_id', userId)
    .single()

  const userContext = {
    name: profile?.display_name || 'Executive',
    headline: profile?.linkedin_headline || '',
    company: profile?.company_linkedin || ''
  }

  // Analyze and edit the content
  const analysis = await analyzeContent(draft, brief, userContext, openaiApiKey)
  const editedContent = await refineContent(draft, brief, analysis, openaiApiKey)
  const qualityScore = await calculateQualityScore(editedContent, brief, openaiApiKey)

  return {
    title: draft.title,
    content: editedContent,
    quality_score: qualityScore,
    word_count: editedContent.split(' ').length,
    editing_metadata: analysis
  }
}

async function analyzeContent(
  draft: any, 
  brief: any, 
  userContext: any, 
  openaiApiKey: string
): Promise<any> {
  const prompt = `Analyze this content for improvements based on the brief and user context.

Content:
${draft.content}

Brief:
- Platform: ${brief.platform}
- Tone: ${brief.tone}
- Length: ${brief.length}
- Angle: ${brief.angle}
- Topic: ${brief.topic}

User Context:
- Name: ${userContext.name}
- Headline: ${userContext.headline}
- Company: ${userContext.company}

Analyze the content and provide specific improvement suggestions in these categories:
1. Platform optimizations (platform-specific best practices)
2. Tone adjustments (matching the desired tone)
3. Structure improvements (flow, readability, engagement)
4. Engagement enhancements (hooks, CTAs, questions)

Return only valid JSON:
{
  "platform_optimizations": ["suggestion1", "suggestion2"],
  "tone_adjustments": ["suggestion1", "suggestion2"],
  "structure_improvements": ["suggestion1", "suggestion2"],
  "engagement_enhancements": ["suggestion1", "suggestion2"],
  "overall_assessment": "brief assessment of content quality"
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
          content: 'You are an expert content editor specializing in executive thought leadership content.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const analysis = data.choices[0]?.message?.content

  if (!analysis) {
    throw new Error('No analysis generated')
  }

  return JSON.parse(analysis)
}

async function refineContent(
  draft: any, 
  brief: any, 
  analysis: any, 
  openaiApiKey: string
): Promise<string> {
  const prompt = `Refine this content based on the analysis and brief requirements.

Original Content:
${draft.content}

Brief Requirements:
- Platform: ${brief.platform}
- Tone: ${brief.tone}
- Length: ${brief.length}
- Angle: ${brief.angle}
- Topic: ${brief.topic}

Analysis and Improvements Needed:
${JSON.stringify(analysis, null, 2)}

Instructions:
1. Apply the suggested improvements from the analysis
2. Ensure the content matches the platform best practices
3. Adjust tone to match the brief requirements
4. Improve structure and flow
5. Enhance engagement elements
6. Maintain the core message and insights
7. Keep the length appropriate for the brief

Return the refined content only (no explanations or markdown formatting):`

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
          content: 'You are an expert content editor. Refine content based on specific requirements and analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      max_tokens: 1500,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const refinedContent = data.choices[0]?.message?.content

  if (!refinedContent) {
    throw new Error('No refined content generated')
  }

  return refinedContent
}

async function calculateQualityScore(
  content: string, 
  brief: any, 
  openaiApiKey: string
): Promise<number> {
  const prompt = `Rate the quality of this content on a scale of 0.0 to 1.0 based on these criteria:

Content:
${content}

Brief Requirements:
- Platform: ${brief.platform}
- Tone: ${brief.tone}
- Length: ${brief.length}
- Angle: ${brief.angle}
- Topic: ${brief.topic}

Evaluation Criteria:
1. Relevance to topic (0-1)
2. Platform appropriateness (0-1)
3. Tone consistency (0-1)
4. Engagement potential (0-1)
5. Professional quality (0-1)

Calculate the average score and return only the number (e.g., 0.85):`

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
          content: 'You are a content quality assessor. Rate content quality on a 0.0-1.0 scale.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 50,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const scoreText = data.choices[0]?.message?.content

  if (!scoreText) {
    throw new Error('No quality score generated')
  }

  // Extract numeric score
  const score = parseFloat(scoreText.trim())
  
  if (isNaN(score) || score < 0 || score > 1) {
    console.warn('Invalid quality score, using default:', scoreText)
    return 0.8 // Default score
  }

  return score
}
