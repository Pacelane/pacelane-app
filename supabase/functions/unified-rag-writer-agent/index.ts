import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Interfaces
interface UnifiedRequest {
  userId: string;
  prompt: string;
  brief: any;
  platform?: string;
  maxResults?: number;
  temperature?: number;
  maxTokens?: number;
}

interface Citation {
  type: 'knowledge_file';
  id: string;
  title: string;
  content: string;
  source_url?: string;
  relevance_score?: number;
}

interface UnifiedResponse {
  success: boolean;
  content: string;
  citations: Citation[];
  metadata: {
    queryTime: number;
    resultsCount: number;
    model: string;
    platform: string;
    ragEnabled?: boolean;
    message?: string;
  };
}

interface GCSConfig {
  bucketPrefix: string;
  projectId: string;
  clientEmail: string;
  privateKey: string;
  privateKeyId: string;
}

class UnifiedRAGWriterAgent {
  private gcsConfig: GCSConfig;
  private supabase: any;
  private projectId: string;
  private location: string;

  constructor(serviceRoleKey: string) {
    this.gcsConfig = {
      bucketPrefix: Deno.env.get('GCS_BUCKET_PREFIX') ?? 'pacelane-',
      projectId: Deno.env.get('GCS_PROJECT_ID') ?? '',
      clientEmail: Deno.env.get('GCS_CLIENT_EMAIL') ?? '',
      privateKey: Deno.env.get('GCS_PRIVATE_KEY') ?? '',
      privateKeyId: Deno.env.get('GCS_PRIVATE_KEY_ID') ?? '',
    };

    this.projectId = this.gcsConfig.projectId;
    this.location = Deno.env.get('GOOGLE_CLOUD_LOCATION') ?? 'us-central1';

    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
  }

  /**
   * Main method to generate LinkedIn post using RAG corpus
   */
  async generateLinkedInPost(request: UnifiedRequest): Promise<UnifiedResponse> {
    const startTime = Date.now();
    
    try {
      console.log(`🚀 Gerando post do LinkedIn para o usuário: ${request.userId}`);
      console.log(`📝 Prompt: ${request.prompt}`);

      // 1. Get user's RAG corpus (optional)
      const corpus = await this.getUserRAGCorpus(request.userId);
      let postContent: string;
      let citations: any[] = [];

      if (corpus) {
        console.log(`📚 Usando corpus RAG: ${corpus.corpusId}`);
        
        // 2. Generate LinkedIn post using Gemini with RAG corpus
        postContent = await this.generateWithGemini(
          request.prompt,
          corpus.corpusId,
          request.brief,
          request.temperature || 0.7,
          request.maxTokens || 2048
        );
        
        // Citations will be provided by Gemini's RAG-enhanced response
        citations = [];
      } else {
        console.log(`⚠️ Nenhum corpus RAG encontrado para o usuário ${request.userId}, usando geração alternativa`);
        
        try {
          // 3. Fallback: Generate content without RAG context
          postContent = await this.generateWithoutRAG(
            request.prompt,
            request.brief,
            request.temperature || 0.7,
            request.maxTokens || 2048
          );
          
          citations = [];
        } catch (fallbackError) {
          console.error(`❌ Falha na geração alternativa:`, fallbackError);
          throw new Error(`Falha na geração de conteúdo. Tente novamente ou entre em contato com o suporte se o problema persistir.`);
        }
      }

      // 4. Save to saved_drafts table
      const savedDraft = await this.saveToSavedDrafts(
        request.userId,
        postContent,
        citations,
        request.brief
      );

      console.log(`💾 Draft salvo com ID: ${savedDraft.id}`);

      const queryTime = Date.now() - startTime;

      return {
        success: true,
        content: postContent,
        citations: citations,
        metadata: {
          queryTime,
          resultsCount: 0,
          model: corpus ? 'gemini-2.5-flash-rag' : 'gemini-2.5-flash',
          platform: 'linkedin',
          ragEnabled: !!corpus,
          message: corpus ? 
            'Conteúdo gerado usando sua base de conhecimento para maior relevância' : 
            'Conteúdo gerado com sucesso. Para obter conteúdo mais relevante baseado em seus arquivos, faça upload de documentos para sua base de conhecimento.'
        }
      };

    } catch (error) {
      console.error('❌ Error generating LinkedIn post:', error);
      throw error;
    }
  }

