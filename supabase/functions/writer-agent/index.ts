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

  // Get rich user profile for enhanced context
  const userProfile = await buildRichUserProfile(userId, supabaseClient)

  // Prepare context from citations
  const contextText = citations.map(citation => 
    `[${citation.type.toUpperCase()}] ${citation.content}`
  ).join('\n\n')

  // Generate content based on platform
  const content = await generatePlatformSpecificContent(brief, contextText, userProfile, openaiApiKey)

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
      systemPrompt = `You are sharing authentic personal insights from your professional experience. Write in a conversational, genuine voice that reflects your unique perspective and expertise. Avoid corporate jargon and generic business speak. Focus on personal stories, honest experiences, and practical insights that only you could share.`
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
  
  return `ROLE: You are ${userContext.role} with deep expertise in ${userContext.domain}.

CONTEXT SYNTHESIS:
Original Request: "${brief.original_content || 'Create professional content'}"
Business Context: ${brief.business_context || 'Professional content sharing'}
Emotional Tone: ${brief.emotional_tone || 'neutral'}
Content Type: ${brief.content_type || 'informational'}
User Writing Style: ${userContext.writingPatterns?.tone || 'professional'} and ${userContext.writingPatterns?.style || 'balanced'}

USER PROFILE:
- Name: ${userContext.name}
- Role: ${userContext.headline}
- Company: ${userContext.company}
- Industry: ${userContext.industry}
- Expertise: ${userContext.expertise?.join(', ') || 'Business leadership'}
- Preferred Topics: ${userContext.preferredTopics?.join(', ') || 'Professional insights'}
- Engagement Triggers: ${userContext.engagementTriggers?.join(', ') || 'Questions and stories'}

CONTENT REQUIREMENTS:
Topic: ${brief.topic}
Tone: ${brief.tone}
Angle: ${brief.angle}
Length: ${lengthGuide}
Urgency: ${brief.urgency || 'normal'}

KNOWLEDGE INTEGRATION:
${contextText}

STRATEGIC APPROACH:
1. ANALYZE the user's intent beyond surface request
2. SYNTHESIZE knowledge base insights with current business context
3. CRAFT content that reflects authentic voice and established expertise
4. OPTIMIZE for LinkedIn engagement using user's proven triggers

OUTPUT REQUIREMENTS:
- Write in FIRST PERSON as ${userContext.name} sharing personal experience
- Use conversational, authentic tone - NOT corporate speak
- Start with personal perspective or story ("How i do it...", "In my experience...")
- Share specific, actionable insights from real experience
- Avoid generic business language and bullet points
- Use natural, human language that sounds like a real person talking
- Include vulnerability or honest admission when appropriate
- End with genuine question or invitation for dialogue

Generate authentic, personal LinkedIn content as ${userContext.name}:`
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

/**
 * Build rich user profile from all available data
 */
