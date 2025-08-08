import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JobRunnerRequest {
  job_id?: string;
  max_jobs?: number;
}

interface AgentJob {
  id: string;
  type: string;
  payload_json: any;
  user_id: string;
  status: string;
  attempts: number;
  run_at: string;
}

interface AgentRun {
  id: string;
  user_id: string;
  order_id?: string;
  job_id: string;
  steps_json: any[];
  timings_json: any;
  cost_cents: number;
  success: boolean;
  error_message?: string;
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

    const { job_id, max_jobs = 5 }: JobRunnerRequest = await req.json()

    // If specific job_id provided, process that job
    if (job_id) {
      const result = await processSpecificJob(supabaseClient, job_id)
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Otherwise, find and process pending jobs
    const result = await processPendingJobs(supabaseClient, max_jobs)
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Job runner error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

async function processSpecificJob(supabaseClient: any, jobId: string) {
  console.log(`Processing specific job: ${jobId}`)
  
  // Get the job
  const { data: job, error: jobError } = await supabaseClient
    .from('agent_job')
    .select('*')
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    throw new Error(`Job not found: ${jobId}`)
  }

  return await executeJob(supabaseClient, job)
}

async function processPendingJobs(supabaseClient: any, maxJobs: number) {
  console.log(`Looking for up to ${maxJobs} pending jobs`)

  // Find pending jobs that are ready to run
  const { data: jobs, error } = await supabaseClient
    .from('agent_job')
    .select('*')
    .eq('status', 'pending')
    .lte('run_at', new Date().toISOString())
    .order('run_at', { ascending: true })
    .limit(maxJobs)

  if (error) {
    throw error
  }

  if (!jobs || jobs.length === 0) {
    console.log('No pending jobs found')
    return { processed: 0, message: 'No pending jobs' }
  }

  console.log(`Found ${jobs.length} pending jobs`)

  const results = []
  for (const job of jobs) {
    try {
      // Mark job as processing
      await supabaseClient
        .from('agent_job')
        .update({ 
          status: 'processing',
          started_at: new Date().toISOString(),
          attempts: job.attempts + 1
        })
        .eq('id', job.id)

      const result = await executeJob(supabaseClient, job)
      results.push({ job_id: job.id, success: true, result })
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error)
      
      // Mark job as failed
      await supabaseClient
        .from('agent_job')
        .update({ 
          status: 'failed',
          error_message: error.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', job.id)

      results.push({ job_id: job.id, success: false, error: error.message })
    }
  }

  return { processed: jobs.length, results }
}

async function executeJob(supabaseClient: any, job: AgentJob) {
  console.log(`Executing job ${job.id} of type: ${job.type}`)
  
  const startTime = Date.now()
  const runId = crypto.randomUUID()
  
  // Create agent run record
  const { data: agentRun, error: runError } = await supabaseClient
    .from('agent_run')
    .insert({
      id: runId,
      user_id: job.user_id,
      job_id: job.id,
      order_id: job.payload_json.order_id,
      steps_json: [],
      timings_json: {},
      cost_cents: 0,
      success: false
    })
    .select()
    .single()

  if (runError) {
    throw new Error(`Failed to create agent run: ${runError.message}`)
  }

  try {
    let result
    const steps = []

    // Execute based on job type
    switch (job.type) {
      case 'process_order':
        result = await processContentOrder(supabaseClient, job, steps)
        break
      case 'pacing_check':
        result = await processPacingCheck(supabaseClient, job, steps)
        break
      case 'draft_review':
        result = await processDraftReview(supabaseClient, job, steps)
        break
      default:
        throw new Error(`Unknown job type: ${job.type}`)
    }

    // Update agent run with success
    await supabaseClient
      .from('agent_run')
      .update({
        steps_json: steps,
        timings_json: { total_ms: Date.now() - startTime },
        success: true
      })
      .eq('id', runId)

    // Mark job as completed
    await supabaseClient
      .from('agent_job')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id)

    return result

  } catch (error) {
    console.error(`Job execution failed:`, error)
    
    // Update agent run with failure
    await supabaseClient
      .from('agent_run')
      .update({
        steps_json: [{ step: 'error', error: error.message, timestamp: new Date().toISOString() }],
        timings_json: { total_ms: Date.now() - startTime },
        success: false,
        error_message: error.message
      })
      .eq('id', runId)

    // Mark job as failed
    await supabaseClient
      .from('agent_job')
      .update({ 
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id)

    throw error
  }
}

async function processContentOrder(supabaseClient: any, job: AgentJob, steps: any[]) {
  const { order_id } = job.payload_json
  
  steps.push({ step: 'start', order_id, timestamp: new Date().toISOString() })

  // Get the content order
  const { data: order, error: orderError } = await supabaseClient
    .from('content_order')
    .select('*')
    .eq('id', order_id)
    .single()

  if (orderError || !order) {
    throw new Error(`Content order not found: ${order_id}`)
  }

  steps.push({ step: 'order_retrieved', order, timestamp: new Date().toISOString() })

  // Step 1: Order Builder - Create content brief
  const brief = await callOrderBuilder(supabaseClient, order.id, steps)
  
  // Step 2: Retrieval - Get relevant context
  const citations = await callRetrievalAgent(supabaseClient, order.user_id, brief.topic, brief.platform, steps)
  
  // Step 3: Writer - Generate initial draft
  const draft = await callWriterAgent(supabaseClient, brief, citations, order.user_id, steps)
  
  // Step 4: Editor - Refine and finalize
  const finalDraft = await callEditorAgent(supabaseClient, draft, brief, order.user_id, steps)
  
  // Step 5: Save to saved_drafts
  const { data: savedDraft, error: saveError } = await supabaseClient
    .from('saved_drafts')
    .insert({
      title: finalDraft.title,
      content: finalDraft.content,
      user_id: job.user_id,
      order_id: order_id,
      citations_json: citations,
      status: 'draft'
    })
    .select()
    .single()

  if (saveError) {
    throw new Error(`Failed to save draft: ${saveError.message}`)
  }

  steps.push({ step: 'draft_saved', draft_id: savedDraft.id, timestamp: new Date().toISOString() })

  return {
    draft_id: savedDraft.id,
    title: savedDraft.title,
    citations_count: citations.length
  }
}



async function processPacingCheck(supabaseClient: any, job: AgentJob, steps: any[]) {
  // TODO: Implement pacing check logic
  steps.push({ step: 'pacing_check', message: 'Not implemented yet', timestamp: new Date().toISOString() })
  return { message: 'Pacing check not implemented yet' }
}

async function callOrderBuilder(supabaseClient: any, orderId: string, steps: any[]) {
  steps.push({ step: 'calling_order_builder', order_id: orderId, timestamp: new Date().toISOString() })
  
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/order-builder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ order_id: orderId }),
  })

  if (!response.ok) {
    throw new Error(`Order builder failed: ${response.status}`)
  }

  const result = await response.json()
  steps.push({ step: 'order_builder_completed', timestamp: new Date().toISOString() })
  
  return result.brief
}

