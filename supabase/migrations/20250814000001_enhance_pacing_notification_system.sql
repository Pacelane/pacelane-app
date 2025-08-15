-- Migration: Enhance Pacing Notification System for Context-Aware Suggestions
-- Date: 2025-08-14
-- Description: Add context tracking, meeting integration, and enhanced user preferences for PCL-51

-- 0. Clean up any existing objects that might conflict
DO $$ 
BEGIN
  -- Drop existing functions if they exist
  DROP FUNCTION IF EXISTS get_meeting_context_since_last_suggestion(UUID);
  DROP FUNCTION IF EXISTS update_meeting_context_tracking(UUID);
  DROP FUNCTION IF EXISTS should_send_pacing_suggestion_today(UUID);
  
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own pacing suggestions" ON public.pacing_suggestions;
  DROP POLICY IF EXISTS "Service role can manage all pacing data" ON public.pacing_suggestions;
  DROP POLICY IF EXISTS "Users can view their own meeting context" ON public.meeting_context_tracking;
  DROP POLICY IF EXISTS "Service role can manage all meeting context" ON public.meeting_context_tracking;
  DROP POLICY IF EXISTS "Users can view their own notification preferences" ON public.user_notification_preferences;
  DROP POLICY IF EXISTS "Users can update their own notification preferences" ON public.user_notification_preferences;
  DROP POLICY IF EXISTS "Service role can manage all notification preferences" ON public.user_notification_preferences;
  
  -- Drop existing tables if they exist (this will cascade to policies and indices)
  DROP TABLE IF EXISTS public.pacing_suggestions CASCADE;
  DROP TABLE IF EXISTS public.meeting_context_tracking CASCADE;
  DROP TABLE IF EXISTS public.user_notification_preferences CASCADE;
  
  RAISE NOTICE 'Cleaned up existing objects for clean migration';
END $$;

-- 1. Add context tracking to pacing_schedules table
ALTER TABLE public.pacing_schedules 
ADD COLUMN IF NOT EXISTS last_suggestion_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_suggestion_context JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS context_integration_enabled BOOLEAN DEFAULT true;

-- 2. Create table to track suggestion history and context
CREATE TABLE IF NOT EXISTS public.pacing_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES public.pacing_schedules(id) ON DELETE CASCADE,
  suggestion_date DATE NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'post', -- 'post', 'story', 'article', etc.
  context_summary JSONB DEFAULT '{}', -- Meeting insights, knowledge base context
  meeting_context JSONB DEFAULT '{}', -- Recent meetings since last suggestion
  knowledge_base_context JSONB DEFAULT '{}', -- Relevant knowledge base items
  suggestion_status TEXT DEFAULT 'sent', -- 'sent', 'viewed', 'acted_upon'
  whatsapp_notification_sent BOOLEAN DEFAULT false,
  whatsapp_notification_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create table for meeting context tracking
CREATE TABLE IF NOT EXISTS public.meeting_context_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_suggestion_date DATE NOT NULL,
  meetings_since_last_suggestion JSONB DEFAULT '[]', -- Array of meeting summaries
  key_insights JSONB DEFAULT '[]', -- Extracted insights from meetings
  topics_discussed JSONB DEFAULT '[]', -- Main topics from recent meetings
  action_items JSONB DEFAULT '[]', -- Action items that could inform content
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- Add unique constraint for ON CONFLICT to work
);

-- 4. Create table for user notification preferences
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'custom'
  preferred_times TEXT[] DEFAULT ARRAY['9:00', '18:00'], -- Preferred notification times
  content_types TEXT[] DEFAULT ARRAY['post', 'story', 'article'], -- Preferred content types
  context_integration_level TEXT DEFAULT 'full', -- 'minimal', 'moderate', 'full'
  meeting_context_weight DECIMAL(3,2) DEFAULT 0.7, -- How much weight to give meeting context
  knowledge_base_weight DECIMAL(3,2) DEFAULT 0.3, -- How much weight to give knowledge base
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Add indices for performance
CREATE INDEX IF NOT EXISTS idx_pacing_suggestions_user_date ON public.pacing_suggestions(user_id, suggestion_date);
CREATE INDEX IF NOT EXISTS idx_pacing_suggestions_schedule ON public.pacing_suggestions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_meeting_context_tracking_user ON public.meeting_context_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user ON public.user_notification_preferences(user_id);

