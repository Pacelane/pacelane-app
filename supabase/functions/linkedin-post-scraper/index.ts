import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface LinkedInPost {
  id: string;
  content: string;
  publishedAt: string;
  engagement: {
    likes: number;
    comments: number;
    shares: number;
  };
  url: string;
}

interface ToneAnalysis {
  tone: 'professional' | 'personal' | 'casual' | 'authoritative' | 'conversational';
  writingStyle: {
    sentenceLength: 'short' | 'medium' | 'long';
    vocabularyLevel: 'basic' | 'intermediate' | 'advanced';
    personalityMarkers: string[];
  };
  commonPatterns: {
    openingStyles: string[];
    closingStyles: string[];
    transitionWords: string[];
    industryTerms: string[];
  };
  contentPreferences: {
    averageLength: number;
    emojiUsage: 'none' | 'minimal' | 'moderate' | 'frequent';
    hashtagStyle: 'none' | 'minimal' | 'moderate' | 'extensive';
    contentTypes: string[];
  };
}

class LinkedInPostScraper {
  private supabase: any;
  private anthropicApiKey: string;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    this.anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY') ?? '';
  }

  /**
   * Scrape LinkedIn posts from user's profile URL
   * Note: This is a simplified implementation. In production, you'd need:
   * - LinkedIn API integration
   * - Proper authentication and permissions
   * - Rate limiting and compliance
   */
  async scrapeLinkedInPosts(linkedInProfileUrl: string): Promise<LinkedInPost[]> {
    try {
      console.log(`📱 Scraping LinkedIn posts for profile: ${linkedInProfileUrl}`);
      
      // For MVP, we'll simulate this with manual input or LinkedIn API
      // In production, this would integrate with LinkedIn's API or web scraping
      
      // Placeholder - return empty array for now
      // Real implementation would use LinkedIn API or web scraping
      console.log('⚠️ LinkedIn scraping not implemented - using manual input method');
      return [];
      
    } catch (error) {
      console.error('Error scraping LinkedIn posts:', error);
      return [];
    }
  }

  /**
   * Store LinkedIn posts for a user
   */
  async storeLinkedInPosts(userId: string, posts: LinkedInPost[]): Promise<boolean> {
    try {
      console.log(`💾 Storing ${posts.length} LinkedIn posts for user: ${userId}`);

      const postsData = posts.map(post => ({
        user_id: userId,
        linkedin_post_id: post.id,
        content: post.content,
        published_at: post.publishedAt,
        engagement_data: post.engagement,
        post_url: post.url,
        scraped_at: new Date().toISOString(),
        metadata: {
          scraped_via: 'api',
          content_length: post.content.length,
          word_count: post.content.split(' ').length
        }
      }));

      const { error } = await this.supabase
        .from('linkedin_posts')
        .upsert(postsData, { 
          onConflict: 'user_id,linkedin_post_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error storing LinkedIn posts:', error);
        return false;
      }

      console.log(`✅ Successfully stored ${posts.length} LinkedIn posts`);
      return true;

    } catch (error) {
      console.error('Error storing LinkedIn posts:', error);
      return false;
    }
  }

  /**
   * Analyze tone and writing style using Anthropic Claude
   */
  async analyzeWritingTone(posts: LinkedInPost[]): Promise<ToneAnalysis> {
    try {
      console.log(`🎭 Analyzing writing tone from ${posts.length} posts`);

      if (posts.length === 0) {
        return this.getDefaultToneAnalysis();
      }

      // Combine all post content for analysis
      const combinedContent = posts.map(post => post.content).join('\n\n---\n\n');

      const prompt = `Analyze the writing tone and style of these LinkedIn posts. Return a JSON object with the analysis.

Posts to analyze:
${combinedContent}

Please analyze and return a JSON object with this exact structure:
{
  "tone": "professional|personal|casual|authoritative|conversational",
  "writingStyle": {
    "sentenceLength": "short|medium|long", 
    "vocabularyLevel": "basic|intermediate|advanced",
    "personalityMarkers": ["array", "of", "characteristic", "phrases"]
  },
  "commonPatterns": {
    "openingStyles": ["how", "posts", "typically", "start"],
    "closingStyles": ["how", "posts", "typically", "end"], 
    "transitionWords": ["common", "transition", "words"],
    "industryTerms": ["industry", "specific", "terms"]
  },
  "contentPreferences": {
    "averageLength": 250,
    "emojiUsage": "none|minimal|moderate|frequent",
    "hashtagStyle": "none|minimal|moderate|extensive", 
    "contentTypes": ["story", "insight", "tip", "question"]
  }
}

Focus on identifying:
1. The overall tone (professional, personal, etc.)
2. Sentence structure patterns
3. Vocabulary sophistication
4. Common opening and closing phrases
5. Content structure preferences
6. Use of emojis, hashtags, and formatting

Return only the JSON object, no other text.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          temperature: 0.1,
          messages: [{
            role: 'user',
            content: prompt
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Anthropic API error:', response.status, errorText);
        return this.getDefaultToneAnalysis();
      }

      const data = await response.json();
      const analysisText = data.content[0]?.text;

      if (!analysisText) {
        console.error('No analysis text received from Anthropic');
        return this.getDefaultToneAnalysis();
      }

      try {
        const analysis = JSON.parse(analysisText);
        console.log('✅ Tone analysis completed successfully');
        return analysis;
      } catch (parseError) {
        console.error('Error parsing tone analysis JSON:', parseError);
        return this.getDefaultToneAnalysis();
      }

    } catch (error) {
      console.error('Error analyzing writing tone:', error);
      return this.getDefaultToneAnalysis();
    }
  }

  /**
   * Get default tone analysis for fallback
   */
  private getDefaultToneAnalysis(): ToneAnalysis {
    return {
      tone: 'professional',
      writingStyle: {
        sentenceLength: 'medium',
        vocabularyLevel: 'intermediate',
        personalityMarkers: []
      },
      commonPatterns: {
        openingStyles: [],
        closingStyles: [],
        transitionWords: [],
        industryTerms: []
      },
      contentPreferences: {
        averageLength: 200,
        emojiUsage: 'minimal',
        hashtagStyle: 'minimal',
        contentTypes: ['insight', 'tip']
      }
    };
  }

  /**
   * Store tone analysis for user
   */
  async storeToneAnalysis(userId: string, analysis: ToneAnalysis): Promise<boolean> {
    try {
      console.log(`💾 Storing tone analysis for user: ${userId}`);

      const { error } = await this.supabase
        .from('user_writing_profiles')
        .upsert({
          user_id: userId,
          tone_analysis: analysis,
          analyzed_at: new Date().toISOString(),
          source: 'linkedin_posts',
          metadata: {
            posts_analyzed: analysis.contentPreferences.averageLength > 0 ? 'multiple' : 'none',
            analysis_method: 'anthropic_claude'
          }
        }, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Error storing tone analysis:', error);
        return false;
      }

      console.log('✅ Tone analysis stored successfully');
      return true;

    } catch (error) {
      console.error('Error storing tone analysis:', error);
      return false;
    }
  }

  /**
   * Get existing LinkedIn posts for a user
   */
  async getUserLinkedInPosts(userId: string): Promise<LinkedInPost[]> {
    try {
      const { data: posts, error } = await this.supabase
        .from('linkedin_posts')
        .select('*')
        .eq('user_id', userId)
        .order('published_at', { ascending: false })
        .limit(20); // Get last 20 posts for analysis

      if (error) {
        console.error('Error fetching user LinkedIn posts:', error);
        return [];
      }

      return posts.map((post: any) => ({
        id: post.linkedin_post_id,
        content: post.content,
        publishedAt: post.published_at,
        engagement: post.engagement_data || { likes: 0, comments: 0, shares: 0 },
        url: post.post_url || ''
      }));

    } catch (error) {
      console.error('Error getting user LinkedIn posts:', error);
      return [];
    }
  }

  /**
   * Manual input method for LinkedIn posts
   */
  async addLinkedInPostsManually(userId: string, posts: string[]): Promise<boolean> {
    try {
      console.log(`📝 Adding ${posts.length} LinkedIn posts manually for user: ${userId}`);

      const postsData = posts.map((content, index) => ({
        user_id: userId,
        linkedin_post_id: `manual_${Date.now()}_${index}`,
        content: content.trim(),
        published_at: new Date().toISOString(),
        engagement_data: { likes: 0, comments: 0, shares: 0 },
        post_url: '',
        scraped_at: new Date().toISOString(),
        metadata: {
          scraped_via: 'manual_input',
          content_length: content.length,
          word_count: content.split(' ').length
        }
      }));

      const { error } = await this.supabase
        .from('linkedin_posts')
        .insert(postsData);

      if (error) {
        console.error('Error adding manual LinkedIn posts:', error);
        return false;
      }

      console.log(`✅ Successfully added ${posts.length} manual LinkedIn posts`);
      return true;

    } catch (error) {
      console.error('Error adding manual LinkedIn posts:', error);
      return false;
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const scraper = new LinkedInPostScraper();
    const body = await req.json();
    const { action, userId, data } = body;

    if (!userId) {
      throw new Error('userId is required');
    }

    switch (action) {
      case 'scrape_posts': {
        // Scrape posts from LinkedIn profile URL
        const { linkedInProfileUrl } = data;
        if (!linkedInProfileUrl) {
          throw new Error('linkedInProfileUrl is required for scraping');
        }

        const posts = await scraper.scrapeLinkedInPosts(linkedInProfileUrl);
        const stored = await scraper.storeLinkedInPosts(userId, posts);
        
        return new Response(JSON.stringify({
          success: stored,
          message: `Scraped and stored ${posts.length} posts`,
          postsCount: posts.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'add_posts_manually': {
        // Add posts manually via copy-paste
        const { posts } = data;
        if (!posts || !Array.isArray(posts)) {
          throw new Error('posts array is required for manual input');
        }

        const added = await scraper.addLinkedInPostsManually(userId, posts);
        
        return new Response(JSON.stringify({
          success: added,
          message: `Added ${posts.length} posts manually`,
          postsCount: posts.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'analyze_tone': {
        // Analyze writing tone from existing posts
        const posts = await scraper.getUserLinkedInPosts(userId);
        const analysis = await scraper.analyzeWritingTone(posts);
        const stored = await scraper.storeToneAnalysis(userId, analysis);

        return new Response(JSON.stringify({
          success: stored,
          message: `Analyzed tone from ${posts.length} posts`,
          analysis,
          postsAnalyzed: posts.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get_posts': {
        // Get existing posts for user
        const posts = await scraper.getUserLinkedInPosts(userId);
        
        return new Response(JSON.stringify({
          success: true,
          posts,
          count: posts.length
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('LinkedIn post scraper error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
