-- Create user_content_skills table for storing personalized LinkedIn content creation skills
CREATE TABLE IF NOT EXISTS public.user_content_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  target_audience TEXT NOT NULL,
  content_objectives TEXT NOT NULL,
  content_pillars TEXT NOT NULL,
  user_summary TEXT NOT NULL,
  anthropic_skill_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_posts_test table for storing recent user posts in markdown format
CREATE TABLE IF NOT EXISTS public.user_posts_test (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create whatsapp_input_test table for storing WhatsApp input in markdown format
CREATE TABLE IF NOT EXISTS public.whatsapp_input_test (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  input_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_content_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_posts_test ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_input_test ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_content_skills
CREATE POLICY "Users can view their own content skills" 
ON public.user_content_skills 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content skills" 
ON public.user_content_skills 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content skills" 
ON public.user_content_skills 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own content skills" 
ON public.user_content_skills 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role can access all content skills (for Edge Functions)
CREATE POLICY "Service role can access all content skills" 
ON public.user_content_skills 
FOR ALL 
USING (auth.role() = 'service_role');

-- RLS Policies for user_posts_test
CREATE POLICY "Users can view their own posts" 
ON public.user_posts_test 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own posts" 
ON public.user_posts_test 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.user_posts_test 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.user_posts_test 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role can access all posts (for Edge Functions)
CREATE POLICY "Service role can access all posts" 
ON public.user_posts_test 
FOR ALL 
USING (auth.role() = 'service_role');

-- RLS Policies for whatsapp_input_test
CREATE POLICY "Users can view their own WhatsApp input" 
ON public.whatsapp_input_test 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own WhatsApp input" 
ON public.whatsapp_input_test 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own WhatsApp input" 
ON public.whatsapp_input_test 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own WhatsApp input" 
ON public.whatsapp_input_test 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role can access all WhatsApp input (for Edge Functions)
CREATE POLICY "Service role can access all WhatsApp input" 
ON public.whatsapp_input_test 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_content_skills_updated_at
BEFORE UPDATE ON public.user_content_skills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_posts_test_updated_at
BEFORE UPDATE ON public.user_posts_test
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_whatsapp_input_test_updated_at
BEFORE UPDATE ON public.whatsapp_input_test
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_content_skills_user_id ON public.user_content_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_posts_test_user_id ON public.user_posts_test(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_input_test_user_id ON public.whatsapp_input_test(user_id);

-- Add comments for documentation
COMMENT ON TABLE public.user_content_skills IS 'Stores personalized LinkedIn content creation skills configuration for each user';
COMMENT ON COLUMN public.user_content_skills.target_audience IS 'Target audience description for content creation';
COMMENT ON COLUMN public.user_content_skills.content_objectives IS 'Content objectives and goals';
COMMENT ON COLUMN public.user_content_skills.content_pillars IS 'Content pillars and themes';
COMMENT ON COLUMN public.user_content_skills.user_summary IS 'User summary and background information';
COMMENT ON COLUMN public.user_content_skills.anthropic_skill_id IS 'Anthropic API skill ID for reuse (created once per user)';

COMMENT ON TABLE public.user_posts_test IS 'Stores recent user posts in markdown format for content generation context';
COMMENT ON TABLE public.whatsapp_input_test IS 'Stores WhatsApp input in markdown format for content generation context';

