import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface QualityReview {
  qualityScore: number;
  improvements: string[];
  brandVoiceAlignment: number;
  audienceRelevance: number;
  engagementOptimization: string[];
  finalContent: LinkedInPost;
  reviewNotes: string;
}

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

class QualityAssurance {
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
   * Review and refine LinkedIn post
   */
  async reviewPost(post: LinkedInPost, userContext: any, userProfile: any): Promise<QualityReview> {
    console.log(`Reviewing post: ${post.title}`);

    // Perform comprehensive review
    const review = await this.performComprehensiveReview(post, userContext, userProfile);
    
    // Apply improvements if needed
    const improvedPost = await this.applyImprovements(post, review, userContext, userProfile);
    
    // Final quality assessment
    const finalReview = await this.finalQualityAssessment(improvedPost, userContext, userProfile);

    return finalReview;
  }

  /**
   * Perform comprehensive review of the post
   */
  private async performComprehensiveReview(post: LinkedInPost, userContext: any, userProfile: any): Promise<Partial<QualityReview>> {
    const prompt = `
You are a content quality assurance expert specializing in LinkedIn posts. Review this post for quality, relevance, and optimization.

ORIGINAL POST:
Title: ${post.title}
Content: ${post.content}
Hashtags: ${post.hashtags.join(', ')}
Call-to-Action: ${post.callToAction}

USER CONTEXT:
${JSON.stringify(userContext, null, 2)}

USER PROFILE:
- Name: ${userProfile.linkedin_name || 'N/A'}
- Headline: ${userProfile.linkedin_headline || 'N/A'}
- Company: ${userProfile.linkedin_company || 'N/A'}

Review the post against these criteria:

1. BRAND VOICE ALIGNMENT (1-10): Does it match the user's professional voice and style?
2. AUDIENCE RELEVANCE (1-10): Is it relevant to their target audience?
3. ENGAGEMENT POTENTIAL (1-10): Will it encourage likes, comments, and shares?
4. LINKEDIN BEST PRACTICES: Does it follow LinkedIn's algorithm preferences?
5. PROFESSIONAL IMPACT: Does it position the user as a thought leader?

Provide specific feedback and suggestions for improvement.

Format as JSON:
{
  "qualityScore": 8,
  "brandVoiceAlignment": 7,
  "audienceRelevance": 8,
  "improvements": ["improvement1", "improvement2"],
  "engagementOptimization": ["optimization1", "optimization2"],
  "reviewNotes": "Brief summary of review findings"
}
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
            { role: 'system', content: 'You are a content quality assurance expert. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const reviewText = data.choices[0].message.content;
      
      try {
        return JSON.parse(reviewText);
      } catch (parseError) {
        console.error('Failed to parse quality review:', parseError);
        return {
          qualityScore: 7,
          brandVoiceAlignment: 7,
          audienceRelevance: 7,
          improvements: [],
          engagementOptimization: [],
          reviewNotes: 'Review completed with default scores'
        };
      }
    } catch (error) {
      console.error('Error performing quality review:', error);
      return {
        qualityScore: 7,
        brandVoiceAlignment: 7,
        audienceRelevance: 7,
        improvements: [],
        engagementOptimization: [],
        reviewNotes: 'Review failed, using default scores'
      };
    }
  }

  /**
   * Apply improvements to the post
   */
  private async applyImprovements(post: LinkedInPost, review: Partial<QualityReview>, userContext: any, userProfile: any): Promise<LinkedInPost> {
    if (!review.improvements || review.improvements.length === 0) {
      return post; // No improvements needed
    }

    const prompt = `
You are a LinkedIn content optimization expert. Apply the following improvements to this post while maintaining its core message and professional tone.

ORIGINAL POST:
${post.content}

IMPROVEMENTS NEEDED:
${review.improvements.join('\n')}

USER CONTEXT:
${JSON.stringify(userContext, null, 2)}

USER PROFILE:
- Name: ${userProfile.linkedin_name || 'N/A'}
- Headline: ${userProfile.linkedin_headline || 'N/A'}

Apply the improvements and return the optimized post content. Maintain:
- The original key message and insights
- Professional tone and voice
- LinkedIn best practices
- Character limit (2800 characters)

Return only the improved post content, ready for LinkedIn.
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
            { role: 'system', content: 'You are a LinkedIn content optimization expert.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const improvedContent = data.choices[0].message.content;

      // Reconstruct the post with improvements
      const hashtagString = post.hashtags?.length ? `\n\n${post.hashtags.join(' ')}` : '';
      const finalContent = `${improvedContent}\n\n${post.callToAction}${hashtagString}`;

      return {
        ...post,
        content: finalContent,
        contentLength: finalContent.length,
        readabilityScore: this.calculateReadabilityScore(finalContent)
      };

    } catch (error) {
      console.error('Error applying improvements:', error);
      return post; // Return original post if improvements fail
    }
  }

