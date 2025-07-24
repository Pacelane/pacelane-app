-- Create inspirations table to store LinkedIn profiles that inspire users
CREATE TABLE public.inspirations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  linkedin_url TEXT NOT NULL,
  linkedin_data JSONB,
  name TEXT,
  company TEXT,
  headline TEXT,
  about TEXT,
  location TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.inspirations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own inspirations" 
ON public.inspirations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own inspirations" 
ON public.inspirations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own inspirations" 
ON public.inspirations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own inspirations" 
ON public.inspirations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_inspirations_updated_at
BEFORE UPDATE ON public.inspirations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();