-- Enhanced Content Suggestions System Migration
-- This migration adds support for GCS integration and multi-agent content generation
-- 
-- RLS Status:
-- - New tables: RLS enabled with comprehensive policies
-- - Modified tables (content_suggestions, knowledge_files): RLS already enabled, 
--   new columns inherit existing policies
-- - All operations respect user isolation and data security

-- Ensure RLS is enabled on content_suggestions (in case previous migration missed it)
ALTER TABLE IF EXISTS public.content_suggestions ENABLE ROW LEVEL SECURITY;

-- 1. WhatsApp User Mapping Table
CREATE TABLE public.whatsapp_user_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  whatsapp_number TEXT NOT NULL,
  chatwoot_contact_id TEXT,
  chatwoot_account_id TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure unique mappings
  UNIQUE(user_id, whatsapp_number),
  UNIQUE(chatwoot_contact_id, chatwoot_account_id)
);

-- 2. User Context Analysis Cache
CREATE TABLE public.user_context_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_data JSONB NOT NULL,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. Enhanced Content Suggestions Table
CREATE TABLE public.enhanced_content_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  full_content TEXT NOT NULL,
  hashtags TEXT[],
  call_to_action TEXT,
  estimated_engagement INTEGER,
  context_sources JSONB,
  generation_metadata JSONB,
  quality_score DECIMAL(3,2),
  is_active BOOLEAN DEFAULT true,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Content Performance Tracking
CREATE TABLE public.content_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_suggestion_id UUID REFERENCES public.enhanced_content_suggestions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  posted_at TIMESTAMP WITH TIME ZONE,
  linkedin_post_id TEXT,
  engagement_metrics JSONB,
  performance_score DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. Add new columns to existing content_suggestions table
-- Note: RLS is already enabled on this table, new columns will inherit existing policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_suggestions') THEN
        ALTER TABLE public.content_suggestions 
        ADD COLUMN IF NOT EXISTS full_content TEXT,
        ADD COLUMN IF NOT EXISTS hashtags TEXT[],
        ADD COLUMN IF NOT EXISTS call_to_action TEXT,
        ADD COLUMN IF NOT EXISTS estimated_engagement INTEGER,
        ADD COLUMN IF NOT EXISTS context_sources JSONB,
        ADD COLUMN IF NOT EXISTS generation_metadata JSONB,
        ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3,2);
    END IF;
END $$;

-- 6. Add GCS-related columns to knowledge_files table
-- Note: RLS is already enabled on this table, new columns will inherit existing policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'knowledge_files') THEN
        ALTER TABLE public.knowledge_files 
        ADD COLUMN IF NOT EXISTS gcs_bucket TEXT,
        ADD COLUMN IF NOT EXISTS gcs_path TEXT,
        ADD COLUMN IF NOT EXISTS file_hash TEXT,
        ADD COLUMN IF NOT EXISTS content_extracted BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS extracted_content TEXT,
        ADD COLUMN IF NOT EXISTS extraction_metadata JSONB;
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.whatsapp_user_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_context_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_content_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies for whatsapp_user_mapping
CREATE POLICY "Users can view their own WhatsApp mappings" 
ON public.whatsapp_user_mapping 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp mappings" 
ON public.whatsapp_user_mapping 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp mappings" 
ON public.whatsapp_user_mapping 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp mappings" 
ON public.whatsapp_user_mapping 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for user_context_analysis
CREATE POLICY "Users can view their own context analysis" 
ON public.user_context_analysis 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own context analysis" 
ON public.user_context_analysis 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own context analysis" 
ON public.user_context_analysis 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own context analysis" 
ON public.user_context_analysis 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for enhanced_content_suggestions
CREATE POLICY "Users can view their own enhanced content suggestions" 
ON public.enhanced_content_suggestions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own enhanced content suggestions" 
ON public.enhanced_content_suggestions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enhanced content suggestions" 
ON public.enhanced_content_suggestions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enhanced content suggestions" 
ON public.enhanced_content_suggestions 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for content_performance
CREATE POLICY "Users can view their own content performance" 
ON public.content_performance 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content performance" 
ON public.content_performance 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content performance" 
ON public.content_performance 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content performance" 
ON public.content_performance 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_whatsapp_user_mapping_number ON public.whatsapp_user_mapping(whatsapp_number);
CREATE INDEX idx_whatsapp_user_mapping_contact ON public.whatsapp_user_mapping(chatwoot_contact_id, chatwoot_account_id);
CREATE INDEX idx_user_context_analysis_user_id ON public.user_context_analysis(user_id);
CREATE INDEX idx_user_context_analysis_expires_at ON public.user_context_analysis(expires_at);
CREATE INDEX idx_enhanced_content_suggestions_user_id ON public.enhanced_content_suggestions(user_id);
CREATE INDEX idx_enhanced_content_suggestions_active ON public.enhanced_content_suggestions(is_active);
CREATE INDEX idx_enhanced_content_suggestions_created_at ON public.enhanced_content_suggestions(created_at DESC);
CREATE INDEX idx_content_performance_user_id ON public.content_performance(user_id);
CREATE INDEX idx_content_performance_suggestion_id ON public.content_performance(content_suggestion_id);

-- Create conditional indexes for existing tables
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'knowledge_files') THEN
        CREATE INDEX IF NOT EXISTS idx_knowledge_files_gcs_path ON public.knowledge_files(gcs_path);
        CREATE INDEX IF NOT EXISTS idx_knowledge_files_content_extracted ON public.knowledge_files(content_extracted);
    END IF;
END $$;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_user_mapping_updated_at
    BEFORE UPDATE ON public.whatsapp_user_mapping
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_enhanced_content_suggestions_updated_at
    BEFORE UPDATE ON public.enhanced_content_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.whatsapp_user_mapping IS 'Maps WhatsApp numbers to user profiles for GCS bucket organization';
COMMENT ON TABLE public.user_context_analysis IS 'Cached context analysis for content generation optimization';
COMMENT ON TABLE public.enhanced_content_suggestions IS 'Enhanced content suggestions with full posts and metadata';
COMMENT ON TABLE public.content_performance IS 'Tracks performance of posted content for optimization';

-- Add conditional comments for existing tables
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'knowledge_files') THEN
        COMMENT ON COLUMN public.knowledge_files.gcs_path IS 'GCS path where the file is stored';
        COMMENT ON COLUMN public.knowledge_files.content_extracted IS 'Whether text content has been extracted from the file';
        COMMENT ON COLUMN public.knowledge_files.extracted_content IS 'Extracted text content for AI analysis';
    END IF;
END $$;

-- Verify RLS is properly configured for all tables
-- This ensures data security and user isolation
DO $$
BEGIN
    -- Check that RLS is enabled on all new tables
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'whatsapp_user_mapping' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on whatsapp_user_mapping table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_context_analysis' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on user_context_analysis table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'enhanced_content_suggestions' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on enhanced_content_suggestions table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'content_performance' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on content_performance table';
    END IF;
    
    -- Verify existing tables still have RLS enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'content_suggestions' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on content_suggestions table';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'knowledge_files' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS not enabled on knowledge_files table';
    END IF;
    
    RAISE NOTICE 'RLS verification completed successfully - all tables have proper security policies';
END $$; 