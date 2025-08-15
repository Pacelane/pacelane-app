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
    
    // Check OpenAI API key first
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
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
    let message, conversationId, fileContexts = [], currentContent;
    
    if (isServiceRole) {
      // For service role calls, get userId from request body
      const body = await req.json();
      userId = body.userId;
      message = body.message;
      conversationId = body.conversationId;
      fileContexts = body.fileContexts || [];
      currentContent = body.currentContent;
      
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
    }

    console.log('Processing request:', { 
      userId: userId, 
      conversationId, 
      messageLength: message?.length,
      fileContextsCount: fileContexts.length,
      hasCurrentContent: !!currentContent
    });

    if (!message) {
      throw new Error('Message is required');
    }

    let currentConversationId = conversationId;

    // If no conversation ID provided, create a new conversation
    if (!currentConversationId) {
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

    // Save user message to database
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

    // Get conversation history for context
    const { data: conversationHistory, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', currentConversationId)
      .order('created_at', { ascending: true });

    if (historyError) {
      console.error('Error fetching conversation history:', historyError);
      throw new Error('Failed to fetch conversation history');
    }

    // Prepare file context information
    let fileContextInfo = '';
    if (fileContexts && fileContexts.length > 0) {
      fileContextInfo = `\n\nAdditional Context: The user has selected the following files as reference for this conversation:
${fileContexts.map((file: any) => `- ${file.name} (${file.type})`).join('\n')}

Please consider these files when providing your response and refer to them if relevant to the user's question.`;
    }

    // Prepare current content context
    let contentContextInfo = '';
    if (currentContent) {
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

    // Prepare messages for OpenAI API
    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI assistant specializing in LinkedIn content creation and editing. You help users write, edit, and improve their professional content. 

Your expertise includes:
- LinkedIn post optimization and best practices
- Professional tone and business writing
- Content structure and formatting
- Engagement strategies and call-to-actions
- Hashtag suggestions and optimization

Be creative, supportive, and provide actionable suggestions. When suggesting edits, be specific about what to change and why. Keep your responses concise but helpful.

${fileContextInfo}${contentContextInfo}`
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    console.log('Sending request to OpenAI with', messages.length, 'messages');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')!}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    console.log('Received response from OpenAI, length:', assistantMessage.length);

    // Save assistant message to database
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