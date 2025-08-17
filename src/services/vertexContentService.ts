import { supabase } from '@/integrations/supabase/client';

export interface ContentBrief {
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

export interface ContextChunk {
  id: string;
  type: 'knowledge_file' | 'meeting_note' | 'whatsapp_message' | 'calendar_event';
  content: string;
  source: string;
  relevance_score: number;
  metadata: any;
}

export interface GeneratedContent {
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

export interface RAGRetrievalResult {
  success: boolean;
  context_chunks: ContextChunk[];
  retrieval_metadata: {
    topic: string;
    platform: string;
    chunks_retrieved: number;
    retrieval_timestamp: string;
  };
}

export interface VertexContentResult {
  success: boolean;
  content: GeneratedContent;
  generation_metadata: {
    model: string;
    platform: string;
    context_chunks_used: number;
    timestamp: string;
  };
}

export class VertexContentService {
  /**
   * Retrieve relevant context using RAG system
   */
  static async retrieveContext(
    topic: string,
    platform: 'linkedin' | 'twitter' | 'instagram' = 'linkedin',
    maxContextChunks: number = 8
  ): Promise<RAGRetrievalResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🔍 Retrieving RAG context for topic:', topic);

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/vertex-rag-retrieval`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          topic,
          platform,
          max_context_chunks: maxContextChunks
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`RAG retrieval failed: ${response.status} - ${errorText}`);
      }

      const result: RAGRetrievalResult = await response.json();
      console.log('✅ RAG context retrieved:', result.context_chunks.length, 'chunks');
      
      return result;
    } catch (error) {
      console.error('❌ RAG context retrieval error:', error);
      throw error;
    }
  }

  /**
   * Generate content using Vertex AI + RAG system
   */
  static async generateContent(
    brief: ContentBrief,
    contextChunks: ContextChunk[],
    platform: 'linkedin' | 'twitter' | 'instagram' = 'linkedin'
  ): Promise<VertexContentResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      console.log('🚀 Generating content with Vertex AI + RAG');

      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/vertex-content-generator`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          brief,
          context_chunks: contextChunks,
          platform
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Vertex AI content generation failed: ${response.status} - ${errorText}`);
      }

      const result: VertexContentResult = await response.json();
      console.log('✅ Content generated with Vertex AI:', result.content.metadata.word_count, 'words');
      
      return result;
    } catch (error) {
      console.error('❌ Vertex AI content generation error:', error);
      throw error;
    }
  }

  /**
   * Complete flow: Retrieve context + Generate content
   */
  static async generateContentWithRAG(
    brief: ContentBrief,
    platform: 'linkedin' | 'twitter' | 'instagram' = 'linkedin'
  ): Promise<VertexContentResult> {
    try {
      console.log('🔄 Starting complete RAG + Vertex AI flow');
      
      // Step 1: Retrieve relevant context
      const retrievalResult = await this.retrieveContext(brief.topic, platform);
      
      if (!retrievalResult.success || retrievalResult.context_chunks.length === 0) {
        console.warn('⚠️ No relevant context found, proceeding with minimal context');
      }
      
      // Step 2: Generate content using retrieved context
      const contentResult = await this.generateContent(brief, retrievalResult.context_chunks, platform);
      
      console.log('✅ Complete RAG + Vertex AI flow completed successfully');
      return contentResult;
      
    } catch (error) {
      console.error('❌ Complete RAG + Vertex AI flow failed:', error);
      throw error;
    }
  }

  /**
   * Compare performance between OpenAI and Vertex AI flows
   */
  static async compareFlows(
    brief: ContentBrief,
    platform: 'linkedin' | 'twitter' | 'instagram' = 'linkedin'
  ): Promise<{
    openai: any;
    vertex: VertexContentResult;
    comparison: {
      openai_time: number;
      vertex_time: number;
      context_chunks: number;
      word_count: number;
    };
  }> {
    try {
      console.log('⚖️ Comparing OpenAI vs Vertex AI flows');
      
      // Test OpenAI flow (current system)
      const openaiStart = performance.now();
      const openaiResult = await this.callOpenAIFlow(brief, platform);
      const openaiTime = performance.now() - openaiStart;
      
      // Test Vertex AI + RAG flow
      const vertexStart = performance.now();
      const vertexResult = await this.generateContentWithRAG(brief, platform);
      const vertexTime = performance.now() - vertexStart;
      
      const comparison = {
        openai_time: openaiTime,
        vertex_time: vertexTime,
        context_chunks: vertexResult.generation_metadata.context_chunks_used,
        word_count: vertexResult.content.metadata.word_count
      };
      
      console.log('⚖️ Flow comparison completed:', comparison);
      
      return {
        openai: openaiResult,
        vertex: vertexResult,
        comparison
      };
      
    } catch (error) {
      console.error('❌ Flow comparison failed:', error);
      throw error;
    }
  }

  /**
   * Call the current OpenAI flow for comparison
   */
  private static async callOpenAIFlow(brief: ContentBrief, platform: string): Promise<any> {
    try {
      // This would call your existing OpenAI-based content generation
      // For now, we'll simulate it
      console.log('🔄 Simulating OpenAI flow call');
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        content: {
          title: brief.topic,
          content: `[OpenAI Generated Content for ${brief.topic}]`,
          metadata: {
            platform,
            length: brief.length,
            tone: brief.tone,
            model: 'gpt-4o-mini'
          }
        }
      };
    } catch (error) {
      console.error('❌ OpenAI flow simulation failed:', error);
      throw error;
    }
  }

  /**
   * Test the RAG retrieval system
   */
  static async testRAGRetrieval(topic: string): Promise<RAGRetrievalResult> {
    try {
      console.log('🧪 Testing RAG retrieval with topic:', topic);
      
      const result = await this.retrieveContext(topic, 'linkedin', 5);
      
      console.log('🧪 RAG retrieval test completed:', {
        topic,
        chunks_found: result.context_chunks.length,
        sources: result.context_chunks.map(chunk => chunk.type)
      });
      
      return result;
    } catch (error) {
      console.error('❌ RAG retrieval test failed:', error);
      throw error;
    }
  }

  /**
   * Test the complete Vertex AI + RAG flow
   */
  static async testCompleteFlow(brief: ContentBrief): Promise<VertexContentResult> {
    try {
      console.log('🧪 Testing complete Vertex AI + RAG flow');
      
      const result = await this.generateContentWithRAG(brief, 'linkedin');
      
      console.log('🧪 Complete flow test completed:', {
        topic: brief.topic,
        word_count: result.content.metadata.word_count,
        context_chunks_used: result.generation_metadata.context_chunks_used
      });
      
      return result;
    } catch (error) {
      console.error('❌ Complete flow test failed:', error);
      throw error;
    }
  }
}

// Export convenience functions
export const testRAGRetrieval = VertexContentService.testRAGRetrieval;
export const testCompleteFlow = VertexContentService.testCompleteFlow;
export const generateContentWithRAG = VertexContentService.generateContentWithRAG;
export const compareFlows = VertexContentService.compareFlows;
