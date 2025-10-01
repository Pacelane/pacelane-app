import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ✅ ENHANCED: Handle both authenticated user calls and service role calls
    let userId: string | null = null;
    let isServiceRole = false;
    
    // Check Anthropic API key first
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    
    // Check if this is a service role call (from job-runner or other edge functions)
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      // Check if it's the service role key
      if (token === Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
        isServiceRole = true;
        console.log('🔑 Service role call detected');
      }
    }
    
    // Initialize Supabase client based on context
    let supabase: any;
    if (isServiceRole) {
      // Service role client for internal calls
      supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
    } else {
      // Regular client for user calls
      supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        {
          global: {
            headers: {
              Authorization: req.headers.get('Authorization')!
            }
          }
        }
      );
    }

    // Get user ID based on context
    let message, conversationId, fileContexts = [], currentContent, mode, selection;
    
    if (isServiceRole) {
      // For service role calls, get userId from request body
      const body = await req.json();
      userId = body.userId;
      message = body.message;
      conversationId = body.conversationId;
      fileContexts = body.fileContexts || [];
      currentContent = body.currentContent;
      mode = body.mode || 'chat'; // 'chat' or 'inline-edit'
      selection = body.selection;
      
      if (!userId) {
        throw new Error('userId is required for service role calls');
      }
      
      console.log('🔑 Service role call for user:', userId);
    } else {
      // For user calls, validate authentication
      if (!authHeader) {
        throw new Error('Authorization header is required');
      }
      
      // Get current user from the authenticated session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        throw new Error('Invalid authorization token');
      }
      
      userId = user.id;
      console.log('👤 Authenticated user call for user:', userId);
      
      // Parse request body for user calls
      const body = await req.json();
      message = body.message;
      conversationId = body.conversationId;
      fileContexts = body.fileContexts || [];
      currentContent = body.currentContent;
      mode = body.mode || 'chat'; // 'chat' or 'inline-edit'
      selection = body.selection;
    }

    console.log('Processing request:', { 
      userId: userId, 
      conversationId, 
      messageLength: message?.length,
      fileContextsCount: fileContexts.length,
      hasCurrentContent: !!currentContent,
      mode: mode,
      hasSelection: !!selection
    });

    if (!message) {
      throw new Error('Message is required');
    }

    let currentConversationId = conversationId;

    // For inline edits, skip conversation/message storage (faster response)
    const skipConversationStorage = mode === 'inline-edit';

    // If no conversation ID provided and not inline edit, create a new conversation
    if (!currentConversationId && !skipConversationStorage) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : '')
        })
        .select()
        .single();

      if (convError) {
        console.error('Error creating conversation:', convError);
        throw new Error('Failed to create conversation');
      }

      currentConversationId = newConversation.id;
      console.log('Created new conversation:', currentConversationId);
    }

    // Save user message to database (skip for inline edits)
    if (!skipConversationStorage) {
      const { error: userMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversationId,
          role: 'user',
          content: message
        });

      if (userMessageError) {
        console.error('Error saving user message:', userMessageError);
        throw new Error('Failed to save user message');
      }
    }

    // Get conversation history for context (skip for inline edits)
    let conversationHistory: any[] = [];
    if (!skipConversationStorage && currentConversationId) {
      const { data, error: historyError } = await supabase
        .from('messages')
        .select('role, content')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });

      if (historyError) {
        console.error('Error fetching conversation history:', historyError);
        throw new Error('Failed to fetch conversation history');
      }
      
      conversationHistory = data || [];
    }

    // Process knowledge base files using Claude Files API (skip for inline edits to keep it fast)
    const { contextText, fileAttachments } = mode === 'inline-edit' 
      ? { contextText: '', fileAttachments: [] }
      : await prepareCitationsWithFiles(fileContexts, anthropicApiKey);

    // Prepare current content context based on mode
    let contentContextInfo = '';
    
    if (mode === 'inline-edit' && selection) {
      // For inline editing, provide focused context
      contentContextInfo = `\n\nInline Edit Mode: The user has selected a specific portion of their content and wants to edit it.

Selected Text:
"""
${selection.text}
"""

Context Before:
"""
${selection.beforeContext || '(beginning of content)'}
"""

Context After:
"""
${selection.afterContext || '(end of content)'}
"""

User's Instruction: "${message}"

CRITICAL INSTRUCTIONS:
1. Return ONLY the edited version of the selected text
2. Do NOT include explanations, commentary, or the surrounding context
3. MANDATORY: Wrap your ENTIRE response in a code block like this example:

\`\`\`
[put the edited text here]
\`\`\`

4. Your response should be ONLY the code block with the edited text inside
5. Keep the same tone and style as the surrounding content
6. Make sure the edit flows naturally with the before and after context
7. The edited text should be in Portuguese (pt-BR) just like the original

EXAMPLE FORMAT:
If the user selects "Hello world" and asks to make it more friendly, your ENTIRE response should be:

\`\`\`
Olá, mundo!
\`\`\`

Nothing else. No explanations before or after the code block.`;
      
    } else if (currentContent) {
      // For full content editing (chat mode)
      contentContextInfo = `\n\nCurrent Content: The user is currently working on this content:
"""
${currentContent}
"""

You are helping them improve this content. When they ask for changes, provide specific suggestions and improvements. 

IMPORTANT: If the user asks for edits or improvements, provide the complete edited version of their content wrapped in a markdown code block like this:

\`\`\`markdown
[edited content here]
\`\`\`

This allows the user to easily apply your suggestions. Always provide the full edited content, not just suggestions.`;
    }

    // Prepare system prompt
    const systemPrompt = `You are a helpful AI assistant specializing in LinkedIn content creation and editing. You help users write, edit, and improve their professional content. 

IMPORTANT: Always respond in Portuguese (pt-BR). All your responses, explanations, and suggestions must be in Brazilian Portuguese.

Your expertise includes:
- LinkedIn post optimization and best practices
- Professional tone and business writing
- Content structure and formatting
- Engagement strategies and call-to-actions
- Hashtag suggestions and optimization

Be creative, supportive, and provide actionable suggestions. When suggesting edits, be specific about what to change and why. Keep your responses concise but helpful.

${contextText ? `\n\nKnowledge Base Context:\n${contextText}` : ''}${contentContextInfo}`;

    // Prepare conversation messages for Claude
    const conversationMessages = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Prepare message content with optional file attachments
    const messageContent: any[] = [
      {
        type: 'text',
        text: message
      }
    ];

    // Add file attachments if available
    if (fileAttachments && fileAttachments.length > 0) {
      console.log(`Adding ${fileAttachments.length} file attachments to Claude request`);
      for (const attachment of fileAttachments) {
        messageContent.push(attachment);
      }
    }

    console.log('Sending request to Claude with', conversationMessages.length + 1, 'messages');

    // Call Claude API
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
        max_tokens: 1000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          ...conversationMessages,
          {
            role: 'user',
            content: messageContent
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.content[0]?.text;

    if (!assistantMessage) {
      throw new Error('No response content from Claude');
    }

    console.log('Received response from Claude, length:', assistantMessage.length);

    // Save assistant message to database (skip for inline edits)
    if (!skipConversationStorage) {
      const { error: assistantMessageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversationId,
          role: 'assistant',
          content: assistantMessage
        });

      if (assistantMessageError) {
        console.error('Error saving assistant message:', assistantMessageError);
        throw new Error('Failed to save assistant message');
      }

      // Update conversation updated_at timestamp
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentConversationId);

      if (updateError) {
        console.error('Error updating conversation timestamp:', updateError);
      }
    }

    console.log('Successfully processed request for conversation:', currentConversationId);

    return new Response(JSON.stringify({
      message: assistantMessage,
      conversationId: currentConversationId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-assistant function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ========== HELPER FUNCTIONS (copied from writer-agent) ==========

interface GCSConfig {
  bucketPrefix: string;
  projectId: string;
  clientEmail: string;
  privateKey: string;
  privateKeyId: string;
}

// GCS configuration for file downloads
const gcsConfig: GCSConfig = {
  bucketPrefix: Deno.env.get('GCS_BUCKET_PREFIX') ?? 'pacelane-whatsapp',
  projectId: Deno.env.get('GCS_PROJECT_ID') ?? '',
  clientEmail: Deno.env.get('GCS_CLIENT_EMAIL') ?? '',
  privateKey: Deno.env.get('GCS_PRIVATE_KEY') ?? '',
  privateKeyId: Deno.env.get('GCS_PRIVATE_KEY_ID') ?? '',
};

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

      signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        new TextEncoder().encode(message)
      );
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
 * Prepare file contexts and upload knowledge base files to Anthropic
 */
async function prepareCitationsWithFiles(fileContexts: any[], anthropicApiKey: string): Promise<{ contextText: string, fileAttachments: any[] }> {
  const fileAttachments: any[] = []
  const contextParts: string[] = []

  console.log(`Preparing ${fileContexts.length} file contexts for AI assistant`);

  for (const fileContext of fileContexts) {
    console.log(`Processing file context: ${fileContext.name}`);
    
    if (fileContext.url) {
      try {
        console.log(`Processing knowledge file: ${fileContext.name}`);
        
        // Check if file type is supported by Anthropic Files API
        const isTextFile = fileContext.name.match(/\.(txt|md|csv|json)$/i)
        const isSupportedPDF = fileContext.name.match(/\.pdf$/i)
        
        if (isTextFile) {
          // Text files can be uploaded to Anthropic
          console.log(`Attempting to upload text file: ${fileContext.name}`);
          const fileId = await uploadFileToAnthropic(fileContext.url, fileContext.name, anthropicApiKey);
          if (fileId) {
            fileAttachments.push({
              type: 'document',
              source: {
                type: 'file',
                file_id: fileId
              }
            });
            contextParts.push(`[KNOWLEDGE_FILE] ${fileContext.name} (attached as document)`);
            console.log(`Successfully attached document: ${fileContext.name}`);
          } else {
            // Fallback to text content if file upload fails
            console.log(`File upload failed, using name only for: ${fileContext.name}`);
            contextParts.push(`[KNOWLEDGE_FILE] ${fileContext.name}`);
          }
        } else if (isSupportedPDF) {
          // Try to upload PDFs to Anthropic (may fail for complex/scanned PDFs)
          console.log(`Attempting to upload PDF file: ${fileContext.name}`);
          const fileId = await uploadFileToAnthropic(fileContext.url, fileContext.name, anthropicApiKey);
          if (fileId) {
            fileAttachments.push({
              type: 'document',
              source: {
                type: 'file',
                file_id: fileId
              }
            });
            contextParts.push(`[KNOWLEDGE_FILE] ${fileContext.name} (attached as PDF document)`);
            console.log(`Successfully attached PDF document: ${fileContext.name}`);
          } else {
            // Fallback if PDF upload fails
            console.log(`PDF upload failed, using name only for: ${fileContext.name}`);
            contextParts.push(`[KNOWLEDGE_FILE] ${fileContext.name} (PDF - content not accessible)`);
          }
        } else {
          // Other file types - use name only
          console.log(`Unsupported file type: ${fileContext.name} - using name only`);
          contextParts.push(`[KNOWLEDGE_FILE] ${fileContext.name}`);
        }
        
      } catch (error) {
        console.warn(`Failed to process file ${fileContext.name}:`, error);
        // Fallback to name only
        contextParts.push(`[KNOWLEDGE_FILE] ${fileContext.name}`);
      }
    } else {
      // Handle files without URLs (just use name)
      contextParts.push(`[FILE] ${fileContext.name}`);
      console.log(`Added file context: ${fileContext.name}`);
    }
  }

  const contextText = contextParts.join('\n\n');
  console.log(`Final context text length: ${contextText.length} characters`);
  console.log(`File attachments: ${fileAttachments.length}`);
  
  return { contextText, fileAttachments };
}

/**
 * Upload a file to Anthropic's file API
 */
async function uploadFileToAnthropic(fileUrl: string, filename: string, anthropicApiKey: string): Promise<string | null> {
  try {
    console.log(`Uploading file ${filename} from ${fileUrl} to Anthropic`);
    
    let fileBuffer: ArrayBuffer;
    
    // Handle different URL types
    if (fileUrl.startsWith('gs://')) {
      // GCS URL - extract bucket and path, then download via GCS API
      const gcsMatch = fileUrl.match(/gs:\/\/([^\/]+)\/(.+)/);
      if (!gcsMatch) {
        throw new Error(`Invalid GCS URL format: ${fileUrl}`);
      }
      
      const bucketName = gcsMatch[1];
      const filePath = gcsMatch[2];
      console.log(`Extracted bucket: ${bucketName}, path: ${filePath}`);
      
      // Get GCS access token
      console.log('Getting GCS access token...');
      const accessToken = await getGCSAccessToken();
      if (!accessToken) {
        throw new Error('Failed to get GCS access token');
      }
      console.log('GCS access token obtained successfully');
      
      // Download file from GCS using authenticated API
      const downloadUrl = `https://storage.googleapis.com/storage/v1/b/${bucketName}/o/${encodeURIComponent(filePath)}?alt=media`;
      console.log(`Downloading from GCS API: ${downloadUrl}`);
      
      const fileResponse = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!fileResponse.ok) {
        throw new Error(`Failed to download file from GCS: ${fileResponse.status} ${fileResponse.statusText}`);
      }
      
      fileBuffer = await fileResponse.arrayBuffer();
      console.log(`Successfully downloaded file from GCS: ${fileBuffer.byteLength} bytes`);
      
    } else if (fileUrl.startsWith('https://storage.googleapis.com/')) {
      // Already a public HTTP URL
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.status}`);
      }
      fileBuffer = await fileResponse.arrayBuffer();
    } else {
      // Other URL types
      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.status}`);
      }
      fileBuffer = await fileResponse.arrayBuffer();
    }

    // Determine MIME type based on file extension
    // Note: Anthropic only supports PDF and plaintext documents
    let mimeType = 'text/plain'; // Default for .txt files
    if (filename.endsWith('.md')) {
      mimeType = 'text/plain'; // Treat markdown as plain text for Anthropic
    } else if (filename.endsWith('.csv')) {
      mimeType = 'text/plain'; // Treat CSV as plain text for Anthropic
    } else if (filename.endsWith('.json')) {
      mimeType = 'text/plain'; // Treat JSON as plain text for Anthropic
    } else if (filename.endsWith('.pdf')) {
      mimeType = 'application/pdf';
    }
    
    console.log(`Setting MIME type for ${filename}: ${mimeType}`);
    
    const fileBlob = new Blob([fileBuffer], { type: mimeType });

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', fileBlob, filename);

    // Upload to Anthropic
    console.log(`Uploading file to Anthropic: ${filename}, size: ${fileBlob.size} bytes, type: ${fileBlob.type}`);
    
    const uploadResponse = await fetch('https://api.anthropic.com/v1/files', {
      method: 'POST',
      headers: {
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'files-api-2025-04-14'
      },
      body: formData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Anthropic file upload failed:', errorText);
      console.error('Response status:', uploadResponse.status);
      console.error('Response headers:', Object.fromEntries(uploadResponse.headers.entries()));
      return null;
    }

    const uploadData = await uploadResponse.json();
    console.log(`Successfully uploaded file ${filename} to Anthropic:`, uploadData.id);
    return uploadData.id;

  } catch (error) {
    console.error(`Error uploading file ${filename} to Anthropic:`, error);
    return null;
  }
}