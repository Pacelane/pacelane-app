-- Create knowledge_files table for user uploads and documents
CREATE TABLE public.knowledge_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'image', 'audio', 'video', 'link')),
  size BIGINT,
  url TEXT,
  storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_activity table for tracking daily activity and streaks
CREATE TABLE public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('content_creation', 'chat_message', 'file_upload', 'profile_update')),
  activity_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one record per user per date per activity type
  UNIQUE(user_id, activity_date, activity_type)
);

-- Create templates table for content templates
CREATE TABLE public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID, -- NULL for system templates, UUID for user-created templates
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for knowledge_files
CREATE POLICY "Users can view their own knowledge files" 
ON public.knowledge_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own knowledge files" 
ON public.knowledge_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own knowledge files" 
ON public.knowledge_files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own knowledge files" 
ON public.knowledge_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for user_activity
CREATE POLICY "Users can view their own activity" 
ON public.user_activity 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own activity" 
ON public.user_activity 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activity" 
ON public.user_activity 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for templates
CREATE POLICY "Users can view all templates" 
ON public.templates 
FOR SELECT 
USING (is_system = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own templates" 
ON public.templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_knowledge_files_updated_at
BEFORE UPDATE ON public.knowledge_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_knowledge_files_user_id ON public.knowledge_files(user_id);
CREATE INDEX idx_knowledge_files_created_at ON public.knowledge_files(created_at DESC);
CREATE INDEX idx_user_activity_user_date ON public.user_activity(user_id, activity_date DESC);
CREATE INDEX idx_user_activity_user_type_date ON public.user_activity(user_id, activity_type, activity_date DESC);
CREATE INDEX idx_templates_system_active ON public.templates(is_system, is_active);
CREATE INDEX idx_templates_user_active ON public.templates(user_id, is_active);

-- Insert some default system templates
INSERT INTO public.templates (title, description, content, category, is_system, is_active) VALUES
('Personal Story', 'Create connection with your audience telling a story about your personal life', 'Start with a personal experience that taught you something valuable...', 'personal', true, true),
('Challenge of The Week', 'Tell about what was the most challenging thing you did this week and what you did to overcome it', 'This week I faced a challenge that pushed me beyond my comfort zone...', 'personal', true, true),
('Industry Insight', 'Share your thoughts on recent industry trends or developments', 'Recently, I''ve been thinking about the changes happening in our industry...', 'professional', true, true),
('Lesson Learned', 'Share a valuable lesson you''ve learned in your career or life', 'One of the most valuable lessons I''ve learned is...', 'educational', true, true),
('Behind the Scenes', 'Give your audience a peek into your work process or daily routine', 'Today I want to share what goes on behind the scenes...', 'personal', true, true);

-- Create function to track user activity automatically
CREATE OR REPLACE FUNCTION public.track_user_activity(
  p_user_id UUID,
  p_activity_type TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_activity (user_id, activity_date, activity_type, activity_count)
  VALUES (p_user_id, CURRENT_DATE, p_activity_type, 1)
  ON CONFLICT (user_id, activity_date, activity_type) 
  DO UPDATE SET 
    activity_count = user_activity.activity_count + 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user streak
CREATE OR REPLACE FUNCTION public.get_user_streak(p_user_id UUID)
RETURNS TABLE(
  current_streak INTEGER,
  longest_streak INTEGER,
  active_days_this_month INTEGER,
  total_activities INTEGER
) AS $$
DECLARE
  streak_count INTEGER := 0;
  max_streak INTEGER := 0;
  current_streak_count INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  month_activities INTEGER;
  total_acts INTEGER;
BEGIN
  -- Get active days this month
  SELECT COUNT(DISTINCT activity_date) INTO month_activities
  FROM public.user_activity 
  WHERE user_id = p_user_id 
    AND activity_date >= DATE_TRUNC('month', CURRENT_DATE);
  
  -- Get total activities
  SELECT COALESCE(SUM(activity_count), 0) INTO total_acts
  FROM public.user_activity 
  WHERE user_id = p_user_id;
  
  -- Calculate current streak (consecutive days from today going backwards)
  WHILE check_date >= CURRENT_DATE - INTERVAL '365 days' LOOP
    IF EXISTS (
      SELECT 1 FROM public.user_activity 
      WHERE user_id = p_user_id 
        AND activity_date = check_date
    ) THEN
      current_streak_count := current_streak_count + 1;
      check_date := check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  -- Calculate longest streak (simplified version)
  SELECT COALESCE(MAX(consecutive_days), 0) INTO max_streak
  FROM (
    SELECT COUNT(*) as consecutive_days
    FROM (
      SELECT activity_date,
             activity_date - ROW_NUMBER() OVER (ORDER BY activity_date)::INTEGER as grp
      FROM (
        SELECT DISTINCT activity_date
        FROM public.user_activity 
        WHERE user_id = p_user_id
        ORDER BY activity_date
      ) daily_activity
    ) grouped
    GROUP BY grp
  ) streaks;
  
  RETURN QUERY SELECT 
    current_streak_count,
    max_streak,
    COALESCE(month_activities, 0)::INTEGER,
    COALESCE(total_acts, 0)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 