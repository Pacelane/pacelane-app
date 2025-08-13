-- Migration: Add pacing scheduling capabilities
-- Date: 2025-01-15
-- Description: Add scheduling fields to agent_job and create pacing_schedules table

-- Add scheduling fields to agent_job table (only if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_job') THEN
        ALTER TABLE public.agent_job 
        ADD COLUMN IF NOT EXISTS schedule_type TEXT CHECK (schedule_type IN ('manual', 'pacing', 'recurring')),
        ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS schedule_config JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create pacing_schedules table for user scheduling preferences
CREATE TABLE public.pacing_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'bi-weekly')),
  selected_days TEXT[] NOT NULL, -- ['monday', 'wednesday', 'friday']
  preferred_time TEXT NOT NULL, -- 'Morning (8-10 AM)'
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indices for performance
CREATE INDEX idx_pacing_schedules_user_id ON public.pacing_schedules(user_id);
CREATE INDEX idx_pacing_schedules_active ON public.pacing_schedules(is_active) WHERE is_active = true;

-- Add agent_job indices (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agent_job') THEN
        CREATE INDEX IF NOT EXISTS idx_agent_job_schedule_type ON public.agent_job(schedule_type);
        CREATE INDEX IF NOT EXISTS idx_agent_job_next_run_at ON public.agent_job(next_run_at);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.pacing_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pacing_schedules
CREATE POLICY "Users can view their own pacing schedules" 
ON public.pacing_schedules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pacing schedules" 
ON public.pacing_schedules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pacing schedules" 
ON public.pacing_schedules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pacing schedules" 
ON public.pacing_schedules 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_pacing_schedules_updated_at
BEFORE UPDATE ON public.pacing_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
