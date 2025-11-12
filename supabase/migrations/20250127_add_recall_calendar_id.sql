-- Add recall_calendar_id column to user_calendars table (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_calendars') THEN
        -- Add column only if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_calendars' AND column_name = 'recall_calendar_id') THEN
            ALTER TABLE public.user_calendars 
            ADD COLUMN recall_calendar_id text;
            
            -- Add comment to explain the column
            COMMENT ON COLUMN public.user_calendars.recall_calendar_id IS 'Recall.ai calendar ID for Calendar V2 integration';
            
            -- Add index for better performance
            CREATE INDEX idx_user_calendars_recall_calendar_id ON public.user_calendars(recall_calendar_id);
        END IF;
    END IF;
END $$;

-- Also add meeting_url column to calendar_events table for Recall.ai integration (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'calendar_events') THEN
        -- Add column only if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'calendar_events' AND column_name = 'meeting_url') THEN
            ALTER TABLE public.calendar_events 
            ADD COLUMN meeting_url text;
            
            -- Add comment to explain the column
            COMMENT ON COLUMN public.calendar_events.meeting_url IS 'Meeting URL from Recall.ai calendar events';
            
            -- Add index for better performance
            CREATE INDEX idx_calendar_events_meeting_url ON public.calendar_events(meeting_url);
        END IF;
    END IF;
END $$;
