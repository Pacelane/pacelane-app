import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface LinkedInPost {
  title: string;
  content: string;
  hashtags: string[];
  callToAction: string;
  estimatedEngagement: number;
  writingStyle: string;
  contentLength: number;
  readabilityScore: number;
  keyPoints: string[];
  contextSources: string[];
}

interface ContentWritingRequest {
  contentIdea: any;
  userContext: any;
  writingStyle: string;
  userProfile: any;
}

class ContentWriter {
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
   * Write a complete LinkedIn post based on content idea
   */
  async writeLinkedInPost(request: ContentWritingRequest): Promise<LinkedInPost> {
    console.log(`Writing LinkedIn post for idea: ${request.contentIdea.title}`);

    const post = await this.generatePostContent(request);
    const enhancedPost = await this.enhancePostWithHashtagsAndCTA(post, request);
    const finalPost = await this.optimizeForLinkedIn(enhancedPost, request);

    return finalPost;
  }

  /**
   * Generate the main post content
   */
  private async generatePostContent(request: ContentWritingRequest): Promise<Partial<LinkedInPost>> {
    const prompt = `
You are a LinkedIn content writer specializing in professional posts that maximize engagement and align with LinkedIn's 2025 algorithm. Write a complete, engaging LinkedIn post based on this content idea and user context.

CONTENT IDEA:
${JSON.stringify(request.contentIdea, null, 2)}

USER CONTEXT:
${JSON.stringify(request.userContext, null, 2)}

WRITING STYLE:
${request.writingStyle}

USER PROFILE:
- Name: ${request.userProfile.linkedin_name || 'N/A'}
- Headline: ${request.userProfile.linkedin_headline || 'N/A'}
- Company: ${request.userProfile.linkedin_company || 'N/A'}

LINKEDIN 2025 BEST PRACTICES TO FOLLOW:

1. ALGORITHM OPTIMIZATION:
- Focus on VALUE and INSIGHTS over virality
- Prioritize KNOWLEDGE-SHARING and professional development
- Encourage MEANINGFUL CONVERSATIONS (thoughtful comments > short ones)
- Avoid engagement bait ("Comment YES if you agree!")
- LinkedIn is NOT designed for virality - focus on professional value

2. CONTENT STRUCTURE (2800 characters max):
- STRONG HOOK: First 2-3 lines must grab attention immediately
- VALUABLE BODY: Provide actionable insights, lessons learned, or unique perspectives
- ENGAGING CONCLUSION: End with a compelling call-to-action
- Use SHORT PARAGRAPHS (2-3 lines max) for scannability
- Include BULLET POINTS and BOLDED KEYWORDS for readability

3. FORMATTING BEST PRACTICES:
- Use bullet points (•) to break up text
- Bold important keywords and phrases
- Keep paragraphs short and scannable
- Use line breaks strategically
- Avoid walls of text

4. ENGAGEMENT STRATEGIES:
- Ask thought-provoking questions that encourage discussion
- Share personal stories or experiences when relevant
- Provide actionable takeaways
- Encourage professional networking and connections
- Focus on real professional outcomes (partnerships, leads, opportunities)

5. CONTENT TYPES THAT PERFORM BEST:
- Industry insights and trends
- Career advice and lessons learned
- How-to guides and actionable tips
- Personal professional stories
- Thought leadership on industry topics
- Behind-the-scenes business insights

6. ALGORITHM SIGNALS TO OPTIMIZE FOR:
- Dwell time (how long users spend reading)
- Meaningful comments from relevant professionals
- Saves and shares
- Professional relevance to user's network
- Topic authority and expertise

7. AVOID:
- Excessive hashtags (3-5 max, relevant only)
- External links in main post (put in comments if needed)
- Generic content without unique perspective
- Overly promotional language
- Non-professional topics

Write a complete LinkedIn post that:
- Opens with a compelling hook that grabs attention in the first 2-3 lines
- Provides valuable insights, lessons learned, or actionable advice
- Uses storytelling or examples when appropriate
- Is optimized for LinkedIn's algorithm (2800 characters max)
- Encourages meaningful engagement and discussion
- Matches the user's professional voice and style
- Uses proper formatting with bullet points, bold text, and short paragraphs
- Ends with a clear, professional call-to-action

Structure the post with:
1. Strong opening hook (first 2-3 lines)
2. Valuable content body with clear points and formatting
3. Engaging conclusion with call-to-action
4. Professional tone throughout

Return the complete post text ready for LinkedIn. Focus on being authentic, valuable, and engaging while following all LinkedIn best practices.
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
            { role: 'system', content: 'You are a LinkedIn content writer specializing in professional posts that maximize engagement and align with LinkedIn\'s 2025 algorithm. Write engaging, valuable, and properly formatted posts.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      return {
        title: request.contentIdea.title,
        content: content,
        contentLength: content.length,
        keyPoints: request.contentIdea.keyPoints || [],
        contextSources: request.contentIdea.contextSources || [],
        writingStyle: request.writingStyle,
        estimatedEngagement: request.contentIdea.estimatedEngagement || 7
      };

    } catch (error) {
      console.error('Error generating post content:', error);
      throw error;
    }
  }

  /**
   * Enhance post with hashtags and call-to-action
   */
  private async enhancePostWithHashtagsAndCTA(post: Partial<LinkedInPost>, request: ContentWritingRequest): Promise<Partial<LinkedInPost>> {
    const prompt = `
Based on this LinkedIn post content, suggest relevant hashtags and a compelling call-to-action following LinkedIn 2025 best practices.

POST CONTENT:
${post.content}

LINKEDIN HASHTAG BEST PRACTICES:
- Use 3-5 hashtags maximum (LinkedIn flags excessive hashtags as spam)
- Choose RELEVANT hashtags that match the content topic
- Mix popular hashtags with niche ones
- Avoid generic hashtags like #motivation or #success
- Focus on industry-specific and topic-specific hashtags
- Research trending hashtags in the user's industry

CALL-TO-ACTION BEST PRACTICES:
- Encourage meaningful professional engagement
- Ask thought-provoking questions
- Invite industry discussion
- Focus on professional networking
- Avoid engagement bait ("Comment YES if you agree!")
- Make it relevant to the post content

Return a JSON object with:
{
  "hashtags": ["#relevant1", "#relevant2", "#relevant3"],
  "callToAction": "Professional call-to-action that encourages meaningful discussion"
}

Focus on hashtags that would help this post reach the right professional audience and a CTA that encourages genuine professional engagement.
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
            { role: 'system', content: 'You are a LinkedIn optimization specialist. Provide relevant hashtags and professional call-to-actions that follow LinkedIn best practices.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const enhancementText = data.choices[0].message.content;
      
      console.error('Raw response:', enhancementText);
      
      const cleanedText = this.cleanJsonResponse(enhancementText);
      const enhancement = JSON.parse(cleanedText);

      return {
        ...post,
        hashtags: enhancement.hashtags || [],
        callToAction: enhancement.callToAction || 'What are your thoughts on this? Share your experience in the comments below!'
      };

    } catch (error) {
      console.error('Error enhancing post with hashtags and CTA:', error);
      // Fallback hashtags and CTA
      return {
        ...post,
        hashtags: ['#professionaldevelopment', '#linkedin', '#networking'],
        callToAction: 'What are your thoughts on this? Share your experience in the comments below!'
      };
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
   * Optimize post for LinkedIn algorithm
   */
  private async optimizeForLinkedIn(post: Partial<LinkedInPost>, request: ContentWritingRequest): Promise<LinkedInPost> {
    // Calculate readability score
    const readabilityScore = this.calculateReadabilityScore(post.content || '');
    
    // Optimize content length and structure
    const optimizedContent = this.optimizeContentStructure(post.content || '');
    
    // LinkedIn 2025 optimization: Ensure content follows best practices
    const linkedInOptimizedContent = this.applyLinkedInOptimizations(optimizedContent);
    
    // Add hashtags to the end of the post (LinkedIn best practice)
    const hashtagString = post.hashtags?.length ? `\n\n${post.hashtags.join(' ')}` : '';
    const finalContent = `${linkedInOptimizedContent}\n\n${post.callToAction}${hashtagString}`;

    // Calculate estimated engagement based on LinkedIn best practices
    const estimatedEngagement = this.calculateLinkedInEngagementScore(finalContent, readabilityScore);

    return {
      title: post.title || '',
      content: finalContent,
      hashtags: post.hashtags || [],
      callToAction: post.callToAction || '',
      estimatedEngagement,
      writingStyle: post.writingStyle || 'professional',
      contentLength: finalContent.length,
      readabilityScore,
      keyPoints: post.keyPoints || [],
      contextSources: post.contextSources || []
    };
  }

  /**
   * Apply LinkedIn-specific optimizations to content
   */
  private applyLinkedInOptimizations(content: string): string {
    let optimized = content;

    // Ensure proper paragraph breaks for scannability
    optimized = optimized.replace(/\n{3,}/g, '\n\n');
    
    // Add bullet points where appropriate for better formatting
    optimized = optimized.replace(/^(\s*)(\d+\.\s)/gm, '$1• ');
    
    // Ensure hashtags are properly spaced
    optimized = optimized.replace(/([^\s])(#\w+)/g, '$1 $2');
    
    // Add line breaks before call-to-action for better visual separation
    optimized = optimized.replace(/([.!?])\s*([A-Z][^.!?]*\?)/g, '$1\n\n$2');
    
    return optimized;
  }

  /**
   * Calculate LinkedIn engagement score based on best practices
   */
  private calculateLinkedInEngagementScore(content: string, readabilityScore: number): number {
    let score = 7; // Base score
    
    // Content length optimization (LinkedIn prefers 1,000-2,000 characters)
    const contentLength = content.length;
    if (contentLength >= 1000 && contentLength <= 2000) {
      score += 1;
    } else if (contentLength >= 500 && contentLength <= 3000) {
      score += 0.5;
    }
    
    // Readability optimization (LinkedIn prefers readable content)
    if (readabilityScore >= 60) {
      score += 1;
    } else if (readabilityScore >= 40) {
      score += 0.5;
    }
    
    // Engagement elements
    if (content.includes('?')) score += 0.5; // Questions encourage engagement
    if (content.includes('•')) score += 0.5; // Bullet points improve readability
    if (content.includes('**')) score += 0.5; // Bold text draws attention
    
    // Professional tone indicators
    if (content.toLowerCase().includes('industry') || 
        content.toLowerCase().includes('professional') ||
        content.toLowerCase().includes('business')) {
      score += 0.5;
    }
    
    // Avoid engagement bait detection
    if (content.toLowerCase().includes('comment yes') ||
        content.toLowerCase().includes('like if you agree')) {
      score -= 1;
    }
    
    return Math.min(10, Math.max(1, Math.round(score)));
  }

  /**
   * Calculate readability score (Flesch Reading Ease)
   */
  private calculateReadabilityScore(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const syllables = this.countSyllables(text);

    if (sentences === 0 || words === 0) return 0;

    const score = 206.835 - (1.015 * (words / sentences)) - (84.6 * (syllables / words));
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Count syllables in text (simplified)
   */
  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let syllableCount = 0;

    words.forEach(word => {
      // Simple syllable counting
      const vowels = word.match(/[aeiouy]+/g);
      if (vowels) {
        syllableCount += vowels.length;
      } else {
        syllableCount += 1; // At least one syllable per word
      }
    });

    return syllableCount;
  }

  /**
   * Optimize content structure for LinkedIn
   */
  private optimizeContentStructure(content: string): string {
    // Add line breaks for better readability
    let optimized = content
      .replace(/([.!?])\s+/g, '$1\n\n') // Double line break after sentences
      .replace(/\n\n\n+/g, '\n\n') // Remove excessive line breaks
      .trim();

    // Ensure proper paragraph structure
    const paragraphs = optimized.split('\n\n');
    const formattedParagraphs = paragraphs.map(p => p.trim()).filter(p => p.length > 0);
    
    return formattedParagraphs.join('\n\n');
  }

  /**
   * Write multiple posts from content ideas
   */
  async writeMultiplePosts(userId: string, contentIdeas: any[], userContext: any): Promise<LinkedInPost[]> {
    console.log(`Writing ${contentIdeas.length} LinkedIn posts for user: ${userId}`);

    const userProfile = await this.getUserProfile(userId);
    const posts: LinkedInPost[] = [];

    for (const idea of contentIdeas) {
      try {
        const request: ContentWritingRequest = {
          contentIdea: idea,
          userContext,
          writingStyle: userContext.communicationPatterns?.writingStyle || 'professional',
          userProfile
        };

        const post = await this.writeLinkedInPost(request);
        posts.push(post);

        // Add small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error writing post for idea: ${idea.title}`, error);
        // Continue with other posts
      }
    }

    console.log(`Successfully wrote ${posts.length} posts`);
    return posts;
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

    const { contentIdeas, userContext } = await req.json();
    
    if (!contentIdeas || !Array.isArray(contentIdeas)) {
      return new Response(JSON.stringify({ error: 'Content ideas array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const writer = new ContentWriter(req.headers.get('Authorization')!.replace('Bearer ', ''));
    const posts = await writer.writeMultiplePosts(user.id, contentIdeas, userContext);

    return new Response(JSON.stringify({ 
      success: true,
      posts,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in content-writer function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 