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

  // Analyze original order message for deeper context
  const orderContext = await analyzeOrderContext(order.params_json?.original_content || '', order.user_id, supabaseClient)

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
  
  // ✅ ENHANCED: Extract meeting context and knowledge base context for personalization
  const meetingContext = params.context?.meeting_context || {};
  const knowledgeBaseContext = params.context?.knowledge_base_context || {};
  const enhancedSuggestion = params.context?.enhanced_suggestion || false;
  
  // ✅ ENHANCED: Use meeting context to personalize the topic and angle
  let personalizedTopic = params.topic || 'general business insights';
  let personalizedAngle = params.angle || orderContext.suggestedAngle || 'insight';
  
  if (enhancedSuggestion && meetingContext?.recent_meetings?.length > 0) {
    const latestMeeting = meetingContext.recent_meetings[0];
    
    // Personalize topic based on recent meeting
    if (latestMeeting.title) {
      personalizedTopic = `Insights from recent meeting: ${latestMeeting.title}`;
    }
    
    // Personalize angle based on meeting topics
    if (latestMeeting.topics_discussed?.length > 0) {
      const mainTopics = latestMeeting.topics_discussed.slice(0, 2).map((t: any) => t.text).join(', ');
      personalizedAngle = `Meeting Insights: ${mainTopics}`;
    }
    
    // Use meeting summary for better context
    if (latestMeeting.key_insights) {
      personalizedTopic = `${personalizedTopic} - ${latestMeeting.key_insights}`;
    }
  }
  
  // Build the content brief with order context
  const brief: ContentBrief = {
    platform: params.platform || preferences.prefer_platform || 'linkedin',
    length: params.length || preferences.default_length || 'medium',
    tone: params.tone || preferences.default_tone || 'professional',
    angle: personalizedAngle,
    topic: personalizedTopic,
    refs: params.refs || [],
    content_guides: contentGuides,
    original_content: params.original_content,
    // Enhanced context from order analysis
    order_context: orderContext,
    business_context: orderContext.businessContext,
    emotional_tone: orderContext.emotionalTone,
    content_type: orderContext.contentType,
    urgency: orderContext.urgency,
    
    // ✅ NEW: Rich meeting context for AI enhancement
    meeting_context: enhancedSuggestion ? {
      recent_meetings: meetingContext.recent_meetings || [],
      key_insights: meetingContext.key_insights || null,
      action_items: meetingContext.action_items || [],
      topics_discussed: meetingContext.topics_discussed || []
    } : null,
    
    // ✅ NEW: Knowledge base context for content relevance
    knowledge_base_context: enhancedSuggestion ? {
      recent_transcripts: knowledgeBaseContext.recent_transcripts || [],
      available_files: knowledgeBaseContext.available_files || [],
      content_extraction_status: knowledgeBaseContext.content_extraction_status || []
    } : null,
    
    // ✅ NEW: Enhanced suggestion metadata
    enhanced_suggestion: enhancedSuggestion,
    context_integration: params.context?.context_integration || false
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

  // ✅ ENHANCED: Log the enhanced brief details for debugging
  if (brief.enhanced_suggestion) {
    console.log(`🎯 Enhanced content brief created for user ${order.user_id}:`);
    console.log(`   📝 Topic: ${enhancedBrief.topic}`);
    console.log(`   🎭 Angle: ${enhancedBrief.angle}`);
    console.log(`   📅 Meeting Context: ${brief.meeting_context?.recent_meetings?.length || 0} recent meetings`);
    console.log(`   📚 Knowledge Base: ${brief.knowledge_base_context?.recent_transcripts?.length || 0} recent transcripts`);
  }

  console.log('Content brief built:', enhancedBrief)
  return enhancedBrief
}

