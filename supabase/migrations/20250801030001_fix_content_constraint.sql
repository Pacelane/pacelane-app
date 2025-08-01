-- Fix content constraint to allow NULL values for audio messages and other non-text content
-- Audio messages, images, and other media don't have text content

ALTER TABLE public.meeting_notes 
ALTER COLUMN content DROP NOT NULL; 