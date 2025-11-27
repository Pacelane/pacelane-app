-- Create linkedin_profile_analysis table for storing public LinkedIn profile analysis submissions
CREATE TABLE IF NOT EXISTS public.linkedin_profile_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  goal TEXT NOT NULL CHECK (goal IN ('Get Hired', 'Hire Talent', 'Build Personal Brand', 'Generate Leads', 'Network')),
  profile_data JSONB,
  analysis TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.linkedin_profile_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for linkedin_profile_analysis
-- No public access - users cannot read their own submissions
-- Only service role can insert and read (for edge function and admin access)

CREATE POLICY "Service role can access all linkedin profile analysis" 
ON public.linkedin_profile_analysis 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_linkedin_analysis_email ON public.linkedin_profile_analysis(email);
CREATE INDEX IF NOT EXISTS idx_linkedin_analysis_created_at ON public.linkedin_profile_analysis(created_at);
CREATE INDEX IF NOT EXISTS idx_linkedin_analysis_goal ON public.linkedin_profile_analysis(goal);

-- Add comments for documentation
COMMENT ON TABLE public.linkedin_profile_analysis IS 'Stores LinkedIn profile analysis submissions from the public analyzer page';
COMMENT ON COLUMN public.linkedin_profile_analysis.name IS 'User''s name (self-reported)';
COMMENT ON COLUMN public.linkedin_profile_analysis.email IS 'User''s email address';
COMMENT ON COLUMN public.linkedin_profile_analysis.linkedin_url IS 'LinkedIn profile URL submitted for analysis';
COMMENT ON COLUMN public.linkedin_profile_analysis.goal IS 'User''s stated goal: Get Hired, Hire Talent, Build Personal Brand, Generate Leads, or Network';
COMMENT ON COLUMN public.linkedin_profile_analysis.profile_data IS 'Raw LinkedIn profile data scraped from Apify (JSONB)';
COMMENT ON COLUMN public.linkedin_profile_analysis.analysis IS 'AI-generated analysis and recommendations';
