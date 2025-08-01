-- Add contact_identifier column for Phase 1 WhatsApp integration
-- This allows us to track contacts without changing the user_id UUID structure

-- Add new column for contact identification
ALTER TABLE public.meeting_notes 
ADD COLUMN contact_identifier TEXT;

-- Add index for efficient contact lookups
CREATE INDEX idx_meeting_notes_contact_identifier ON public.meeting_notes(contact_identifier);

-- Update RLS policies to allow Edge Function to insert with NULL user_id
-- but require contact_identifier for WhatsApp messages
CREATE POLICY "System can create WhatsApp messages" 
ON public.meeting_notes 
FOR INSERT 
WITH CHECK (
  -- Allow authenticated users to create their own notes
  (auth.uid() = user_id AND contact_identifier IS NULL)
  OR 
  -- Allow system to create WhatsApp messages with contact identifier
  (user_id IS NULL AND source_type = 'whatsapp' AND contact_identifier IS NOT NULL)
); 