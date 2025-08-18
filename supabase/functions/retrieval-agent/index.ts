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

  // Just use Claude to find relevant knowledge files
  const knowledgeFiles = await searchKnowledgeFilesWithClaude(supabaseClient, userId, topic, maxResults)
  
  console.log(`Found ${knowledgeFiles.length} relevant files`)
  return knowledgeFiles
}

// Simplified - no more complex search terms generation

// Simplified - no LinkedIn search

// Simplified - no meeting notes search

// Simplified - no separate function needed

async function searchKnowledgeFilesWithClaude(
  supabaseClient: any, 
  userId: string, 
  contentTopic: string,
  limit: number
): Promise<Citation[]> {
  console.log(`🤖 Claude-powered file selection for topic: "${contentTopic}"`);
  
  try {
    // Get all user files (just names and basic metadata for Claude)
    const { data: files, error } = await supabaseClient
      .from('knowledge_files')
      .select('id, name, type, created_at, url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !files) {
      console.error('Error fetching knowledge files:', error);
      return [];
    }

    console.log(`📁 Found ${files.length} total files for Claude selection`);

    if (files.length === 0) {
      return [];
    }

    // Use Claude to select relevant files
    const selectedFileIds = await selectFilesWithClaude(contentTopic, files, limit);
    
    if (!selectedFileIds || selectedFileIds.length === 0) {
      console.log('🤖 Claude selected no relevant files');
      return [];
    }

    // Get full file details for selected files
    const selectedFiles = files.filter(file => selectedFileIds.includes(file.id));
    
    console.log(`🎯 Claude selected ${selectedFiles.length} relevant files:`);
    selectedFiles.forEach((file, index) => {
      console.log(`${index + 1}. "${file.name}" (${file.type})`);
    });

    // Convert to citations format
    return selectedFiles.map(file => ({
      type: 'knowledge_file',
      id: file.id,
      title: file.name,
      content: `File: ${file.name} (${file.type})`, // Simple content for now
      created_at: file.created_at,
      relevance_score: 1.0, // Claude deemed it relevant
      source_url: file.url,
      metadata: {
        file_type: file.type,
        selection_method: 'claude_ai',
        claude_selected: true
      }
    }));
  } catch (error) {
    console.error('Error in Claude-powered knowledge search:', error);
    return [];
  }
}

// Simplified - no complex scoring functions needed

/**
 * Use Claude to intelligently select relevant files from the user's knowledge base
 */
async function selectFilesWithClaude(
  userPrompt: string, 
  availableFiles: any[], 
  maxFiles: number
): Promise<string[]> {
  try {
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      console.warn('ANTHROPIC_API_KEY not found, falling back to first few files');
      return availableFiles.slice(0, Math.min(maxFiles, availableFiles.length)).map(f => f.id);
    }

    // Create file list for Claude with IDs
    const fileList = availableFiles.map(file => 
      `- ID: ${file.id} | ${file.name} (${file.type || 'unknown'})`
    ).join('\n');

    console.log(`📁 Files available for Claude selection:`);
    availableFiles.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file.name} (${file.type || 'unknown'})`);
    });

    const prompt = `The user wants to create content about: "${userPrompt}"

Available files:
${fileList}

Select ONLY files that are directly relevant to the user's request. Return a JSON array of file IDs.

Example: ["file-id-1", "file-id-2"]`;

    console.log(`🤖 Asking Claude to select files for: "${userPrompt}"`);
    console.log(`📁 Available files: ${availableFiles.length}`);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 200,
        temperature: 0.1,
        system: 'You are a helpful assistant that selects relevant files. Always return valid JSON arrays.',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.content[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Claude');
    }

    // Log the raw response from Claude
    console.log('🤖 Raw Claude response:', aiResponse);
    console.log('🤖 Response length:', aiResponse.length);

    // Parse Claude's response - try to extract JSON if there's extra text
    let selectedFileIds;
    try {
      selectedFileIds = JSON.parse(aiResponse);
      console.log('✅ Direct JSON parse successful');
    } catch (parseError) {
      console.log('❌ Direct JSON parse failed:', parseError.message);
      // Try to extract JSON from the response if Claude added extra text
      console.log('🔍 Trying to extract JSON from response...');
      const jsonMatch = aiResponse.match(/\[.*\]/);
      if (jsonMatch) {
        try {
          selectedFileIds = JSON.parse(jsonMatch[0]);
          console.log('✅ Successfully extracted JSON from response:', jsonMatch[0]);
        } catch (extractError) {
          console.error('❌ Failed to extract JSON:', extractError.message);
          throw new Error('Could not parse Claude response as JSON');
        }
      } else {
        console.log('❌ No JSON array pattern found in response');
        throw new Error('No JSON array found in Claude response');
      }
    }
    
    if (!Array.isArray(selectedFileIds)) {
      console.warn('Claude returned invalid format, using fallback');
      return availableFiles.slice(0, Math.min(maxFiles, availableFiles.length)).map(f => f.id);
    }

    // Validate that all selected IDs exist in available files
    const validFileIds = selectedFileIds.filter(id => 
      availableFiles.some(file => file.id === id)
    );

    console.log(`🤖 Claude selected ${validFileIds.length} files:`, validFileIds);
    return validFileIds;

  } catch (error) {
    console.error('Error in Claude file selection:', error);
    // Fallback: return first few files
    console.log('Using fallback file selection');
    return availableFiles.slice(0, Math.min(maxFiles, availableFiles.length)).map(f => f.id);
  }
}
