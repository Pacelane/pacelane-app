import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WriterRequest {
  brief: any;
  citations: any[];
  user_id: string;
}

interface GCSConfig {
  bucketPrefix: string;
  projectId: string;
  clientEmail: string;
  privateKey: string;
  privateKeyId: string;
}

interface GeneratedDraft {
  title: string;
  content: string;
  metadata: {
    platform: string;
    length: string;
    tone: string;
    angle: string;
    word_count: number;
    citations_used: number;
    generation_metadata: any;
  };
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

    const { brief, citations, user_id }: WriterRequest = await req.json()

    if (!brief || !user_id) {
      throw new Error('brief and user_id are required')
    }

    const draft = await generateContentDraft(supabaseClient, brief, citations, user_id)

    // Save the draft to the database
    const { data: savedDraft, error: saveError } = await supabaseClient
      .from('saved_drafts')
      .insert({
        title: draft.title,
        content: draft.content,
        user_id: user_id,
        order_id: null, // No order_id for direct writer-agent calls
        citations_json: citations,
        status: 'draft'
      })
      .select()
      .single()

    if (saveError) {
      console.error('Failed to save draft to database:', saveError)
      // Don't fail the request if saving fails, just return the draft
      return new Response(JSON.stringify({ success: true, draft, saved: false, error: saveError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    console.log(`Draft saved to database with ID: ${savedDraft.id}`)

    return new Response(JSON.stringify({ 
      success: true, 
      draft: { ...draft, id: savedDraft.id }, 
      saved: true,
      draft_id: savedDraft.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Writer agent error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

// GCS configuration for file downloads
const gcsConfig: GCSConfig = {
  bucketPrefix: Deno.env.get('GCS_BUCKET_PREFIX') ?? 'pacelane-whatsapp',
  projectId: Deno.env.get('GCS_PROJECT_ID') ?? '',
  clientEmail: Deno.env.get('GCS_CLIENT_EMAIL') ?? '',
  privateKey: Deno.env.get('GCS_PRIVATE_KEY') ?? '',
  privateKeyId: Deno.env.get('GCS_PRIVATE_KEY_ID') ?? '',
};

// Debug GCS config (without exposing sensitive data)
console.log('GCS Config check:', {
  bucketPrefix: gcsConfig.bucketPrefix,
  projectId: gcsConfig.projectId ? 'SET' : 'NOT_SET',
  clientEmail: gcsConfig.clientEmail ? 'SET' : 'NOT_SET',
  privateKey: gcsConfig.privateKey ? `${gcsConfig.privateKey.length} chars` : 'NOT_SET',
  privateKeyId: gcsConfig.privateKeyId ? 'SET' : 'NOT_SET',
});

async function generateContentDraft(
  supabaseClient: any, 
  brief: any, 
  citations: any[], 
  userId: string
): Promise<GeneratedDraft> {
  console.log(`Generating content draft for user ${userId}`)
  console.log('WriterAgent: brief snapshot', {
    platform: brief?.platform,
    length: brief?.length,
    tone: brief?.tone,
    angle: brief?.angle,
    language: brief?.language || brief?.locale,
  })

  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is required for content generation')
  }

  // Get rich user profile for enhanced context
  const userProfile = await buildRichUserProfile(userId, supabaseClient)
  // add userId so inferRequestedLanguage can use it
  userProfile.user_id = userId

  // Get user's writing tone analysis from LinkedIn posts
  const writingProfile = await getUserWritingProfile(userId, supabaseClient)
  userProfile.writingProfile = writingProfile

  // Prepare context from citations and upload files if needed
  const { contextText, fileAttachments } = await prepareCitationsWithFiles(citations, anthropicApiKey)

  // Generate content based on platform using Anthropic Claude
  const content = await generatePlatformSpecificContent(brief, contextText, userProfile, citations, anthropicApiKey, fileAttachments)
  console.log('WriterAgent: content generated length (chars)', content?.length || 0)

  // Calculate word count
  const wordCount = content.split(' ').length

  // Generate a more engaging title based on the content and context
  const improvedTitle = generateImprovedTitle(brief, content, citations)
  
  return {
    title: improvedTitle,
    content,
    metadata: {
      platform: brief.platform,
      length: brief.length,
      tone: brief.tone,
      angle: brief.angle,
      word_count: wordCount,
      citations_used: citations.length,
      generation_metadata: {
        model: 'claude-3-5-haiku-20241022',
        temperature: 0.7,
        timestamp: new Date().toISOString(),
        provider: 'anthropic'
      }
    }
  }
}

/**
 * Get GCS access token using service account credentials
 */
async function getGCSAccessToken(): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    
    const header = { alg: 'RS256', typ: 'JWT' };
    const payload = {
      iss: gcsConfig.clientEmail,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    
    const message = `${headerB64}.${payloadB64}`;
    
    const privateKeyPem = gcsConfig.privateKey.replace(/\\n/g, '\n');
    console.log('Private key length:', privateKeyPem.length);
    
    let signature: ArrayBuffer;
    try {
      const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        pemToArrayBuffer(privateKeyPem),
        {
          name: 'RSASSA-PKCS1-v1_5',
          hash: 'SHA-256',
        },
        false,
        ['sign']
      );
      console.log('Private key imported successfully');

      signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        new TextEncoder().encode(message)
      );
      console.log('Signature created successfully');
    } catch (cryptoError) {
      console.error('Crypto operation failed:', cryptoError);
      throw cryptoError;
    }

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
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const pemContents = pem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryString = atob(pemContents);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Prepare citations and upload knowledge base files to Anthropic
 */
async function prepareCitationsWithFiles(citations: any[], anthropicApiKey: string): Promise<{ contextText: string, fileAttachments: any[] }> {
  const fileAttachments: any[] = []
  const contextParts: string[] = []

  console.log(`Preparing ${citations.length} citations for content generation`)

  for (const citation of citations) {
    console.log(`Processing citation: ${citation.type} - ${citation.title || citation.id}`)
    
    if (citation.type === 'knowledge_file' && citation.source_url) {
      try {
        console.log(`Processing knowledge file: ${citation.title}`)
        
        // Check if file type is supported by Anthropic Files API
        const isTextFile = citation.title.match(/\.(txt|md|csv|json)$/i)
        const isSupportedPDF = citation.title.match(/\.pdf$/i)
        
        if (isTextFile) {
          // Text files can be uploaded to Anthropic
          console.log(`Attempting to upload text file: ${citation.title}`)
          const fileId = await uploadFileToAnthropic(citation.source_url, citation.title, anthropicApiKey)
          if (fileId) {
            fileAttachments.push({
              type: 'document',
              source: {
                type: 'file',
                file_id: fileId
              }
            })
            contextParts.push(`[KNOWLEDGE_FILE] ${citation.title} (attached as document)`)
            console.log(`Successfully attached document: ${citation.title}`)
          } else {
            // Fallback to text content if file upload fails
            console.log(`File upload failed, using text content for: ${citation.title}`)
            contextParts.push(`[KNOWLEDGE_FILE] ${citation.content}`)
          }
        } else if (isSupportedPDF) {
          // PDFs are not supported by Anthropic Files API for binary content
          console.log(`PDF file detected: ${citation.title} - using text content fallback (PDFs not supported by Files API)`)
          contextParts.push(`[KNOWLEDGE_FILE] ${citation.content}`)
        } else {
          // Other file types - use text content
          console.log(`Unsupported file type: ${citation.title} - using text content fallback`)
          contextParts.push(`[KNOWLEDGE_FILE] ${citation.content}`)
        }
        
      } catch (error) {
        console.warn(`Failed to process file ${citation.title}:`, error)
        // Fallback to text content
        contextParts.push(`[KNOWLEDGE_FILE] ${citation.content}`)
      }
    } else {
      // Handle other citation types (meeting notes, LinkedIn posts)
      contextParts.push(`[${citation.type.toUpperCase()}] ${citation.content}`)
      console.log(`Added text citation: ${citation.type}`)
    }
  }

  const contextText = contextParts.join('\n\n')
  console.log(`Final context text length: ${contextText.length} characters`)
  console.log(`File attachments: ${fileAttachments.length}`)
  
  return { contextText, fileAttachments }
}

/**
 * Upload a file to Anthropic's file API
 */
async function uploadFileToAnthropic(fileUrl: string, filename: string, anthropicApiKey: string): Promise<string | null> {
  try {
    console.log(`Uploading file ${filename} from ${fileUrl} to Anthropic`)
    
    let fileBuffer: ArrayBuffer
    
    // Handle different URL types
    if (fileUrl.startsWith('gs://')) {
      // GCS URL - extract bucket and path, then download via GCS API
      const gcsMatch = fileUrl.match(/gs:\/\/([^\/]+)\/(.+)/)
      if (!gcsMatch) {
        throw new Error(`Invalid GCS URL format: ${fileUrl}`)
      }
      
      const bucketName = gcsMatch[1]
      const filePath = gcsMatch[2]
      console.log(`Extracted bucket: ${bucketName}, path: ${filePath}`)
      
      // Get GCS access token
      console.log('Getting GCS access token...')
      const accessToken = await getGCSAccessToken()
      if (!accessToken) {
        throw new Error('Failed to get GCS access token')
      }
      console.log('GCS access token obtained successfully')
      
      // Download file from GCS using authenticated API
      const downloadUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`
      console.log(`Downloading from GCS API: ${downloadUrl}`)
      
      const fileResponse = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (!fileResponse.ok) {
        throw new Error(`Failed to download file from GCS: ${fileResponse.status} ${fileResponse.statusText}`)
      }
      
      fileBuffer = await fileResponse.arrayBuffer()
      console.log(`Successfully downloaded file from GCS: ${fileBuffer.byteLength} bytes`)
      
      // Debug file content (first 200 chars for text files)
      if (filename.endsWith('.txt') || filename.endsWith('.md')) {
        const textContent = new TextDecoder().decode(fileBuffer.slice(0, 200));
        console.log(`File content preview: ${textContent}...`);
      }
      
    } else if (fileUrl.startsWith('https://storage.googleapis.com/')) {
      // Already a public HTTP URL
      const fileResponse = await fetch(fileUrl)
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.status}`)
      }
      fileBuffer = await fileResponse.arrayBuffer()
    } else {
      // Other URL types
      const fileResponse = await fetch(fileUrl)
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.status}`)
      }
      fileBuffer = await fileResponse.arrayBuffer()
    }

    // Determine MIME type based on file extension
    // Note: Anthropic only supports PDF and plaintext documents
    let mimeType = 'text/plain' // Default for .txt files
    if (filename.endsWith('.md')) {
      mimeType = 'text/plain' // Treat markdown as plain text for Anthropic
    } else if (filename.endsWith('.csv')) {
      mimeType = 'text/plain' // Treat CSV as plain text for Anthropic
    } else if (filename.endsWith('.json')) {
      mimeType = 'text/plain' // Treat JSON as plain text for Anthropic
    } else if (filename.endsWith('.pdf')) {
      mimeType = 'application/pdf'
    }
    
    console.log(`Setting MIME type for ${filename}: ${mimeType}`)
    
    const fileBlob = new Blob([fileBuffer], { type: mimeType })

    // Create FormData for file upload
    const formData = new FormData()
    formData.append('file', fileBlob, filename)

    // Upload to Anthropic
    console.log(`Uploading file to Anthropic: ${filename}, size: ${fileBlob.size} bytes, type: ${fileBlob.type}`)
    
    const uploadResponse = await fetch('https://api.anthropic.com/v1/files', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14'
      },
      body: formData
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error('Anthropic file upload failed:', errorText)
      console.error('Response status:', uploadResponse.status)
      console.error('Response headers:', Object.fromEntries(uploadResponse.headers.entries()))
      return null
    }

    const uploadData = await uploadResponse.json()
    console.log(`Successfully uploaded file ${filename} to Anthropic:`, uploadData.id)
    return uploadData.id

  } catch (error) {
    console.error(`Error uploading file ${filename} to Anthropic:`, error)
    return null
  }
}

async function generatePlatformSpecificContent(
  brief: any, 
  contextText: string, 
  userContext: any, 
  citations: any[],
  anthropicApiKey: string,
  fileAttachments: any[] = []
): Promise<string> {
  const platform = brief.platform?.toLowerCase() || 'linkedin'
  // Determine requested content language from brief or recent WhatsApp inputs
  const contentLanguage = await inferRequestedLanguage(brief, anthropicApiKey, userContext)
  console.log('WriterAgent: resolved content language', contentLanguage)
  console.log('WriterAgent: platform', platform)

  let systemPrompt = ''
  let userPrompt = ''

  switch (platform) {
    case 'linkedin':
      systemPrompt = `You are sharing authentic personal insights from your professional experience. Write in a conversational, genuine voice that reflects your unique perspective and expertise. Avoid corporate jargon and generic business speak. Focus on personal stories, honest experiences, and practical insights that only you could share. 

CRITICAL: Start the post directly with your content. Do NOT add any prefixes like "Aqui está o post:", "Here's the post:", or similar introductory phrases. Begin immediately with your first sentence.

Always write strictly in ${contentLanguage}. Do not switch languages. If context appears in other languages, keep proper nouns but write the post in ${contentLanguage}.`
      userPrompt = buildLinkedInPrompt(brief, contextText, userContext)
      break
    case 'twitter':
      systemPrompt = `You are an expert Twitter content creator for executives. Create concise, impactful tweets that drive engagement and thought leadership. Always write strictly in ${contentLanguage}. Do not switch languages. If context appears in other languages, keep proper nouns but write in ${contentLanguage}.`
      userPrompt = buildTwitterPrompt(brief, contextText, userContext)
      break
    case 'instagram':
      systemPrompt = `You are an expert Instagram content creator for executives. Create visually-oriented, engaging content with compelling captions. Always write strictly in ${contentLanguage}. Do not switch languages. If context appears in other languages, keep proper nouns but write in ${contentLanguage}.`
      userPrompt = buildInstagramPrompt(brief, contextText, userContext)
      break
    default:
      systemPrompt = `You are an expert content creator for executives. Create professional, engaging content that demonstrates thought leadership. Always write strictly in ${contentLanguage}. Do not switch languages. If context appears in other languages, keep proper nouns but write in ${contentLanguage}.`
      userPrompt = buildGenericPrompt(brief, contextText, userContext)
  }

  // Prepare message content with optional file attachments
  const messageContent: any[] = [
    {
      type: 'text',
      text: userPrompt
    }
  ]

  // Add file attachments if available
  if (fileAttachments && fileAttachments.length > 0) {
    console.log(`Adding ${fileAttachments.length} file attachments to Claude request`)
    console.log('File attachments:', JSON.stringify(fileAttachments, null, 2))
    for (const attachment of fileAttachments) {
      messageContent.push(attachment)
      console.log(`Added file attachment: ${attachment.source}`)
    }
  } else {
    console.log('No file attachments to add')
  }

  console.log('Final message content structure:', JSON.stringify(messageContent, null, 2))

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'files-api-2025-04-14'
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: getMaxTokens(brief.length),
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: messageContent
        }
      ]
    }),
  })

  if (!response.ok) {
    const apiErrorText = await response.text().catch(() => '')
    console.error('WriterAgent: Anthropic API error', response.status, apiErrorText)
    throw new Error(`Anthropic API error: ${response.status}`)
  }

  const data = await response.json()
  const generatedContent = data.content[0]?.text

  if (!generatedContent) {
    throw new Error('No content generated')
  }

  // Verify language, auto-correct if model ignored constraint
  try {
    const detectedOutLang = await detectLanguageOf(generatedContent, anthropicApiKey)
    console.log('WriterAgent: output language detected', detectedOutLang)
    if (detectedOutLang && contentLanguage && detectedOutLang.toLowerCase() !== contentLanguage.toLowerCase()) {
      console.log(`WriterAgent: correcting output language from ${detectedOutLang} to ${contentLanguage}`)
      const corrected = await translateToLanguage(generatedContent, contentLanguage, anthropicApiKey)
      return corrected || generatedContent
    }
  } catch (e) {
    console.warn('WriterAgent: language verification/translation skipped due to error')
  }

  return generatedContent
}

/**
 * Infer the requested output language.
 * Priority:
 * 1) brief.language or brief.locale if provided
 * 2) Language of the latest WhatsApp-derived inputs (meeting_notes.content or audio_files.transcription)
 * 3) Fallback to 'English'
 */
async function inferRequestedLanguage(brief: any, anthropicApiKey: string, userContext: any): Promise<string> {
  try {
    const explicit = (brief?.language || brief?.locale || '').toString().trim()
    if (explicit) {
      console.log('WriterAgent: language from brief', explicit)
      return explicit
    }

    // 1) Prefer the exact message that generated the order (from Chatwoot → content_order → order-builder)
    const originalContent = (brief?.original_content || '').toString().trim()
    if (originalContent) {
      console.log('WriterAgent: inferring language from brief.original_content (exact order message)')
      const fromOriginal = await detectLanguageOf(originalContent, anthropicApiKey)
      if (fromOriginal) {
        console.log('WriterAgent: detected from original_content', fromOriginal)
        return fromOriginal
      }
    }

    // 2) Otherwise, build a short sample from latest WhatsApp-origin content (text or audio transcription)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const userId = userContext?.user_id || userContext?.id || null
    if (!userId) return 'English'
    console.log('WriterAgent: inferring language using recent WhatsApp inputs for user', userId)

    // Pull recent meeting notes text
    const { data: notes } = await supabaseClient
      .from('meeting_notes')
      .select('content, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)

    // Pull recent audio transcriptions
    const { data: audios } = await supabaseClient
      .from('audio_files')
      .select('transcription, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3)

    const corpus = [
      ...(notes?.map((n: any) => n.content) || []),
      ...(audios?.map((a: any) => a.transcription) || []),
    ]
      .filter(Boolean)
      .join('\n')
      .slice(0, 2000) // keep it small

    console.log('WriterAgent: notes count', notes?.length || 0, 'audios count', audios?.length || 0)
    console.log('WriterAgent: corpus length', corpus?.length || 0)
    if (!corpus) {
      console.log('WriterAgent: no corpus available, defaulting to English')
      return 'English'
    }

    // Use a tiny language-id prompt (kept server-side only)
    const prompt = `Detect the primary human language of the following text. Return only the language name in English (e.g., "Portuguese", "Spanish", "English").\n\nText:\n${corpus}`

        const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        temperature: 0,
        system: 'You are a precise language identification tool. Output only the language name.',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.warn('WriterAgent: language-id API error', response.status, errText)
      return 'English'
    }
    const data = await response.json()
    const detected = data.content?.[0]?.text?.trim()
    console.log('WriterAgent: detected language', detected)
    return detected || 'English'
  } catch (_err) {
    console.warn('WriterAgent: inferRequestedLanguage failed, defaulting to English')
    return 'English'
  }
}

async function detectLanguageOf(text: string, anthropicApiKey: string): Promise<string> {
  try {
    const prompt = `Detect the primary human language of the following text. Return only the language name in English.\n\nText:\n${text.slice(0, 2000)}`
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 10,
        temperature: 0,
        system: 'You are a precise language identification tool. Output only the language name.',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    })
    if (!response.ok) return ''
    const data = await response.json()
    return data.content?.[0]?.text?.trim() || ''
  } catch (_) {
    return ''
  }
}

async function translateToLanguage(text: string, targetLanguage: string, anthropicApiKey: string): Promise<string> {
  try {
    const prompt = `Translate the following LinkedIn post to ${targetLanguage}. Preserve line breaks, placeholders like {X}, emoji numerals, and overall structure. Return only the translated post.\n\n${text}`
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1200,
        temperature: 0.2,
        system: 'You are a careful translator that preserves formatting and placeholders.',
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    })
    if (!response.ok) return ''
    const data = await response.json()
    return data.content?.[0]?.text || ''
  } catch (_) {
    return ''
  }
}

/**
 * Generate an improved, engaging title based on content and context
 */
function generateImprovedTitle(brief: any, content: string, citations: any[]): string {
  // Start with the original topic as base
  let title = brief.topic || 'Generated Content'
  
  // If we have knowledge base citations, try to make the title more specific
  const knowledgeCitations = citations.filter(c => c.type === 'knowledge_file')
  if (knowledgeCitations.length > 0) {
    const firstCitation = knowledgeCitations[0]
    if (firstCitation.title) {
      // Extract key terms from the citation title
      const citationTitle = firstCitation.title
        .replace(/[\[\]]/g, '') // Remove brackets
        .replace(/\.(txt|md|csv|json|pdf|docx|pptx|xlsx)$/i, '') // Remove file extensions
        .trim()
      
      // If the citation title is more specific than the brief topic, use it
      if (citationTitle.length > title.length && citationTitle.includes(title)) {
        title = citationTitle
      } else if (citationTitle.length > title.length) {
        // Combine topic with citation context
        title = `${title}: ${citationTitle}`
      }
    }
  }
  
  // Make the title more engaging by adding action words
  const actionWords = ['Insights', 'Lessons', 'Experience', 'Strategy', 'Approach', 'Solution']
  const randomAction = actionWords[Math.floor(Math.random() * actionWords.length)]
  
  // Only add action word if title doesn't already have one
  if (!actionWords.some(word => title.toLowerCase().includes(word.toLowerCase()))) {
    title = `${randomAction} from ${title}`
  }
  
  return title
}

function buildLinkedInPrompt(brief: any, contextText: string, userContext: any): string {
  const lengthGuide = getLengthGuide(brief.length)

  const ctaEnabled = Boolean(brief?.cta?.enabled && brief?.cta?.keyword)
  const keyword = brief?.cta?.keyword || 'SYSTEM'
  const assetMode = (brief?.asset_mode || 'outcome').toLowerCase()

  const cadenceHint = (() => {
    const days = userContext?.pacingSchedule?.selected_days || userContext?.pacingPreferences?.frequency
    const time = userContext?.pacingSchedule?.preferred_time || userContext?.pacingPreferences?.recommendations_time
    if (Array.isArray(days) && days.length) {
      const label = days.slice(0, 3).map((d: string) => d[0]?.toUpperCase?.() || '').join(' ')
      return `- Cadence (internal): ${label}${time ? ` • ${time}` : ''}`
    }
    return ''
  })()

  return `You are ${userContext.name || 'a business professional'} writing a LinkedIn post in your own voice.

Write about: ${brief.topic}
Tone: ${brief.tone || 'professional'}
Length: ${getLengthGuide(brief.length)}

${contextText ? `Context to reference naturally:\n${contextText}\n` : ''}

Write a ${brief.platform || 'LinkedIn'} post that:
- Sounds authentic and personal
- Shares a practical insight or experience
- Uses your natural speaking voice
- Doesn't use hashtags or bold formatting

Just write the post - no analysis or commentary.`
}

function buildTwitterPrompt(brief: any, contextText: string, userContext: any): string {
  return `Create a Twitter thread for ${userContext.name} (${userContext.headline}).

Topic: ${brief.topic}
Tone: ${brief.tone}
Length: 2-3 tweets

Context from knowledge base:
${contextText}

Requirements:
- First tweet should hook readers
- Each tweet should be under 280 characters
- Make it engaging and shareable
- Reference the context naturally
- No hashtags

Generate the Twitter thread:`
}

function buildInstagramPrompt(brief: any, contextText: string, userContext: any): string {
  return `Create an Instagram caption for ${userContext.name} (${userContext.headline}).

Topic: ${brief.topic}
Tone: ${brief.tone}
Length: Medium caption

Context from knowledge base:
${contextText}

Requirements:
- Start with an engaging hook
- Make it visually descriptive
- Include a call-to-action
- Keep it authentic and personal
- No hashtags

Generate the Instagram caption:`
}

function buildGenericPrompt(brief: any, contextText: string, userContext: any): string {
  const lengthGuide = getLengthGuide(brief.length)
  
  return `Create content for ${userContext.name} (${userContext.headline}).

Topic: ${brief.topic}
Platform: ${brief.platform}
Tone: ${brief.tone}
Angle: ${brief.angle}
Length: ${lengthGuide}

Context from knowledge base:
${contextText}

Requirements:
- Engaging and professional
- Demonstrates thought leadership
- References context naturally
- Appropriate for the specified platform and length
- No hashtags

Generate the content:`
}

function getLengthGuide(length: string): string {
  switch (length?.toLowerCase()) {
    case 'short':
      return '100-200 words'
    case 'medium':
      return '200-400 words'
    case 'long':
      return '400-800 words'
    default:
      return '200-400 words'
  }
}

function getMaxTokens(length: string): number {
  switch (length?.toLowerCase()) {
    case 'short':
      return 300
    case 'medium':
      return 600
    case 'long':
      return 1200
    default:
      return 600
  }
}

/**
 * Build rich user profile from all available data
 */
async function buildRichUserProfile(userId: string, supabaseClient: any): Promise<any> {
  try {
    // Get comprehensive profile data
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('display_name, linkedin_headline, company_linkedin, industry, linkedin_about, goals, content_guides, pacing_preferences')
      .eq('user_id', userId)
      .single()

    // Get recent meeting notes for writing pattern analysis
    const { data: recentNotes } = await supabaseClient
      .from('meeting_notes')
      .select('content')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get recent content for voice analysis
    const { data: recentContent } = await supabaseClient
      .from('content_suggestions')
      .select('content, engagement_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    // Analyze writing patterns from recent content
    const writingPatterns = analyzeWritingPatterns(recentNotes || [], recentContent || [])

    // Load active pacing schedule (for cadence-aware writing)
    const { data: schedules } = await supabaseClient
      .from('pacing_schedules')
      .select('selected_days, preferred_time, is_active, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)

    const pacingSchedule = schedules?.[0] || null

    // Build comprehensive user persona
    const richProfile = {
      // Basic info
      name: profile?.display_name || 'Professional',
      headline: profile?.linkedin_headline || '',
      company: profile?.company_linkedin || '',
      industry: profile?.industry || 'Business',
      about: profile?.linkedin_about || '',

      // Goals and preferences
      goals: profile?.goals || {},
      contentGuides: profile?.content_guides || {},
      pacingPreferences: profile?.pacing_preferences || {},
      pacingSchedule,

      // Derived insights
      writingPatterns,
      
      // Professional context
      role: extractRole(profile?.linkedin_headline || ''),
      domain: profile?.industry || 'business',
      expertise: extractExpertise(profile?.linkedin_about || '', profile?.linkedin_headline || ''),
      
      // Content preferences
      preferredTopics: extractPreferredTopics(recentNotes || [], profile?.goals || {}),
      engagementTriggers: analyzeEngagementTriggers(recentContent || [])
    }

    console.log('Built rich user profile:', richProfile)
    return richProfile

  } catch (error) {
    console.error('Error building rich user profile:', error)
    // Fallback to basic profile
    return {
      name: 'Professional',
      headline: '',
      company: '',
      role: 'Executive',
      domain: 'business',
      writingPatterns: { tone: 'professional', style: 'concise' }
    }
  }
}

/**
 * Analyze writing patterns from user's content
 */
function analyzeWritingPatterns(notes: any[], content: any[]): any {
  const allText = [
    ...notes.map(note => note.content),
    ...content.map(item => item.content)
  ].join(' ')

  if (!allText.trim()) {
    return {
      tone: 'professional',
      style: 'concise',
      commonPhrases: [],
      averageLength: 'medium'
    }
  }

  // Analyze tone
  const personalWords = ['I', 'my', 'me', 'personally', 'experience', 'believe']
  const technicalWords = ['system', 'process', 'framework', 'strategy', 'implementation']
  const casualWords = ['awesome', 'great', 'love', 'excited', 'amazing']

  const personalCount = personalWords.filter(word => 
    allText.toLowerCase().includes(word.toLowerCase())).length
  const technicalCount = technicalWords.filter(word => 
    allText.toLowerCase().includes(word.toLowerCase())).length
  const casualCount = casualWords.filter(word => 
    allText.toLowerCase().includes(word.toLowerCase())).length

  let tone = 'professional'
  if (casualCount > personalCount && casualCount > technicalCount) {
    tone = 'casual'
  } else if (personalCount > technicalCount) {
    tone = 'personal'
  } else if (technicalCount > personalCount) {
    tone = 'technical'
  }

  return {
    tone,
    style: 'balanced',
    commonPhrases: [],
    averageLength: 'medium'
  }
}

/**
 * Extract role from LinkedIn headline
 */
function extractRole(headline: string): string {
  const roleKeywords = {
    'CEO': ['CEO', 'Chief Executive', 'Founder'],
    'CTO': ['CTO', 'Chief Technology', 'Technical Lead'],
    'Manager': ['Manager', 'Director', 'Head of'],
    'Developer': ['Developer', 'Engineer', 'Programmer'],
    'Consultant': ['Consultant', 'Advisory', 'Advisor'],
    'Executive': ['Executive', 'VP', 'Vice President']
  }

  for (const [role, keywords] of Object.entries(roleKeywords)) {
    if (keywords.some(keyword => headline.toLowerCase().includes(keyword.toLowerCase()))) {
      return role
    }
  }

  return 'Professional'
}

/**
 * Extract expertise areas from about and headline
 */
function extractExpertise(about: string, headline: string): string[] {
  const text = `${about} ${headline}`.toLowerCase()
  const expertiseAreas = [
    'artificial intelligence', 'ai', 'machine learning',
    'software development', 'web development', 'mobile development',
    'marketing', 'digital marketing', 'content marketing',
    'sales', 'business development', 'growth',
    'leadership', 'management', 'strategy'
  ]

  return expertiseAreas.filter(area => text.includes(area))
}

/**
 * Extract preferred topics from notes and goals
 */
function extractPreferredTopics(notes: any[], goals: any): string[] {
  const topics = new Set<string>()
  
  // From goals
  if (goals.content_topics) {
    goals.content_topics.forEach((topic: string) => topics.add(topic))
  }

  return Array.from(topics).slice(0, 5)
}

/**
 * Analyze engagement triggers from past content
 */
function analyzeEngagementTriggers(content: any[]): string[] {
  return ['questions', 'stories', 'tips'] // Default triggers
}

/**
 * Get user's writing profile from tone analysis
 */
async function getUserWritingProfile(userId: string, supabaseClient: any): Promise<any> {
  try {
    const { data: profile, error } = await supabaseClient
      .from('user_writing_profiles')
      .select('tone_analysis, analyzed_at, metadata')
      .eq('user_id', userId)
      .single();

    if (error || !profile) {
      console.log('No writing profile found for user, using defaults');
      return null;
    }

    console.log('Loaded writing profile for user:', userId);
    return profile.tone_analysis;

  } catch (error) {
    console.error('Error loading writing profile:', error);
    return null;
  }
}