async function callRetrievalAgent(supabaseClient: any, userId: string, topic: string, platform: string, steps: any[]) {
  steps.push({ step: 'calling_retrieval_agent', topic, platform, timestamp: new Date().toISOString() })
  
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/retrieval-agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ 
      user_id: userId, 
      topic, 
      platform,
      max_results: 5 
    }),
  })

  if (!response.ok) {
    throw new Error(`Retrieval agent failed: ${response.status}`)
  }

  const result = await response.json()
  steps.push({ step: 'retrieval_agent_completed', citations_count: result.citations.length, timestamp: new Date().toISOString() })
  
  return result.citations
}

async function callWriterAgent(supabaseClient: any, brief: any, citations: any[], userId: string, steps: any[]) {
  steps.push({ step: 'calling_writer_agent', timestamp: new Date().toISOString() })
  
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/writer-agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ 
      brief, 
      citations, 
      user_id: userId 
    }),
  })

  if (!response.ok) {
    throw new Error(`Writer agent failed: ${response.status}`)
  }

  const result = await response.json()
  steps.push({ step: 'writer_agent_completed', timestamp: new Date().toISOString() })
  
  return result.draft
}

async function callEditorAgent(supabaseClient: any, draft: any, brief: any, userId: string, steps: any[]) {
  steps.push({ step: 'calling_editor_agent', timestamp: new Date().toISOString() })
  
  const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/editor-agent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
    body: JSON.stringify({ 
      draft, 
      brief, 
      user_id: userId 
    }),
  })

  if (!response.ok) {
    throw new Error(`Editor agent failed: ${response.status}`)
  }

  const result = await response.json()
  steps.push({ step: 'editor_agent_completed', quality_score: result.draft.quality_score, timestamp: new Date().toISOString() })
  
  return result.draft
}

async function processDraftReview(supabaseClient: any, job: AgentJob, steps: any[]) {
  // TODO: Implement draft review logic
  steps.push({ step: 'draft_review', message: 'Not implemented yet', timestamp: new Date().toISOString() })
  return { message: 'Draft review not implemented yet' }
}
