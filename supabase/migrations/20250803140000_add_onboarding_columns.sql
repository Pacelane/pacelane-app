-- Add missing onboarding columns to profiles table
-- Note: goals and content_guides already exist from 20250724160401_add_goals.sql

-- Only add columns that don't exist yet
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS inspirations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS guides JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS content_pillars JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
ADD COLUMN IF NOT EXISTS is_onboarded BOOLEAN DEFAULT FALSE;

-- Update existing onboarding_completed to is_onboarded for consistency (if column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'onboarding_completed') THEN
    UPDATE public.profiles SET is_onboarded = onboarding_completed WHERE is_onboarded IS NULL;
  END IF;
END $$;

-- Add comments for clarity
COMMENT ON COLUMN public.profiles.inspirations IS 'Array of LinkedIn profiles that inspire the user';
COMMENT ON COLUMN public.profiles.guides IS 'Array of selected content guide topics';
COMMENT ON COLUMN public.profiles.content_pillars IS 'Array of selected content pillar themes';
COMMENT ON COLUMN public.profiles.whatsapp_number IS 'WhatsApp number for notifications (optional)';
COMMENT ON COLUMN public.profiles.is_onboarded IS 'Whether user has completed onboarding flow'; 