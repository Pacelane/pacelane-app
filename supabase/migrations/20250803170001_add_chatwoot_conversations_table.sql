-- Migration: Add Chatwoot conversations table and user notification preferences
-- This supports PCL-26 minimal WhatsApp notification policy

-- Check if conversations table already exists and handle accordingly
DO $$
BEGIN
    -- Check if conversations table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations') THEN
        -- Check if chatwoot_conversation_id column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'chatwoot_conversation_id') THEN
            -- Add the missing column
            ALTER TABLE conversations ADD COLUMN chatwoot_conversation_id INTEGER;
            
            -- Add unique constraint if possible
            BEGIN
                ALTER TABLE conversations ADD CONSTRAINT conversations_chatwoot_id_unique UNIQUE (chatwoot_conversation_id);
            EXCEPTION WHEN duplicate_object THEN
                RAISE NOTICE 'Unique constraint already exists on chatwoot_conversation_id';
            END;
            
            RAISE NOTICE 'Added chatwoot_conversation_id column to existing conversations table';
        ELSE
            RAISE NOTICE 'chatwoot_conversation_id column already exists in conversations table';
        END IF;
        
        -- Check if context_json column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'context_json') THEN
            ALTER TABLE conversations ADD COLUMN context_json JSONB DEFAULT '{}'::jsonb;
            RAISE NOTICE 'Added context_json column to existing conversations table';
        END IF;
        
        -- Check if updated_at column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'updated_at') THEN
            ALTER TABLE conversations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to existing conversations table';
        END IF;
        
    ELSE
        -- Create conversations table from scratch
        CREATE TABLE conversations (
          id SERIAL PRIMARY KEY,
          chatwoot_conversation_id INTEGER UNIQUE NOT NULL,
          context_json JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created new conversations table';
    END IF;
END $$;

-- Add index for efficient conversation lookup (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_conversations_chatwoot_id ON conversations(chatwoot_conversation_id);

-- Check if user_bucket_mapping table exists before trying to modify it
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_bucket_mapping') THEN
        -- Add notify_on_ready field to user_bucket_mapping for user preferences
        ALTER TABLE user_bucket_mapping 
        ADD COLUMN IF NOT EXISTS notify_on_ready BOOLEAN DEFAULT false;
        
        -- Add index for efficient user preference lookup
        CREATE INDEX IF NOT EXISTS idx_user_bucket_notify ON user_bucket_mapping(notify_on_ready);
        
        -- Add comment explaining the purpose
        COMMENT ON COLUMN user_bucket_mapping.notify_on_ready IS 'User preference for receiving WhatsApp notifications when content is ready';
        
        RAISE NOTICE 'Successfully added notify_on_ready field to user_bucket_mapping table';
    ELSE
        RAISE NOTICE 'user_bucket_mapping table does not exist yet, skipping notify_on_ready field addition';
    END IF;
END $$;

-- Add comment explaining the purpose
COMMENT ON TABLE conversations IS 'Stores Chatwoot conversation context for handling multi-step clarifications in WhatsApp integration';
COMMENT ON COLUMN conversations.context_json IS 'JSON object containing clarifying field, order parameters, and conversation state';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversations_updated_at') THEN
        CREATE TRIGGER update_conversations_updated_at 
            BEFORE UPDATE ON conversations 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Created update_conversations_updated_at trigger';
    ELSE
        RAISE NOTICE 'update_conversations_updated_at trigger already exists';
    END IF;
END $$;
