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
      case 'pacing_content_generation':
        result = await processPacingContentGeneration(supabaseClient, job, steps)
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
  const citations = await callRetrievalAgent(supabaseClient, order.user_id, brief.topic, brief.platform, steps, null) // No meeting context for content orders
  
  // Step 3: Writer - Generate initial draft
  const draft = await callWriterAgent(supabaseClient, brief, citations, order.user_id, steps, null) // No meeting context for content orders
  
  // Step 4: Editor - Refine and finalize
  const finalDraft = await callEditorAgent(supabaseClient, draft, brief, order.user_id, steps, null) // No meeting context for content orders
  
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

async function processPacingContentGeneration(supabaseClient: any, job: AgentJob, steps: any[]) {
  // ✅ FIXED: Now using ALL the rich context data from the enhanced pacing system
  const { 
    schedule_id, 
    frequency, 
    selected_days, 
    preferred_time,
    meeting_context,
    knowledge_base_context,
    context_integration,
    enhanced_suggestion,
    trigger_date
  } = job.payload_json
  
  steps.push({ 
    step: 'start', 
    schedule_id, 
    frequency, 
    selected_days, 
    preferred_time,
    context_integration,
    enhanced_suggestion,
    has_meeting_context: !!meeting_context?.meetings_since,
    has_knowledge_context: !!knowledge_base_context?.transcripts_available,
    timestamp: new Date().toISOString() 
  })

  // Get user's pacing preferences and content pillars
  const { data: profile, error: profileError } = await supabaseClient
    .from('profiles')
    .select('pacing_preferences, content_pillars, goals')
    .eq('user_id', job.user_id)
    .single()

  if (profileError || !profile) {
    throw new Error(`Profile not found for user: ${job.user_id}`)
  }

  steps.push({ step: 'profile_retrieved', profile, timestamp: new Date().toISOString() })

  // ✅ ENHANCED: Create personalized content order using all available context
  let personalizedTopic = await generatePersonalizedTopic(supabaseClient, job.user_id, meeting_context, knowledge_base_context);
  let personalizedAngle = await generatePersonalizedAngle(supabaseClient, job.user_id, meeting_context, knowledge_base_context);
  
  // Use meeting context to personalize the content if available
  if (meeting_context?.meetings_since && meeting_context.meetings_since.length > 0) {
    const latestMeeting = meeting_context.meetings_since[0];
    if (latestMeeting.title) {
      personalizedTopic = `Insights from recent meeting: ${latestMeeting.title}`;
    }
    
    // Extract key topics and action items for personalization
    if (latestMeeting.topics && latestMeeting.topics.length > 0) {
      const mainTopics = latestMeeting.topics.slice(0, 2).map((t: any) => t.text).join(', ');
      personalizedAngle = `Meeting Insights: ${mainTopics}`;
    }
  }

  // ✅ ENHANCED: Create content order with rich context integration
  const contentOrderData = {
    user_id: job.user_id,
    source: 'pacing',
    params_json: {
      platform: 'linkedin_post', // Default to LinkedIn, can be made configurable
      length: 'Medium',
      tone: 'Professional',
      angle: personalizedAngle,
      topic: personalizedTopic,
      refs: [],
      context: {
        // ✅ Enhanced context with meeting insights
        schedule_id,
        frequency,
        selected_days,
        preferred_time,
        pacing_preferences: profile.pacing_preferences,
        content_pillars: profile.content_pillars,
        goals: profile.goals,
        
        // ✅ NEW: Rich meeting context for personalization
        meeting_context: {
          recent_meetings: meeting_context?.meetings_since || [],
          key_insights: meeting_context?.meetings_since?.[0]?.summary || null,
          action_items: meeting_context?.meetings_since?.[0]?.action_items || [],
          topics_discussed: meeting_context?.meetings_since?.[0]?.topics || []
        },
        
        // ✅ NEW: Knowledge base context for content relevance
        knowledge_base_context: {
          recent_transcripts: knowledge_base_context?.transcripts_available || [],
          available_files: knowledge_base_context?.transcripts_available || [],
          content_extraction_status: knowledge_base_context?.transcripts_available?.map((f: any) => ({
            file_name: f.name,
            extracted: f.content_extracted,
            file_type: f.type
          })) || []
        },
        
        // ✅ NEW: Enhanced suggestion metadata
        enhanced_suggestion: enhanced_suggestion || false,
        context_integration: context_integration || false,
        trigger_date: trigger_date || new Date().toISOString()
      }
    },
    triggered_by: 'pacing'
  }

  const { data: contentOrder, error: orderError } = await supabaseClient
    .from('content_order')
    .insert(contentOrderData)
    .select()
    .single()

  if (orderError) {
    throw new Error(`Failed to create content order: ${orderError.message}`)
  }

  steps.push({ 
    step: 'content_order_created', 
    order_id: contentOrder.id,
    personalized_topic: personalizedTopic,
    personalized_angle: personalizedAngle,
    context_integration: context_integration,
    enhanced_suggestion: enhanced_suggestion,
    timestamp: new Date().toISOString() 
  })

  // ✅ ENHANCED: Log the context being used for better debugging
  if (enhanced_suggestion && meeting_context?.meetings_since) {
    console.log(`🎯 Enhanced pacing content generation for user ${job.user_id}:`);
    console.log(`   📅 Recent meetings: ${meeting_context.meetings_since.length}`);
    console.log(`   📝 Personalized topic: ${personalizedTopic}`);
    console.log(`   🎭 Personalized angle: ${personalizedAngle}`);
    if (meeting_context.meetings_since[0]) {
      console.log(`   🏢 Latest meeting: ${meeting_context.meetings_since[0].title}`);
      console.log(`   💡 Key topics: ${meeting_context.meetings_since[0].topics?.map((t: any) => t.text).join(', ') || 'None'}`);
    }
  }

  // ✅ ENHANCED: Pass meeting context to AI agents for better personalization
  // Step 1: Order Builder - Create content brief with context
  const brief = await callOrderBuilder(supabaseClient, contentOrder.id, steps)
  
  // Step 2: Retrieval - Get relevant context (enhanced with meeting insights)
  const citations = await callRetrievalAgent(
    supabaseClient, 
    job.user_id, 
    brief.topic, 
    brief.platform, 
    steps,
    meeting_context // ✅ Pass meeting context for better retrieval
  )
  
  // Step 3: Writer - Generate initial draft with meeting insights
  const draft = await callWriterAgent(
    supabaseClient, 
    brief, 
    citations, 
    job.user_id, 
    steps,
    meeting_context // ✅ Pass meeting context for personalized content
  )
  
  // Step 4: Editor - Refine and finalize with context
  const finalDraft = await callEditorAgent(
    supabaseClient, 
    draft, 
    brief, 
    job.user_id, 
    steps,
    meeting_context // ✅ Pass meeting context for better refinement
  )
  
  // Step 5: Save to saved_drafts
  const { data: savedDraft, error: saveError } = await supabaseClient
    .from('saved_drafts')
    .insert({
      title: finalDraft.title,
      content: finalDraft.content,
      user_id: job.user_id,
      order_id: contentOrder.id,
      citations_json: citations,
      status: 'draft'
    })
    .select()
    .single()

  if (saveError) {
    throw new Error(`Failed to save draft: ${saveError.message}`)
  }

  steps.push({ step: 'draft_saved', draft_id: savedDraft.id, timestamp: new Date().toISOString() })

  // Step 6: Send WhatsApp notification
  try {
    console.log('📱 Sending WhatsApp notification for completed draft');
    
    // ✅ ENHANCED: Use enhanced mode if this was an enhanced pacing suggestion
    const notificationBody = enhanced_suggestion 
      ? { draftId: savedDraft.id, enhanced: true }
      : { draftId: savedDraft.id };
    
    const notificationResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-notifications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify(notificationBody),
    });

    if (notificationResponse.ok) {
      const notificationResult = await notificationResponse.json();
      console.log('✅ WhatsApp notification sent:', notificationResult);
      steps.push({ step: 'whatsapp_notification_sent', timestamp: new Date().toISOString() });
    } else {
      console.warn('⚠️ Failed to send WhatsApp notification:', notificationResponse.status);
      steps.push({ step: 'whatsapp_notification_failed', error: notificationResponse.status, timestamp: new Date().toISOString() });
    }
  } catch (notificationError) {
    console.warn('⚠️ Error sending WhatsApp notification:', notificationError);
    steps.push({ step: 'whatsapp_notification_error', error: notificationError.message, timestamp: new Date().toISOString() });
    // Don't fail the job if notification fails
  }

  return {
    draft_id: savedDraft.id,
    title: savedDraft.title,
    citations_count: citations.length,
    schedule_id,
    frequency,
    selected_days
  }
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

