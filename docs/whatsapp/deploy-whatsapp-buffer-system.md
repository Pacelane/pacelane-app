# WhatsApp Buffer System Deployment Guide

## Overview
This guide walks through deploying the new WhatsApp message buffer system that aggregates messages over 30 seconds before processing them with AI.

## Prerequisites
- Supabase CLI installed and configured
- Access to your Supabase project dashboard
- Chatwoot instance with API access
- OpenAI API key

## Phase 1: Database Setup

### 1. Deploy Database Migrations

Run the migrations in your Supabase SQL Editor:

```sql
-- First migration: Core buffer system
-- Copy and paste the contents of: supabase/migrations/20250923000001_add_message_buffer_system.sql

-- Second migration: Cron job setup  
-- Copy and paste the contents of: supabase/migrations/20250923000002_setup_buffer_processing_cron.sql
```

### 2. Configure Environment Settings

In your Supabase dashboard, go to Settings > Database and add these settings:

```sql
-- Set Supabase URL for cron jobs
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://your-project-id.supabase.co';

-- Set service role key for cron jobs (replace with your actual service role key)
ALTER DATABASE postgres SET app.settings.service_role_key = 'your-service-role-key';
```

## Phase 2: Deploy Supabase Functions

### 1. Deploy Message Buffer Manager
```bash
supabase functions deploy message-buffer-manager --no-verify-jwt
```

### 2. Deploy Buffer Processor
```bash
supabase functions deploy buffer-processor --no-verify-jwt
```

### 3. Deploy New Webhook Handler
```bash
supabase functions deploy chatwoot-webhook-v2 --no-verify-jwt
```

## Phase 3: Environment Variables

Set these environment variables in your Supabase project (Settings > Edge Functions):

```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Chatwoot Configuration
CHATWOOT_BASE_URL=https://your-chatwoot-instance.com
CHATWOOT_API_TOKEN=your_chatwoot_api_token
CHATWOOT_ACCOUNT_ID=your_account_id

# Buffer Configuration (optional - defaults are set)
MESSAGE_BUFFER_DURATION_MS=30000
BUFFER_PROCESSING_INTERVAL_MS=10000
MAX_BUFFER_SIZE=50
MAX_BUFFER_AGE_MS=300000
```

## Phase 4: Webhook Configuration

### Option A: Gradual Migration (Recommended)

1. **Keep existing webhook active** for now
2. **Test new webhook** with a subset of conversations
3. **Monitor performance** and fix any issues
4. **Gradually migrate** all traffic to new webhook

### Option B: Direct Migration

1. **Update Chatwoot webhook URL** to point to the new function:
   ```
   https://your-project-id.supabase.co/functions/v1/chatwoot-webhook-v2
   ```

2. **Disable the old webhook** once you confirm the new one is working

## Phase 5: Testing & Verification

### 1. Test Database Setup
```sql
-- Check if tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('message_buffer', 'buffered_messages', 'buffer_processing_jobs', 'feature_flags');

-- Check feature flags
SELECT * FROM feature_flags;

-- Check cron jobs
SELECT * FROM cron.job WHERE jobname LIKE '%buffer%';
```

### 2. Test Functions

#### Test Buffer Manager:
```bash
curl -X POST "https://your-project-id.supabase.co/functions/v1/message-buffer-manager?action=handle" \
  -H "Authorization: Bearer your-service-role-key" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 12345,
    "content": "Test message",
    "message_type": "incoming",
    "conversation": {"id": 1, "status": "open", "channel": "Channel::Whatsapp"},
    "sender": {"id": 1, "name": "Test User", "phone_number": "+1234567890"},
    "created_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'
```

#### Test Buffer Processor:
```bash
curl -X POST "https://your-project-id.supabase.co/functions/v1/buffer-processor" \
  -H "Authorization: Bearer your-service-role-key" \
  -H "Content-Type: application/json"
```

#### Test New Webhook:
```bash
curl -X POST "https://your-project-id.supabase.co/functions/v1/chatwoot-webhook-v2" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 12345,
    "event": "message_created",
    "content": "Test message",
    "message_type": "incoming",
    "conversation": {"id": 1, "status": "open", "channel": "Channel::Whatsapp"},
    "sender": {"id": 1, "name": "Test User", "phone_number": "+1234567890"},
    "created_at": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
  }'
```

### 3. Monitor Cron Jobs

```sql
-- Check cron job execution logs
SELECT * FROM cron_job_logs ORDER BY executed_at DESC LIMIT 10;

-- Get cron job status
SELECT * FROM get_cron_job_status();

-- Manually trigger buffer processing (for testing)
SELECT * FROM trigger_buffer_processing();
```

