-- Create generated_posts table for storing generated LinkedIn posts
CREATE TABLE IF NOT EXISTS public.generated_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  whatsapp_input_id UUID REFERENCES public.whatsapp_input_test(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'published')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.generated_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generated_posts
CREATE POLICY "Users can view their own generated posts" 
ON public.generated_posts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generated posts" 
ON public.generated_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated posts" 
ON public.generated_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated posts" 
ON public.generated_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role can access all generated posts (for Edge Functions)
CREATE POLICY "Service role can access all generated posts" 
ON public.generated_posts 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_generated_posts_updated_at
BEFORE UPDATE ON public.generated_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_generated_posts_user_id ON public.generated_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_whatsapp_input_id ON public.generated_posts(whatsapp_input_id);
CREATE INDEX IF NOT EXISTS idx_generated_posts_status ON public.generated_posts(status);
CREATE INDEX IF NOT EXISTS idx_generated_posts_created_at ON public.generated_posts(created_at);

-- Add comments for documentation
COMMENT ON TABLE public.generated_posts IS 'Stores generated LinkedIn posts created by the spider-agent';
COMMENT ON COLUMN public.generated_posts.content IS 'The generated LinkedIn post content (cleaned/parsed)';
COMMENT ON COLUMN public.generated_posts.whatsapp_input_id IS 'Reference to the WhatsApp input that generated this post';
COMMENT ON COLUMN public.generated_posts.status IS 'Post status: draft, pending, approved, or published';

