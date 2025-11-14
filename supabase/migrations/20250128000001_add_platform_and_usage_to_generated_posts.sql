-- Migration: Add platform and usage columns to generated_posts table
-- This migration adds support for tracking which platform (LinkedIn/Substack) was used
-- and stores debug information about skill usage

-- Step 1: Add platform column with CHECK constraint
ALTER TABLE public.generated_posts 
ADD COLUMN IF NOT EXISTS platform TEXT 
CHECK (platform IN ('linkedin', 'substack'));

-- Step 2: Add usage JSONB column for debug information
ALTER TABLE public.generated_posts 
ADD COLUMN IF NOT EXISTS usage JSONB;

-- Step 3: Set default platform for existing rows (backward compatibility)
UPDATE public.generated_posts 
SET platform = 'linkedin' 
WHERE platform IS NULL;

-- Step 4: Create index on platform for better query performance
CREATE INDEX IF NOT EXISTS idx_generated_posts_platform 
ON public.generated_posts(platform);

-- Step 5: Create index on usage JSONB for queries (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_generated_posts_usage 
ON public.generated_posts USING GIN (usage);

-- Update comments
COMMENT ON COLUMN public.generated_posts.platform IS 'Platform where the content will be published: linkedin or substack';
COMMENT ON COLUMN public.generated_posts.usage IS 'JSONB object containing debug information: {skill_id, skill_type, platform, used_existing_skill, selection_method}';

-- Update table comment
COMMENT ON TABLE public.generated_posts IS 'Stores generated posts for LinkedIn and Substack created by the spider-agent';

