-- Add LinkedIn Posts and Tone Analysis Tables
-- Migration: 20250116000000_add_linkedin_posts_tone_analysis.sql

-- Create linkedin_posts table to store user's existing LinkedIn posts
CREATE TABLE IF NOT EXISTS linkedin_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  linkedin_post_id TEXT NOT NULL,
  content TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  engagement_data JSONB DEFAULT '{}',
  post_url TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique posts per user
  UNIQUE(user_id, linkedin_post_id)
);

-- Create user_writing_profiles table to store tone analysis
CREATE TABLE IF NOT EXISTS user_writing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tone_analysis JSONB NOT NULL DEFAULT '{}',
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source TEXT DEFAULT 'linkedin_posts',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- One writing profile per user
  UNIQUE(user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_user_id ON linkedin_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_published_at ON linkedin_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_linkedin_posts_scraped_at ON linkedin_posts(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_writing_profiles_user_id ON user_writing_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_writing_profiles_analyzed_at ON user_writing_profiles(analyzed_at DESC);

-- Enable Row Level Security
ALTER TABLE linkedin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_writing_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for linkedin_posts
CREATE POLICY "Users can view their own LinkedIn posts" ON linkedin_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own LinkedIn posts" ON linkedin_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own LinkedIn posts" ON linkedin_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own LinkedIn posts" ON linkedin_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_writing_profiles
CREATE POLICY "Users can view their own writing profile" ON user_writing_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own writing profile" ON user_writing_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own writing profile" ON user_writing_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own writing profile" ON user_writing_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_linkedin_posts_updated_at 
  BEFORE UPDATE ON linkedin_posts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_writing_profiles_updated_at 
  BEFORE UPDATE ON user_writing_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE linkedin_posts IS 'Stores users LinkedIn posts for tone analysis and style learning';
COMMENT ON TABLE user_writing_profiles IS 'Stores AI-analyzed writing tone and style profiles for each user';

COMMENT ON COLUMN linkedin_posts.linkedin_post_id IS 'Original LinkedIn post ID or generated ID for manual posts';
COMMENT ON COLUMN linkedin_posts.content IS 'Full text content of the LinkedIn post';
COMMENT ON COLUMN linkedin_posts.engagement_data IS 'Post engagement metrics (likes, comments, shares)';
COMMENT ON COLUMN linkedin_posts.metadata IS 'Additional metadata like content length, word count, scraping method';

COMMENT ON COLUMN user_writing_profiles.tone_analysis IS 'AI-generated analysis of users writing tone and style patterns';
COMMENT ON COLUMN user_writing_profiles.source IS 'Source of the analysis data (linkedin_posts, manual_input, etc.)';
COMMENT ON COLUMN user_writing_profiles.metadata IS 'Analysis metadata like number of posts analyzed, AI model used';
