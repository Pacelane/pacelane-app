-- Migration: Add Substack support to user_content_skills table
-- This migration adds support for Substack skills alongside LinkedIn skills

-- Step 1: Add new column for Substack skill ID
ALTER TABLE public.user_content_skills 
ADD COLUMN IF NOT EXISTS anthropic_skill_id_substack TEXT;

-- Step 2: Rename existing anthropic_skill_id to anthropic_skill_id_linkedin
-- First, copy existing data to new column name
ALTER TABLE public.user_content_skills 
ADD COLUMN IF NOT EXISTS anthropic_skill_id_linkedin TEXT;

-- Copy existing data from anthropic_skill_id to anthropic_skill_id_linkedin
UPDATE public.user_content_skills 
SET anthropic_skill_id_linkedin = anthropic_skill_id 
WHERE anthropic_skill_id IS NOT NULL;

-- Drop the old column (only if it exists and we've copied the data)
-- Note: We keep the old column for now to maintain compatibility during migration
-- It will be dropped in a follow-up migration after verifying data migration

-- Update comments
COMMENT ON COLUMN public.user_content_skills.anthropic_skill_id_linkedin IS 'Anthropic API skill ID for LinkedIn content creation (created once per user)';
COMMENT ON COLUMN public.user_content_skills.anthropic_skill_id_substack IS 'Anthropic API skill ID for Substack content creation (created once per user)';
COMMENT ON COLUMN public.user_content_skills.anthropic_skill_id IS 'DEPRECATED: Use anthropic_skill_id_linkedin instead. This column will be removed in a future migration.';

