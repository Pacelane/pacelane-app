import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContentGenerationRequest {
  user_id: string;
  brief: ContentBrief;
  context_chunks: ContextChunk[];
  platform: 'linkedin' | 'twitter' | 'instagram';
}

interface ContentBrief {
  topic: string;
  tone: 'personal' | 'professional' | 'casual' | 'authoritative';
  length: 'short' | 'medium' | 'long';
  angle: string;
  target_audience?: string;
  cta?: {
    enabled: boolean;
    keyword?: string;
  };
}

interface ContextChunk {
  id: string;
  type: 'knowledge_file' | 'meeting_note' | 'whatsapp_message' | 'calendar_event';
  content: string;
  source: string;
  relevance_score: number;
  metadata: any;
}

interface GeneratedContent {
  title: string;
  content: string;
  metadata: {
    platform: string;
    length: string;
    tone: string;
    angle: string;
    word_count: number;
    context_chunks_used: number;
    generation_metadata: any;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, brief, context_chunks, platform }: ContentGenerationRequest = await req.json();

    if (!user_id || !brief || !context_chunks) {
      throw new Error('user_id, brief, and context_chunks are required');
    }

    console.log(`🚀 Vertex AI Content Generation for user ${user_id}, platform: ${platform}`);

    // Get user profile and style information
    const userProfile = await buildRichUserProfile(supabaseClient, user_id);
    
    // Generate content using Vertex AI
    const generatedContent = await generateContentWithVertexAI(brief, context_chunks, userProfile, platform);
    
    // Save generation history
    await saveGenerationHistory(supabaseClient, user_id, brief, generatedContent, context_chunks);

    console.log(`✅ Content generated successfully: ${generatedContent.metadata.word_count} words`);

