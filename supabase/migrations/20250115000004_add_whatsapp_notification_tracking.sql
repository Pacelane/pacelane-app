-- Add WhatsApp notification tracking to saved_drafts table
-- This allows us to track which drafts have had WhatsApp notifications sent

-- Add notification tracking columns
ALTER TABLE public.saved_drafts 
ADD COLUMN IF NOT EXISTS whatsapp_notification_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_notification_sent_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient querying of pending notifications
CREATE INDEX IF NOT EXISTS idx_saved_drafts_whatsapp_notification 
ON public.saved_drafts (whatsapp_notification_sent, status, user_id) 
WHERE whatsapp_notification_sent = false AND status = 'ready';

-- Add index for notification timestamp
CREATE INDEX IF NOT EXISTS idx_saved_drafts_notification_sent_at 
ON public.saved_drafts (whatsapp_notification_sent_at) 
WHERE whatsapp_notification_sent_at IS NOT NULL;

-- Add RLS policy for notification tracking
-- Users can only see their own notification status
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'saved_drafts' 
        AND policyname = 'Users can view their own notification status'
    ) THEN
        CREATE POLICY "Users can view their own notification status" ON public.saved_drafts
            FOR SELECT USING (auth.uid() = user_id::uuid);
    END IF;
END $$;

-- Users can update their own notification status
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'saved_drafts' 
        AND policyname = 'Users can update their own notification status'
    ) THEN
        CREATE POLICY "Users can update their own notification status" ON public.saved_drafts
            FOR UPDATE USING (auth.uid() = user_id::uuid);
    END IF;
END $$;

-- Service role can update notification status for all drafts
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'saved_drafts' 
        AND policyname = 'Service role can update all notification status'
    ) THEN
        CREATE POLICY "Service role can update all notification status" ON public.saved_drafts
            FOR UPDATE USING (auth.role() = 'service_role');
    END IF;
END $$;

-- Add comment explaining the new fields
COMMENT ON COLUMN public.saved_drafts.whatsapp_notification_sent IS 'Whether a WhatsApp notification has been sent for this draft';
COMMENT ON COLUMN public.saved_drafts.whatsapp_notification_sent_at IS 'When the WhatsApp notification was sent';
