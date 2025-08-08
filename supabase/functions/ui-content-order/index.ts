import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface UIContentOrderRequest {
  platform: string; // 'linkedin', 'twitter', 'instagram', 'generic'
  length: string; // 'short', 'medium', 'long'
  tone: string; // 'professional', 'casual', 'friendly', 'authoritative'
  angle: string; // 'story', 'tips', 'insights', 'question', 'announcement'
  refs: string[]; // Reference materials or context
  original_content?: string; // Existing content to enhance
  context?: string; // Additional context
  topic?: string; // Specific topic or title
}

interface ContentOrder {
  id: string;
  user_id: string;
  source: string;
  params_json: any;
  triggered_by: string;
  created_at: string;
  updated_at: string;
}

interface AgentJob {
  id: string;
  type: string;
  payload_json: any;
  user_id: string;
  status: string;
  attempts: number;
  run_at: string;
  created_at: string;
  updated_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create Supabase client with service role key for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header is required');
    }

    // Create client with user token for auth verification
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get current user from the authenticated session
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    
    if (authError || !user) {
      throw new Error('Invalid authorization token');
    }

    const requestData: UIContentOrderRequest = await req.json();

    console.log('Processing UI content order request:', { 
      userId: user.id, 
      platform: requestData.platform,
      length: requestData.length,
      tone: requestData.tone,
      angle: requestData.angle,
      hasOriginalContent: !!requestData.original_content,
      hasContext: !!requestData.context,
      topic: requestData.topic
    });

    // Validate required fields
    if (!requestData.platform || !requestData.length || !requestData.tone || !requestData.angle) {
      throw new Error('Missing required fields: platform, length, tone, angle');
    }

    // Create content order
    const contentOrderData = {
      user_id: user.id,
      source: 'ui',
      params_json: {
        platform: requestData.platform,
        length: requestData.length,
        tone: requestData.tone,
        angle: requestData.angle,
        refs: requestData.refs || [],
        original_content: requestData.original_content || null,
        context: requestData.context || null,
        topic: requestData.topic || null
      },
      triggered_by: 'ui'
    };

    const { data: contentOrder, error: orderError } = await supabase
      .from('content_order')
      .insert(contentOrderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating content order:', orderError);
      throw new Error('Failed to create content order');
    }

    console.log('Created content order:', contentOrder.id);

    // Create agent job to process the order
    const agentJobData = {
      type: 'process_order',
      payload_json: {
        order_id: contentOrder.id
      },
      user_id: user.id,
      status: 'pending',
      attempts: 0,
      run_at: new Date().toISOString()
    };

    const { data: agentJob, error: jobError } = await supabase
      .from('agent_job')
      .insert(agentJobData)
      .select()
      .single();

    if (jobError) {
      console.error('Error creating agent job:', jobError);
      throw new Error('Failed to create agent job');
    }

    console.log('Created agent job:', agentJob.id);

    // The job-runner will be triggered automatically via Database Webhook
    // when the agent_job is inserted

    return new Response(JSON.stringify({
      success: true,
      message: 'Content order created and processing started',
      orderId: contentOrder.id,
      jobId: agentJob.id,
      userId: user.id,
      source: 'ui',
      platform: requestData.platform,
      length: requestData.length,
      tone: requestData.tone,
      angle: requestData.angle,
      topic: requestData.topic
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ui-content-order function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
