-- Migration: Add simple configuration for pacing scheduler
-- Date: 2025-01-15
-- Description: Add basic configuration for the pacing scheduler

-- Create a simple configuration table for pacing scheduler settings
CREATE TABLE IF NOT EXISTS public.pacing_scheduler_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert basic configuration values
INSERT INTO public.pacing_scheduler_config (key, value, description) VALUES
  ('enabled', 'true', 'Whether the pacing scheduler is enabled'),
  ('check_interval_hours', '12', 'How often to check for scheduled content (in hours)')
ON CONFLICT (key) DO NOTHING;

-- Create a function to get configuration values
CREATE OR REPLACE FUNCTION get_pacing_config(config_key TEXT)
RETURNS TEXT AS $$
DECLARE
  config_value TEXT;
BEGIN
  SELECT value INTO config_value 
  FROM public.pacing_scheduler_config 
  WHERE key = config_key;
  
  RETURN COALESCE(config_value, '');
END;
$$ LANGUAGE plpgsql;

-- Update the main function to check if enabled
CREATE OR REPLACE FUNCTION create_scheduled_pacing_jobs()
RETURNS void AS $$
DECLARE
  today_name text;
  schedule_record record;
  jobs_created integer := 0;
  enabled text;
BEGIN
  -- Check if scheduler is enabled
  enabled := get_pacing_config('enabled');
  IF enabled != 'true' THEN
    RAISE NOTICE 'Pacing scheduler is disabled, skipping execution';
    RETURN;
  END IF;

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
    -- Check if we already created a job for this user today
    IF NOT EXISTS (
      SELECT 1 FROM public.agent_job 
      WHERE user_id = schedule_record.user_id 
      AND type = 'pacing_content_generation'
      AND schedule_type = 'pacing'
      AND DATE(created_at) = CURRENT_DATE
    ) THEN
      
      -- Create content generation job
      INSERT INTO public.agent_job (
        type,
        payload_json,
        user_id,
        status,
        schedule_type,
        schedule_config,
        run_at
      ) VALUES (
        'pacing_content_generation',
        jsonb_build_object(
          'schedule_id', schedule_record.id,
          'frequency', schedule_record.frequency,
          'selected_days', schedule_record.selected_days,
          'preferred_time', schedule_record.preferred_time,
          'trigger_date', CURRENT_DATE::text
        ),
        schedule_record.user_id,
        'pending',
        'pacing',
        jsonb_build_object(
          'frequency', schedule_record.frequency,
          'selected_days', schedule_record.selected_days,
          'preferred_time', schedule_record.preferred_time
        ),
        NOW()
      );
      
      jobs_created := jobs_created + 1;
      RAISE NOTICE 'Created job for user % (schedule: %)', schedule_record.user_id, schedule_record.id;
      
      -- Update last_triggered_at
      UPDATE public.pacing_schedules 
      SET last_triggered_at = NOW() 
      WHERE id = schedule_record.id;
      
    ELSE
      RAISE NOTICE 'Job already exists for user % today, skipping', schedule_record.user_id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Pacing scheduler completed. Created % jobs for %', jobs_created, today_name;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on config table
ALTER TABLE public.pacing_scheduler_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only service role can access)
CREATE POLICY "Service role can manage pacing config" 
ON public.pacing_scheduler_config 
FOR ALL 
USING (auth.role() = 'service_role');

-- Add comments
COMMENT ON TABLE public.pacing_scheduler_config IS 'Basic configuration settings for the pacing scheduler';
COMMENT ON FUNCTION get_pacing_config(TEXT) IS 'Get configuration value for pacing scheduler';
COMMENT ON FUNCTION create_scheduled_pacing_jobs() IS 'Direct database function called by cron jobs to create pacing content generation jobs';
