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
You are a LinkedIn content writer specializing in professional posts. Write a complete, engaging LinkedIn post based on this content idea and user context.

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

Write a complete LinkedIn post that:
- Opens with a compelling hook that grabs attention
- Provides valuable insights or lessons learned
- Uses storytelling or examples when appropriate
- Is optimized for LinkedIn's algorithm (2800 characters max)
- Encourages engagement and discussion
- Matches the user's professional voice and style

Structure the post with:
1. Strong opening hook (first 2-3 lines)
2. Valuable content body with clear points
3. Engaging conclusion
4. Clear call-to-action

Return the complete post text ready for LinkedIn. Focus on being authentic, valuable, and engaging.
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
            { role: 'system', content: 'You are a LinkedIn content writer. Write engaging, professional posts.' },
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
Based on this LinkedIn post content, suggest relevant hashtags and a compelling call-to-action.

POST CONTENT:
${post.content}

CONTENT IDEA:
${JSON.stringify(request.contentIdea, null, 2)}

USER PROFILE:
- Headline: ${request.userProfile.linkedin_headline || 'N/A'}
- Company: ${request.userProfile.linkedin_company || 'N/A'}

Provide:
1. 3-5 relevant hashtags (mix of popular and niche)
2. A compelling call-to-action that encourages engagement

Format as JSON:
{
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "callToAction": "What's your experience with this? Share your thoughts below! 👇"
}

Make hashtags relevant to the content and user's industry. Make the CTA engaging and specific to the post content.
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
            { role: 'system', content: 'You are a LinkedIn optimization expert. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.5,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const enhancementText = data.choices[0].message.content;
      
      try {
        const enhancement = JSON.parse(enhancementText);
        return {
          ...post,
          hashtags: enhancement.hashtags || [],
          callToAction: enhancement.callToAction || "What's your experience with this? Share your thoughts below! 👇"
        };
      } catch (parseError) {
        console.error('Failed to parse hashtags and CTA:', parseError);
        return {
          ...post,
          hashtags: request.contentIdea.hashtagSuggestions || ["#LinkedIn", "#ProfessionalDevelopment"],
          callToAction: "What's your experience with this? Share your thoughts below! 👇"
        };
      }
    } catch (error) {
      console.error('Error enhancing post with hashtags and CTA:', error);
      return {
        ...post,
        hashtags: request.contentIdea.hashtagSuggestions || ["#LinkedIn", "#ProfessionalDevelopment"],
        callToAction: "What's your experience with this? Share your thoughts below! 👇"
      };
    }
  }

  /**
   * Optimize post for LinkedIn algorithm
   */
  private async optimizeForLinkedIn(post: Partial<LinkedInPost>, request: ContentWritingRequest): Promise<LinkedInPost> {
    // Calculate readability score
    const readabilityScore = this.calculateReadabilityScore(post.content || '');
    
    // Optimize content length and structure
    const optimizedContent = this.optimizeContentStructure(post.content || '');
    
    // Add hashtags to the end of the post
    const hashtagString = post.hashtags?.length ? `\n\n${post.hashtags.join(' ')}` : '';
    const finalContent = `${optimizedContent}\n\n${post.callToAction}${hashtagString}`;

    return {
      title: post.title || '',
      content: finalContent,
      hashtags: post.hashtags || [],
      callToAction: post.callToAction || '',
      estimatedEngagement: post.estimatedEngagement || 7,
      writingStyle: post.writingStyle || 'professional',
      contentLength: finalContent.length,
      readabilityScore,
      keyPoints: post.keyPoints || [],
      contextSources: post.contextSources || []
    };
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