async function callRetrievalAgent(supabaseClient: any, userId: string, topic: string, platform: string, steps: any[], meetingContext?: any) {
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
      max_results: 5,
      meeting_context: meetingContext // Pass meeting context to retrieval agent
    }),
  })

  if (!response.ok) {
    throw new Error(`Retrieval agent failed: ${response.status}`)
  }

  const result = await response.json()
  steps.push({ step: 'retrieval_agent_completed', citations_count: result.citations.length, timestamp: new Date().toISOString() })
  
  return result.citations
}

async function callWriterAgent(supabaseClient: any, brief: any, citations: any[], userId: string, steps: any[], meetingContext?: any) {
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
      user_id: userId,
      meeting_context: meetingContext // Pass meeting context to writer agent
    }),
  })

  if (!response.ok) {
    throw new Error(`Writer agent failed: ${response.status}`)
  }

  const result = await response.json()
  steps.push({ step: 'writer_agent_completed', timestamp: new Date().toISOString() })
  
  return result.draft
}

async function callEditorAgent(supabaseClient: any, draft: any, brief: any, userId: string, steps: any[], meetingContext?: any) {
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
      user_id: userId,
      meeting_context: meetingContext // Pass meeting context to editor agent
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

// Helper functions for personalized content generation
async function generatePersonalizedTopic(supabaseClient: any, userId: string, meetingContext: any, knowledgeContext: any): Promise<string> {
  try {
    // Get user's LinkedIn profile and content pillars for context
    console.log(`🔍 Querying profile for user_id: ${userId}`);
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('linkedin_headline, linkedin_company, linkedin_about, content_pillars, goals, linkedin_data')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error(`❌ Profile query error:`, profileError);
    }

    // Get recent knowledge base files for topic inspiration
    const { data: recentFiles } = await supabaseClient
      .from('knowledge_files')
      .select('filename, title, metadata')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Extract LinkedIn data from the correct format
    console.log(`🔍 Debug - Profile data:`, JSON.stringify(profile, null, 2));
    
    const linkedinData = profile?.linkedin_data;
    console.log(`🔍 Debug - LinkedIn data:`, JSON.stringify(linkedinData, null, 2));
    
    // Try both possible data structures
    const basicInfo = linkedinData?.last_scrape_raw?.basic_info || linkedinData?.basic_info || {};
    const skills = linkedinData?.last_scrape_raw?.skills || linkedinData?.skills || [];
    const experience = linkedinData?.last_scrape_raw?.experience || linkedinData?.experience || [];
    
    console.log(`🔍 Debug - Basic info:`, JSON.stringify(basicInfo, null, 2));
    console.log(`🔍 Debug - Skills:`, JSON.stringify(skills.slice(0, 3), null, 2)); // Show first 3 skills
    
    // Generate topic based on available context
    const userRole = basicInfo.headline || profile?.linkedin_headline || 'Professional';
    const userCompany = basicInfo.current_company || profile?.linkedin_company || '';
    const userIndustry = extractIndustryFromSkills(skills) || 'Business';
    const contentPillars = profile?.content_pillars || [];
    const topSkills = skills.slice(0, 5).map(s => s.name).join(', ');
    const recentFileTopics = recentFiles?.map(f => f.filename || f.title).join(', ') || '';

    console.log(`🎯 Generating personalized topic for ${userRole} at ${userCompany}`);
    console.log(`📋 Content pillars: ${contentPillars.length}`);
    console.log(`📁 Recent files: ${recentFiles?.length || 0}`);
    console.log(`🎯 Top skills: ${topSkills}`);

    // Prioritize content pillars if available
    if (contentPillars.length > 0) {
      const randomPillar = contentPillars[Math.floor(Math.random() * contentPillars.length)];
      console.log(`✅ Using content pillar: ${randomPillar.name}`);
      return `${randomPillar.name}: ${randomPillar.description}`;
    }

    // Use recent knowledge base files
    if (recentFiles && recentFiles.length > 0) {
      const recentFile = recentFiles[0];
      console.log(`✅ Using recent file: ${recentFile.filename || recentFile.title}`);
      return `Professional insights inspired by recent work on ${recentFile.filename || recentFile.title}`;
    }

    // Generate topic based on user's top skills if available
    if (skills.length > 0) {
      const topSkillsText = skills.slice(0, 3).map(s => s.name).join(', ');
      console.log(`✅ Using skills-based topic: ${topSkillsText}`);
      return `${userRole} insights: Leveraging ${topSkillsText} for professional growth and industry impact`;
    }
    
    console.log(`✅ Using role-based fallback for ${userRole}`);
    return `${userRole} insights: Strategic approaches to business growth and professional development`;

  } catch (error) {
    console.warn('❌ Error generating personalized topic:', error);
    return 'Professional insights and industry updates';
  }
}

