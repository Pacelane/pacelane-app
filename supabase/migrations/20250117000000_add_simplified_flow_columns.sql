-- Add columns for simplified flow tracking
-- This migration adds support for storing user messages and flow type information

-- Add user_message column to agent_job table
ALTER TABLE public.agent_job 
ADD COLUMN IF NOT EXISTS user_message TEXT;

-- Add simplified_flow flag to agent_job table
ALTER TABLE public.agent_job 
ADD COLUMN IF NOT EXISTS simplified_flow BOOLEAN DEFAULT true;

-- Add flow_type to agent_run table
ALTER TABLE public.agent_run 
ADD COLUMN IF NOT EXISTS flow_type TEXT DEFAULT 'simplified';

-- Add relevant_files to agent_run table for storing file IDs
ALTER TABLE public.agent_run 
ADD COLUMN IF NOT EXISTS relevant_files JSONB DEFAULT '[]';

-- Add comment explaining the new columns
COMMENT ON COLUMN public.agent_job.user_message IS 'Original user message (e.g., WhatsApp message) for simplified flow';
COMMENT ON COLUMN public.agent_job.simplified_flow IS 'Flag indicating whether to use simplified flow (true) or complex multi-agent flow (false)';
COMMENT ON COLUMN public.agent_run.flow_type IS 'Type of flow used: simplified (retrieval->writer) or complex (order-builder->retrieval->writer)';
COMMENT ON COLUMN public.agent_run.relevant_files IS 'Array of relevant file IDs found by retrieval agent for simplified flow';

-- Create index for simplified_flow flag for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_job_simplified_flow ON public.agent_job(simplified_flow);

-- Create index for flow_type for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_run_flow_type ON public.agent_run(flow_type);