## Phase 6: Monitoring & Maintenance

### 1. Key Metrics to Monitor

```sql
-- Active buffers
SELECT status, COUNT(*) FROM message_buffer GROUP BY status;

-- Recent buffer activity
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as buffers_created,
    AVG(message_count) as avg_messages_per_buffer
FROM message_buffer 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;

-- Processing performance
SELECT 
    DATE_TRUNC('hour', processed_at) as hour,
    COUNT(*) as buffers_processed,
    AVG(EXTRACT(EPOCH FROM (processed_at - buffer_start_time))) as avg_processing_time_seconds
FROM message_buffer 
WHERE processed_at IS NOT NULL 
AND processed_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour;

-- Failed jobs
SELECT * FROM buffer_processing_jobs 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

### 2. Feature Flag Management

```sql
-- Enable/disable features
UPDATE feature_flags SET is_enabled = true WHERE flag_name = 'message_buffering';
UPDATE feature_flags SET is_enabled = false WHERE flag_name = 'response_quality_enhancement';

-- Check current feature status
SELECT flag_name, is_enabled, description FROM feature_flags;
```

### 3. Maintenance Commands

```sql
-- Clean up old completed buffers (run monthly)
DELETE FROM message_buffer 
WHERE status = 'completed' 
AND processed_at < NOW() - INTERVAL '30 days';

-- Clean up old cron logs (run weekly)
DELETE FROM cron_job_logs 
WHERE executed_at < NOW() - INTERVAL '7 days';

-- Reset failed jobs for retry
UPDATE buffer_processing_jobs 
SET status = 'scheduled', attempts = 0, error_message = NULL
WHERE status = 'failed' AND attempts < 3;
```

## Rollback Plan

If you need to rollback to the original system:

### 1. Quick Rollback
```sql
-- Disable buffer processing
SELECT toggle_buffer_processing(false);

-- Disable message buffering feature
UPDATE feature_flags SET is_enabled = false WHERE flag_name = 'message_buffering';
```

### 2. Full Rollback
1. **Update Chatwoot webhook** back to original URL
2. **Disable cron jobs**:
   ```sql
   UPDATE cron.job SET active = false WHERE jobname LIKE '%buffer%';
   ```
3. **Keep data** for analysis - don't drop tables immediately

## Troubleshooting

### Common Issues

1. **Cron jobs not running**
   - Check if pg_cron extension is enabled
   - Verify environment variables are set
   - Check cron_job_logs for errors

2. **Messages not being buffered**
   - Check feature_flags table
   - Verify webhook URL is correct
   - Check function logs in Supabase dashboard

3. **AI processing failures**
   - Verify OpenAI API key is set
   - Check API quota and rate limits
   - Review buffer-processor logs

4. **Chatwoot responses not sending**
   - Verify Chatwoot API credentials
   - Check conversation status
   - Review network connectivity

### Debug Commands

```sql
-- Check recent webhook activity
SELECT * FROM webhook_logs ORDER BY processed_at DESC LIMIT 10;

-- Check buffer processing status
SELECT 
    mb.*,
    bpj.status as job_status,
    bpj.attempts,
    bpj.error_message
FROM message_buffer mb
LEFT JOIN buffer_processing_jobs bpj ON mb.id = bpj.buffer_id
WHERE mb.created_at > NOW() - INTERVAL '1 hour'
ORDER BY mb.created_at DESC;

-- Check recent messages in buffers
SELECT 
    mb.id as buffer_id,
    mb.status,
    mb.message_count,
    COUNT(bm.id) as actual_message_count
FROM message_buffer mb
LEFT JOIN buffered_messages bm ON mb.id = bm.buffer_id
WHERE mb.created_at > NOW() - INTERVAL '1 hour'
GROUP BY mb.id, mb.status, mb.message_count
ORDER BY mb.created_at DESC;
```

## Success Criteria

✅ **Database migrations completed successfully**  
✅ **All Supabase functions deployed**  
✅ **Cron jobs running every 10 seconds**  
✅ **Feature flags configured**  
✅ **Test messages being buffered**  
✅ **AI processing working**  
✅ **Responses being sent to Chatwoot**  

## Next Steps

After successful deployment:

1. **Monitor system performance** for 24-48 hours
2. **Collect user feedback** on response quality
3. **Fine-tune AI prompts** based on real conversations
4. **Optimize buffer duration** if needed
5. **Plan additional features** like typing indicators
6. **Document lessons learned** for future improvements

---

*This completes the core buffer system deployment. The system will now aggregate WhatsApp messages over 30 seconds and process them together for more natural conversation flow.*
