-- Migration: Verify and ensure only 9 AM pacing cron job is active
-- Date: 2025-01-18
-- Description: Double-check that only the 9 AM cron job exists and 6 PM is removed

-- Unschedule any remaining evening jobs (safe to run even if already unscheduled)
-- Only run if cron extension is available (skip in local development)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'cron') THEN
        -- Unschedule any remaining evening jobs
        SELECT cron.unschedule('evening-pacing-scheduler');
        
        -- Ensure the 9 AM job is properly scheduled
        -- First unschedule it to avoid duplicates
        SELECT cron.unschedule('daily-pacing-scheduler');
        
        -- Re-schedule the 9 AM job
        SELECT cron.schedule(
          'daily-pacing-scheduler',
          '0 9 * * *',
          'SELECT create_scheduled_pacing_jobs();'
        );
        
        RAISE NOTICE 'Cron jobs updated successfully';
    ELSE
        RAISE NOTICE 'Cron extension not available, skipping cron job updates';
    END IF;
END $$;

-- Note: Function comment will be added in the migration that creates the function
