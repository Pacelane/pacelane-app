import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ContentStrategy {
  themes: string[];
  topics: string[];
  contentIdeas: ContentIdea[];
  strategicRationale: string;
  targetAudience: string[];
  engagementGoals: string[];
}

interface ContentIdea {
  title: string;
  description: string;
  strategicRationale: string;
  targetAudience: string[];
  contentType: 'linkedin_post' | 'blog_article' | 'twitter_thread';
  estimatedEngagement: number;
  contextSources: string[];
  keyPoints: string[];
  hashtagSuggestions: string[];
}

class ContentStrategist {
  private supabase: any;
  private openaiApiKey: string;

  constructor(userToken: string) {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: `Bearer ${userToken}` },
        },
      }
    );

    this.openaiApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
  }

  /**
   * Generate content strategy based on context analysis
   */
  async generateContentStrategy(userId: string, contextAnalysis: any): Promise<ContentStrategy> {
    console.log(`Generating content strategy for user: ${userId}`);

    // Get user profile and goals
    const profile = await this.getUserProfile(userId);
    const inspirations = await this.getInspirations(userId);

    // Generate strategic content ideas
    const contentIdeas = await this.generateContentIdeas(contextAnalysis, profile, inspirations);

    // Create overall strategy
    const strategy: ContentStrategy = {
      themes: this.extractThemes(contentIdeas),
      topics: this.extractTopics(contentIdeas),
      contentIdeas,
      strategicRationale: await this.generateStrategicRationale(contextAnalysis, profile, contentIdeas),
      targetAudience: this.identifyTargetAudience(profile, contextAnalysis),
      engagementGoals: this.defineEngagementGoals(profile)
    };

    console.log(`Generated ${contentIdeas.length} content ideas`);
    return strategy;
  }

  /**
   * Get user profile
   */
  private async getUserProfile(userId: string): Promise<any> {
    try {
      const { data: profile, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return {};
      }

      return profile || {};
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {};
    }
  }

  /**
   * Get user inspirations
   */
  private async getInspirations(userId: string): Promise<any[]> {
    try {
      const { data: inspirations, error } = await this.supabase
        .from('inspirations')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching inspirations:', error);
        return [];
      }

      return inspirations || [];
    } catch (error) {
      console.error('Error fetching inspirations:', error);
      return [];
    }
  }

  /**
   * Generate content ideas using AI
   */
  private async generateContentIdeas(contextAnalysis: any, profile: any, inspirations: any[]): Promise<ContentIdea[]> {
    const prompt = `
You are a LinkedIn content strategy expert specializing in 2025 algorithm optimization and professional engagement. Based on the following context analysis, generate 5 strategic content ideas that would maximize the user's professional impact and audience engagement on LinkedIn.

CONTEXT ANALYSIS:
${JSON.stringify(contextAnalysis, null, 2)}

USER PROFILE:
- Name: ${profile.linkedin_name || 'N/A'}
- Headline: ${profile.linkedin_headline || 'N/A'}
- Company: ${profile.linkedin_company || 'N/A'}
- About: ${profile.linkedin_about || 'N/A'}
- Goals: ${JSON.stringify(profile.goals) || 'N/A'}
- Content Guides: ${JSON.stringify(profile.content_guides) || 'N/A'}

INSPIRATIONS (people they admire):
${inspirations.map(i => `- ${i.name} at ${i.company}: ${i.headline}`).join('\n') || 'None'}

LINKEDIN 2025 CONTENT STRATEGY GUIDELINES:

1. ALGORITHM OPTIMIZATION:
- Focus on VALUE and INSIGHTS over virality
- Prioritize KNOWLEDGE-SHARING and professional development
- Encourage MEANINGFUL CONVERSATIONS (thoughtful comments > short ones)
- LinkedIn rewards EXPERTISE and TOPIC AUTHORITY
- Content should provide GENUINE PROFESSIONAL VALUE

2. CONTENT TYPES THAT PERFORM BEST:
- Industry insights and trends analysis
- Career advice and lessons learned from experience
- How-to guides and actionable professional tips
- Personal professional stories with universal lessons
- Thought leadership on industry topics
- Behind-the-scenes business insights
- Professional challenges and solutions

3. ENGAGEMENT OPTIMIZATION:
- Ask thought-provoking questions that encourage discussion
- Share unique perspectives and experiences
- Provide actionable takeaways
- Focus on real professional outcomes (partnerships, leads, opportunities)
- Encourage professional networking and connections

4. CONTENT STRUCTURE BEST PRACTICES:
- Strong hooks that grab attention in first 2-3 lines
- Valuable body content with clear insights
- Engaging conclusions with professional call-to-action
- Use bullet points and formatting for scannability
- Keep content between 1,000-2,000 characters for optimal engagement

5. AVOID:
- Generic content without unique perspective
- Overly promotional language
- Non-professional topics
- Engagement bait ("Comment YES if you agree!")
- Excessive hashtags (3-5 max, relevant only)

Generate 5 content ideas that:
- Align with the user's expertise and professional goals
- Address their target audience's pain points and interests
- Leverage recent insights and experiences from their context
- Follow LinkedIn 2025 best practices for maximum engagement
- Have high potential for meaningful professional impact
- Encourage genuine professional discussions and networking

For each idea, provide:
1. Compelling title (max 80 characters)
2. Strategic description (max 150 characters)
3. Target audience and value proposition
4. Content type (linkedin_post, blog_article, or twitter_thread)
5. Estimated engagement potential (1-10 scale)
6. Key points to cover (3-5 bullet points)
7. Relevant hashtag suggestions (3-5 hashtags)
8. Context sources that inspired this idea

Format as JSON array:
[
  {
    "title": "Content title here",
    "description": "Brief description here",
    "strategicRationale": "Why this content is valuable",
    "targetAudience": ["audience1", "audience2"],
    "contentType": "linkedin_post",
    "estimatedEngagement": 8,
    "contextSources": ["source1", "source2"],
    "keyPoints": ["point1", "point2", "point3"],
    "hashtagSuggestions": ["#hashtag1", "#hashtag2"]
  }
]

Focus on actionable, valuable content that positions the user as a thought leader in their field.
`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a content strategy expert. Respond ONLY with valid JSON. Do not include markdown formatting, code blocks, or any other text. Return pure JSON that can be parsed directly.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const ideasText = data.choices[0].message.content;
      
      try {
        // Clean the response by removing markdown code blocks if present
        const cleanedText = this.cleanJsonResponse(ideasText);
        const ideas = JSON.parse(cleanedText);
        return Array.isArray(ideas) ? ideas : [];
      } catch (parseError) {
        console.error('Failed to parse content ideas:', parseError);
        console.error('Raw response:', ideasText);
        return [];
      }
    } catch (error) {
      console.error('Error generating content ideas:', error);
      return [];
    }
  }

  /**
   * Clean JSON response by removing markdown code blocks
   */
  private cleanJsonResponse(text: string): string {
    // Remove markdown code blocks (```json ... ```)
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    // If the response starts with a newline, remove it
    if (cleaned.startsWith('\n')) {
      cleaned = cleaned.substring(1);
    }
    
    return cleaned;
  }

  /**
   * Extract themes from content ideas
   */
  private extractThemes(contentIdeas: ContentIdea[]): string[] {
    const themes = new Set<string>();
    
    contentIdeas.forEach(idea => {
      // Extract themes from title and description
      const text = `${idea.title} ${idea.description}`.toLowerCase();
      
      // Common LinkedIn themes
      const commonThemes = [
        'leadership', 'innovation', 'growth', 'success', 'learning', 'challenges',
        'teamwork', 'strategy', 'technology', 'business', 'career', 'networking',
        'mentorship', 'change', 'opportunity', 'expertise', 'industry', 'trends'
      ];
      
      commonThemes.forEach(theme => {
        if (text.includes(theme)) {
          themes.add(theme);
        }
      });
    });
    
    return Array.from(themes).slice(0, 5);
  }

  /**
   * Extract topics from content ideas
   */
  private extractTopics(contentIdeas: ContentIdea[]): string[] {
    const topics = new Set<string>();
    
    contentIdeas.forEach(idea => {
      // Extract topics from context sources
      idea.contextSources.forEach(source => {
        if (source.includes('knowledge')) topics.add('Knowledge Sharing');
        if (source.includes('whatsapp')) topics.add('Communication');
        if (source.includes('meeting')) topics.add('Leadership');
        if (source.includes('conversation')) topics.add('Networking');
      });
    });
    
    return Array.from(topics).slice(0, 5);
  }

  /**
   * Generate strategic rationale
   */
  private async generateStrategicRationale(contextAnalysis: any, profile: any, contentIdeas: ContentIdea[]): Promise<string> {
    const prompt = `
Based on the context analysis and generated content ideas, provide a brief strategic rationale for the content strategy.

CONTEXT ANALYSIS SUMMARY:
- Expertise Areas: ${contextAnalysis.knowledgeInsights?.expertiseAreas?.slice(0, 3).join(', ') || 'N/A'}
- Key Themes: ${contextAnalysis.knowledgeInsights?.keyThemes?.slice(0, 3).join(', ') || 'N/A'}
- Communication Style: ${contextAnalysis.communicationPatterns?.writingStyle || 'N/A'}

CONTENT IDEAS GENERATED: ${contentIdeas.length}

Provide a 2-3 sentence strategic rationale explaining how these content ideas align with the user's goals and will help them achieve their professional objectives.
`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a content strategy expert.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 200,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating strategic rationale:', error);
      return 'Content strategy designed to leverage user expertise and engage target audience effectively.';
    }
  }

  /**
   * Identify target audience
   */
  private identifyTargetAudience(profile: any, contextAnalysis: any): string[] {
    const audience = new Set<string>();
    
    // Based on profile
    if (profile.linkedin_headline) {
      if (profile.linkedin_headline.toLowerCase().includes('founder')) audience.add('Founders & Entrepreneurs');
      if (profile.linkedin_headline.toLowerCase().includes('ceo')) audience.add('Executives & Leaders');
      if (profile.linkedin_headline.toLowerCase().includes('manager')) audience.add('Managers & Team Leaders');
      if (profile.linkedin_headline.toLowerCase().includes('developer')) audience.add('Tech Professionals');
    }
    
    // Based on expertise areas
    contextAnalysis.knowledgeInsights?.expertiseAreas?.forEach((area: string) => {
      if (area.toLowerCase().includes('leadership')) audience.add('Leadership & Management');
      if (area.toLowerCase().includes('tech')) audience.add('Technology Professionals');
      if (area.toLowerCase().includes('business')) audience.add('Business Professionals');
      if (area.toLowerCase().includes('marketing')) audience.add('Marketing Professionals');
    });
    
    return Array.from(audience).slice(0, 5);
  }

  /**
   * Define engagement goals
   */
  private defineEngagementGoals(profile: any): string[] {
    const goals = new Set<string>();
    
    // Based on user goals
    if (profile.goals) {
      const goalsText = JSON.stringify(profile.goals).toLowerCase();
      if (goalsText.includes('network')) goals.add('Build Professional Network');
      if (goalsText.includes('thought leader')) goals.add('Establish Thought Leadership');
      if (goalsText.includes('brand')) goals.add('Personal Brand Building');
      if (goalsText.includes('opportunity')) goals.add('Generate Business Opportunities');
      if (goalsText.includes('learn')) goals.add('Share Knowledge & Learn');
    }
    
    // Default goals
    if (goals.size === 0) {
      goals.add('Build Professional Network');
      goals.add('Establish Thought Leadership');
      goals.add('Share Valuable Insights');
    }
    
    return Array.from(goals).slice(0, 3);
  }
}

// Main handler
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get context analysis from request body
    const { contextAnalysis } = await req.json();
    
    if (!contextAnalysis) {
      return new Response(JSON.stringify({ error: 'Context analysis required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const strategist = new ContentStrategist(req.headers.get('Authorization')!.replace('Bearer ', ''));
    const strategy = await strategist.generateContentStrategy(user.id, contextAnalysis);

    return new Response(JSON.stringify({ 
      success: true,
      strategy,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in content-strategist function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 