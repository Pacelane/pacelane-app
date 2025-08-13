-- Create conversations table to store chat threads (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table to store individual chat messages (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for conversations (only if user_id column exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'user_id') THEN
        CREATE POLICY "Users can view their own conversations" 
        ON public.conversations 
        FOR SELECT 
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can create their own conversations" 
        ON public.conversations 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own conversations" 
        ON public.conversations 
        FOR UPDATE 
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own conversations" 
        ON public.conversations 
        FOR DELETE 
        USING (auth.uid() = user_id);
    ELSE
        RAISE NOTICE 'conversations table does not have user_id column, skipping user-based policies';
    END IF;
END $$;

-- Create policies for messages (only if both tables exist and have required columns)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'user_id') THEN
        
        CREATE POLICY "Users can view messages from their conversations" 
        ON public.messages 
        FOR SELECT 
        USING (EXISTS (
          SELECT 1 FROM public.conversations 
          WHERE conversations.id = messages.conversation_id 
          AND conversations.user_id = auth.uid()
        ));

        CREATE POLICY "Users can create messages in their conversations" 
        ON public.messages 
        FOR INSERT 
        WITH CHECK (EXISTS (
          SELECT 1 FROM public.conversations 
          WHERE conversations.id = messages.conversation_id 
          AND conversations.user_id = auth.uid()
        ));
    ELSE
        RAISE NOTICE 'messages table or conversations.user_id column does not exist, skipping message policies';
    END IF;
END $$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
        CREATE TRIGGER update_conversations_updated_at
          BEFORE UPDATE ON public.conversations
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- Create indexes for better performance
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'conversations') THEN
        -- Only create user_id index if the column exists
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'user_id') THEN
            CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
        END IF;
        
        -- Create updated_at index (this column should exist)
        CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
        CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
    END IF;
END $$;