async function enhanceBriefWithAI(brief: ContentBrief, order: any): Promise<ContentBrief> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    console.log('OPENAI_API_KEY not found, skipping AI enhancement')
    return brief
  }

  try {
    // ✅ ENHANCED: Build context-aware prompt using meeting insights
    let contextPrompt = '';
    
    if (brief.enhanced_suggestion && brief.meeting_context?.recent_meetings?.length > 0) {
      const latestMeeting = brief.meeting_context.recent_meetings[0];
      contextPrompt = `

🎯 ENHANCED CONTEXT - Recent Meeting Insights:
- Meeting Title: ${latestMeeting.title || 'Recent meeting'}
- Key Topics: ${latestMeeting.topics_discussed?.map((t: any) => t.text).join(', ') || 'Various topics'}
- Action Items: ${latestMeeting.action_items?.map((a: any) => a.text).join(', ') || 'None specified'}
- Key Insights: ${latestMeeting.key_insights || 'Meeting summary available'}

💡 Use these meeting insights to make the content more relevant and personalized to the user's recent activities.`;
    }
    
    if (brief.knowledge_base_context?.recent_transcripts?.length > 0) {
      const transcriptCount = brief.knowledge_base_context.recent_transcripts.length;
      contextPrompt += `

📚 KNOWLEDGE BASE CONTEXT:
- Recent Transcripts: ${transcriptCount} new transcript(s) available
- Content can reference and build upon these recent materials
- Use this context to create more informed and relevant content`;
    }

    const prompt = `Enhance this content brief for better AI content generation.

Original Brief:
- Platform: ${brief.platform}
- Length: ${brief.length}
- Tone: ${brief.tone}
- Angle: ${brief.angle}
- Topic: ${brief.topic}
- Original Content: ${brief.original_content || 'None provided'}
- Enhanced Suggestion: ${brief.enhanced_suggestion ? 'Yes - Use meeting context' : 'No - Standard content'}

User Goals: ${JSON.stringify(brief.content_guides || {})}${contextPrompt}

Enhance the brief by:
1. Clarifying the topic if vague
2. Suggesting specific angles or perspectives
3. Adding target audience details if missing
4. Identifying key points to cover
5. Suggesting relevant hashtags or references
6. ${brief.enhanced_suggestion ? 'Incorporating meeting insights for personalization' : 'Creating engaging general content'}

Return only valid JSON:
{
  "enhanced_topic": "clear, specific topic",
  "suggested_angle": "specific angle or perspective",
  "target_audience": "who this content is for",
  "key_points": ["point1", "point2", "point3"],
  "suggested_hashtags": ["hashtag1", "hashtag2"],
  "content_structure": "suggested structure (e.g., problem-solution, story, tips)",
  "meeting_insights_integration": "${brief.enhanced_suggestion ? 'How to incorporate meeting insights' : 'N/A'}"
}`

    console.log(`🤖 Enhancing brief with AI${brief.enhanced_suggestion ? ' (Enhanced mode with meeting context)' : ''}`);
    
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
            content: `You are an expert content strategist specializing in ${brief.enhanced_suggestion ? 'context-aware, personalized content' : 'general business content'}. ${brief.enhanced_suggestion ? 'Use meeting insights to create highly relevant content.' : 'Create engaging content based on user preferences.'}`
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

/**
 * Analyze original order message for deeper context and intent
 */
async function analyzeOrderContext(originalMessage: string, userId: string, supabaseClient: any): Promise<any> {
  if (!originalMessage || originalMessage.trim() === '') {
    return {
      explicitRequests: [],
      businessContext: 'general business content',
      emotionalTone: 'neutral',
      implicitNeeds: [],
      urgency: 'normal',
      contentType: 'informational'
    }
  }

  const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
  if (!openaiApiKey) {
    console.warn('OPENAI_API_KEY not found, using basic order analysis')
    return analyzeOrderBasic(originalMessage)
  }

  try {
    // Get user context for better analysis
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('linkedin_headline, company_linkedin, industry, goals')
      .eq('user_id', userId)
      .single()

    const userContext = profile ? {
      role: profile.linkedin_headline || 'Professional',
      company: profile.company_linkedin || 'Company',
      industry: profile.industry || 'Business',
      goals: profile.goals || {}
    } : {}

    const prompt = `Analyze this content creation request for deep context and intent.

Original Message: "${originalMessage}"

User Context:
- Role: ${userContext.role}
- Company: ${userContext.company}
- Industry: ${userContext.industry}

Extract and analyze:
1. Explicit requests (what they directly asked for)
2. Business context (what business situation prompted this)
3. Emotional tone (urgency, excitement, concern, etc.)
4. Implicit needs (what they might need but didn't ask for)
5. Content purpose (educate, promote, share experience, etc.)

Return only valid JSON:
{
  "explicitRequests": ["request1", "request2"],
  "businessContext": "description of business situation",
  "emotionalTone": "tone description",
  "implicitNeeds": ["need1", "need2"],
  "urgency": "low|normal|high",
  "contentType": "educational|promotional|personal|thought-leadership",
  "keyInsights": ["insight1", "insight2"],
  "suggestedAngle": "recommended content angle"
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
            content: 'You are an expert at analyzing business communication and extracting context for content creation. Always return valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 600,
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

    const analysis = JSON.parse(aiResponse)
    console.log('Order context analysis:', analysis)
    
    return analysis

  } catch (error) {
    console.error('Error in AI order analysis:', error)
    return analyzeOrderBasic(originalMessage)
  }
}

/**
 * Basic rule-based order analysis fallback
 */
function analyzeOrderBasic(message: string): any {
  const lowerMessage = message.toLowerCase()
  
  // Detect urgency
  const urgencyWords = ['urgent', 'asap', 'quickly', 'immediately', 'soon', 'deadline']
  const urgency = urgencyWords.some(word => lowerMessage.includes(word)) ? 'high' : 'normal'
  
  // Detect emotional tone
  let emotionalTone = 'neutral'
  if (lowerMessage.includes('excited') || lowerMessage.includes('great') || lowerMessage.includes('amazing')) {
    emotionalTone = 'positive'
  } else if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('challenge')) {
    emotionalTone = 'concerned'
  }
  
  // Detect content type
  let contentType = 'informational'
  if (lowerMessage.includes('promote') || lowerMessage.includes('announce') || lowerMessage.includes('launch')) {
    contentType = 'promotional'
  } else if (lowerMessage.includes('experience') || lowerMessage.includes('story') || lowerMessage.includes('learned')) {
    contentType = 'personal'
  } else if (lowerMessage.includes('insight') || lowerMessage.includes('trend') || lowerMessage.includes('opinion')) {
    contentType = 'thought-leadership'
  }

  return {
    explicitRequests: [message],
    businessContext: 'User requested content creation',
    emotionalTone,
    implicitNeeds: ['engaging content', 'professional voice'],
    urgency,
    contentType,
    keyInsights: [],
    suggestedAngle: 'professional perspective'
  }
}
