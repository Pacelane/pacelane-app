-- Fix user_id constraint to allow NULL values for Phase 1 WhatsApp integration
-- This allows messages to be stored even when user mapping is not yet implemented

ALTER TABLE public.meeting_notes 
ALTER COLUMN user_id DROP NOT NULL; 