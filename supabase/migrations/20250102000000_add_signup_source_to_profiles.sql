-- Add signup_source column to profiles table
-- This tracks where the user signed up from (organic, linkedin_wrapped, linkedin_analyzer)

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS signup_source text DEFAULT 'organic';

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.signup_source IS 'Tracks the source of user signup: organic, linkedin_wrapped, or linkedin_analyzer';


