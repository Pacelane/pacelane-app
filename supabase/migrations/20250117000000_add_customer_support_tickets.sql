-- Migration: Add customer support tickets table for PCL-37
-- Description: Creates table to store customer support tickets from various sources

-- Create customer_support_tickets table
CREATE TABLE IF NOT EXISTS public.customer_support_tickets (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User identification (optional - tickets can be anonymous)
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    
    -- Ticket classification
    event_type TEXT NOT NULL CHECK (event_type IN (
        'user_error',
        'system_error', 
        'integration_failure',
        'content_generation_failure',
        'authentication_issue',
        'billing_issue',
        'feature_request',
        'bug_report',
        'general_support'
    )),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Ticket content
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Status tracking
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    assigned_to TEXT, -- Support team member assigned
    
    -- Structured data
    metadata JSONB DEFAULT '{}',
    error_details JSONB DEFAULT '{}',
    user_context JSONB DEFAULT '{}',
    
    -- Resolution tracking
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customer_support_tickets_user_id ON public.customer_support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_support_tickets_event_type ON public.customer_support_tickets(event_type);
CREATE INDEX IF NOT EXISTS idx_customer_support_tickets_severity ON public.customer_support_tickets(severity);
CREATE INDEX IF NOT EXISTS idx_customer_support_tickets_status ON public.customer_support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_customer_support_tickets_created_at ON public.customer_support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_support_tickets_user_email ON public.customer_support_tickets(user_email);

-- Create compound index for common queries
CREATE INDEX IF NOT EXISTS idx_customer_support_tickets_status_severity ON public.customer_support_tickets(status, severity);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_support_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_support_tickets_updated_at
    BEFORE UPDATE ON public.customer_support_tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_support_tickets_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE public.customer_support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy: Support team members can view all tickets
CREATE POLICY "Support team can view all tickets" ON public.customer_support_tickets
    FOR SELECT
    USING (
        -- Allow if user is authenticated and has support role
        auth.role() = 'authenticated' AND (
            -- Check if user has admin/support permissions
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND (
                    role = 'admin' OR 
                    role = 'support' OR
                    metadata->>'permissions' ? 'support_access'
                )
            )
        )
    );

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view their own tickets" ON public.customer_support_tickets
    FOR SELECT
    USING (
        auth.uid() = user_id OR 
        auth.jwt()->>'email' = user_email
    );

-- Policy: Support team can update all tickets
CREATE POLICY "Support team can update all tickets" ON public.customer_support_tickets
    FOR UPDATE
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND (
                    role = 'admin' OR 
                    role = 'support' OR
                    metadata->>'permissions' ? 'support_access'
                )
            )
        )
    );

-- Policy: System can insert tickets (for webhook processing)
CREATE POLICY "System can insert tickets" ON public.customer_support_tickets
    FOR INSERT
    WITH CHECK (true); -- Allow all inserts (will be restricted by service role key)

-- Policy: Support team can delete tickets (for cleanup)
CREATE POLICY "Support team can delete tickets" ON public.customer_support_tickets
    FOR DELETE
    USING (
        auth.role() = 'authenticated' AND (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() 
                AND (
                    role = 'admin' OR
                    metadata->>'permissions' ? 'support_access'
                )
            )
        )
    );

-- Create view for support dashboard with aggregated data
CREATE OR REPLACE VIEW public.support_tickets_summary AS
SELECT 
    event_type,
    severity,
    status,
    COUNT(*) as ticket_count,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as last_24h,
    COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as last_7_days,
    AVG(
        CASE 
            WHEN resolved_at IS NOT NULL 
            THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 
            ELSE NULL 
        END
    ) as avg_resolution_hours
FROM public.customer_support_tickets
GROUP BY event_type, severity, status
ORDER BY 
    CASE severity 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
    END,
    ticket_count DESC;

-- Grant permissions for the view
GRANT SELECT ON public.support_tickets_summary TO authenticated;

-- Add helpful comments
COMMENT ON TABLE public.customer_support_tickets IS 'Stores customer support tickets from various sources including Slack webhooks, user reports, and system errors';
COMMENT ON COLUMN public.customer_support_tickets.event_type IS 'Type of support event: user_error, system_error, integration_failure, etc.';
COMMENT ON COLUMN public.customer_support_tickets.severity IS 'Priority level: low, medium, high, critical';
COMMENT ON COLUMN public.customer_support_tickets.metadata IS 'Additional structured data about the ticket';
COMMENT ON COLUMN public.customer_support_tickets.error_details IS 'Technical error information including stack traces, request IDs, etc.';
COMMENT ON COLUMN public.customer_support_tickets.user_context IS 'User context information like browser, page URL, session data, etc.';
