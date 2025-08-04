import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface UserContextAnalysis {
  knowledgeInsights: {
    expertiseAreas: string[];
    keyThemes: string[];
    valuableContent: string[];
    documentTypes: string[];
  };
  communicationPatterns: {
    commonTopics: string[];
    writingStyle: string;
    engagementPreferences: string[];
    conversationThemes: string[];
  };
  recentInsights: {
    fromWhatsApp: string[];
    fromMeetings: string[];
    fromConversations: string[];
    fromKnowledgeBase: string[];
  };
  contentOpportunities: {
    trendingTopics: string[];
    painPoints: string[];
    successStories: string[];
    industryInsights: string[];
  };
  profile: any;
  analyzedAt: string;
}

interface GCSConfig {
  bucketPrefix: string;
  projectId: string;
  clientEmail: string;
  privateKey: string;
  privateKeyId: string;
}

class ContextAnalyzer {
  private supabase: any;
  private gcsConfig: GCSConfig;
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

    this.gcsConfig = {
      bucketPrefix: Deno.env.get('GCS_BUCKET_PREFIX') ?? 'pacelane-storage',
      projectId: Deno.env.get('GCS_PROJECT_ID') ?? '',
      clientEmail: Deno.env.get('GCS_CLIENT_EMAIL') ?? '',
      privateKey: Deno.env.get('GCS_PRIVATE_KEY') ?? '',
      privateKeyId: Deno.env.get('GCS_PRIVATE_KEY_ID') ?? '',
    };

