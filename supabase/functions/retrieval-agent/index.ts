import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RetrievalRequest {
  user_id: string;
  topic: string;
  platform?: string;
  max_results?: number;
}

interface Citation {
  type: 'meeting_note' | 'knowledge_file';
  id: string;
  title?: string;
  content: string;
  created_at: string;
  relevance_score?: number;
  source_url?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, topic, platform, max_results = 5 }: RetrievalRequest = await req.json()

    if (!user_id || !topic) {
      throw new Error('user_id and topic are required')
    }

    const citations = await retrieveRelevantContext(supabaseClient, user_id, topic, platform, max_results)

    return new Response(JSON.stringify({ success: true, citations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Retrieval agent error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function retrieveRelevantContext(
  supabaseClient: any, 
  userId: string, 
  topic: string, 
  platform?: string, 
  maxResults: number = 5
): Promise<Citation[]> {
  console.log(`Retrieving context for user ${userId}, topic: ${topic}`)

  const citations: Citation[] = []
  const searchTerms = generateSearchTerms(topic, platform)

  // Search user's LinkedIn posts for style and topic relevance
  const linkedinPosts = await searchLinkedInPosts(supabaseClient, userId, searchTerms, Math.ceil(maxResults / 3))
  citations.push(...linkedinPosts)

  // Search meeting notes
  const meetingNotes = await searchMeetingNotes(supabaseClient, userId, searchTerms, Math.ceil(maxResults / 3))
  citations.push(...meetingNotes)

  // Search knowledge files
  const knowledgeFiles = await searchKnowledgeFiles(supabaseClient, userId, searchTerms, Math.ceil(maxResults / 3))
  citations.push(...knowledgeFiles)

  // Sort by relevance and limit results
  const sortedCitations = citations
    .sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0))
    .slice(0, maxResults)

  console.log(`Found ${sortedCitations.length} relevant citations`)
  return sortedCitations
}

function generateSearchTerms(topic: string, platform?: string): string[] {
  const terms = [topic.toLowerCase()]
  
  // Add platform-specific terms
  if (platform) {
    terms.push(platform.toLowerCase())
  }

  // Extract key words from topic
  const words = topic.split(' ').filter(word => word.length > 3)
  terms.push(...words)

  // Add common business terms
  const businessTerms = ['strategy', 'growth', 'leadership', 'innovation', 'business', 'management', 'team', 'success']
  terms.push(...businessTerms)

  return [...new Set(terms)] // Remove duplicates
}

async function searchLinkedInPosts(
  supabaseClient: any, 
  userId: string, 
  searchTerms: string[], 
  limit: number
): Promise<Citation[]> {
  const citations: Citation[] = []

  // Search user's LinkedIn posts for similar topics and writing style examples
  for (const term of searchTerms.slice(0, 2)) { // Limit to first 2 terms
    const { data: posts, error } = await supabaseClient
      .from('linkedin_posts')
      .select('id, content, published_at, engagement_data')
      .eq('user_id', userId)
      .ilike('content', `%${term}%`)
      .order('published_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching LinkedIn posts:', error)
      continue
    }

    if (posts) {
      for (const post of posts) {
        const relevanceScore = calculateRelevanceScore(post.content, searchTerms)
        
        citations.push({
          type: 'linkedin_post',
          id: post.id,
          title: 'Your LinkedIn Post',
          content: extractRelevantSnippet(post.content, searchTerms),
          created_at: post.published_at,
          relevance_score: relevanceScore + 0.2, // Boost LinkedIn posts as they show user's voice
          source_url: `linkedin://post/${post.id}`
        })
      }
    }
  }

  return citations
}

async function searchMeetingNotes(
  supabaseClient: any, 
  userId: string, 
  searchTerms: string[], 
  limit: number
): Promise<Citation[]> {
  const citations: Citation[] = []

  // Search for each term
  for (const term of searchTerms.slice(0, 3)) { // Limit to first 3 terms to avoid too many queries
    const { data: notes, error } = await supabaseClient
      .from('meeting_notes')
      .select('id, content, created_at, source_type')
      .eq('user_id', userId)
      .ilike('content', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching meeting notes:', error)
      continue
    }

    if (notes) {
      for (const note of notes) {
        const relevanceScore = calculateRelevanceScore(note.content, searchTerms)
        
        citations.push({
          type: 'meeting_note',
          id: note.id,
          content: extractRelevantSnippet(note.content, searchTerms),
          created_at: note.created_at,
          relevance_score: relevanceScore
        })
      }
    }
  }

  return citations
}

async function searchKnowledgeFiles(
  supabaseClient: any, 
  userId: string, 
  searchTerms: string[], 
  limit: number
): Promise<Citation[]> {
  const citations: Citation[] = []

  // Search for each term
  for (const term of searchTerms.slice(0, 3)) {
    const { data: files, error } = await supabaseClient
      .from('knowledge_files')
      .select('id, name, extracted_content, created_at, url')
      .eq('user_id', userId)
      .not('extracted_content', 'is', null)
      .ilike('extracted_content', `%${term}%`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error searching knowledge files:', error)
      continue
    }

    if (files) {
      for (const file of files) {
        const relevanceScore = calculateRelevanceScore(file.extracted_content, searchTerms)
        
        citations.push({
          type: 'knowledge_file',
          id: file.id,
          title: file.name,
          content: extractRelevantSnippet(file.extracted_content, searchTerms),
          created_at: file.created_at,
          relevance_score: relevanceScore,
          source_url: file.url
        })
      }
    }
  }

  return citations
}

function calculateRelevanceScore(content: string, searchTerms: string[]): number {
  const contentLower = content.toLowerCase()
  let score = 0

  for (const term of searchTerms) {
    const termCount = (contentLower.match(new RegExp(term, 'g')) || []).length
    score += termCount * 0.1 // Base score for each occurrence
  }

  // Bonus for exact topic match
  if (searchTerms[0] && contentLower.includes(searchTerms[0])) {
    score += 0.5
  }

  // Bonus for recent content (within last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  return Math.min(score, 1.0) // Cap at 1.0
}

function extractRelevantSnippet(content: string, searchTerms: string[]): string {
  const maxLength = 300
  const contentLower = content.toLowerCase()
  
  // Find the best position to start the snippet
  let bestPosition = 0
  let bestScore = 0

  for (const term of searchTerms) {
    const position = contentLower.indexOf(term)
    if (position !== -1) {
      const score = calculateSnippetScore(content, position, searchTerms)
      if (score > bestScore) {
        bestScore = score
        bestPosition = position
      }
    }
  }

  // Extract snippet around the best position
  const start = Math.max(0, bestPosition - 100)
  const end = Math.min(content.length, start + maxLength)
  let snippet = content.substring(start, end)

  // Add ellipsis if we're not at the beginning/end
  if (start > 0) snippet = '...' + snippet
  if (end < content.length) snippet = snippet + '...'

  return snippet
}

function calculateSnippetScore(content: string, position: number, searchTerms: string[]): number {
  const windowSize = 200
  const start = Math.max(0, position - windowSize / 2)
  const end = Math.min(content.length, position + windowSize / 2)
  const window = content.substring(start, end).toLowerCase()
  
  let score = 0
  for (const term of searchTerms) {
    const termCount = (window.match(new RegExp(term, 'g')) || []).length
    score += termCount
  }
  
  return score
}