-- 6. Enable RLS on new tables
ALTER TABLE public.pacing_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_context_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
CREATE POLICY "Users can view their own pacing suggestions"
ON public.pacing_suggestions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all pacing data"
ON public.pacing_suggestions FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own meeting context"
ON public.meeting_context_tracking FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all meeting context"
ON public.meeting_context_tracking FOR ALL
USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own notification preferences"
ON public.user_notification_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
ON public.user_notification_preferences FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all notification preferences"
ON public.user_notification_preferences FOR ALL
USING (auth.role() = 'service_role');

-- 8. Create function to get meeting context since last suggestion
CREATE OR REPLACE FUNCTION get_meeting_context_since_last_suggestion(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  last_suggestion_date DATE;
  meeting_context JSONB;
BEGIN
  -- Get the last suggestion date for this user
  SELECT COALESCE(MAX(suggestion_date), CURRENT_DATE - INTERVAL '30 days')
  INTO last_suggestion_date
  FROM public.pacing_suggestions
  WHERE user_id = user_uuid;
  
  -- Get meetings since last suggestion
  SELECT jsonb_build_object(
    'last_suggestion_date', last_suggestion_date,
    'meetings_since', (
      SELECT jsonb_agg(jsonb_build_object(
        'meeting_id', rm.meeting_id,
        'title', rm.title,
        'summary', rm.summary_text,
        'topics', rm.topics,
        'action_items', rm.action_items,
        'key_questions', rm.key_moments,
        'date', rm.start_time
      ))
      FROM public.read_ai_meetings rm
      WHERE rm.user_id = user_uuid
      AND rm.start_time::date > last_suggestion_date
      AND rm.summary_text IS NOT NULL
    ),
    'transcripts_available', (
      SELECT jsonb_agg(jsonb_build_object(
        'file_id', kf.id,
        'filename', kf.filename, -- Use filename instead of title
        'type', kf.type,
        'uploaded_at', kf.uploaded_at,
        'file_path', kf.file_path,
        'file_size', kf.file_size
      ))
      FROM public.knowledge_files kf
      WHERE kf.user_id = user_uuid
      AND kf.uploaded_at::date > last_suggestion_date
      AND kf.type = 'file'
    )
  ) INTO meeting_context;
  
  RETURN COALESCE(meeting_context, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Create function to update meeting context tracking
CREATE OR REPLACE FUNCTION update_meeting_context_tracking(user_uuid UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO public.meeting_context_tracking (user_id, last_suggestion_date, meetings_since_last_suggestion, key_insights, topics_discussed, action_items)
  VALUES (
    user_uuid,
    CURRENT_DATE,
    get_meeting_context_since_last_suggestion(user_uuid),
    '[]'::jsonb, -- Will be populated by AI analysis
    '[]'::jsonb, -- Will be populated by AI analysis
    '[]'::jsonb  -- Will be populated by AI analysis
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    last_suggestion_date = EXCLUDED.last_suggestion_date,
    meetings_since_last_suggestion = EXCLUDED.meetings_since_last_suggestion,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to check if suggestion should be sent today
CREATE OR REPLACE FUNCTION should_send_pacing_suggestion_today(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  schedule_record RECORD;
  today_name TEXT;
BEGIN
  -- Get today's day name
  SELECT 
    CASE EXTRACT(dow FROM CURRENT_DATE)
      WHEN 0 THEN 'sunday'
      WHEN 1 THEN 'monday' 
      WHEN 2 THEN 'tuesday'
      WHEN 3 THEN 'wednesday'
      WHEN 4 THEN 'thursday'
      WHEN 5 THEN 'friday'
      WHEN 6 THEN 'saturday'
    END INTO today_name;
  
  -- Get user's active pacing schedule
  SELECT * INTO schedule_record
  FROM public.pacing_schedules
  WHERE user_id = user_uuid AND is_active = true
  LIMIT 1;
  
  -- If no active schedule, don't send
  IF schedule_record IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if today is a selected day
  IF NOT (today_name = ANY(schedule_record.selected_days)) THEN
    RETURN FALSE;
  END IF;
  
  -- ALWAYS send suggestions on pacing days (removed the date restrictions)
  -- This ensures users get daily engagement and content suggestions
  -- regardless of existing drafts or previous suggestions
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Update the existing create_scheduled_pacing_jobs function to use new logic
CREATE OR REPLACE FUNCTION create_scheduled_pacing_jobs()
RETURNS void AS $$
DECLARE
  today_name text;
  schedule_record record;
  jobs_created integer := 0;
  enabled text;
BEGIN
  -- Check if scheduler is enabled
  enabled := get_pacing_config('enabled');
  IF enabled != 'true' THEN
    RAISE NOTICE 'Pacing scheduler is disabled, skipping execution';
    RETURN;
  END IF;

  -- Get today's day name
  SELECT 
    CASE EXTRACT(dow FROM CURRENT_DATE)
      WHEN 0 THEN 'sunday'
      WHEN 1 THEN 'monday' 
      WHEN 2 THEN 'tuesday'
      WHEN 3 THEN 'wednesday'
      WHEN 4 THEN 'thursday'
      WHEN 5 THEN 'friday'
      WHEN 6 THEN 'saturday'
    END INTO today_name;
  
  RAISE NOTICE 'Enhanced pacing scheduler cron job triggered at % for %', NOW(), today_name;
  
  -- Loop through all active pacing schedules
  FOR schedule_record IN 
    SELECT * FROM public.pacing_schedules 
    WHERE is_active = true 
    AND selected_days @> ARRAY[today_name]
  LOOP
    -- Use new function to check if suggestion should be sent today
    IF should_send_pacing_suggestion_today(schedule_record.user_id) THEN
      
      -- ALWAYS create content generation job on pacing days (removed the restriction)
      -- This ensures users get daily suggestions regardless of existing drafts
      
      -- Update meeting context tracking
      PERFORM update_meeting_context_tracking(schedule_record.user_id);
      
      -- Create enhanced content generation job with context
      INSERT INTO public.agent_job (
        type,
        payload_json,
        user_id,
        status,
        schedule_type,
        schedule_config,
        run_at
      ) VALUES (
        'pacing_content_generation',
        jsonb_build_object(
          'schedule_id', schedule_record.id,
          'frequency', schedule_record.frequency,
          'selected_days', schedule_record.selected_days,
          'preferred_time', schedule_record.preferred_time,
          'trigger_date', CURRENT_DATE::text,
          'context_integration', true,
          'meeting_context', get_meeting_context_since_last_suggestion(schedule_record.user_id),
          'enhanced_suggestion', true
        ),
        schedule_record.user_id,
        'pending',
        'pacing',
        jsonb_build_object(
          'frequency', schedule_record.frequency,
          'selected_days', schedule_record.selected_days,
          'preferred_time', schedule_record.preferred_time,
          'context_integration', true
        ),
        NOW()
      );
      
      jobs_created := jobs_created + 1;
      RAISE NOTICE 'Created enhanced job for user % (schedule: %) with context integration', schedule_record.user_id, schedule_record.id;
      
      -- Update last_triggered_at
      UPDATE public.pacing_schedules 
      SET last_triggered_at = NOW() 
      WHERE id = schedule_record.id;
      
    ELSE
      RAISE NOTICE 'Suggestion not needed today for user % (schedule: %)', schedule_record.user_id, schedule_record.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Enhanced pacing scheduler completed. Created % jobs for %', jobs_created, today_name;
END;
$$ LANGUAGE plpgsql;

-- 12. Add comments
COMMENT ON TABLE public.pacing_suggestions IS 'Tracks pacing suggestions sent to users with context information';
COMMENT ON TABLE public.meeting_context_tracking IS 'Tracks meeting context since last suggestion for enhanced content generation';
COMMENT ON TABLE public.user_notification_preferences IS 'User preferences for notification frequency, timing, and context integration';
COMMENT ON FUNCTION get_meeting_context_since_last_suggestion(UUID) IS 'Get meeting context since last suggestion for enhanced content generation';
COMMENT ON FUNCTION update_meeting_context_tracking(UUID) IS 'Update meeting context tracking for a user';
COMMENT ON FUNCTION should_send_pacing_suggestion_today(UUID) IS 'Check if pacing suggestion should be sent today based on enhanced logic';
COMMENT ON FUNCTION create_scheduled_pacing_jobs() IS 'Enhanced pacing scheduler with context integration and improved suggestion logic';
