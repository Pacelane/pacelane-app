-- Add recall_calendar_id column to user_calendars table (safe with IF NOT EXISTS)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_calendars') THEN
        ALTER TABLE public.user_calendars ADD COLUMN IF NOT EXISTS recall_calendar_id text;
        COMMENT ON COLUMN public.user_calendars.recall_calendar_id IS 'Recall.ai calendar ID for Calendar V2 integration';
        CREATE INDEX IF NOT EXISTS idx_user_calendars_recall_calendar_id ON public.user_calendars(recall_calendar_id);
    END IF;
END $$;

-- Also add meeting_url column to calendar_events table for Recall.ai integration (safe with IF NOT EXISTS)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_events') THEN
        ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS meeting_url text;
        COMMENT ON COLUMN public.calendar_events.meeting_url IS 'Meeting URL from Recall.ai calendar events';
        CREATE INDEX IF NOT EXISTS idx_calendar_events_meeting_url ON public.calendar_events(meeting_url);
    END IF;
END $$;
