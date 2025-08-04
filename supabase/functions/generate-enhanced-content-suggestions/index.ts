import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface EnhancedContentSuggestion {
  id: string;
  title: string;
  description: string;
  fullContent: string;
  hashtags: string[];
  callToAction: string;
  estimatedEngagement: number;
  contextSources: {
    knowledgeFiles: string[];
    whatsappMessages: string[];
    meetingNotes: string[];
    conversations: string[];
  };
  generationMetadata: {
    strategyAgent: string;
    writerAgent: string;
    qualityScore: number;
    generationTime: string;
  };
  isActive: boolean;
  createdAt: string;
}

class EnhancedContentGenerator {
  private supabase: any;
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private userToken: string;

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

    this.supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    this.supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    this.userToken = userToken;
  }

  /**
   * Generate enhanced content suggestions using multi-agent system
   */
  async generateEnhancedSuggestions(userId: string): Promise<EnhancedContentSuggestion[]> {
    console.log(`Starting enhanced content generation for user: ${userId}`);
    const startTime = Date.now();

    try {
      // Step 1: Context Analysis
      console.log('Step 1: Analyzing user context...');
      const contextAnalysis = await this.analyzeUserContext(userId);
      
      // Step 2: Content Strategy
      console.log('Step 2: Generating content strategy...');
      const contentStrategy = await this.generateContentStrategy(userId, contextAnalysis);
      
      // Step 3: Content Writing
      console.log('Step 3: Writing LinkedIn posts...');
      const linkedInPosts = await this.writeLinkedInPosts(userId, contentStrategy.contentIdeas, contextAnalysis);
      
      // Step 4: Quality Assurance
      console.log('Step 4: Quality assurance review...');
      const qualityReviews = await this.reviewPosts(userId, linkedInPosts, contextAnalysis);
      
      // Step 5: Save enhanced suggestions
      console.log('Step 5: Saving enhanced suggestions...');
      const enhancedSuggestions = await this.saveEnhancedSuggestions(userId, qualityReviews, contextAnalysis, startTime);

      console.log(`Successfully generated ${enhancedSuggestions.length} enhanced content suggestions`);
      return enhancedSuggestions;

    } catch (error) {
      console.error('Error in enhanced content generation:', error);
      throw error;
    }
  }

  /**
   * Step 1: Analyze user context
   */
  private async analyzeUserContext(userId: string): Promise<any> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/analyze-user-context`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error(`Context analysis failed: ${response.status}`);
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('Error in context analysis:', error);
      throw error;
    }
  }

  /**
   * Step 2: Generate content strategy
   */
  private async generateContentStrategy(userId: string, contextAnalysis: any): Promise<any> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/content-strategist`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          contextAnalysis 
        }),
      });

      if (!response.ok) {
        throw new Error(`Content strategy generation failed: ${response.status}`);
      }

      const data = await response.json();
      return data.strategy;
    } catch (error) {
      console.error('Error in content strategy generation:', error);
      throw error;
    }
  }

  /**
   * Step 3: Write LinkedIn posts
   */
  private async writeLinkedInPosts(userId: string, contentIdeas: any[], userContext: any): Promise<any[]> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/content-writer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          contentIdeas,
          userContext 
        }),
      });

      if (!response.ok) {
        throw new Error(`Content writing failed: ${response.status}`);
      }

      const data = await response.json();
      return data.posts;
    } catch (error) {
      console.error('Error in content writing:', error);
      throw error;
    }
  }

  /**
   * Step 4: Quality assurance review
   */
  private async reviewPosts(userId: string, posts: any[], userContext: any): Promise<any[]> {
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/quality-assurance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.userToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId,
          posts,
          userContext 
        }),
      });

      if (!response.ok) {
        throw new Error(`Quality assurance failed: ${response.status}`);
      }

      const data = await response.json();
      return data.reviews;
    } catch (error) {
      console.error('Error in quality assurance:', error);
      throw error;
    }
  }

  /**
   * Step 5: Save enhanced suggestions to database
   */
  private async saveEnhancedSuggestions(
    userId: string, 
    qualityReviews: any[], 
    contextAnalysis: any, 
    startTime: number
  ): Promise<EnhancedContentSuggestion[]> {
    try {
      // Clear old suggestions
      await this.supabase
        .from('enhanced_content_suggestions')
        .update({ is_active: false })
        .eq('user_id', userId);

      // Prepare suggestions for insertion
      const suggestionsToInsert = qualityReviews.map((review, index) => {
        const post = review.finalContent;
        const generationTime = ((Date.now() - startTime) / 1000).toFixed(2);

        return {
          user_id: userId,
          title: post.title,
          description: `Enhanced LinkedIn post with quality score ${review.qualityScore}/10`,
          full_content: post.content,
          hashtags: post.hashtags,
          call_to_action: post.callToAction,
          estimated_engagement: post.estimatedEngagement,
          context_sources: {
            knowledgeFiles: contextAnalysis.knowledgeInsights?.expertiseAreas || [],
            whatsappMessages: contextAnalysis.recentInsights?.fromWhatsApp || [],
            meetingNotes: contextAnalysis.recentInsights?.fromMeetings || [],
            conversations: contextAnalysis.recentInsights?.fromConversations || []
          },
          generation_metadata: {
            strategyAgent: 'content-strategist-v1',
            writerAgent: 'content-writer-v1',
            qualityScore: review.qualityScore,
            generationTime: `${generationTime}s`,
            brandVoiceAlignment: review.brandVoiceAlignment,
            audienceRelevance: review.audienceRelevance,
            reviewNotes: review.reviewNotes
          },
          quality_score: review.qualityScore,
          is_active: true
        };
      });

      // Insert new suggestions
      const { data: newSuggestions, error } = await this.supabase
        .from('enhanced_content_suggestions')
        .insert(suggestionsToInsert)
        .select();

      if (error) {
        console.error('Error saving enhanced suggestions:', error);
        throw error;
      }

      return newSuggestions || [];
    } catch (error) {
      console.error('Error saving enhanced suggestions:', error);
      throw error;
    }
  }

  /**
   * Get user profile for context
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

    console.log(`Generating enhanced content suggestions for user: ${user.id}`);

    const generator = new EnhancedContentGenerator(req.headers.get('Authorization')!.replace('Bearer ', ''));
    const suggestions = await generator.generateEnhancedSuggestions(user.id);

    return new Response(JSON.stringify({ 
      success: true,
      suggestions,
      generatedAt: new Date().toISOString(),
      message: `Successfully generated ${suggestions.length} enhanced content suggestions`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-enhanced-content-suggestions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 