async function buildRichUserProfile(userId: string, supabaseClient: any): Promise<any> {
  try {
    // Get comprehensive profile data
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('display_name, linkedin_headline, company_linkedin, industry, linkedin_about, goals, content_guides, pacing_preferences')
      .eq('user_id', userId)
      .single()

    // Get recent meeting notes for writing pattern analysis
    const { data: recentNotes } = await supabaseClient
      .from('meeting_notes')
      .select('content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get recent content for voice analysis
    const { data: recentContent } = await supabaseClient
      .from('content_suggestions')
      .select('content, engagement_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Analyze writing patterns from recent content
    const writingPatterns = analyzeWritingPatterns(recentNotes || [], recentContent || [])

    // Build comprehensive user persona
    const richProfile = {
      // Basic info
      name: profile?.display_name || 'Professional',
      headline: profile?.linkedin_headline || '',
      company: profile?.company_linkedin || '',
      industry: profile?.industry || 'Business',
      about: profile?.linkedin_about || '',

      // Goals and preferences
      goals: profile?.goals || {},
      contentGuides: profile?.content_guides || {},
      pacingPreferences: profile?.pacing_preferences || {},

      // Derived insights
      writingPatterns,
      
      // Professional context
      role: extractRole(profile?.linkedin_headline || ''),
      domain: profile?.industry || 'business',
      expertise: extractExpertise(profile?.linkedin_about || '', profile?.linkedin_headline || ''),
      
      // Content preferences
      preferredTopics: extractPreferredTopics(recentNotes || [], profile?.goals || {}),
      engagementTriggers: analyzeEngagementTriggers(recentContent || [])
    }

    console.log('Built rich user profile:', richProfile)
    return richProfile

  } catch (error) {
    console.error('Error building rich user profile:', error)
    // Fallback to basic profile
    return {
      name: 'Professional',
      headline: '',
      company: '',
      role: 'Executive',
      domain: 'business',
      writingPatterns: { tone: 'professional', style: 'concise' }
    }
  }
}

/**
 * Analyze writing patterns from user's content
 */
function analyzeWritingPatterns(notes: any[], content: any[]): any {
  const allText = [
    ...notes.map(note => note.content),
    ...content.map(item => item.content)
  ].join(' ')

  if (!allText.trim()) {
    return {
      tone: 'professional',
      style: 'concise',
      commonPhrases: [],
      averageLength: 'medium'
    }
  }

  // Analyze tone
  const personalWords = ['I', 'my', 'me', 'personally', 'experience', 'believe']
  const technicalWords = ['system', 'process', 'framework', 'strategy', 'implementation']
  const casualWords = ['awesome', 'great', 'love', 'excited', 'amazing']

  const personalCount = personalWords.filter(word => 
    allText.toLowerCase().includes(word.toLowerCase())).length
  const technicalCount = technicalWords.filter(word => 
    allText.toLowerCase().includes(word.toLowerCase())).length
  const casualCount = casualWords.filter(word => 
    allText.toLowerCase().includes(word.toLowerCase())).length

  let tone = 'professional'
  if (casualCount > personalCount && casualCount > technicalCount) {
    tone = 'casual'
  } else if (personalCount > technicalCount) {
    tone = 'personal'
  } else if (technicalCount > personalCount) {
    tone = 'technical'
  }

  return {
    tone,
    style: 'balanced',
    commonPhrases: [],
    averageLength: 'medium'
  }
}

/**
 * Extract role from LinkedIn headline
 */
function extractRole(headline: string): string {
  const roleKeywords = {
    'CEO': ['CEO', 'Chief Executive', 'Founder'],
    'CTO': ['CTO', 'Chief Technology', 'Technical Lead'],
    'Manager': ['Manager', 'Director', 'Head of'],
    'Developer': ['Developer', 'Engineer', 'Programmer'],
    'Consultant': ['Consultant', 'Advisory', 'Advisor'],
    'Executive': ['Executive', 'VP', 'Vice President']
  }

  for (const [role, keywords] of Object.entries(roleKeywords)) {
    if (keywords.some(keyword => headline.toLowerCase().includes(keyword.toLowerCase()))) {
      return role
    }
  }

  return 'Professional'
}

/**
 * Extract expertise areas from about and headline
 */
function extractExpertise(about: string, headline: string): string[] {
  const text = `${about} ${headline}`.toLowerCase()
  const expertiseAreas = [
    'artificial intelligence', 'ai', 'machine learning',
    'software development', 'web development', 'mobile development',
    'marketing', 'digital marketing', 'content marketing',
    'sales', 'business development', 'growth',
    'leadership', 'management', 'strategy'
  ]

  return expertiseAreas.filter(area => text.includes(area))
}

/**
 * Extract preferred topics from notes and goals
 */
function extractPreferredTopics(notes: any[], goals: any): string[] {
  const topics = new Set<string>()
  
  // From goals
  if (goals.content_topics) {
    goals.content_topics.forEach((topic: string) => topics.add(topic))
  }

  return Array.from(topics).slice(0, 5)
}

/**
 * Analyze engagement triggers from past content
 */
function analyzeEngagementTriggers(content: any[]): string[] {
  return ['questions', 'stories', 'tips'] // Default triggers
}