    return new Response(JSON.stringify({ 
      success: true, 
      content: generatedContent,
      generation_metadata: {
        model: 'vertex-ai-gemini',
        platform,
        context_chunks_used: context_chunks.length,
        timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Vertex AI Content Generation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function generateContentWithVertexAI(
  brief: ContentBrief,
  contextChunks: ContextChunk[],
  userProfile: any,
  platform: string
): Promise<GeneratedContent> {
  
  // For now, we'll simulate Vertex AI generation
  // In the next step, we'll integrate with actual Vertex AI API
  console.log('🔄 Simulating Vertex AI generation (will be replaced with real API)');
  
  // Build the prompt with RAG context
  const prompt = buildRAGPrompt(brief, contextChunks, userProfile, platform);
  
  // Simulate AI response (replace this with actual Vertex AI call)
  const generatedContent = await simulateVertexAIResponse(prompt, brief, platform);
  
  // Calculate word count
  const wordCount = generatedContent.split(' ').length;
  
  return {
    title: brief.topic || 'Generated Content',
    content: generatedContent,
    metadata: {
      platform,
      length: brief.length,
      tone: brief.tone,
      angle: brief.angle,
      word_count: wordCount,
      context_chunks_used: contextChunks.length,
      generation_metadata: {
        model: 'vertex-ai-gemini-simulated',
        temperature: 0.7,
        timestamp: new Date().toISOString()
      }
    }
  };
}

function buildRAGPrompt(
  brief: ContentBrief,
  contextChunks: ContextChunk[],
  userProfile: any,
  platform: string
): string {
  
  const contextText = contextChunks
    .map(chunk => `[${chunk.type.toUpperCase()}] ${chunk.content}`)
    .join('\n\n');
  
  const lengthGuide = getLengthGuide(brief.length);
  const ctaEnabled = Boolean(brief?.cta?.enabled && brief?.cta?.keyword);
  const keyword = brief?.cta?.keyword || 'SYSTEM';
  
  const platformSpecificPrompt = getPlatformSpecificPrompt(platform, brief, contextText, userProfile, lengthGuide, ctaEnabled, keyword);
  
  return platformSpecificPrompt;
}

function getPlatformSpecificPrompt(
  platform: string,
  brief: ContentBrief,
  contextText: string,
  userProfile: any,
  lengthGuide: string,
  ctaEnabled: boolean,
  keyword: string
): string {
  
  switch (platform.toLowerCase()) {
    case 'linkedin':
      return buildLinkedInPrompt(brief, contextText, userProfile, lengthGuide, ctaEnabled, keyword);
    case 'twitter':
      return buildTwitterPrompt(brief, contextText, userProfile);
    case 'instagram':
      return buildInstagramPrompt(brief, contextText, userProfile);
    default:
      return buildGenericPrompt(brief, contextText, userProfile, lengthGuide);
  }
}

function buildLinkedInPrompt(
  brief: ContentBrief,
  contextText: string,
  userProfile: any,
  lengthGuide: string,
  ctaEnabled: boolean,
  keyword: string
): string {
  
  const cadenceHint = (() => {
    const days = userProfile?.pacingSchedule?.selected_days || userProfile?.pacingPreferences?.frequency;
    const time = userProfile?.pacingSchedule?.preferred_time || userProfile?.pacingPreferences?.recommendations_time;
    if (Array.isArray(days) && days.length) {
      const label = days.slice(0, 3).map((d: string) => d[0]?.toUpperCase?.() || '').join(' ');
      return `- Cadence (internal): ${label}${time ? ` • ${time}` : ''}`;
    }
    return '';
  })();

  return `ROLE
You are ${userProfile.name} writing in first person. Operator tone, direct and human. No corporate speak.

PROFILE SNAPSHOT
- Name: ${userProfile.name}
- Role: ${userProfile.headline}
- Company: ${userProfile.company}
- Industry: ${userProfile.industry}
- Preferred Topics: ${userProfile.preferredTopics?.join(', ') || '—'}
${cadenceHint}

CONSTRAINTS
- First person only. Never address the reader directly.
- Short lines. New line every 1–2 sentences.
- No bold, no hashtags, no bullets (use emoji numerals for steps).
- Avoid metrics; use placeholders like {X} or {insert what changed} if needed.
- Narrate a real internal system already in use.
- Hook must imply there's a repeatable system/resource behind the result.

CONTEXT FROM YOUR KNOWLEDGE BASE (reference naturally; do not dump):
${contextText}

WRITING MODE
Outcome-based breakdown. "I built → how I used it → what changed".

OUTPUT
- A LinkedIn post written as ${userProfile.name}:
  - Start with a hook implying a system.
  - Narrate the system you used.
  - If steps help clarity, format as:
    1️⃣ ...\n    2️⃣ ...\n    3️⃣ ...
  - End with an authentic reflection.
  ${ctaEnabled ? `- Close with: "Want the full resource? Comment ${keyword}."` : `- No CTA unless it is already present in the brief.`}

STYLE GUARDRAILS
- Keep it personal, concrete, and specific to how you operate.
- Do not explain "why content works"; show what you actually do.

SPEC
Topic: ${brief.topic}
Tone: ${brief.tone || userProfile.writingPatterns?.tone || 'personal'}
Angle: ${brief.angle || 'practical system'}
Length: ${lengthGuide}

Generate only the LinkedIn post. Do not include analysis or headings.`;
}

function buildTwitterPrompt(brief: ContentBrief, contextText: string, userProfile: any): string {
  return `Create a Twitter thread for ${userProfile.name} (${userProfile.headline}).

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

Generate the Twitter thread:`;
}

function buildInstagramPrompt(brief: ContentBrief, contextText: string, userProfile: any): string {
  return `Create an Instagram caption for ${userProfile.name} (${userProfile.headline}).

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

Generate the Instagram caption:`;
}

function buildGenericPrompt(brief: ContentBrief, contextText: string, userProfile: any, lengthGuide: string): string {
  return `Create content for ${userProfile.name} (${userProfile.headline}).

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

Generate the content:`;
}

function getLengthGuide(length: string): string {
  switch (length?.toLowerCase()) {
    case 'short':
      return '100-200 words';
    case 'medium':
      return '200-400 words';
    case 'long':
      return '400-800 words';
    default:
      return '200-400 words';
  }
}

async function simulateVertexAIResponse(prompt: string, brief: ContentBrief, platform: string): Promise<string> {
  // This is a placeholder that simulates what Vertex AI would generate
  // In the next step, we'll replace this with actual Vertex AI API calls
  
  const baseContent = `I've been thinking about ${brief.topic} lately, and it's reminded me of a key insight from my experience.

Recently, I implemented a new approach that transformed how we handle this challenge. It started with a simple observation: ${brief.angle}.

Here's what I discovered:

1️⃣ The traditional methods weren't addressing the root cause
2️⃣ A systematic approach revealed unexpected opportunities  
3️⃣ Small changes created ripple effects across the organization

What struck me most was how this process taught me that ${brief.topic} isn't just about the immediate problem—it's about building systems that prevent similar issues in the future.

The key lesson? When you focus on the underlying patterns rather than just the symptoms, you unlock solutions that scale beyond the original challenge.

This experience reinforced my belief that ${brief.topic} requires thinking beyond quick fixes and building sustainable frameworks.`;

  // Adjust content based on platform and length
  if (platform === 'twitter') {
    return baseContent.split('\n\n')[0]; // Just the first paragraph for Twitter
  } else if (brief.length === 'short') {
    return baseContent.split('\n\n').slice(0, 2).join('\n\n'); // First two paragraphs
  }
  
  return baseContent;
}

async function buildRichUserProfile(supabaseClient: any, userId: string): Promise<any> {
  try {
    // Get comprehensive profile data
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('display_name, linkedin_headline, company_linkedin, industry, linkedin_about, goals, content_guides, pacing_preferences')
      .eq('user_id', userId)
      .single();

    // Get recent meeting notes for writing pattern analysis
    const { data: recentNotes } = await supabaseClient
      .from('meeting_notes')
      .select('content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get recent content for voice analysis
    const { data: recentContent } = await supabaseClient
      .from('content_suggestions')
      .select('content, engagement_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Analyze writing patterns from recent content
    const writingPatterns = analyzeWritingPatterns(recentNotes || [], recentContent || []);

    // Load active pacing schedule (for cadence-aware writing)
    const { data: schedules } = await supabaseClient
      .from('pacing_schedules')
      .select('selected_days, preferred_time, is_active, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    const pacingSchedule = schedules?.[0] || null;

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
    };

    console.log('Built rich user profile:', richProfile);
    return richProfile;

  } catch (error) {
    console.error('Error building rich user profile:', error);
    // Fallback to basic profile
    return {
      name: 'Professional',
      headline: '',
      company: '',
      role: 'Executive',
      domain: 'business',
      writingPatterns: { tone: 'professional', style: 'concise' }
    };
  }
}

function analyzeWritingPatterns(notes: any[], content: any[]): any {
  const allText = [
    ...notes.map(note => note.content),
    ...content.map(item => item.content)
  ].join(' ');

  if (!allText.trim()) {
    return {
      tone: 'professional',
      style: 'concise',
      commonPhrases: [],
      averageLength: 'medium'
    };
  }

  // Analyze tone
  const personalWords = ['I', 'my', 'me', 'personally', 'experience', 'believe'];
  const technicalWords = ['system', 'process', 'framework', 'strategy', 'implementation'];
  const casualWords = ['awesome', 'great', 'love', 'excited', 'amazing'];

  const personalCount = personalWords.filter(word => 
    allText.toLowerCase().includes(word.toLowerCase())).length;
  const technicalCount = technicalWords.filter(word => 
    allText.toLowerCase().includes(word.toLowerCase())).length;
  const casualCount = casualWords.filter(word => 
    allText.toLowerCase().includes(word.toLowerCase())).length;

  let tone = 'professional';
  if (casualCount > personalCount && casualCount > technicalCount) {
    tone = 'casual';
  } else if (personalCount > technicalCount) {
    tone = 'personal';
  } else if (technicalCount > personalCount) {
    tone = 'technical';
  }

  return {
    tone,
    style: 'balanced',
    commonPhrases: [],
    averageLength: 'medium'
  };
}

function extractRole(headline: string): string {
  const roleKeywords = {
    'CEO': ['CEO', 'Chief Executive', 'Founder'],
    'CTO': ['CTO', 'Chief Technology', 'Technical Lead'],
    'Manager': ['Manager', 'Director', 'Head of'],
    'Developer': ['Developer', 'Engineer', 'Programmer'],
    'Consultant': ['Consultant', 'Advisory', 'Advisor'],
    'Executive': ['Executive', 'VP', 'Vice President']
  };

  for (const [role, keywords] of Object.entries(roleKeywords)) {
    if (keywords.some(keyword => headline.toLowerCase().includes(keyword.toLowerCase()))) {
      return role;
    }
  }

  return 'Professional';
}

function extractExpertise(about: string, headline: string): string[] {
  const text = `${about} ${headline}`.toLowerCase();
  const expertiseAreas = [
    'artificial intelligence', 'ai', 'machine learning',
    'software development', 'web development', 'mobile development',
    'marketing', 'digital marketing', 'content marketing',
    'sales', 'business development', 'growth',
    'leadership', 'management', 'strategy'
  ];

  return expertiseAreas.filter(area => text.includes(area));
}

function extractPreferredTopics(notes: any[], goals: any): string[] {
  const topics = new Set<string>();
  
  // From goals
  if (goals.content_topics) {
    goals.content_topics.forEach((topic: string) => topics.add(topic));
  }

  return Array.from(topics).slice(0, 5);
}

function analyzeEngagementTriggers(content: any[]): string[] {
  return ['questions', 'stories', 'tips']; // Default triggers
}

async function saveGenerationHistory(
  supabaseClient: any,
  userId: string,
  brief: ContentBrief,
  generatedContent: GeneratedContent,
  contextChunks: ContextChunk[]
) {
  try {
    await supabaseClient
      .from('content_generations')
      .insert({
        user_id: userId,
        brief,
        generated_content: generatedContent.content,
        context_used: contextChunks,
        style_applied: generatedContent.metadata,
        created_at: new Date().toISOString()
      });
    
    console.log('✅ Generation history saved');
  } catch (error) {
    console.error('❌ Failed to save generation history:', error);
  }
}
