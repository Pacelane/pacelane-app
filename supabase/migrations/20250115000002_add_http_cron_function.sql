-- Migration: Update cron jobs to use direct database function
-- Date: 2025-01-15
-- Description: Update cron jobs to use the direct database function instead of HTTP calls

-- Update the cron jobs to use the direct database function
-- First, unschedule the old jobs
SELECT cron.unschedule('daily-pacing-scheduler');
SELECT cron.unschedule('evening-pacing-scheduler');

-- Schedule the new jobs with the direct database function
-- Run every day at 9:00 AM
SELECT cron.schedule(
  'daily-pacing-scheduler',
  '0 9 * * *',
  'SELECT create_scheduled_pacing_jobs();'
);

-- Run every day at 6:00 PM for evening content
SELECT cron.schedule(
  'evening-pacing-scheduler',
  '0 18 * * *',
  'SELECT create_scheduled_pacing_jobs();'
);

-- Add a comment explaining the updated approach
COMMENT ON FUNCTION create_scheduled_pacing_jobs() IS 'Direct database function called by cron jobs to create pacing content generation jobs';
