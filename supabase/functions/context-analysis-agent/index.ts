import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface QueueMessage {
  user_id: string
  schedule_id: string
  analysis_date: string
  timestamp: string
  type: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'GET') {
      // Process pending queue messages
      return await processPendingMessages(supabaseClient)
    } else if (req.method === 'POST') {
      // Handle POST requests (manual trigger or webhook)
      const body = await req.json()
      const { user_id, schedule_id } = body
      
      if (user_id && schedule_id) {
        // Manual trigger with specific user - process that user
        console.log('🔧 Manual trigger for specific user:', user_id)
        return await analyzeUserContext(supabaseClient, user_id, schedule_id)
      } else {
        // Webhook trigger - automatically process the latest queue message
        console.log('🔗 Webhook trigger detected - processing latest queue message')
        return await processLatestQueueMessage(supabaseClient)
      }
    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Context analysis agent error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function processPendingMessages(supabaseClient: any): Promise<Response> {
  console.log('🔍 Processing pending context analysis messages...')
  
  let processedCount = 0
  let errorCount = 0
  const MAX_MESSAGES_PER_REQUEST = 10
  
  try {
    while (processedCount + errorCount < MAX_MESSAGES_PER_REQUEST) {
      // Pop message from queue
      const { data: message, error: popError } = await supabaseClient
        .schema('pgmq_public')
        .rpc('pop', { queue_name: 'pacing_content_queue' })
      
      if (popError || !message || (Array.isArray(message) && message.length === 0)) {
        console.log('No more messages in queue or error occurred')
        break
      }
      
      try {
        // Handle array response from pgmq.pop()
        const messageObj = Array.isArray(message) ? message[0] : message
        
        if (!messageObj?.message || typeof messageObj.message !== 'object') {
          console.error(`❌ Invalid message structure:`, messageObj)
          
          // Archive invalid message
          await supabaseClient
            .schema('pgmq_public')
            .rpc('archive', { 
              queue_name: 'pacing_content_queue', 
              msg_id: messageObj?.msg_id 
            })
          
          errorCount++
          continue
        }
        
        const queueMessage: QueueMessage = messageObj.message
        console.log(`✅ Processing message for user: ${queueMessage.user_id}`)
        
        await analyzeUserContext(supabaseClient, queueMessage.user_id, queueMessage.schedule_id)
        
        processedCount++
        console.log(`✅ Successfully processed message`)
        
      } catch (error) {
        console.error(`❌ Error processing message:`, error)
        errorCount++
        
        // Archive failed message
        try {
          await supabaseClient
            .schema('pgmq_public')
            .rpc('archive', { 
              queue_name: 'pacing_content_queue', 
              msg_id: messageObj?.msg_id 
            })
        } catch (archiveError) {
          console.error(`❌ Failed to archive message:`, archiveError)
        }
      }
    }
    
    return new Response(JSON.stringify({
      message: 'Queue processing completed',
      processed: processedCount,
      errors: errorCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    throw new Error(`Failed to process queue: ${error.message}`)
  }
}

async function analyzeUserContext(
  supabaseClient: any, 
  userId: string, 
  scheduleId: string
): Promise<void> {
  console.log(`🧠 Analyzing context for user ${userId}`)
  
  try {
    // 1. Get knowledge base files
    const { data: knowledgeFiles } = await supabaseClient
      .from('knowledge_files')
      .select('name, type, extracted_content')
      .eq('user_id', userId)
      .eq('content_extracted', true)
      .not('extracted_content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(10)
    
    // 2. Get meeting notes
    const { data: meetingNotes } = await supabaseClient
      .from('meeting_notes')
      .select('content, source_type')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    
    // 3. Get audio transcripts
    const { data: audioFiles } = await supabaseClient
      .from('audio_files')
      .select('transcription')
      .eq('user_id', userId)
      .eq('transcription_status', 'completed')
      .not('transcription', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5)
    
    // 4. Create simple context summary
    const knowledgeSummary = knowledgeFiles?.map(f => `${f.name} (${f.type})`).join(', ') || 'None'
    const meetingSummary = meetingNotes?.map(n => n.content.substring(0, 100)).join(' | ') || 'None'
    const audioSummary = audioFiles?.map(a => a.transcription.substring(0, 100)).join(' | ') || 'None'
    
    // 5. Generate topic suggestions using simple prompt
    const topicSuggestions = await generateTopicSuggestions(
      knowledgeSummary, 
      meetingSummary, 
      audioSummary
    )
    
    // 6. Unified RAG writer has been removed - content generation is no longer available
    console.log(`⚠️ Unified RAG writer has been removed. Content generation for ${topicSuggestions.length} topics skipped.`)
    
    console.log(`✅ Context analysis completed for user ${userId}`)
    
  } catch (error) {
    console.error('Context analysis failed:', error)
    throw error
  }
}

async function generateTopicSuggestions(
  knowledgeSummary: string, 
  meetingSummary: string, 
  audioSummary: string
): Promise<string[]> {
  console.log('💡 Generating topic suggestions using LLM')
  
  try {
    // Create a simple prompt for the LLM to analyze context and suggest topics
    const prompt = `You are a content analyst. Consider these files and data:

KNOWLEDGE BASE FILES: ${knowledgeSummary}
MEETING TRANSCRIPTS: ${meetingSummary}
MEETING NOTES: ${audioSummary}

Based on this context, suggest 1 engaging topic for a LinkedIn post. The topic should be:
- Relevant to the user's recent work and knowledge
- Professional and valuable for their network
- Based on the actual content they've been working with

Return ONLY the 1 topic title, nothing else.`

    // Call an LLM to analyze and generate suggestions
    const suggestions = await callLLMForAnalysis(prompt)
    
    // Parse the response to get topic title
    const topics = suggestions.split('\n').filter(topic => topic.trim().length > 0).slice(0, 1)
    
    console.log('✅ LLM generated topics:', topics)
    return topics
    
  } catch (error) {
    console.error('❌ LLM analysis failed, using fallback topics:', error)
    
    // Fallback to simple topic if LLM fails
    const fallbackTopics: string[] = []
    
    if (knowledgeSummary !== 'None') {
      fallbackTopics.push('Document Insights & Key Takeaways')
    } else if (meetingSummary !== 'None') {
      fallbackTopics.push('Meeting Insights & Action Items')
    } else if (audioSummary !== 'None') {
      fallbackTopics.push('Audio Content Highlights')
    } else {
      fallbackTopics.push('Professional Development Insights')
    }
    
    return fallbackTopics.slice(0, 1) // Only 1 topic
  }
}

async function callLLMForAnalysis(prompt: string): Promise<string> {
  console.log('🤖 Calling Gemini LLM for context analysis')
  console.log('📝 Prompt:', prompt)
  
  try {
    // Get GCS access token using service account
    const accessToken = await getGCSAccessToken()
    if (!accessToken) {
      throw new Error('Failed to get GCS access token')
    }

    const projectId = Deno.env.get('GCS_PROJECT_ID') ?? ''
    const location = Deno.env.get('GOOGLE_CLOUD_LOCATION') ?? 'us-central1'
    
    console.log('🔑 Using project:', projectId, 'location:', location)
    
    const generationUrl = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.5-flash:generateContent`

    const requestBody = {
      contents: [{
        role: "user",
        parts: [{
          text: prompt
        }]
      }],
      generation_config: {
        temperature: 0.7,
        max_output_tokens: 2048, // Increased from 500 to 2048
        top_p: 0.8,
        top_k: 40
      }
    }

    console.log('📤 Sending request to Gemini:', JSON.stringify(requestBody, null, 2))

    const response = await fetch(generationUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📥 Gemini response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Gemini API error response:', errorText)
      throw new Error(`Gemini API failed: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('📋 Gemini raw response:', JSON.stringify(result, null, 2))
    
    // Check if we have candidates with content
    if (!result.candidates || result.candidates.length === 0) {
      console.error('❌ No candidates in Gemini response:', result)
      throw new Error('No candidates generated by Gemini')
    }
    
    const candidate = result.candidates[0]
    console.log('🔍 Candidate details:', JSON.stringify(candidate, null, 2))
    
    // Check finish reason
    if (candidate.finishReason === 'MAX_TOKENS') {
      console.log('⚠️ Response hit MAX_TOKENS limit, but should still have content')
    }
    
    // Try to get content from different possible structures
    let generatedContent = ''
    
    if (candidate.content?.parts && candidate.content.parts.length > 0) {
      generatedContent = candidate.content.parts[0]?.text || ''
    } else if (candidate.content?.text) {
      generatedContent = candidate.content.text
    } else if (candidate.text) {
      generatedContent = candidate.text
    }
    
    if (!generatedContent) {
      console.error('❌ No content found in candidate:', candidate)
      throw new Error('No content generated by Gemini - response structure issue')
    }

    console.log('✅ Gemini LLM response received:', generatedContent)
    return generatedContent
    
  } catch (error) {
    console.error('❌ Gemini LLM call failed:', error)
    throw new Error('Failed to analyze context with LLM')
  }
}

async function getGCSAccessToken(): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000)
    
    const header = { alg: 'RS256', typ: 'JWT' }
    const payload = {
      iss: Deno.env.get('GCS_CLIENT_EMAIL') ?? '',
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    }

    const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    
    const message = `${headerB64}.${payloadB64}`
    
    const privateKeyPem = (Deno.env.get('GCS_PRIVATE_KEY') ?? '').replace(/\\n/g, '\n')
    
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      pemToArrayBuffer(privateKeyPem),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256',
      },
      false,
      ['sign']
    )

    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(message)
    )

    const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    const jwt = `${message}.${signatureB64}`

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    })

    if (tokenResponse.ok) {
      const tokenData = await tokenResponse.json()
      return tokenData.access_token
    } else {
      const errorText = await tokenResponse.text()
      console.error('Token request failed:', errorText)
      return null
    }
  } catch (error) {
    console.error('Error getting access token:', error)
    return null
  }
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  
  try {
    const binaryString = atob(pemContents)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes.buffer
  } catch (error) {
    console.error(`❌ Error in pemToArrayBuffer: ${error.message}`)
    throw error
  }
}

