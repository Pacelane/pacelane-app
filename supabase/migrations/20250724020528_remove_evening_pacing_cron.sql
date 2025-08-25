-- Migration: Remove evening pacing cron job
-- Date: 2025-01-18
-- Description: Remove the 6 PM pacing scheduler cron job, keeping only the 9 AM one

-- Remove the evening pacing scheduler cron job
-- Only run if cron extension is available (skip in local development)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'cron') THEN
        SELECT cron.unschedule('evening-pacing-scheduler');
        RAISE NOTICE 'Evening pacing cron job removed';
    ELSE
        RAISE NOTICE 'Cron extension not available, skipping cron job removal';
    END IF;
END $$;

-- Note: Function comment will be added in the migration that creates the function