  /**
   * Get user's RAG corpus from database
   */
  private async getUserRAGCorpus(userId: string): Promise<{ corpusId: string; displayName: string } | null> {
    try {
      const { data, error } = await this.supabase
        .from('rag_corpora')
        .select('corpus_id, display_name')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        console.error('❌ Error fetching RAG corpus:', error);
        return null;
      }

      return {
        corpusId: data.corpus_id,
        displayName: data.display_name
      };
    } catch (error) {
      console.error('❌ Error getting user RAG corpus:', error);
      return null;
    }
  }

  /**
   * Retrieve relevant content from RAG corpus using Vertex AI API
   */
  private async retrieveFromRAGCorpus(corpusId: string, query: string, maxResults: number): Promise<any[]> {
    try {
      console.log(`🔍 Querying RAG corpus: ${query}`);

      // Extract corpus ID parts
      const corpusIdParts = corpusId.split('/');
      const projectId = corpusIdParts[1];
      const location = corpusIdParts[3];

      // Use the CORRECT Vertex AI RAG API endpoint for retrieval
      const queryUrl = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}:retrieveContexts`;

      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get GCS access token');
      }

      // Use the CORRECT request body structure from Google docs
      const response = await fetch(queryUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vertex_rag_store: {
            rag_resources: {
              rag_corpus: corpusId
            },
            vector_distance_threshold: 0.7
          },
          query: {
            text: query,
            similarity_top_k: maxResults
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ RAG query failed: ${response.status} - ${errorText}`);
        throw new Error(`RAG query failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ RAG query successful, found ${result.contexts?.length || 0} results`);

      // Extract and format the results from the correct response structure
      const contexts = result.contexts || [];
      return contexts.map((context: any) => ({
        id: context.ragFile?.name || 'unknown',
        displayName: context.ragFile?.displayName || 'Unknown',
        content: context.chunk?.data?.stringValue || context.chunk?.data?.textValue || '',
        text: context.chunk?.data?.stringValue || context.chunk?.data?.textValue || '',
        gcsUri: context.ragFile?.gcsSource?.uris?.[0] || '',
        relevanceScore: context.relevanceScore || 0.8,
        chunkIndex: context.chunk?.chunkIndex || 0
      }));

    } catch (error) {
      console.error('❌ Error retrieving from RAG corpus:', error);
      // Fallback to basic file search if RAG query fails
      return this.fallbackFileSearch(query, maxResults);
    }
  }

  /**
   * Fallback file search if RAG query fails
   */
  private async fallbackFileSearch(query: string, maxResults: number): Promise<any[]> {
    try {
      console.log(`🔄 Using fallback file search for: ${query}`);
      
      // Simple keyword-based search in knowledge files
      const { data: files, error } = await this.supabase
        .from('knowledge_files')
        .select('id, name, type, url, created_at')
        .ilike('name', `%${query}%`)
        .limit(maxResults);

      if (error || !files) {
        console.error('❌ Fallback search failed:', error);
        return [];
      }

      return files.map(file => ({
        id: file.id,
        displayName: file.name,
        content: `File: ${file.name} (${file.type})`,
        text: `File: ${file.name} (${file.type})`,
        gcsUri: file.url || '',
        relevanceScore: 0.6,
        chunkIndex: 0
      }));
    } catch (error) {
      console.error('❌ Fallback search error:', error);
      return [];
    }
  }

  /**
   * Generate LinkedIn post using Gemini with retrieved context
   */
  private async generateWithGemini(
    prompt: string, 
    corpusId: string, 
    brief: any, 
    temperature: number, 
    maxTokens: number
  ): Promise<string> {
    try {
      console.log(`🤖 Gerando conteúdo com Gemini 2.5 Flash`);

      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        throw new Error('Falha ao obter token de acesso do GCS');
      }

      // Create LinkedIn post prompt
      const linkedInPrompt = `
Você é um criador de conteúdo profissional do LinkedIn. Crie um post envolvente do LinkedIn baseado no seguinte:

SOLICITAÇÃO DO USUÁRIO: ${prompt}

BRIEF: ${JSON.stringify(brief, null, 2)}

INSTRUÇÕES:
- Crie um post do LinkedIn envolvente que atenda à solicitação do usuário
- Use o contexto RAG fornecido para adicionar valor e credibilidade
- Mantenha-o profissional, mas envolvente
- Torne-o acionável e compartilhável
- Baseie sua resposta no conteúdo da base de conhecimento recuperada
- **IMPORTANTE: Sempre gere o conteúdo em PORTUGUÊS BRASILEIRO (pt-BR)**
- Use linguagem natural e coloquial brasileira quando apropriado
- Mantenha o tom profissional adequado para o LinkedIn

SAÍDA APENAS O CONTEÚDO DO POST DO LINKEDIN, sem formatação adicional ou explicações.
`;

      const generationUrl = `https://${this.location}-aiplatform.googleapis.com/v1beta1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/gemini-2.5-flash:generateContent`;

      // Use the CORRECT RAG-enhanced Gemini API format from Google docs
      const response = await fetch(generationUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{
              text: linkedInPrompt
            }]
          }],
          tools: {
            retrieval: {
              disable_attribution: false,
              vertex_rag_store: {
                rag_resources: {
                  rag_corpus: corpusId
                },
                similarity_top_k: 5,
                vector_distance_threshold: 0.7
              }
            }
          },
          generation_config: {
            temperature: temperature,
            max_output_tokens: maxTokens,
            top_p: 0.8,
            top_k: 40
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Falha na geração do Gemini: ${response.status} - ${errorText}`);
        throw new Error(`Falha na geração do Gemini: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const generatedContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!generatedContent) {
        throw new Error('Nenhum conteúdo foi gerado pelo Gemini');
      }

      console.log(`✅ Conteúdo gerado com sucesso (${generatedContent.length} caracteres)`);
      return generatedContent;

    } catch (error) {
      console.error('❌ Error generating with Gemini:', error);
      throw error;
    }
  }

  /**
   * Generate LinkedIn post using Gemini without RAG context
   */
  private async generateWithoutRAG(
    prompt: string, 
    brief: any, 
    temperature: number, 
    maxTokens: number
  ): Promise<string> {
    try {
      console.log(`🤖 Gerando conteúdo sem RAG`);

      const accessToken = await this.getGCSAccessToken();
      if (!accessToken) {
        throw new Error('Falha ao obter token de acesso do GCS');
      }

      // Create LinkedIn post prompt
      const linkedInPrompt = `
Você é um criador de conteúdo profissional do LinkedIn. Crie um post envolvente do LinkedIn baseado no seguinte:

SOLICITAÇÃO DO USUÁRIO: ${prompt}

BRIEF: ${JSON.stringify(brief, null, 2)}

INSTRUÇÕES:
- Crie um post do LinkedIn envolvente que atenda à solicitação do usuário
- Não use nenhuma base de conhecimento externa ou contexto RAG
- Mantenha-o profissional, mas envolvente
- Torne-o acionável e compartilhável
- Baseie sua resposta na solicitação do usuário e no brief
- **IMPORTANTE: Sempre gere o conteúdo em PORTUGUÊS BRASILEIRO (pt-BR)**
- Use linguagem natural e coloquial brasileira quando apropriado
- Mantenha o tom profissional adequado para o LinkedIn

SAÍDA APENAS O CONTEÚDO DO POST DO LINKEDIN, sem formatação adicional ou explicações.
`;

      const generationUrl = `https://${this.location}-aiplatform.googleapis.com/v1beta1/projects/${this.projectId}/locations/${this.location}/publishers/google/models/gemini-2.5-flash:generateContent`;

      // Simple Gemini generation without RAG tools
      const response = await fetch(generationUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{
              text: linkedInPrompt
            }]
          }],
          generation_config: {
            temperature: temperature,
            max_output_tokens: maxTokens,
            top_p: 0.8,
            top_k: 40
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Falha na geração do Gemini: ${response.status} - ${errorText}`);
        throw new Error(`Falha na geração do Gemini: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const generatedContent = result.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!generatedContent) {
        throw new Error('Nenhum conteúdo foi gerado pelo Gemini');
      }

      console.log(`✅ Conteúdo gerado com sucesso (${generatedContent.length} caracteres)`);
      return generatedContent;

    } catch (error) {
      console.error(`❌ Erro ao gerar sem RAG:`, error);
      throw error;
    }
  }

  /**
   * Save generated post to saved_drafts table
   */
  private async saveToSavedDrafts(userId: string, content: string, citations: any[], brief: any): Promise<{ id: string }> {
    try {
      const { data, error } = await this.supabase
        .from('saved_drafts')
        .insert({
          title: `LinkedIn Post - ${new Date().toLocaleDateString()}`,
          content: content,
          user_id: userId,
          order_id: null,
          citations_json: citations,
          status: 'draft'
          // Note: metadata column doesn't exist in current schema
          // We can store brief info in citations_json if needed
        })
        .select('id')
        .single();

      if (error) {
        console.error('❌ Error saving draft:', error);
        throw new Error(`Failed to save draft: ${error.message}`);
      }

      return { id: data.id };
    } catch (error) {
      console.error('❌ Error saving to saved_drafts:', error);
      throw error;
    }
  }

  /**
   * Get GCS access token using service account
   */
  private async getGCSAccessToken(): Promise<string | null> {
    try {
      const now = Math.floor(Date.now() / 1000);
      
      const header = { alg: 'RS256', typ: 'JWT' };
      const payload = {
        iss: this.gcsConfig.clientEmail,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now
      };

      const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      
      const message = `${headerB64}.${payloadB64}`;
      
      const privateKeyPem = this.gcsConfig.privateKey.replace(/\\n/g, '\n');
      
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        this.pemToArrayBuffer(privateKeyPem),
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      );

      const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        new TextEncoder().encode(message)
      );

      const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      const jwt = `${message}.${signatureB64}`;

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt
        })
      });

      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        return tokenData.access_token;
      } else {
        const errorText = await tokenResponse.text();
        console.error('Token request failed:', errorText);
        return null;
      }
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Convert PEM private key to ArrayBuffer
   */
  private pemToArrayBuffer(pem: string): ArrayBuffer {
    const pemContents = pem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    
    try {
      const binaryString = atob(pemContents);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error(`❌ Error in pemToArrayBuffer: ${error.message}`);
      throw error;
    }
  }
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize agent with service role key
    const agent = new UnifiedRAGWriterAgent(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

    if (req.method === 'POST') {
      const body = await req.json();
      const { userId, prompt, brief, platform, maxResults, temperature, maxTokens } = body;

      if (!userId || !prompt || !brief) {
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Missing required fields: userId, prompt, brief' 
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const request: UnifiedRequest = {
        userId,
        prompt,
        brief,
        platform: platform || 'linkedin',
        maxResults: maxResults || 5,
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 2048
      };

      const result = await agent.generateLinkedInPost(request);

      return new Response(
        JSON.stringify(result),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Method not allowed' 
        }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('❌ Unified RAG Writer Agent error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
