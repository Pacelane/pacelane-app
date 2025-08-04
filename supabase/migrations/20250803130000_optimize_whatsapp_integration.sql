-- Optimize meeting_notes table for WhatsApp integration
-- Add fields for better tracking and storage management

-- Allow NULL user_id for Phase 1 (before user mapping is implemented)
ALTER TABLE public.meeting_notes 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.meeting_notes 
ADD COLUMN chatwoot_message_id TEXT,
ADD COLUMN chatwoot_contact_id TEXT,
ADD COLUMN message_type TEXT CHECK (message_type IN ('incoming', 'outgoing', 'template')),
ADD COLUMN gcs_storage_path TEXT,
ADD COLUMN processing_status TEXT DEFAULT 'stored' CHECK (processing_status IN ('stored', 'processing', 'processed', 'error')),
ADD COLUMN error_details TEXT;

-- Update the source_type constraint to be more specific
ALTER TABLE public.meeting_notes 
DROP CONSTRAINT meeting_notes_source_type_check,
ADD CONSTRAINT meeting_notes_source_type_check 
CHECK (source_type IN ('whatsapp', 'manual', 'email', 'sms', 'telegram'));

-- Add indexes for efficient querying
CREATE INDEX idx_meeting_notes_chatwoot_message_id ON public.meeting_notes(chatwoot_message_id);
CREATE INDEX idx_meeting_notes_chatwoot_contact_id ON public.meeting_notes(chatwoot_contact_id);
CREATE INDEX idx_meeting_notes_processing_status ON public.meeting_notes(processing_status);
CREATE INDEX idx_meeting_notes_gcs_storage_path ON public.meeting_notes(gcs_storage_path);

-- Add composite index for efficient conversation tracking
CREATE INDEX idx_meeting_notes_conversation_tracking 
ON public.meeting_notes(chatwoot_conversation_id, chatwoot_contact_id, created_at DESC); 