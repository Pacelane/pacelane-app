import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

interface PacingSchedule {
  id: string
  user_id: string
  frequency: string
  selected_days: string[]
  preferred_time: string
  is_active: boolean
}

interface ScheduleCheckResult {
  userId: string
  shouldGenerate: boolean
  reason: string
  scheduleId: string
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
      // Check which users need content today
      return await checkPacingSchedules(supabaseClient)
    } else if (req.method === 'POST') {
      // Create scheduled content generation jobs
      return await createScheduledJobs(supabaseClient)
    } else {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Pacing scheduler error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function checkPacingSchedules(supabaseClient: any): Promise<Response> {
  console.log('🔍 Checking pacing schedules for today...')
  
  const today = new Date()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const todayName = dayNames[today.getDay()]
  
  console.log(`📅 Today is ${todayName}`)
  
  // Get all active pacing schedules
  const { data: schedules, error } = await supabaseClient
    .from('pacing_schedules')
    .select('*')
    .eq('is_active', true)
  
  if (error) {
    throw new Error(`Failed to fetch pacing schedules: ${error.message}`)
  }
  
  if (!schedules || schedules.length === 0) {
    console.log('📝 No active pacing schedules found')
    return new Response(JSON.stringify({ 
      message: 'No active schedules',
      schedules: [],
      today: todayName
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  console.log(`📋 Found ${schedules.length} active schedules`)
  
  // Check which schedules should trigger today
  const results: ScheduleCheckResult[] = []
  
  for (const schedule of schedules) {
    const shouldGenerate = schedule.selected_days.includes(todayName)
    const reason = shouldGenerate 
      ? `Scheduled for ${todayName}` 
      : `Not scheduled for ${todayName}`
    
    results.push({
      userId: schedule.user_id,
      shouldGenerate,
      reason,
      scheduleId: schedule.id
    })
    
    if (shouldGenerate) {
      console.log(`✅ User ${schedule.user_id} should generate content today`)
    } else {
      console.log(`⏭️ User ${schedule.user_id} not scheduled for today`)
    }
  }
  
  return new Response(JSON.stringify({
    message: 'Schedule check completed',
    schedules: results,
    today: todayName,
    totalSchedules: schedules.length,
    activeToday: results.filter(r => r.shouldGenerate).length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function createScheduledJobs(supabaseClient: any): Promise<Response> {
  console.log('🚀 Creating scheduled content generation jobs...')
  
  const today = new Date()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const todayName = dayNames[today.getDay()]
  
  // Get schedules that should trigger today
  const { data: schedules, error } = await supabaseClient
    .from('pacing_schedules')
    .select('*')
    .eq('is_active', true)
    .contains('selected_days', [todayName])
  
  if (error) {
    throw new Error(`Failed to fetch today's schedules: ${error.message}`)
  }
  
  if (!schedules || schedules.length === 0) {
    console.log('📝 No schedules active for today')
    return new Response(JSON.stringify({ 
      message: 'No schedules active for today',
      jobsCreated: 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
  
  console.log(`📋 Found ${schedules.length} schedules active for today`)
  
  const jobsCreated = []
  
  for (const schedule of schedules) {
    try {
      // Check if we already created a job for this user today
      const { data: existingJob } = await supabaseClient
        .from('agent_job')
        .select('id')
        .eq('user_id', schedule.user_id)
        .eq('type', 'pacing_content_generation')
        .eq('schedule_type', 'pacing')
        .gte('created_at', today.toISOString().split('T')[0])
        .maybeSingle()
      
      if (existingJob) {
        console.log(`⏭️ Job already exists for user ${schedule.user_id} today`)
        continue
      }
      
      // Create content generation job
      const { data: job, error: jobError } = await supabaseClient
        .from('agent_job')
        .insert({
          type: 'pacing_content_generation',
          payload_json: {
            schedule_id: schedule.id,
            frequency: schedule.frequency,
            selected_days: schedule.selected_days,
            preferred_time: schedule.preferred_time,
            trigger_date: today.toISOString()
          },
          user_id: schedule.user_id,
          status: 'pending',
          schedule_type: 'pacing',
          schedule_config: {
            frequency: schedule.frequency,
            selected_days: schedule.selected_days,
            preferred_time: schedule.preferred_time
          },
          run_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (jobError) {
        console.error(`❌ Failed to create job for user ${schedule.user_id}:`, jobError)
        continue
      }
      
      console.log(`✅ Created job ${job.id} for user ${schedule.user_id}`)
      jobsCreated.push(job.id)
      
      // Update last_triggered_at
      await supabaseClient
        .from('pacing_schedules')
        .update({ last_triggered_at: new Date().toISOString() })
        .eq('id', schedule.id)
      
    } catch (error) {
      console.error(`❌ Error processing schedule ${schedule.id}:`, error)
    }
  }
  
  return new Response(JSON.stringify({
    message: 'Scheduled jobs created',
    jobsCreated: jobsCreated.length,
    jobIds: jobsCreated,
    totalSchedules: schedules.length
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
