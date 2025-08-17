import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RAGRequest {
  user_id: string;
  topic: string;
  platform: 'linkedin' | 'twitter' | 'instagram';
  max_context_chunks?: number;
}

interface ContextChunk {
  id: string;
  type: 'knowledge_file' | 'meeting_note' | 'whatsapp_message' | 'calendar_event';
  content: string;
  source: string;
  relevance_score: number;
  metadata: any;
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

    const { user_id, topic, platform, max_context_chunks = 8 }: RAGRequest = await req.json();

    if (!user_id || !topic) {
      throw new Error('user_id and topic are required');
    }

    console.log(`🔍 RAG Retrieval for user ${user_id}, topic: ${topic}`);

    // Get relevant context from all sources
    const contextChunks = await retrieveRelevantContext(
      supabaseClient, 
      user_id, 
      topic, 
      platform, 
      max_context_chunks
    );

    console.log(`✅ Found ${contextChunks.length} relevant context chunks`);

    return new Response(JSON.stringify({ 
      success: true, 
      context_chunks: contextChunks,
      retrieval_metadata: {
        topic,
        platform,
        chunks_retrieved: contextChunks.length,
        retrieval_timestamp: new Date().toISOString()
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ RAG Retrieval error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function retrieveRelevantContext(
  supabaseClient: any,
  userId: string,
  topic: string,
  platform: string,
  maxChunks: number
): Promise<ContextChunk[]> {
  
  const allChunks: ContextChunk[] = [];
  
  // 1. Get knowledge base context (most important)
  const knowledgeChunks = await getKnowledgeBaseContext(supabaseClient, userId, topic, Math.ceil(maxChunks * 0.4));
  allChunks.push(...knowledgeChunks);
  
  // 2. Get recent meeting insights
  const meetingChunks = await getMeetingContext(supabaseClient, userId, topic, Math.ceil(maxChunks * 0.3));
  allChunks.push(...meetingChunks);
  
  // 3. Get WhatsApp business context
  const whatsappChunks = await getWhatsAppContext(supabaseClient, userId, topic, Math.ceil(maxChunks * 0.2));
  allChunks.push(...whatsappChunks);
  
  // 4. Get calendar context
  const calendarChunks = await getCalendarContext(supabaseClient, userId, topic, Math.ceil(maxChunks * 0.1));
  allChunks.push(...calendarChunks);
  
  // Sort by relevance and limit results
  const sortedChunks = allChunks
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, maxChunks);
  
  return sortedChunks;
}

async function getKnowledgeBaseContext(
  supabaseClient: any,
  userId: string,
  topic: string,
  limit: number
): Promise<ContextChunk[]> {
  
  // For now, use basic text search (we'll enhance with embeddings later)
  const searchTerms = generateSearchTerms(topic);
  const chunks: ContextChunk[] = [];
  
  for (const term of searchTerms.slice(0, 3)) {
    const { data: files, error } = await supabaseClient
      .from('knowledge_files')
      .select('id, name, extracted_content, created_at, url')
      .eq('user_id', userId)
      .not('extracted_content', 'is', null)
      .ilike('extracted_content', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Knowledge base search error:', error);
      continue;
    }
    
    if (files) {
      for (const file of files) {
        const relevanceScore = calculateRelevanceScore(file.extracted_content, searchTerms);
        const contentChunks = chunkText(file.extracted_content, 300);
        
        for (let i = 0; i < contentChunks.length && chunks.length < limit; i++) {
          chunks.push({
            id: `${file.id}_chunk_${i}`,
            type: 'knowledge_file',
            content: contentChunks[i],
            source: file.name,
            relevance_score: relevanceScore,
            metadata: {
              file_id: file.id,
              chunk_index: i,
              file_url: file.url,
              created_at: file.created_at
            }
          });
        }
      }
    }
  }
  
  return chunks;
}

async function getMeetingContext(
  supabaseClient: any,
  userId: string,
  topic: string,
  limit: number
): Promise<ContextChunk[]> {
  
  const searchTerms = generateSearchTerms(topic);
  const chunks: ContextChunk[] = [];
  
  for (const term of searchTerms.slice(0, 2)) {
    const { data: notes, error } = await supabaseClient
      .from('meeting_notes')
      .select('id, content, created_at, source_type')
      .eq('user_id', userId)
      .ilike('content', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) continue;
    
    if (notes) {
      for (const note of notes) {
        const relevanceScore = calculateRelevanceScore(note.content, searchTerms);
        chunks.push({
          id: note.id,
          type: 'meeting_note',
          content: note.content.slice(0, 300),
          source: `Meeting: ${note.source_type || 'Unknown'}`,
          relevance_score: relevanceScore,
          metadata: {
            created_at: note.created_at,
            source_type: note.source_type
          }
        });
      }
    }
  }
  
  return chunks;
}

async function getWhatsAppContext(
  supabaseClient: any,
  userId: string,
  topic: string,
  limit: number
): Promise<ContextChunk[]> {
  
  const searchTerms = generateSearchTerms(topic);
  const chunks: ContextChunk[] = [];
  
  for (const term of searchTerms.slice(0, 2)) {
    const { data: messages, error } = await supabaseClient
      .from('whatsapp_messages')
      .select('id, content, created_at, conversation_id')
      .eq('user_id', userId)
      .ilike('content', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) continue;
    
    if (messages) {
      for (const message of messages) {
        const relevanceScore = calculateRelevanceScore(message.content, searchTerms);
        chunks.push({
          id: message.id,
          type: 'whatsapp_message',
          content: message.content.slice(0, 300),
          source: 'WhatsApp Conversation',
          relevance_score: relevanceScore,
          metadata: {
            conversation_id: message.conversation_id,
            created_at: message.created_at
          }
        });
      }
    }
  }
  
  return chunks;
}

async function getCalendarContext(
  supabaseClient: any,
  userId: string,
  topic: string,
  limit: number
): Promise<ContextChunk[]> {
  
  // This will be enhanced when you implement calendar integration
  // For now, return empty array
  return [];
}

function generateSearchTerms(topic: string): string[] {
  const terms = [topic.toLowerCase()];
  
  // Extract key words from topic
  const words = topic.split(' ').filter(word => word.length > 3);
  terms.push(...words);
  
  // Add common business terms
  const businessTerms = ['strategy', 'growth', 'leadership', 'innovation', 'business', 'management', 'team', 'success'];
  terms.push(...businessTerms);
  
  return [...new Set(terms)];
}

function calculateRelevanceScore(content: string, searchTerms: string[]): number {
  const contentLower = content.toLowerCase();
  let score = 0;
  
  for (const term of searchTerms) {
    const termCount = (contentLower.match(new RegExp(term, 'g')) || []).length;
    score += termCount * 0.1;
  }
  
  // Bonus for exact topic match
  if (searchTerms[0] && contentLower.includes(searchTerms[0])) {
    score += 0.5;
  }
  
  return Math.min(score, 1.0);
}

function chunkText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (currentChunk.length + trimmedSentence.length <= maxLength) {
      currentChunk += (currentChunk ? ' ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
        currentChunk = trimmedSentence;
      } else {
        // Single sentence is too long, split it
        chunks.push(trimmedSentence.slice(0, maxLength) + '...');
      }
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk + '.');
  }
  
  return chunks;
}
