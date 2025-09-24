-- WhatsApp Chatwoot Integration Buffer System
-- Migration: Add message buffer system for 30-second message aggregation

-- Create message_buffer table for managing buffer sessions
CREATE TABLE IF NOT EXISTS message_buffer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id INTEGER NOT NULL, -- Chatwoot conversation ID
  user_id UUID NOT NULL,
  buffer_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  buffer_end_time TIMESTAMP WITH TIME ZONE,
  last_message_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'processing', 'completed'
  message_count INTEGER DEFAULT 0,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create buffered_messages table for storing individual messages in buffer
CREATE TABLE IF NOT EXISTS buffered_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buffer_id UUID NOT NULL REFERENCES message_buffer(id) ON DELETE CASCADE,
  chatwoot_message_id INTEGER NOT NULL,
  content TEXT,
  message_type TEXT NOT NULL, -- 'text', 'audio', 'image', 'file'
  content_type TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  sender_info JSONB NOT NULL,
  conversation_info JSONB NOT NULL,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create buffer_processing_jobs table for scheduled processing
CREATE TABLE IF NOT EXISTS buffer_processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buffer_id UUID NOT NULL REFERENCES message_buffer(id),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'running', 'completed', 'failed'
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Add buffer-related fields to existing conversations table
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS user_id UUID,
ADD COLUMN IF NOT EXISTS chatwoot_conversation_id INTEGER,
ADD COLUMN IF NOT EXISTS active_buffer_id UUID REFERENCES message_buffer(id),
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS conversation_state TEXT DEFAULT 'idle'; -- 'idle', 'buffering', 'processing'

-- Add foreign key constraint for user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'conversations_user_id_fkey'
    ) THEN
        ALTER TABLE conversations 
        ADD CONSTRAINT conversations_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id);
    END IF;
END $$;

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_message_buffer_conversation ON message_buffer(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_buffer_status ON message_buffer(status);
CREATE INDEX IF NOT EXISTS idx_message_buffer_user ON message_buffer(user_id);
CREATE INDEX IF NOT EXISTS idx_message_buffer_last_message ON message_buffer(last_message_time);
CREATE INDEX IF NOT EXISTS idx_buffered_messages_buffer ON buffered_messages(buffer_id);
CREATE INDEX IF NOT EXISTS idx_buffered_messages_chatwoot ON buffered_messages(chatwoot_message_id);
CREATE INDEX IF NOT EXISTS idx_buffer_jobs_scheduled ON buffer_processing_jobs(scheduled_for, status);
CREATE INDEX IF NOT EXISTS idx_buffer_jobs_status ON buffer_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_conversations_chatwoot ON conversations(chatwoot_conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_active_buffer ON conversations(active_buffer_id);

-- Create feature_flags table for configuration management
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_name TEXT UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial feature flags
INSERT INTO feature_flags (flag_name, is_enabled, description) VALUES
('message_buffering', true, 'Enable 30-second message buffering'),
('typing_indicators', true, 'Show typing indicators during processing'),
('enhanced_ai_processing', true, 'Use aggregated context for AI responses'),
('response_quality_enhancement', false, 'Apply post-processing to responses')
ON CONFLICT (flag_name) DO NOTHING;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_message_buffer_updated_at 
    BEFORE UPDATE ON message_buffer 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at 
    BEFORE UPDATE ON feature_flags 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE message_buffer ENABLE ROW LEVEL SECURITY;
ALTER TABLE buffered_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE buffer_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role can manage message_buffer" ON message_buffer
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage buffered_messages" ON buffered_messages
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage buffer_processing_jobs" ON buffer_processing_jobs
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage feature_flags" ON feature_flags
    FOR ALL USING (auth.role() = 'service_role');

-- Users can only see their own data
CREATE POLICY "Users can see their own message buffers" ON message_buffer
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can see their own buffered messages" ON buffered_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM message_buffer mb 
            WHERE mb.id = buffer_id AND mb.user_id = auth.uid()
        )
    );

-- Feature flags are readable by all authenticated users
CREATE POLICY "Authenticated users can read feature flags" ON feature_flags
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create helper functions
CREATE OR REPLACE FUNCTION get_active_buffer_for_conversation(conv_id INTEGER)
RETURNS UUID AS $$
DECLARE
    buffer_id UUID;
BEGIN
    SELECT mb.id INTO buffer_id
    FROM message_buffer mb
    WHERE mb.conversation_id = conv_id 
    AND mb.status = 'active'
    AND mb.last_message_time > NOW() - INTERVAL '5 minutes' -- Safety timeout
    ORDER BY mb.last_message_time DESC
    LIMIT 1;
    
    RETURN buffer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_feature_enabled(flag_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    enabled BOOLEAN;
BEGIN
    SELECT is_enabled INTO enabled
    FROM feature_flags
    WHERE feature_flags.flag_name = is_feature_enabled.flag_name;
    
    RETURN COALESCE(enabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE message_buffer IS 'Manages 30-second message buffers for aggregating WhatsApp messages';
COMMENT ON TABLE buffered_messages IS 'Stores individual messages within a buffer session';
COMMENT ON TABLE buffer_processing_jobs IS 'Tracks scheduled jobs for processing message buffers';
COMMENT ON COLUMN message_buffer.status IS 'Buffer status: active (collecting), processing (being processed), completed (done)';
COMMENT ON COLUMN buffered_messages.message_type IS 'Type of message: text, audio, image, file';
COMMENT ON COLUMN buffer_processing_jobs.status IS 'Job status: scheduled, running, completed, failed';
