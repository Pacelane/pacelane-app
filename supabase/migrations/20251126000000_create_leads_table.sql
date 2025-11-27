-- =====================================================
-- Lead Magnets - Leads Table
-- =====================================================
-- This migration creates the database structure for 
-- capturing leads from lead magnet tools (LinkedIn Analyzer,
-- LinkedIn Wrapped) without requiring user authentication.
-- =====================================================

-- =====================================================
-- 1. LEADS TABLE
-- =====================================================
-- Stores all lead submissions from lead magnet tools

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Lead contact information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  linkedin_url TEXT NOT NULL,
  
  -- Lead source tracking
  lead_source TEXT NOT NULL CHECK (lead_source IN ('linkedin_analyzer', 'linkedin_wrapped')),
  
  -- Scraped data from Apify
  scraped_data JSONB DEFAULT '{}'::jsonb,
  
  -- Additional metadata (goal, utm params, etc)
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Track if lead converted to user
  converted_to_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- 2. INDEXES
-- =====================================================
-- Performance indexes for common queries

-- Index for email lookups (deduplication, conversion tracking)
CREATE INDEX idx_leads_email ON public.leads(email);

-- Index for source filtering
CREATE INDEX idx_leads_source ON public.leads(lead_source);

-- Index for status filtering
CREATE INDEX idx_leads_status ON public.leads(status);

-- Index for created_at (recent leads, analytics)
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);

-- Composite index for analytics queries
CREATE INDEX idx_leads_source_created ON public.leads(lead_source, created_at DESC);

-- Index for conversion tracking
CREATE INDEX idx_leads_converted ON public.leads(converted_to_user_id) WHERE converted_to_user_id IS NOT NULL;

-- =====================================================
-- 3. TRIGGERS
-- =====================================================
-- Auto-update updated_at timestamp

CREATE OR REPLACE FUNCTION public.update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leads_updated_at();

-- =====================================================
-- 4. RLS POLICIES
-- =====================================================
-- Note: RLS is disabled for leads table since these are
-- public submissions that don't require authentication.
-- Access control is handled at the edge function level.

-- Enable RLS but with permissive policies for edge functions
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage all leads
CREATE POLICY "Service role can manage all leads"
  ON public.leads
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =====================================================
-- 5. COMMENTS
-- =====================================================
-- Documentation for the table and columns

COMMENT ON TABLE public.leads IS 'Stores lead submissions from lead magnet tools';
COMMENT ON COLUMN public.leads.lead_source IS 'Source of the lead: linkedin_analyzer or linkedin_wrapped';
COMMENT ON COLUMN public.leads.scraped_data IS 'JSON data scraped from LinkedIn via Apify';
COMMENT ON COLUMN public.leads.metadata IS 'Additional metadata like goal, utm params, etc';
COMMENT ON COLUMN public.leads.status IS 'Processing status: pending, processing, completed, failed';
COMMENT ON COLUMN public.leads.converted_to_user_id IS 'User ID if lead created an account';


