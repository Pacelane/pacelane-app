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
  console.log('WriterAgent: brief snapshot', {
    platform: brief?.platform,
    length: brief?.length,
    tone: brief?.tone,
    angle: brief?.angle,
    language: brief?.language || brief?.locale,
  })

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is required for content generation')
  }

  // Get rich user profile for enhanced context
  const userProfile = await buildRichUserProfile(userId, supabaseClient)
  // add userId so inferRequestedLanguage can use it
  userProfile.user_id = userId

  // Prepare context from citations
  const contextText = citations.map(citation => 
    `[${citation.type.toUpperCase()}] ${citation.content}`
  ).join('\n\n')

  // Generate content based on platform
  const content = await generatePlatformSpecificContent(brief, contextText, userProfile, openaiApiKey)
  console.log('WriterAgent: content generated length (chars)', content?.length || 0)

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
  // Determine requested content language from brief or recent WhatsApp inputs
  const contentLanguage = await inferRequestedLanguage(brief, openaiApiKey, userContext)
  console.log('WriterAgent: resolved content language', contentLanguage)
  console.log('WriterAgent: platform', platform)

  let systemPrompt = ''
  let userPrompt = ''

  switch (platform) {
    case 'linkedin':
      systemPrompt = `You are sharing authentic personal insights from your professional experience. Write in a conversational, genuine voice that reflects your unique perspective and expertise. Avoid corporate jargon and generic business speak. Focus on personal stories, honest experiences, and practical insights that only you could share. Always write strictly in ${contentLanguage}. Do not switch languages. If context appears in other languages, keep proper nouns but write the post in ${contentLanguage}.`
      userPrompt = buildLinkedInPrompt(brief, contextText, userContext)
      break
    case 'twitter':
      systemPrompt = `You are an expert Twitter content creator for executives. Create concise, impactful tweets that drive engagement and thought leadership. Always write strictly in ${contentLanguage}. Do not switch languages. If context appears in other languages, keep proper nouns but write in ${contentLanguage}.`
      userPrompt = buildTwitterPrompt(brief, contextText, userContext)
      break
    case 'instagram':
      systemPrompt = `You are an expert Instagram content creator for executives. Create visually-oriented, engaging content with compelling captions. Always write strictly in ${contentLanguage}. Do not switch languages. If context appears in other languages, keep proper nouns but write in ${contentLanguage}.`
      userPrompt = buildInstagramPrompt(brief, contextText, userContext)
      break
    default:
      systemPrompt = `You are an expert content creator for executives. Create professional, engaging content that demonstrates thought leadership. Always write strictly in ${contentLanguage}. Do not switch languages. If context appears in other languages, keep proper nouns but write in ${contentLanguage}.`
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
    const apiErrorText = await response.text().catch(() => '')
    console.error('WriterAgent: OpenAI API error', response.status, apiErrorText)
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const generatedContent = data.choices[0]?.message?.content

  if (!generatedContent) {
    throw new Error('No content generated')
  }

  // Verify language, auto-correct if model ignored constraint
  try {
    const detectedOutLang = await detectLanguageOf(generatedContent, openaiApiKey)
    console.log('WriterAgent: output language detected', detectedOutLang)
    if (detectedOutLang && contentLanguage && detectedOutLang.toLowerCase() !== contentLanguage.toLowerCase()) {
      console.log(`WriterAgent: correcting output language from ${detectedOutLang} to ${contentLanguage}`)
      const corrected = await translateToLanguage(generatedContent, contentLanguage, openaiApiKey)
      return corrected || generatedContent
    }
  } catch (e) {
    console.warn('WriterAgent: language verification/translation skipped due to error')
  }

  return generatedContent
}

/**
 * Infer the requested output language.
 * Priority:
 * 1) brief.language or brief.locale if provided
 * 2) Language of the latest WhatsApp-derived inputs (meeting_notes.content or audio_files.transcription)
 * 3) Fallback to 'English'
 */
async function inferRequestedLanguage(brief: any, openaiApiKey: string, userContext: any): Promise<string> {
  try {
    const explicit = (brief?.language || brief?.locale || '').toString().trim()
    if (explicit) {
      console.log('WriterAgent: language from brief', explicit)
      return explicit
    }

    // 1) Prefer the exact message that generated the order (from Chatwoot → content_order → order-builder)
    const originalContent = (brief?.original_content || '').toString().trim()
    if (originalContent) {
      console.log('WriterAgent: inferring language from brief.original_content (exact order message)')
      const fromOriginal = await detectLanguageOf(originalContent, openaiApiKey)
      if (fromOriginal) {
        console.log('WriterAgent: detected from original_content', fromOriginal)
        return fromOriginal
      }
    }

    // 2) Otherwise, build a short sample from latest WhatsApp-origin content (text or audio transcription)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const userId = userContext?.user_id || userContext?.id || null
    if (!userId) return 'English'
    console.log('WriterAgent: inferring language using recent WhatsApp inputs for user', userId)

    // Pull recent meeting notes text
    const { data: notes } = await supabaseClient
      .from('meeting_notes')
      .select('content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)

    // Pull recent audio transcriptions
    const { data: audios } = await supabaseClient
      .from('audio_files')
      .select('transcription, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)

    const corpus = [
      ...(notes?.map((n: any) => n.content) || []),
      ...(audios?.map((a: any) => a.transcription) || []),
    ]
      .filter(Boolean)
      .join('\n')
      .slice(0, 2000) // keep it small

    console.log('WriterAgent: notes count', notes?.length || 0, 'audios count', audios?.length || 0)
    console.log('WriterAgent: corpus length', corpus?.length || 0)
    if (!corpus) {
      console.log('WriterAgent: no corpus available, defaulting to English')
      return 'English'
    }

    // Use a tiny language-id prompt (kept server-side only)
    const prompt = `Detect the primary human language of the following text. Return only the language name in English (e.g., "Portuguese", "Spanish", "English").\n\nText:\n${corpus}`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a precise language identification tool. Output only the language name.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
        max_tokens: 10,
      })
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.warn('WriterAgent: language-id API error', response.status, errText)
      return 'English'
    }
    const data = await response.json()
    const detected = data.choices?.[0]?.message?.content?.trim()
    console.log('WriterAgent: detected language', detected)
    return detected || 'English'
  } catch (_err) {
    console.warn('WriterAgent: inferRequestedLanguage failed, defaulting to English')
    return 'English'
  }
}

