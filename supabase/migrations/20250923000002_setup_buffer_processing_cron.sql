-- Setup cron job for buffer processing
-- This migration sets up the pg_cron extension and schedules buffer processing

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the buffer processor
CREATE OR REPLACE FUNCTION process_message_buffers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    supabase_url text;
    service_key text;
    response_status integer;
BEGIN
    -- Get environment variables (these need to be set in Supabase)
    supabase_url := current_setting('app.settings.supabase_url', true);
    service_key := current_setting('app.settings.service_role_key', true);
    
    -- Only proceed if we have the required configuration
    IF supabase_url IS NOT NULL AND service_key IS NOT NULL THEN
        -- Call the buffer processor function via HTTP
        SELECT status INTO response_status
        FROM net.http_post(
            url := supabase_url || '/functions/v1/buffer-processor',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || service_key,
                'Content-Type', 'application/json'
            ),
            body := '{}'::jsonb
        );
        
        -- Log the result
        INSERT INTO cron_job_logs (job_name, status, executed_at)
        VALUES ('process_message_buffers', COALESCE(response_status, 0), NOW())
        ON CONFLICT DO NOTHING;
        
        -- Raise notice for debugging
        RAISE NOTICE 'Buffer processor called with status: %', COALESCE(response_status, 0);
    ELSE
        RAISE WARNING 'Missing Supabase configuration for buffer processing';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Log errors
        INSERT INTO cron_job_logs (job_name, status, error_message, executed_at)
        VALUES ('process_message_buffers', -1, SQLERRM, NOW())
        ON CONFLICT DO NOTHING;
        
        RAISE WARNING 'Error in process_message_buffers: %', SQLERRM;
END;
$$;

-- Create a table to log cron job executions
CREATE TABLE IF NOT EXISTS cron_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    status INTEGER,
    error_message TEXT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_executed_at ON cron_job_logs(executed_at);
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_job_name ON cron_job_logs(job_name);

-- Enable RLS
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;

-- Service role can manage cron job logs
CREATE POLICY "Service role can manage cron_job_logs" ON cron_job_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Schedule the buffer processing job to run every 10 seconds
-- Note: This will be created when the migration runs
SELECT cron.schedule(
    job_name := 'process-message-buffers',
    schedule := '*/10 * * * * *', -- Every 10 seconds
    command := 'SELECT process_message_buffers();'
);

-- Create a cleanup job for old cron logs (runs daily at 2 AM)
SELECT cron.schedule(
    job_name := 'cleanup-cron-logs',
    schedule := '0 2 * * *', -- Daily at 2 AM
    command := 'DELETE FROM cron_job_logs WHERE executed_at < NOW() - INTERVAL ''7 days'';'
);

-- Create a cleanup job for old completed buffers (runs daily at 3 AM)
SELECT cron.schedule(
    job_name := 'cleanup-old-buffers',
    schedule := '0 3 * * *', -- Daily at 3 AM
    command := 'DELETE FROM message_buffer WHERE status = ''completed'' AND processed_at < NOW() - INTERVAL ''30 days'';'
);

-- Function to manually trigger buffer processing (for testing)
CREATE OR REPLACE FUNCTION trigger_buffer_processing()
RETURNS TABLE(result jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM process_message_buffers();
    RETURN QUERY SELECT jsonb_build_object(
        'success', true,
        'message', 'Buffer processing triggered manually',
        'timestamp', NOW()
    );
END;
$$;

-- Function to get cron job status
CREATE OR REPLACE FUNCTION get_cron_job_status()
RETURNS TABLE(
    job_name text,
    schedule text,
    active boolean,
    last_execution timestamp with time zone,
    last_status integer,
    error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cj.jobname::text,
        cj.schedule::text,
        cj.active,
        cjl.executed_at,
        cjl.status,
        cjl.error_message
    FROM cron.job cj
    LEFT JOIN LATERAL (
        SELECT executed_at, status, error_message
        FROM cron_job_logs 
        WHERE job_name = cj.jobname 
        ORDER BY executed_at DESC 
        LIMIT 1
    ) cjl ON true
    WHERE cj.jobname LIKE 'process-message-buffers%' 
       OR cj.jobname LIKE 'cleanup-%';
END;
$$;

-- Function to disable/enable buffer processing
CREATE OR REPLACE FUNCTION toggle_buffer_processing(enable boolean)
RETURNS TABLE(result jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF enable THEN
        -- Enable the cron job
        UPDATE cron.job 
        SET active = true 
        WHERE jobname = 'process-message-buffers';
        
        RETURN QUERY SELECT jsonb_build_object(
            'success', true,
            'message', 'Buffer processing enabled',
            'timestamp', NOW()
        );
    ELSE
        -- Disable the cron job
        UPDATE cron.job 
        SET active = false 
        WHERE jobname = 'process-message-buffers';
        
        RETURN QUERY SELECT jsonb_build_object(
            'success', true,
            'message', 'Buffer processing disabled',
            'timestamp', NOW()
        );
    END IF;
END;
$$;

-- Add comments for documentation
COMMENT ON FUNCTION process_message_buffers() IS 'Calls the buffer processor Supabase function via HTTP';
COMMENT ON FUNCTION trigger_buffer_processing() IS 'Manually triggers buffer processing for testing';
COMMENT ON FUNCTION get_cron_job_status() IS 'Returns status of buffer processing cron jobs';
COMMENT ON FUNCTION toggle_buffer_processing(boolean) IS 'Enable or disable automatic buffer processing';
COMMENT ON TABLE cron_job_logs IS 'Logs execution of cron jobs for monitoring and debugging';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION process_message_buffers() TO postgres;
GRANT EXECUTE ON FUNCTION trigger_buffer_processing() TO service_role;
GRANT EXECUTE ON FUNCTION get_cron_job_status() TO service_role;
GRANT EXECUTE ON FUNCTION toggle_buffer_processing(boolean) TO service_role;
