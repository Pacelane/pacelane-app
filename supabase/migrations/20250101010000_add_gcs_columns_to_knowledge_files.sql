-- Add GCS-related columns to knowledge_files table
-- This migration adds the missing columns needed for GCS integration

-- Add GCS-related columns
ALTER TABLE public.knowledge_files 
ADD COLUMN IF NOT EXISTS gcs_bucket TEXT,
ADD COLUMN IF NOT EXISTS gcs_path TEXT,
ADD COLUMN IF NOT EXISTS file_hash TEXT,
ADD COLUMN IF NOT EXISTS content_extracted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS extracted_content TEXT,
ADD COLUMN IF NOT EXISTS extraction_metadata JSONB,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add comments for documentation
COMMENT ON COLUMN public.knowledge_files.gcs_bucket IS 'GCS bucket name where the file is stored';
COMMENT ON COLUMN public.knowledge_files.gcs_path IS 'GCS path where the file is stored';
COMMENT ON COLUMN public.knowledge_files.file_hash IS 'SHA-256 hash of the file for deduplication';
COMMENT ON COLUMN public.knowledge_files.content_extracted IS 'Whether text content has been extracted from the file';
COMMENT ON COLUMN public.knowledge_files.extracted_content IS 'Extracted text content for AI analysis';
COMMENT ON COLUMN public.knowledge_files.extraction_metadata IS 'Metadata about content extraction process';
COMMENT ON COLUMN public.knowledge_files.metadata IS 'Additional file metadata';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_knowledge_files_gcs_path ON public.knowledge_files(gcs_path);
CREATE INDEX IF NOT EXISTS idx_knowledge_files_content_extracted ON public.knowledge_files(content_extracted);
CREATE INDEX IF NOT EXISTS idx_knowledge_files_file_hash ON public.knowledge_files(file_hash); 