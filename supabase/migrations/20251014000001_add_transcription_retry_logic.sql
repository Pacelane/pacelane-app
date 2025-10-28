-- Add retry logic columns to knowledge_files table for transcription
ALTER TABLE public.knowledge_files
ADD COLUMN IF NOT EXISTS transcription_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_transcription_attempt_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN public.knowledge_files.transcription_attempts IS 'Number of times transcription has been attempted';
COMMENT ON COLUMN public.knowledge_files.last_transcription_attempt_at IS 'Timestamp of the last transcription attempt';

-- Create index for faster queries on retry logic
CREATE INDEX IF NOT EXISTS idx_knowledge_files_retry_eligible 
ON public.knowledge_files(type, transcription_status, transcription_attempts, last_transcription_attempt_at) 
WHERE type = 'audio' AND transcription_status IN ('failed', 'pending');