async function detectLanguageOf(text: string, openaiApiKey: string): Promise<string> {
  try {
    const prompt = `Detect the primary human language of the following text. Return only the language name in English.\n\nText:\n${text.slice(0, 2000)}`
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a precise language identification tool. Output only the language name.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0,
        max_tokens: 10,
      })
    })
    if (!response.ok) return ''
    const data = await response.json()
    return data.choices?.[0]?.message?.content?.trim() || ''
  } catch (_) {
    return ''
  }
}

async function translateToLanguage(text: string, targetLanguage: string, openaiApiKey: string): Promise<string> {
  try {
    const prompt = `Translate the following LinkedIn post to ${targetLanguage}. Preserve line breaks, placeholders like {X}, emoji numerals, and overall structure. Return only the translated post.\n\n${text}`
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiApiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a careful translator that preserves formatting and placeholders.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 1200,
      })
    })
    if (!response.ok) return ''
    const data = await response.json()
    return data.choices?.[0]?.message?.content || ''
  } catch (_) {
    return ''
  }
}

function buildLinkedInPrompt(brief: any, contextText: string, userContext: any): string {
  const lengthGuide = getLengthGuide(brief.length)

  const ctaEnabled = Boolean(brief?.cta?.enabled && brief?.cta?.keyword)
  const keyword = brief?.cta?.keyword || 'SYSTEM'
  const assetMode = (brief?.asset_mode || 'outcome').toLowerCase()

  const cadenceHint = (() => {
    const days = userContext?.pacingSchedule?.selected_days || userContext?.pacingPreferences?.frequency
    const time = userContext?.pacingSchedule?.preferred_time || userContext?.pacingPreferences?.recommendations_time
    if (Array.isArray(days) && days.length) {
      const label = days.slice(0, 3).map((d: string) => d[0]?.toUpperCase?.() || '').join(' ')
      return `- Cadence (internal): ${label}${time ? ` • ${time}` : ''}`
    }
    return ''
  })()

  return `ROLE
You are the founder writing in first person. Operator tone, direct and human. No corporate speak.

PROFILE SNAPSHOT
- Name: ${userContext.name}
- Role: ${userContext.headline}
- Company: ${userContext.company}
- Industry: ${userContext.industry}
- Preferred Topics: ${userContext.preferredTopics?.join(', ') || '—'}
${cadenceHint}

CONSTRAINTS
- First person only. Never address the reader directly.
- Short lines. New line every 1–2 sentences.
- No bold, no hashtags, no bullets (use emoji numerals for steps).
- Avoid metrics; use placeholders like {X} or {insert what changed} if needed.
- Narrate a real internal system already in use.
- Hook must imply there’s a repeatable system/resource behind the result.

CONTEXT (reference naturally; do not dump)
${contextText}

WRITING MODE
${assetMode === 'steal' ? `“Steal This” asset reveal. Minimal narrative. Present the internal tool/prompt/workflow and what it unlocks.` : `Outcome-based breakdown. “I built → how I used it → what changed”.`}

OUTPUT
- A LinkedIn post written as ${userContext.name}:
  - Start with a hook implying a system.
  - Narrate the system you used.
  - If steps help clarity, format as:
    1️⃣ ...\n    2️⃣ ...\n    3️⃣ ...
  - End with an authentic reflection.
  ${ctaEnabled ? `- Close with: "Want the full resource? Comment ${keyword}."` : `- No CTA unless it is already present in the brief.`}

STYLE GUARDRAILS
- Keep it personal, concrete, and specific to how you operate.
- Do not explain “why content works”; show what you actually do.

SPEC
Topic: ${brief.topic}
Tone: ${brief.tone || userContext.writingPatterns?.tone || 'personal'}
Angle: ${brief.angle || 'practical system'}
Length: ${lengthGuide}

Generate only the LinkedIn post. Do not include analysis or headings.`
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
- Make it engaging and shareable
- Reference the context naturally
- No hashtags

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
- Make it visually descriptive
- Include a call-to-action
- Keep it authentic and personal
- No hashtags

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
- No hashtags

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

    // Load active pacing schedule (for cadence-aware writing)
    const { data: schedules } = await supabaseClient
      .from('pacing_schedules')
      .select('selected_days, preferred_time, is_active, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)

    const pacingSchedule = schedules?.[0] || null

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
      pacingSchedule,

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