    this.openaiApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
  }

  /**
   * Analyze all user context data
   */
  async analyzeUserContext(userId: string): Promise<UserContextAnalysis> {
    console.log(`Starting context analysis for user: ${userId}`);

    // Check for existing cached analysis
    const cachedAnalysis = await this.getCachedAnalysis(userId);
    if (cachedAnalysis) {
      console.log('Using cached context analysis');
      return cachedAnalysis;
    }

    // Gather all user data
    const [
      knowledgeFiles,
      whatsappMessages,
      meetingNotes,
      conversations,
      profile,
      inspirations
    ] = await Promise.all([
      this.getKnowledgeBaseData(userId),
      this.getWhatsAppData(userId),
      this.getMeetingNotesData(userId),
      this.getConversationsData(userId),
      this.getUserProfile(userId),
      this.getInspirationsData(userId)
    ]);

    // Analyze each data source
    const knowledgeInsights = await this.analyzeKnowledgeBase(knowledgeFiles);
    const communicationPatterns = await this.analyzeCommunicationData(whatsappMessages, meetingNotes, conversations);
    const recentInsights = await this.extractRecentInsights(whatsappMessages, meetingNotes, conversations, knowledgeFiles);
    const contentOpportunities = await this.identifyContentOpportunities(knowledgeInsights, communicationPatterns, recentInsights);

    const analysis: UserContextAnalysis = {
      knowledgeInsights,
      communicationPatterns,
      recentInsights,
      contentOpportunities,
      profile,
      analyzedAt: new Date().toISOString()
    };

    // Cache the analysis
    await this.cacheAnalysis(userId, analysis);

    console.log('Context analysis completed');
    return analysis;
  }

  /**
   * Get cached analysis if it exists and is still valid
   */
  private async getCachedAnalysis(userId: string): Promise<UserContextAnalysis | null> {
    try {
      const { data: cached, error } = await this.supabase
        .from('user_context_analysis')
        .select('analysis_data, expires_at')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .order('analyzed_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !cached) {
        return null;
      }

      return cached.analysis_data;
    } catch (error) {
      console.error('Error getting cached analysis:', error);
      return null;
    }
  }

  /**
   * Cache analysis results
   */
  private async cacheAnalysis(userId: string, analysis: UserContextAnalysis): Promise<void> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Cache for 24 hours

      const { error } = await this.supabase
        .from('user_context_analysis')
        .insert({
          user_id: userId,
          analysis_data: analysis,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        console.error('Error caching analysis:', error);
      }
    } catch (error) {
      console.error('Error caching analysis:', error);
    }
  }

  /**
   * Get knowledge base data
   */
  private async getKnowledgeBaseData(userId: string): Promise<any[]> {
    try {
      const { data: files, error } = await this.supabase
        .from('knowledge_files')
        .select('*')
        .eq('user_id', userId)
        .eq('content_extracted', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching knowledge files:', error);
        return [];
      }

      return files || [];
    } catch (error) {
      console.error('Error fetching knowledge base data:', error);
      return [];
    }
  }

  /**
   * Get WhatsApp messages data
   */
  private async getWhatsAppData(userId: string): Promise<any[]> {
    try {
      const { data: messages, error } = await this.supabase
        .from('meeting_notes')
        .select('*')
        .eq('user_id', userId)
        .eq('source_type', 'whatsapp')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching WhatsApp messages:', error);
        return [];
      }

      return messages || [];
    } catch (error) {
      console.error('Error fetching WhatsApp data:', error);
      return [];
    }
  }

  /**
   * Get meeting notes data
   */
  private async getMeetingNotesData(userId: string): Promise<any[]> {
    try {
      const { data: notes, error } = await this.supabase
        .from('meeting_notes')
        .select('*')
        .eq('user_id', userId)
        .eq('source_type', 'manual')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching meeting notes:', error);
        return [];
      }

      return notes || [];
    } catch (error) {
      console.error('Error fetching meeting notes data:', error);
      return [];
    }
  }

  /**
   * Get conversations data
   */
  private async getConversationsData(userId: string): Promise<any[]> {
    try {
      const { data: conversations, error } = await this.supabase
        .from('conversations')
        .select('title, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      return conversations || [];
    } catch (error) {
      console.error('Error fetching conversations data:', error);
      return [];
    }
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
   * Get inspirations data
   */
  private async getInspirationsData(userId: string): Promise<any[]> {
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
      console.error('Error fetching inspirations data:', error);
      return [];
    }
  }

  /**
   * Analyze knowledge base files using AI
   */
  private async analyzeKnowledgeBase(files: any[]): Promise<UserContextAnalysis['knowledgeInsights']> {
    if (files.length === 0) {
      return {
        expertiseAreas: [],
        keyThemes: [],
        valuableContent: [],
        documentTypes: []
      };
    }

    const fileContents = files.map(file => ({
      name: file.name,
      content: file.extracted_content || '',
      type: file.type
    })).filter(file => file.content && file.content.length > 0);

    if (fileContents.length === 0) {
      return {
        expertiseAreas: [],
        keyThemes: [],
        valuableContent: [],
        documentTypes: []
      };
    }

    const prompt = `
You are a content analysis expert. Analyze the following knowledge base files to extract insights for content creation.

KNOWLEDGE BASE FILES:
${fileContents.map(file => `File: ${file.name} (${file.type})
Content: ${file.content.substring(0, 1000)}...`).join('\n\n')}

Extract and organize the following insights:

1. EXPERTISE AREAS: List 5-7 key areas where the user demonstrates expertise
2. KEY THEMES: Identify 3-5 recurring themes in their content and knowledge
3. VALUABLE CONTENT: Extract 5-10 specific insights, stories, or lessons that could be shared
4. DOCUMENT TYPES: List the types of documents and their purposes

Format your response as a JSON object with these exact keys:
{
  "expertiseAreas": ["area1", "area2", ...],
  "keyThemes": ["theme1", "theme2", ...],
  "valuableContent": ["insight1", "insight2", ...],
  "documentTypes": ["type1", "type2", ...]
}

Be specific and actionable in your analysis.
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
            { role: 'system', content: 'You are a content analysis expert. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      
      try {
        return JSON.parse(analysisText);
      } catch (parseError) {
        console.error('Failed to parse knowledge base analysis:', parseError);
        return {
          expertiseAreas: [],
          keyThemes: [],
          valuableContent: [],
          documentTypes: []
        };
      }
    } catch (error) {
      console.error('Error analyzing knowledge base:', error);
      return {
        expertiseAreas: [],
        keyThemes: [],
        valuableContent: [],
        documentTypes: []
      };
    }
  }

  /**
   * Analyze communication patterns
   */
  private async analyzeCommunicationData(whatsappMessages: any[], meetingNotes: any[], conversations: any[]): Promise<UserContextAnalysis['communicationPatterns']> {
    const allContent = [
      ...whatsappMessages.map(msg => msg.content),
      ...meetingNotes.map(note => note.content),
      ...conversations.map(conv => conv.title)
    ].filter(content => content && content.length > 0);

    if (allContent.length === 0) {
      return {
        commonTopics: [],
        writingStyle: 'professional',
        engagementPreferences: [],
        conversationThemes: []
      };
    }

    const prompt = `
You are a communication analysis expert. Analyze the following communication data to understand the user's communication patterns.

COMMUNICATION DATA:
${allContent.slice(0, 20).map((content, index) => `Message ${index + 1}: ${content.substring(0, 500)}...`).join('\n\n')}

Analyze and provide:

1. COMMON TOPICS: List 5-7 topics the user frequently discusses
2. WRITING STYLE: Describe their communication style (e.g., "professional", "casual", "technical", "storytelling")
3. ENGAGEMENT PREFERENCES: How they prefer to engage (e.g., "questions", "stories", "data", "examples")
4. CONVERSATION THEMES: 3-5 recurring themes in their communications

Format as JSON:
{
  "commonTopics": ["topic1", "topic2", ...],
  "writingStyle": "style description",
  "engagementPreferences": ["pref1", "pref2", ...],
  "conversationThemes": ["theme1", "theme2", ...]
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
            { role: 'system', content: 'You are a communication analysis expert. Always respond with valid JSON only.' },
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
      const analysisText = data.choices[0].message.content;
      
      try {
        return JSON.parse(analysisText);
      } catch (parseError) {
        console.error('Failed to parse communication analysis:', parseError);
        return {
          commonTopics: [],
          writingStyle: 'professional',
          engagementPreferences: [],
          conversationThemes: []
        };
      }
    } catch (error) {
      console.error('Error analyzing communication patterns:', error);
      return {
        commonTopics: [],
        writingStyle: 'professional',
        engagementPreferences: [],
        conversationThemes: []
      };
    }
  }

  /**
   * Extract recent insights from all data sources
   */
  private async extractRecentInsights(whatsappMessages: any[], meetingNotes: any[], conversations: any[], knowledgeFiles: any[]): Promise<UserContextAnalysis['recentInsights']> {
    const recentWhatsApp = whatsappMessages.slice(0, 10).map(msg => msg.content).filter(Boolean);
    const recentMeetings = meetingNotes.slice(0, 10).map(note => note.content).filter(Boolean);
    const recentConversations = conversations.slice(0, 10).map(conv => conv.title).filter(Boolean);
    const recentKnowledge = knowledgeFiles.slice(0, 5).map(file => file.extracted_content).filter(Boolean);

    return {
      fromWhatsApp: recentWhatsApp,
      fromMeetings: recentMeetings,
      fromConversations: recentConversations,
      fromKnowledgeBase: recentKnowledge
    };
  }

  /**
   * Identify content opportunities
   */
  private async identifyContentOpportunities(knowledgeInsights: any, communicationPatterns: any, recentInsights: any): Promise<UserContextAnalysis['contentOpportunities']> {
    const allInsights = {
      expertise: knowledgeInsights.expertiseAreas,
      themes: knowledgeInsights.keyThemes,
      valuableContent: knowledgeInsights.valuableContent,
      topics: communicationPatterns.commonTopics,
      recentContent: [
        ...recentInsights.fromWhatsApp,
        ...recentInsights.fromMeetings,
        ...recentInsights.fromConversations
      ]
    };

    const prompt = `
You are a content strategy expert. Based on the following insights, identify content opportunities.

INSIGHTS:
${JSON.stringify(allInsights, null, 2)}

Identify:

1. TRENDING TOPICS: 3-5 topics that are currently relevant
2. PAIN POINTS: 3-5 problems or challenges the user could address
3. SUCCESS STORIES: 3-5 achievements or wins that could be shared
4. INDUSTRY INSIGHTS: 3-5 industry-specific insights or trends

Format as JSON:
{
  "trendingTopics": ["topic1", "topic2", ...],
  "painPoints": ["pain1", "pain2", ...],
  "successStories": ["story1", "story2", ...],
  "industryInsights": ["insight1", "insight2", ...]
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
            { role: 'system', content: 'You are a content strategy expert. Always respond with valid JSON only.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.4,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const analysisText = data.choices[0].message.content;
      
      try {
        return JSON.parse(analysisText);
      } catch (parseError) {
        console.error('Failed to parse content opportunities:', parseError);
        return {
          trendingTopics: [],
          painPoints: [],
          successStories: [],
          industryInsights: []
        };
      }
    } catch (error) {
      console.error('Error identifying content opportunities:', error);
      return {
        trendingTopics: [],
        painPoints: [],
        successStories: [],
        industryInsights: []
      };
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

    const analyzer = new ContextAnalyzer(req.headers.get('Authorization')!.replace('Bearer ', ''));
    const analysis = await analyzer.analyzeUserContext(user.id);

    return new Response(JSON.stringify({ 
      success: true,
      analysis,
      analyzedAt: analysis.analyzedAt
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-user-context function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}); 