-- PCL-13a: Agent infrastructure tables for WhatsApp intent routing
-- Create content_order table for tracking content creation requests
CREATE TABLE public.content_order (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('whatsapp', 'app', 'pacing', 'api')),
  params_json JSONB NOT NULL DEFAULT '{}',
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('whatsapp', 'pacing', 'manual', 'api')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_job table for job queue and processing
CREATE TABLE public.agent_job (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('process_order', 'pacing_check', 'draft_review')),
  payload_json JSONB NOT NULL DEFAULT '{}',
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  attempts INTEGER NOT NULL DEFAULT 0,
  run_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create agent_run table for detailed execution logging
CREATE TABLE public.agent_run (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID REFERENCES public.content_order(id) ON DELETE CASCADE,
  job_id UUID REFERENCES public.agent_job(id) ON DELETE CASCADE,
  steps_json JSONB NOT NULL DEFAULT '[]',
  timings_json JSONB NOT NULL DEFAULT '{}',
  cost_cents INTEGER DEFAULT 0,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indices for performance
CREATE INDEX idx_content_order_user_id_created_at ON public.content_order(user_id, created_at DESC);
CREATE INDEX idx_agent_job_status_run_at ON public.agent_job(status, run_at);
CREATE INDEX idx_agent_job_user_id_created_at ON public.agent_job(user_id, created_at DESC);
CREATE INDEX idx_agent_run_order_id ON public.agent_run(order_id);
CREATE INDEX idx_agent_run_job_id ON public.agent_run(job_id);

-- Enable Row Level Security
ALTER TABLE public.content_order ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_job ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_run ENABLE ROW LEVEL SECURITY;

-- RLS Policies for content_order
CREATE POLICY "Users can view their own content orders" 
ON public.content_order 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own content orders" 
ON public.content_order 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own content orders" 
ON public.content_order 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for agent_job
CREATE POLICY "Users can view their own agent jobs" 
ON public.agent_job 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agent jobs" 
ON public.agent_job 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent jobs" 
ON public.agent_job 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for agent_run
CREATE POLICY "Users can view their own agent runs" 
ON public.agent_run 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agent runs" 
ON public.agent_run 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent runs" 
ON public.agent_run 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add order_id and citations_json to saved_drafts for linking
ALTER TABLE public.saved_drafts 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.content_order(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS citations_json JSONB DEFAULT '[]';

-- Index for saved_drafts order_id
CREATE INDEX IF NOT EXISTS idx_saved_drafts_order_id ON public.saved_drafts(order_id);

-- Add a trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Update content_order updated_at if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_order' AND column_name = 'updated_at') THEN
        ALTER TABLE public.content_order ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
        CREATE TRIGGER update_content_order_updated_at BEFORE UPDATE ON public.content_order FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;
