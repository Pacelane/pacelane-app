-- Create content_generations table for tracking Vertex AI + RAG content generation
CREATE TABLE IF NOT EXISTS content_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brief JSONB NOT NULL,
  generated_content TEXT NOT NULL,
  context_used JSONB NOT NULL,
  style_applied JSONB NOT NULL,
  performance_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_generations_user_id ON content_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_content_generations_created_at ON content_generations(created_at);

-- Add RLS policies
ALTER TABLE content_generations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own content generations
CREATE POLICY "Users can view own content generations" ON content_generations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own content generations
CREATE POLICY "Users can insert own content generations" ON content_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own content generations
CREATE POLICY "Users can update own content generations" ON content_generations
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own content generations
CREATE POLICY "Users can delete own content generations" ON content_generations
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON content_generations TO authenticated;
