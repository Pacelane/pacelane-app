-- Migration: Add automatic daily pacing scheduler cron jobs
-- Date: 2025-01-15
-- Description: Set up cron jobs to automatically check pacing schedules daily

-- Enable the pg_cron extension if not already enabled
-- Only create if available (skip in local development)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        CREATE EXTENSION IF NOT EXISTS pg_cron;
        RAISE NOTICE 'pg_cron extension enabled';
    ELSE
        RAISE NOTICE 'pg_cron extension already exists';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron extension not available, skipping (local development)';
END $$;

-- Create a function that will be called by the cron job
-- This function works directly with the database - no HTTP calls needed
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

-- Schedule the cron job to run every day at 9:00 AM
-- Only run if cron extension is available (skip in local development)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'cron') THEN
        -- Format: minute hour day month day_of_week
        -- '0 9 * * *' means: 0 minutes, 9 hours, every day, every month, every day of week
        SELECT cron.schedule(
          'daily-pacing-scheduler',
          '0 9 * * *',
          'SELECT create_scheduled_pacing_jobs();'
        );
        
        -- Also schedule a backup job at 6:00 PM for users who prefer evening content
        SELECT cron.schedule(
          'evening-pacing-scheduler',
          '0 18 * * *',
          'SELECT create_scheduled_pacing_jobs();'
        );
        
        RAISE NOTICE 'Pacing cron jobs scheduled successfully';
    ELSE
        RAISE NOTICE 'Cron extension not available, skipping cron job scheduling';
    END IF;
END $$;

-- Add a comment explaining the cron jobs
COMMENT ON FUNCTION create_scheduled_pacing_jobs() IS 'Function called by cron jobs to trigger daily pacing content generation';
