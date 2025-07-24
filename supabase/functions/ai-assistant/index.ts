import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    // Get Supabase environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Extract user from JWT token
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      throw new Error('Invalid authorization token');
    }

    const { message, conversationId } = await req.json();

    console.log('Processing request:', { userId: user.id, conversationId, messageLength: message?.length });

    if (!message) {
      throw new Error('Message is required');
    }

    let currentConversationId = conversationId;

    // If no conversation ID provided, create a new conversation
    if (!currentConversationId) {
      const { data: newConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          user_id: user.id,
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

    // Prepare messages for OpenAI API
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant specializing in content creation. You help users write, edit, and improve their content. Be creative, supportive, and provide actionable suggestions. Keep your responses concise but helpful.'
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
        'Authorization': `Bearer ${openAIApiKey}`,
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