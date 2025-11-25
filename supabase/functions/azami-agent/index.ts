import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { corsHeaders } from "../_shared/cors.ts";

// Interfaces for the new schema
interface KnowledgePage {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content: string;
  source: string;
  relations_analyzed: boolean;
}

interface AzamiRelation {
  source_page_id: string;
  target_page_id: string;
  relation_type: string;
  relation_strength: number;
  relation_description: string;
  llm_analysis: any;
  status: 'suggested' | 'accepted' | 'rejected';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the request body (optional, for manual triggers)
    let body = {};
    try {
      body = await req.json();
    } catch (e) {
      // Ignore if no body
    }

    // 1. Find unanalyzed pages
    // We limit to 5 to avoid timeouts, processing in batches
    const { data: unanalyzedPages, error: fetchError } = await supabase
      .from('knowledge_pages')
      .select('*')
      .eq('relations_analyzed', false)
      .limit(5);

    if (fetchError) {
      console.error('Error fetching unanalyzed pages:', fetchError);
      throw fetchError;
    }

    if (!unanalyzedPages || unanalyzedPages.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No unanalyzed pages found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${unanalyzedPages.length} pages to analyze`);

    const results = [];

    // 2. Process each page
    for (const page of unanalyzedPages) {
      try {
        // Fetch potential related pages (context window)
        // For now, we fetch recent pages, but this could be vector search in future
        const { data: potentialMatches, error: matchError } = await supabase
          .from('knowledge_pages')
          .select('id, title, content, slug')
          .neq('id', page.id)
          .eq('user_id', page.user_id)
          .limit(20); // Limit context window

        if (matchError) throw matchError;

        if (!potentialMatches || potentialMatches.length === 0) {
          console.log(`No other pages found to relate with: ${page.title}`);
          // Mark as analyzed even if no matches found
          await markAsAnalyzed(supabase, page.id);
          continue;
        }

        // 3. Analyze with LLM (Claude)
        const relations = await analyzeRelations(page, potentialMatches);

        // 4. Store relations
        if (relations && relations.length > 0) {
          await createRelations(supabase, page.id, page.user_id, relations);
        }

        // 5. Mark as analyzed
        await markAsAnalyzed(supabase, page.id);
        
        results.push({
          page: page.title,
          relationsFound: relations.length
        });

      } catch (err: any) {
        console.error(`Error processing page ${page.title}:`, err);
        results.push({
          page: page.title,
          error: err.message
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in azami-agent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function markAsAnalyzed(supabase: any, pageId: string) {
  const { error } = await supabase
    .from('knowledge_pages')
    .update({ relations_analyzed: true })
    .eq('id', pageId);
    
  if (error) console.error('Error marking page as analyzed:', error);
}

async function createRelations(supabase: any, sourcePageId: string, userId: string, relations: any[]) {
  const relationsToInsert = relations.map(rel => ({
    user_id: userId,
    source_page_id: sourcePageId,
    target_page_id: rel.target_page_id,
    relation_type: rel.type,
    relation_strength: rel.strength,
    relation_description: rel.description,
    llm_analysis: rel.analysis || {},
    status: 'suggested'
  }));

  // Check for existing inverse relations to avoid duplicates if desired, 
  // but for "See Also" suggestions, we might want one-way suggestions initially.
  // The unique constraint is (source, target), so we can just upsert or ignore.
  
  const { error } = await supabase
    .from('azami_relations')
    .upsert(relationsToInsert, { onConflict: 'source_page_id, target_page_id' });

  if (error) {
    console.error('Error creating relations:', error);
    throw error;
  }
}

async function analyzeRelations(sourcePage: KnowledgePage, potentialMatches: any[]) {
  // Prepare context for LLM
  const candidates = potentialMatches.map(p => ({
    id: p.id,
    title: p.title,
    preview: p.content ? p.content.substring(0, 300) : ''
  }));

  const prompt = `
You are Azami, a knowledge graph agent. Your task is to identify SEMANTIC RELATIONS between a source document and a list of candidate documents.

SOURCE DOCUMENT:
Title: ${sourcePage.title}
Content: ${sourcePage.content ? sourcePage.content.substring(0, 1000) : ''}...

CANDIDATE DOCUMENTS:
${JSON.stringify(candidates, null, 2)}

INSTRUCTIONS:
1. Analyze the source document and candidates.
2. Identify candidates that have a STRONG semantic relationship with the source.
3. Relations should be useful for a "See Also" section.
4. Ignore weak or generic links.
5. Return a JSON array of relations.

RELATION TYPES:
- 'semantic': Concepts are related in meaning.
- 'topical': Share the same specific topic.
- 'temporal': Related by time or sequence.
- 'referential': One explicitly mentions the other (or should).

OUTPUT FORMAT (JSON ONLY):
[
  {
    "target_page_id": "uuid",
    "type": "semantic",
    "strength": 0.85,
    "description": "Brief explanation of why they are related"
  }
]

If no strong relations are found, return [].
`;

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    console.warn('No ANTHROPIC_API_KEY found. Skipping LLM analysis.');
    return [];
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('LLM API Error:', err);
    throw new Error(`LLM API Error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content[0].text;
  
  try {
    // Extract JSON from text (handle potential markdown blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (e) {
    console.error('Error parsing LLM response:', e);
    return [];
  }
}
