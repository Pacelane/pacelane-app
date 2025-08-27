-- Migration: Redesign Pacing Scheduler with Supabase Queues
-- Date: 2025-01-20
-- Description: Replace complex agent_job system with queue-based pacing scheduler

-- Enable the pgmq extension for Supabase Queues
-- Note: pgmq extension should already be enabled via Supabase Queues integration
-- If not, you can enable it manually in the Supabase dashboard under Extensions

-- Create the main pacing content queue
-- Check if pgmq extension is available and create queue safely
DO $$
BEGIN
  -- Check if pgmq extension exists and is enabled
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pgmq'
  ) THEN
    -- Create the queue
    PERFORM pgmq.create('pacing_content_queue');
    RAISE NOTICE 'Queue pacing_content_queue created successfully';
  ELSE
    RAISE NOTICE 'pgmq extension not available, skipping queue creation (local development)';
  END IF;
END $$;

-- Note: We're using the existing unified-rag-writer-agent instead of a separate queue
-- The content suggestions queue is not needed in this implementation

-- Create pacing_context_analysis table to store context analysis results
CREATE TABLE public.pacing_context_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  schedule_id UUID NOT NULL REFERENCES public.pacing_schedules(id) ON DELETE CASCADE,
  analysis_date DATE NOT NULL,
  
  -- Context summary from knowledge base and meeting transcripts
  knowledge_context JSONB NOT NULL DEFAULT '{}',
  meeting_context JSONB NOT NULL DEFAULT '{}',
  
  -- Generated content suggestions
  content_suggestions JSONB NOT NULL DEFAULT '[]',
  
  -- Analysis metadata
  analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure one analysis per user per day
  UNIQUE(user_id, analysis_date)
);

