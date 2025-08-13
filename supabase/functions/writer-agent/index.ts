import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WriterRequest {
  brief: any;
  citations: any[];
  user_id: string;
}

interface GeneratedDraft {
  title: string;
  content: string;
  metadata: {
    platform: string;
    length: string;
    tone: string;
    angle: string;
    word_count: number;
    citations_used: number;
    generation_metadata: any;
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

    const { brief, citations, user_id }: WriterRequest = await req.json()

    if (!brief || !user_id) {
      throw new Error('brief and user_id are required')
    }

    const draft = await generateContentDraft(supabaseClient, brief, citations, user_id)

    return new Response(JSON.stringify({ success: true, draft }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Writer agent error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function generateContentDraft(
  supabaseClient: any, 
  brief: any, 
  citations: any[], 
  userId: string
): Promise<GeneratedDraft> {
  console.log(`Generating content draft for user ${userId}`)

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required for content generation')
  }

  // Get user profile for additional context
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

  // Prepare context from citations
  const contextText = citations.map(citation => 
    `[${citation.type.toUpperCase()}] ${citation.content}`
  ).join('\n\n')

  // Generate content based on platform
  const content = await generatePlatformSpecificContent(brief, contextText, userContext, openaiApiKey)

  // Calculate word count
  const wordCount = content.split(' ').length

  return {
    title: brief.topic || 'Generated Content',
    content,
    metadata: {
      platform: brief.platform,
      length: brief.length,
      tone: brief.tone,
      angle: brief.angle,
      word_count: wordCount,
      citations_used: citations.length,
      generation_metadata: {
        model: 'gpt-4o-mini',
        temperature: 0.7,
        timestamp: new Date().toISOString()
      }
    }
  }
}

async function generatePlatformSpecificContent(
  brief: any, 
  contextText: string, 
  userContext: any, 
  openaiApiKey: string
): Promise<string> {
  const platform = brief.platform?.toLowerCase() || 'linkedin'
  
  let systemPrompt = ''
  let userPrompt = ''

  switch (platform) {
    case 'linkedin':
      systemPrompt = `You are an expert LinkedIn content creator for executives. Create engaging, professional content that positions the author as a thought leader. Focus on insights, experiences, and value-driven content.`
      userPrompt = buildLinkedInPrompt(brief, contextText, userContext)
      break
    case 'twitter':
      systemPrompt = `You are an expert Twitter content creator for executives. Create concise, impactful tweets that drive engagement and thought leadership.`
      userPrompt = buildTwitterPrompt(brief, contextText, userContext)
      break
    case 'instagram':
      systemPrompt = `You are an expert Instagram content creator for executives. Create visually-oriented, engaging content with compelling captions.`
      userPrompt = buildInstagramPrompt(brief, contextText, userContext)
      break
    default:
      systemPrompt = `You are an expert content creator for executives. Create professional, engaging content that demonstrates thought leadership.`
      userPrompt = buildGenericPrompt(brief, contextText, userContext)
  }

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
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: getMaxTokens(brief.length),
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const generatedContent = data.choices[0]?.message?.content

  if (!generatedContent) {
    throw new Error('No content generated')
  }

  return generatedContent
}

function buildLinkedInPrompt(brief: any, contextText: string, userContext: any): string {
  const lengthGuide = getLengthGuide(brief.length)
  
  return `Create a LinkedIn post for ${userContext.name} (${userContext.headline} at ${userContext.company}).

Topic: ${brief.topic}
Tone: ${brief.tone}
Angle: ${brief.angle}
Length: ${lengthGuide}

Key points to cover: ${brief.key_points?.join(', ') || 'None specified'}
Target audience: ${brief.target_audience || 'Business professionals'}

Context from knowledge base:
${contextText}

Requirements:
- Start with a compelling hook
- Include personal insights or experiences
- End with a call-to-action or question
- Use appropriate hashtags
- Keep it professional but engaging
- Reference the context naturally

Generate the LinkedIn post content:`
}

function buildTwitterPrompt(brief: any, contextText: string, userContext: any): string {
  return `Create a Twitter thread for ${userContext.name} (${userContext.headline}).

Topic: ${brief.topic}
Tone: ${brief.tone}
Length: 2-3 tweets

Context from knowledge base:
${contextText}

Requirements:
- First tweet should hook readers
- Each tweet should be under 280 characters
- Include relevant hashtags
- Make it engaging and shareable
- Reference the context naturally

Generate the Twitter thread:`
}

function buildInstagramPrompt(brief: any, contextText: string, userContext: any): string {
  return `Create an Instagram caption for ${userContext.name} (${userContext.headline}).

Topic: ${brief.topic}
Tone: ${brief.tone}
Length: Medium caption

Context from knowledge base:
${contextText}

Requirements:
- Start with an engaging hook
- Include relevant hashtags
- Make it visually descriptive
- Include a call-to-action
- Keep it authentic and personal

Generate the Instagram caption:`
}

function buildGenericPrompt(brief: any, contextText: string, userContext: any): string {
  const lengthGuide = getLengthGuide(brief.length)
  
  return `Create content for ${userContext.name} (${userContext.headline}).

Topic: ${brief.topic}
Platform: ${brief.platform}
Tone: ${brief.tone}
Angle: ${brief.angle}
Length: ${lengthGuide}

Context from knowledge base:
${contextText}

Requirements:
- Engaging and professional
- Demonstrates thought leadership
- References context naturally
- Appropriate for the specified platform and length

Generate the content:`
}

function getLengthGuide(length: string): string {
  switch (length?.toLowerCase()) {
    case 'short':
      return '100-200 words'
    case 'medium':
      return '200-400 words'
    case 'long':
      return '400-800 words'
    default:
      return '200-400 words'
  }
}

function getMaxTokens(length: string): number {
  switch (length?.toLowerCase()) {
    case 'short':
      return 300
    case 'medium':
      return 600
    case 'long':
      return 1200
    default:
      return 600
  }
}
