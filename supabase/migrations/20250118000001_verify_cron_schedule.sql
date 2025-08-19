-- Migration: Verify and ensure only 9 AM pacing cron job is active
-- Date: 2025-01-18
-- Description: Double-check that only the 9 AM cron job exists and 6 PM is removed

-- Unschedule any remaining evening jobs (safe to run even if already unscheduled)
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

-- Add documentation
COMMENT ON FUNCTION create_scheduled_pacing_jobs() IS 'Direct database function called by cron job to create pacing content generation jobs. Runs daily at 9:00 AM only.';
