-- Migration: Add user bucket mapping table for GCS bucket management
-- This table ensures that each user gets a consistent bucket for their WhatsApp messages

-- Create user_bucket_mapping table
CREATE TABLE public.user_bucket_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one bucket per user
  UNIQUE(user_id),
  -- Ensure bucket names are unique
  UNIQUE(bucket_name)
);

-- Enable Row Level Security
ALTER TABLE public.user_bucket_mapping ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_bucket_mapping
CREATE POLICY "Users can view their own bucket mappings" 
ON public.user_bucket_mapping 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all bucket mappings" 
ON public.user_bucket_mapping 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_user_bucket_mapping_user_id ON public.user_bucket_mapping(user_id);
CREATE INDEX idx_user_bucket_mapping_bucket_name ON public.user_bucket_mapping(bucket_name);

-- Add updated_at trigger
CREATE TRIGGER update_user_bucket_mapping_updated_at
    BEFORE UPDATE ON public.user_bucket_mapping
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.user_bucket_mapping IS 'Maps users to their GCS buckets for WhatsApp message storage';
COMMENT ON COLUMN public.user_bucket_mapping.user_id IS 'Reference to the user profile';
COMMENT ON COLUMN public.user_bucket_mapping.bucket_name IS 'GCS bucket name for this user';
COMMENT ON COLUMN public.user_bucket_mapping.created_at IS 'When the bucket mapping was created';
COMMENT ON COLUMN public.user_bucket_mapping.updated_at IS 'When the bucket mapping was last updated';

-- Verify RLS is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_bucket_mapping' 
        AND schemaname = 'public'
    ) THEN
        RAISE EXCEPTION 'RLS policies not created for user_bucket_mapping table';
    END IF;
END $$; 