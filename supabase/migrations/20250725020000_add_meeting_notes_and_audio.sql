-- Create meeting_notes table to store processed WhatsApp/meeting content
CREATE TABLE public.meeting_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  chatwoot_conversation_id TEXT,
  content TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('whatsapp', 'manual', 'email')),
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audio_files table to store audio recordings and transcripts
CREATE TABLE public.audio_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  meeting_note_id UUID REFERENCES public.meeting_notes(id) ON DELETE CASCADE,
  chatwoot_attachment_url TEXT,
  file_path TEXT,
  transcription TEXT,
  duration_seconds INTEGER,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create content_context table to link meeting notes to content suggestions
CREATE TABLE public.content_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_suggestion_id UUID REFERENCES public.content_suggestions(id) ON DELETE CASCADE,
  meeting_note_id UUID REFERENCES public.meeting_notes(id) ON DELETE CASCADE,
  weight DECIMAL(3,2) DEFAULT 1.0, -- How much this context influenced the suggestion
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to content_suggestions for enhanced content
ALTER TABLE public.content_suggestions 
ADD COLUMN content TEXT, -- Full post content
ADD COLUMN content_type TEXT DEFAULT 'linkedin_post' CHECK (content_type IN ('linkedin_post', 'blog_article', 'twitter_thread')),
ADD COLUMN generation_prompt TEXT, -- The prompt used to generate this content
ADD COLUMN word_count INTEGER;

-- Enable Row Level Security
ALTER TABLE public.meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_context ENABLE ROW LEVEL SECURITY;

-- Create policies for meeting_notes
CREATE POLICY "Users can view their own meeting notes" 
ON public.meeting_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meeting notes" 
ON public.meeting_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meeting notes" 
ON public.meeting_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meeting notes" 
ON public.meeting_notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for audio_files
CREATE POLICY "Users can view their own audio files" 
ON public.audio_files 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own audio files" 
ON public.audio_files 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own audio files" 
ON public.audio_files 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own audio files" 
ON public.audio_files 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for content_context
CREATE POLICY "Users can view content context for their suggestions" 
ON public.content_context 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.content_suggestions 
  WHERE content_suggestions.id = content_context.content_suggestion_id 
  AND content_suggestions.user_id = auth.uid()
));

CREATE POLICY "Users can create content context for their suggestions" 
ON public.content_context 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.content_suggestions 
  WHERE content_suggestions.id = content_context.content_suggestion_id 
  AND content_suggestions.user_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX idx_meeting_notes_user_id ON public.meeting_notes(user_id);
CREATE INDEX idx_meeting_notes_created_at ON public.meeting_notes(created_at DESC);
CREATE INDEX idx_meeting_notes_chatwoot_conversation ON public.meeting_notes(chatwoot_conversation_id);

CREATE INDEX idx_audio_files_user_id ON public.audio_files(user_id);
CREATE INDEX idx_audio_files_meeting_note_id ON public.audio_files(meeting_note_id);
CREATE INDEX idx_audio_files_processed_at ON public.audio_files(processed_at);

CREATE INDEX idx_content_context_suggestion_id ON public.content_context(content_suggestion_id);
CREATE INDEX idx_content_context_meeting_note_id ON public.content_context(meeting_note_id); 