async function generatePersonalizedAngle(supabaseClient: any, userId: string, meetingContext: any, knowledgeContext: any): Promise<string> {
  try {
    // Get user's goals and content preferences
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('goals, linkedin_headline, content_pillars, linkedin_data')
      .eq('user_id', userId)
      .single();

    // Extract LinkedIn data
    const linkedinData = profile?.linkedin_data;
    const basicInfo = linkedinData?.last_scrape_raw?.basic_info || linkedinData?.basic_info || {};
    const userRole = basicInfo.headline || profile?.linkedin_headline || 'Professional';
    const goals = profile?.goals || {};
    const contentPillars = profile?.content_pillars || [];

    console.log(`🎭 Generating personalized angle for ${userRole}`);
    console.log(`🎯 Goals: ${JSON.stringify(goals)}`);

    // Use goals to determine angle
    if (goals.primary_goal) {
      const goalAngle = getAngleFromGoal(goals.primary_goal);
      console.log(`✅ Using goal-based angle: ${goalAngle}`);
      return goalAngle;
    }

    // Use content pillars
    if (contentPillars.length > 0) {
      const randomPillar = contentPillars[Math.floor(Math.random() * contentPillars.length)];
      const pillarName = randomPillar?.name || randomPillar?.title || 'Content Theme';
      console.log(`✅ Using content pillar angle: ${pillarName} Insights`);
      return `${pillarName} Insights`;
    }

    // Fallback based on role
    const roleAngle = getAngleFromRole(userRole);
    console.log(`✅ Using role-based angle: ${roleAngle}`);
    return roleAngle;

  } catch (error) {
    console.warn('❌ Error generating personalized angle:', error);
    return 'Professional Perspective';
  }
}

