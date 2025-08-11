-- Migration: Add Read.ai Integration
-- Date: 2025-08-11
-- Description: Add tables for Read.ai webhook data and meeting analytics

-- Create read_ai_meetings table to store meeting data from Read.ai webhooks
CREATE TABLE IF NOT EXISTS read_ai_meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    meeting_id TEXT NOT NULL UNIQUE, -- Read.ai meeting ID
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    platform TEXT, -- Zoom, Teams, Meet, etc.
    recording_url TEXT,
    transcript_url TEXT,
    summary_url TEXT,
    meeting_url TEXT,
    host_email TEXT,
    host_name TEXT,
    participants JSONB DEFAULT '[]', -- Array of participant objects
    topics JSONB DEFAULT '[]', -- Array of topics discussed
    action_items JSONB DEFAULT '[]', -- Array of action items
    insights JSONB DEFAULT '{}', -- Meeting insights object
    analytics JSONB DEFAULT '{}', -- Speaking time, participation, etc.
    transcript_text TEXT, -- Full transcript text
    summary_text TEXT, -- AI-generated summary
    key_moments JSONB DEFAULT '[]', -- Important moments/highlights
    sentiment_analysis JSONB DEFAULT '{}', -- Sentiment data
    webhook_data JSONB NOT NULL, -- Raw webhook payload for debugging
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create read_ai_participants table for detailed participant data
CREATE TABLE IF NOT EXISTS read_ai_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES read_ai_meetings(id) ON DELETE CASCADE,
    participant_id TEXT NOT NULL, -- Read.ai participant ID
    name TEXT NOT NULL,
    email TEXT,
    is_host BOOLEAN DEFAULT false,
    is_guest BOOLEAN DEFAULT false,
    join_time TIMESTAMPTZ,
    leave_time TIMESTAMPTZ,
    speaking_time_seconds INTEGER DEFAULT 0,
    participation_score DECIMAL(5,2), -- 0-100 participation score
    sentiment_score DECIMAL(5,2), -- -1 to 1 sentiment score
    talk_ratio DECIMAL(5,2), -- Percentage of total speaking time
    interruptions_count INTEGER DEFAULT 0,
    questions_asked INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(meeting_id, participant_id)
);

-- Create read_ai_action_items table for extracted action items
CREATE TABLE IF NOT EXISTS read_ai_action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES read_ai_meetings(id) ON DELETE CASCADE,
    action_item_id TEXT, -- Read.ai action item ID if available
    title TEXT NOT NULL,
    description TEXT,
    assignee_name TEXT,
    assignee_email TEXT,
    due_date DATE,
    status TEXT DEFAULT 'open', -- open, in_progress, completed
    priority TEXT DEFAULT 'medium', -- low, medium, high
    confidence_score DECIMAL(5,2), -- AI confidence in extraction
    timestamp_in_meeting INTEGER, -- Seconds from meeting start
    context_text TEXT, -- Surrounding transcript context
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create read_ai_topics table for meeting topics
CREATE TABLE IF NOT EXISTS read_ai_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES read_ai_meetings(id) ON DELETE CASCADE,
    topic_id TEXT, -- Read.ai topic ID if available
    title TEXT NOT NULL,
    description TEXT,
    start_time_seconds INTEGER, -- When topic started in meeting
    end_time_seconds INTEGER, -- When topic ended in meeting
    duration_seconds INTEGER,
    importance_score DECIMAL(5,2), -- 0-100 importance score
    keywords JSONB DEFAULT '[]', -- Array of relevant keywords
    participant_involvement JSONB DEFAULT '{}', -- Who spoke about this topic
    sentiment DECIMAL(5,2), -- Topic sentiment score
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create read_ai_webhooks table for webhook processing logs
CREATE TABLE IF NOT EXISTS read_ai_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id TEXT, -- Read.ai webhook ID if provided
    event_type TEXT NOT NULL, -- meeting.completed, meeting.started, etc.
    payload JSONB NOT NULL, -- Full webhook payload
    signature TEXT, -- Webhook signature for verification
    processing_status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
    error_message TEXT,
    meeting_id UUID REFERENCES read_ai_meetings(id),
    user_id UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_read_ai_meetings_user_id ON read_ai_meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_read_ai_meetings_start_time ON read_ai_meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_read_ai_meetings_meeting_id ON read_ai_meetings(meeting_id);
CREATE INDEX IF NOT EXISTS idx_read_ai_participants_meeting_id ON read_ai_participants(meeting_id);
CREATE INDEX IF NOT EXISTS idx_read_ai_action_items_meeting_id ON read_ai_action_items(meeting_id);
CREATE INDEX IF NOT EXISTS idx_read_ai_action_items_status ON read_ai_action_items(status);
CREATE INDEX IF NOT EXISTS idx_read_ai_topics_meeting_id ON read_ai_topics(meeting_id);
CREATE INDEX IF NOT EXISTS idx_read_ai_webhooks_event_type ON read_ai_webhooks(event_type);
CREATE INDEX IF NOT EXISTS idx_read_ai_webhooks_created_at ON read_ai_webhooks(created_at);

-- Add RLS policies for read_ai_meetings
ALTER TABLE read_ai_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own Read.ai meetings" ON read_ai_meetings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Read.ai meetings" ON read_ai_meetings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Read.ai meetings" ON read_ai_meetings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Read.ai meetings" ON read_ai_meetings
    FOR DELETE USING (auth.uid() = user_id);

-- Add RLS policies for read_ai_participants
ALTER TABLE read_ai_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants of their meetings" ON read_ai_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM read_ai_meetings 
            WHERE read_ai_meetings.id = read_ai_participants.meeting_id 
            AND read_ai_meetings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert participants for their meetings" ON read_ai_participants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM read_ai_meetings 
            WHERE read_ai_meetings.id = read_ai_participants.meeting_id 
            AND read_ai_meetings.user_id = auth.uid()
        )
    );

-- Add RLS policies for read_ai_action_items
ALTER TABLE read_ai_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view action items of their meetings" ON read_ai_action_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM read_ai_meetings 
            WHERE read_ai_meetings.id = read_ai_action_items.meeting_id 
            AND read_ai_meetings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage action items of their meetings" ON read_ai_action_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM read_ai_meetings 
            WHERE read_ai_meetings.id = read_ai_action_items.meeting_id 
            AND read_ai_meetings.user_id = auth.uid()
        )
    );

-- Add RLS policies for read_ai_topics
ALTER TABLE read_ai_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view topics of their meetings" ON read_ai_topics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM read_ai_meetings 
            WHERE read_ai_meetings.id = read_ai_topics.meeting_id 
            AND read_ai_meetings.user_id = auth.uid()
        )
    );

-- Add RLS policies for read_ai_webhooks (admin access for debugging)
ALTER TABLE read_ai_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage webhooks" ON read_ai_webhooks
    FOR ALL USING (auth.role() = 'service_role');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_read_ai_meetings_updated_at 
    BEFORE UPDATE ON read_ai_meetings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_read_ai_action_items_updated_at 
    BEFORE UPDATE ON read_ai_action_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