async function processLatestQueueMessage(supabaseClient: any): Promise<Response> {
  console.log('🔍 Processing latest queue message from webhook trigger')
  
  try {
    // Get the latest message from the queue
    const { data: message, error: popError } = await supabaseClient
      .schema('pgmq_public')
      .rpc('pop', { queue_name: 'pacing_content_queue' })
    
    if (popError || !message) {
      console.log('No messages in queue to process')
      return new Response(JSON.stringify({
        message: 'No messages in queue to process',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    // Handle array response from pgmq.pop()
    const messageObj = Array.isArray(message) ? message[0] : message
    
    if (!messageObj?.message || typeof messageObj.message !== 'object') {
      console.error('❌ Invalid message structure from queue:', messageObj)
      return new Response(JSON.stringify({
        error: 'Invalid message structure from queue',
        processed: 0
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    const queueMessage: QueueMessage = messageObj.message
    console.log('✅ Processing webhook-triggered message for user:', queueMessage.user_id)
    
    // Process the message
    await analyzeUserContext(supabaseClient, queueMessage.user_id, queueMessage.schedule_id)
    
    return new Response(JSON.stringify({
      message: 'Webhook-triggered message processed successfully',
      processed: 1,
      user_id: queueMessage.user_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('❌ Error processing webhook-triggered message:', error)
    return new Response(JSON.stringify({
      error: 'Failed to process webhook-triggered message',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}