function getAngleFromGoal(primaryGoal: string): string {
  switch (primaryGoal.toLowerCase()) {
    case 'thought leadership':
      return 'Industry Thought Leadership';
    case 'network building':
      return 'Professional Networking Insights';
    case 'career growth':
      return 'Career Development Strategies';
    case 'business growth':
      return 'Business Growth Tactics';
    default:
      return `${primaryGoal} Perspective`;
  }
}

function getAngleFromRole(userRole: string): string {
  const roleAngles = {
    'ceo': 'Executive Leadership Insights',
    'founder': 'Entrepreneurial Perspective',
    'manager': 'Team Leadership Strategies',
    'director': 'Strategic Management Insights',
    'consultant': 'Professional Consulting Advice',
    'developer': 'Technical Innovation Insights',
    'designer': 'Design Strategy Perspectives',
    'marketer': 'Marketing Strategy Insights',
    'sales': 'Sales Excellence Strategies'
  };

  const roleKey = userRole.toLowerCase();
  for (const [key, angle] of Object.entries(roleAngles)) {
    if (roleKey.includes(key)) {
      return angle;
    }
  }

  return 'Professional Experience Insights';
}

function extractIndustryFromSkills(skills: any[]): string {
  if (!skills || skills.length === 0) return 'Business';
  
  const skillNames = skills.map(s => s.name.toLowerCase());
  
  // Marketing/Digital Marketing
  if (skillNames.some(s => s.includes('marketing') || s.includes('google ads') || s.includes('facebook'))) {
    return 'Marketing';
  }
  
  // Technology/Programming
  if (skillNames.some(s => s.includes('programação') || s.includes('analytics') || s.includes('bi'))) {
    return 'Technology';
  }
  
  // Strategy/Business
  if (skillNames.some(s => s.includes('estratégia') || s.includes('gestão') || s.includes('projetos'))) {
    return 'Business Strategy';
  }
  
  return 'Business';
}