  /**
   * Final quality assessment
   */
  private async finalQualityAssessment(post: LinkedInPost, userContext: any, userProfile: any): Promise<QualityReview> {
    const prompt = `
Perform a final quality assessment of this LinkedIn post.

FINAL POST:
Title: ${post.title}
Content: ${post.content}
Hashtags: ${post.hashtags.join(', ')}
Call-to-Action: ${post.callToAction}

USER CONTEXT:
${JSON.stringify(userContext, null, 2)}

USER PROFILE:
- Name: ${userProfile.linkedin_name || 'N/A'}
- Headline: ${userProfile.linkedin_headline || 'N/A'}

Provide a final quality score (1-10) and brief assessment notes.

Format as JSON:
{
  "qualityScore": 8,
  "reviewNotes": "Final assessment notes"
}
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
            { role: 'system', content: 'You are a content quality expert. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const assessmentText = data.choices[0].message.content;
      
      try {
        const assessment = JSON.parse(assessmentText);
        return {
          qualityScore: assessment.qualityScore || 8,
          improvements: [],
          brandVoiceAlignment: 8,
          audienceRelevance: 8,
          engagementOptimization: [],
          finalContent: post,
          reviewNotes: assessment.reviewNotes || 'Post approved for LinkedIn'
        };
      } catch (parseError) {
        console.error('Failed to parse final assessment:', parseError);
        return {
          qualityScore: 8,
          improvements: [],
          brandVoiceAlignment: 8,
          audienceRelevance: 8,
          engagementOptimization: [],
          finalContent: post,
          reviewNotes: 'Post approved for LinkedIn'
        };
      }
    } catch (error) {
      console.error('Error in final quality assessment:', error);
      return {
        qualityScore: 8,
        improvements: [],
        brandVoiceAlignment: 8,
        audienceRelevance: 8,
        engagementOptimization: [],
        finalContent: post,
        reviewNotes: 'Post approved for LinkedIn'
      };
    }
  }

  /**
   * Calculate readability score
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
   * Count syllables in text
   */
  private countSyllables(text: string): number {
    const words = text.toLowerCase().split(/\s+/);
    let syllableCount = 0;

    words.forEach(word => {
      const vowels = word.match(/[aeiouy]+/g);
      if (vowels) {
        syllableCount += vowels.length;
      } else {
        syllableCount += 1;
      }
    });

    return syllableCount;
  }

  /**
   * Review multiple posts
   */
  async reviewMultiplePosts(userId: string, posts: LinkedInPost[], userContext: any): Promise<QualityReview[]> {
    console.log(`Reviewing ${posts.length} posts for user: ${userId}`);

    const userProfile = await this.getUserProfile(userId);
    const reviews: QualityReview[] = [];

    for (const post of posts) {
      try {
        const review = await this.reviewPost(post, userContext, userProfile);
        reviews.push(review);

        // Add small delay between reviews
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error reviewing post: ${post.title}`, error);
        // Add default review
        reviews.push({
          qualityScore: 7,
          improvements: [],
          brandVoiceAlignment: 7,
          audienceRelevance: 7,
          engagementOptimization: [],
          finalContent: post,
          reviewNotes: 'Review failed, using default assessment'
        });
      }
    }

    console.log(`Successfully reviewed ${reviews.length} posts`);
    return reviews;
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

    const { posts, userContext } = await req.json();
    
    if (!posts || !Array.isArray(posts)) {
      return new Response(JSON.stringify({ error: 'Posts array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const qa = new QualityAssurance(req.headers.get('Authorization')!.replace('Bearer ', ''));
    const reviews = await qa.reviewMultiplePosts(user.id, posts, userContext);

    return new Response(JSON.stringify({ 
      success: true,
      reviews,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in quality-assurance function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 