-- Create pacing_content_generation table for final content tracking
CREATE TABLE public.pacing_content_generation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  schedule_id UUID NOT NULL REFERENCES public.pacing_schedules(id) ON DELETE CASCADE,
  context_analysis_id UUID NOT NULL REFERENCES public.pacing_context_analysis(id) ON DELETE CASCADE,
  
  -- Content generation details
  content_type TEXT NOT NULL CHECK (content_type IN ('linkedin_post', 'blog_post', 'newsletter', 'social_media')),
  content_title TEXT,
  content_body TEXT,
  content_metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Generation status
  generation_status TEXT NOT NULL DEFAULT 'pending' CHECK (generation_status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Add indices for performance
CREATE INDEX idx_pacing_context_analysis_user_date ON public.pacing_context_analysis(user_id, analysis_date DESC);
CREATE INDEX idx_pacing_context_analysis_status ON public.pacing_context_analysis(analysis_status);
CREATE INDEX idx_pacing_content_generation_user_date ON public.pacing_content_generation(user_id, created_at DESC);
CREATE INDEX idx_pacing_content_generation_status ON public.pacing_content_generation(generation_status);

-- Enable Row Level Security
ALTER TABLE public.pacing_context_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pacing_content_generation ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pacing_context_analysis
CREATE POLICY "Users can view their own context analysis" 
ON public.pacing_context_analysis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own context analysis" 
ON public.pacing_context_analysis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own context analysis" 
ON public.pacing_context_analysis 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for pacing_content_generation
CREATE POLICY "Users can view their own content generation" 
ON public.pacing_content_generation 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content generation" 
ON public.pacing_content_generation 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content generation" 
ON public.pacing_content_generation 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to send message to pacing content queue
CREATE OR REPLACE FUNCTION send_to_pacing_queue(
  p_user_id UUID,
  p_schedule_id UUID,
  p_analysis_date DATE DEFAULT CURRENT_DATE
)
RETURNS TEXT AS $$
DECLARE
  queue_message JSONB;
  message_id TEXT;
BEGIN
  -- Check if analysis already exists for this user/date
  IF EXISTS (
    SELECT 1 FROM public.pacing_context_analysis 
    WHERE user_id = p_user_id AND analysis_date = p_analysis_date
  ) THEN
    RAISE NOTICE 'Context analysis already exists for user % on date %', p_user_id, p_analysis_date;
    RETURN 'analysis_exists';
  END IF;
  
  -- Create queue message
  queue_message := jsonb_build_object(
    'user_id', p_user_id,
    'schedule_id', p_schedule_id,
    'analysis_date', p_analysis_date,
    'timestamp', now(),
    'type', 'pacing_context_analysis'
  );
  
  -- Send to queue
  SELECT pgmq.send('pacing_content_queue', queue_message) INTO message_id;
  
  -- Create pending analysis record
  INSERT INTO public.pacing_context_analysis (
    user_id, schedule_id, analysis_date, analysis_status
  ) VALUES (
    p_user_id, p_schedule_id, p_analysis_date, 'pending'
  );
  
  RAISE NOTICE 'Sent message % to pacing queue for user %', message_id, p_user_id;
  RETURN message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Content suggestions are now sent directly to the unified-rag-writer-agent
-- This function is not needed in the current implementation

-- Update the existing pacing scheduler function to use queues
CREATE OR REPLACE FUNCTION create_scheduled_pacing_jobs()
RETURNS void AS $$
DECLARE
  today_name text;
  schedule_record record;
  jobs_created integer := 0;
BEGIN
  -- Get today's day name
  SELECT 
    CASE EXTRACT(dow FROM CURRENT_DATE)
      WHEN 0 THEN 'sunday'
      WHEN 1 THEN 'monday' 
      WHEN 2 THEN 'tuesday'
      WHEN 3 THEN 'wednesday'
      WHEN 4 THEN 'thursday'
      WHEN 5 THEN 'friday'
      WHEN 6 THEN 'saturday'
    END INTO today_name;
  
  RAISE NOTICE 'Pacing scheduler cron job triggered at % for %', NOW(), today_name;
  
  -- Loop through all active pacing schedules
  FOR schedule_record IN 
    SELECT * FROM public.pacing_schedules 
    WHERE is_active = true 
    AND selected_days @> ARRAY[today_name]
  LOOP
    -- Send to queue instead of creating agent_job rows
    PERFORM send_to_pacing_queue(
      schedule_record.user_id, 
      schedule_record.id, 
      CURRENT_DATE
    );
    
    jobs_created := jobs_created + 1;
    RAISE NOTICE 'Queued analysis for user % (schedule: %)', schedule_record.user_id, schedule_record.id;
    
    -- Update last_triggered_at
    UPDATE public.pacing_schedules 
    SET last_triggered_at = NOW() 
    WHERE id = schedule_record.id;
  END LOOP;
  
  RAISE NOTICE 'Pacing scheduler completed. Queued % analyses for %', jobs_created, today_name;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions for queue operations
-- Only grant if pgmq schema exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = 'pgmq'
  ) THEN
    GRANT USAGE ON SCHEMA pgmq TO authenticated;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pgmq TO authenticated;
    RAISE NOTICE 'Permissions granted for pgmq schema';
  ELSE
    RAISE NOTICE 'pgmq schema not found, skipping permission grants';
  END IF;
END $$;

-- Create a safe function to get queue size
CREATE OR REPLACE FUNCTION get_queue_size(queue_name text)
RETURNS integer AS $$
BEGIN
  BEGIN
    -- Try to get the queue size
    RETURN pgmq.size(queue_name::text);
  EXCEPTION
    WHEN OTHERS THEN
      -- Return 0 if there's any error (queue doesn't exist, etc.)
      RETURN 0;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for monitoring queue status
-- Use a function to safely get queue size
CREATE OR REPLACE VIEW public.pacing_queue_status AS
SELECT 
  'pacing_content_queue' as queue_name,
  get_queue_size('pacing_content_queue') as pending_messages,
  'Context analysis queue for pacing scheduler' as description;

-- Grant access to the queue status view
GRANT SELECT ON public.pacing_queue_status TO authenticated;
