-- Create rag_corpora table to track user RAG corpora
CREATE TABLE IF NOT EXISTS public.rag_corpora (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  corpus_id TEXT NOT NULL UNIQUE, -- Vertex AI corpus ID
  display_name TEXT NOT NULL,
  project_id TEXT NOT NULL, -- Google Cloud project ID
  location TEXT NOT NULL, -- Vertex AI location (e.g., us-central1)
  status TEXT NOT NULL DEFAULT 'active', -- active, processing, error
  file_count INTEGER NOT NULL DEFAULT 0, -- Number of files in corpus
  total_tokens INTEGER NOT NULL DEFAULT 0, -- Total tokens processed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one corpus per user
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rag_corpora_user_id ON public.rag_corpora(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_corpora_corpus_id ON public.rag_corpora(corpus_id);

-- Add RLS policies
ALTER TABLE public.rag_corpora ENABLE ROW LEVEL SECURITY;

-- Users can only see their own corpora
CREATE POLICY "Users can view own corpora" ON public.rag_corpora
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own corpora
CREATE POLICY "Users can insert own corpora" ON public.rag_corpora
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own corpora
CREATE POLICY "Users can update own corpora" ON public.rag_corpora
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own corpora
CREATE POLICY "Users can delete own corpora" ON public.rag_corpora
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role full access" ON public.rag_corpora
  FOR ALL USING (auth.role() = 'service_role');

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rag_corpora_updated_at 
  BEFORE UPDATE ON public.rag_corpora 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.rag_corpora IS 'Stores information about user RAG corpora in Vertex AI';
COMMENT ON COLUMN public.rag_corpora.corpus_id IS 'Vertex AI corpus ID (e.g., projects/123/locations/us-central1/ragCorpora/456)';
COMMENT ON COLUMN public.rag_corpora.status IS 'Current status of the corpus: active, processing, error';
COMMENT ON COLUMN public.rag_corpora.file_count IS 'Number of files currently in the corpus';
COMMENT ON COLUMN public.rag_corpora.total_tokens IS 'Total tokens processed across all files in the corpus';
