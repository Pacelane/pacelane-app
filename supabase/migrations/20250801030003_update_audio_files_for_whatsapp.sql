-- Update audio_files table for WhatsApp integration
-- Add contact_identifier and make user_id nullable for Phase 1

-- Add contact_identifier column for Phase 1 WhatsApp integration
ALTER TABLE public.audio_files 
ADD COLUMN contact_identifier TEXT;

-- Make user_id nullable for Phase 1 (same as meeting_notes)
ALTER TABLE public.audio_files 
ALTER COLUMN user_id DROP NOT NULL;

-- Add new columns for WhatsApp audio processing
ALTER TABLE public.audio_files 
ADD COLUMN chatwoot_attachment_id INTEGER,
ADD COLUMN original_file_size INTEGER,
ADD COLUMN transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'error')),
ADD COLUMN transcription_error TEXT,
ADD COLUMN openai_model TEXT DEFAULT 'whisper-1';

-- Add indexes for efficient querying
CREATE INDEX idx_audio_files_contact_identifier ON public.audio_files(contact_identifier);
CREATE INDEX idx_audio_files_transcription_status ON public.audio_files(transcription_status);
CREATE INDEX idx_audio_files_chatwoot_attachment_id ON public.audio_files(chatwoot_attachment_id);

-- Update RLS policies to allow Edge Function to insert with NULL user_id
CREATE POLICY "System can create WhatsApp audio files" 
ON public.audio_files 
FOR INSERT 
WITH CHECK (
  -- Allow authenticated users to create their own audio files
  (auth.uid() = user_id AND contact_identifier IS NULL)
  OR 
  -- Allow system to create WhatsApp audio files with contact identifier
  (user_id IS NULL AND contact_identifier IS NOT NULL)
); 