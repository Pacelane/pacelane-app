-- Migration: Fix Read.ai user_id constraint
-- Date: 2025-08-11
-- Description: Allow null user_id for Read.ai meetings when user mapping is not available

-- Alter read_ai_meetings table to allow null user_id
ALTER TABLE read_ai_meetings 
ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies to handle null user_id
DROP POLICY IF EXISTS "Users can view their own Read.ai meetings" ON read_ai_meetings;
DROP POLICY IF EXISTS "Users can insert their own Read.ai meetings" ON read_ai_meetings;
DROP POLICY IF EXISTS "Users can update their own Read.ai meetings" ON read_ai_meetings;
DROP POLICY IF EXISTS "Users can delete their own Read.ai meetings" ON read_ai_meetings;

CREATE POLICY "Users can view their own Read.ai meetings" ON read_ai_meetings
    FOR SELECT USING (
        auth.uid() = user_id OR 
        user_id IS NULL OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can insert their own Read.ai meetings" ON read_ai_meetings
    FOR INSERT WITH CHECK (
        auth.uid() = user_id OR 
        user_id IS NULL OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can update their own Read.ai meetings" ON read_ai_meetings
    FOR UPDATE USING (
        auth.uid() = user_id OR 
        user_id IS NULL OR 
        auth.role() = 'service_role'
    );

CREATE POLICY "Users can delete their own Read.ai meetings" ON read_ai_meetings
    FOR DELETE USING (
        auth.uid() = user_id OR 
        user_id IS NULL OR 
        auth.role() = 'service_role'
    );

-- Update related table policies to handle null user_id in meetings
DROP POLICY IF EXISTS "Users can view participants of their meetings" ON read_ai_participants;
DROP POLICY IF EXISTS "Users can insert participants for their meetings" ON read_ai_participants;

CREATE POLICY "Users can view participants of their meetings" ON read_ai_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM read_ai_meetings 
            WHERE read_ai_meetings.id = read_ai_participants.meeting_id 
            AND (
                read_ai_meetings.user_id = auth.uid() OR 
                read_ai_meetings.user_id IS NULL OR 
                auth.role() = 'service_role'
            )
        )
    );

CREATE POLICY "Users can insert participants for their meetings" ON read_ai_participants
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM read_ai_meetings 
            WHERE read_ai_meetings.id = read_ai_participants.meeting_id 
            AND (
                read_ai_meetings.user_id = auth.uid() OR 
                read_ai_meetings.user_id IS NULL OR 
                auth.role() = 'service_role'
            )
        )
    );

-- Update action items policies
DROP POLICY IF EXISTS "Users can view action items of their meetings" ON read_ai_action_items;
DROP POLICY IF EXISTS "Users can manage action items of their meetings" ON read_ai_action_items;

CREATE POLICY "Users can view action items of their meetings" ON read_ai_action_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM read_ai_meetings 
            WHERE read_ai_meetings.id = read_ai_action_items.meeting_id 
            AND (
                read_ai_meetings.user_id = auth.uid() OR 
                read_ai_meetings.user_id IS NULL OR 
                auth.role() = 'service_role'
            )
        )
    );

CREATE POLICY "Users can manage action items of their meetings" ON read_ai_action_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM read_ai_meetings 
            WHERE read_ai_meetings.id = read_ai_action_items.meeting_id 
            AND (
                read_ai_meetings.user_id = auth.uid() OR 
                read_ai_meetings.user_id IS NULL OR 
                auth.role() = 'service_role'
            )
        )
    );

-- Update topics policies
DROP POLICY IF EXISTS "Users can view topics of their meetings" ON read_ai_topics;

CREATE POLICY "Users can view topics of their meetings" ON read_ai_topics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM read_ai_meetings 
            WHERE read_ai_meetings.id = read_ai_topics.meeting_id 
            AND (
                read_ai_meetings.user_id = auth.uid() OR 
                read_ai_meetings.user_id IS NULL OR 
                auth.role() = 'service_role'
            )
        )
    );

-- Add policy for topics INSERT/UPDATE/DELETE
CREATE POLICY "Users can manage topics of their meetings" ON read_ai_topics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM read_ai_meetings 
            WHERE read_ai_meetings.id = read_ai_topics.meeting_id 
            AND (
                read_ai_meetings.user_id = auth.uid() OR 
                read_ai_meetings.user_id IS NULL OR 
                auth.role() = 'service_role'
            )
        )
    );
