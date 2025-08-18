-- Migration: Remove evening pacing cron job
-- Date: 2025-01-18
-- Description: Remove the 6 PM pacing scheduler cron job, keeping only the 9 AM one

-- Remove the evening pacing scheduler cron job
SELECT cron.unschedule('evening-pacing-scheduler');

-- Add a comment for documentation
COMMENT ON FUNCTION create_scheduled_pacing_jobs() IS 'Direct database function called by cron job to create pacing content generation jobs. Runs daily at 9 AM only.';
