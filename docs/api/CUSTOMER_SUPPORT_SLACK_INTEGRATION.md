# Customer Support Slack Integration (PCL-37)

## Overview

This document describes the implementation of **PCL-37: Customer Support Slack Webhook Integration**. The system automatically sends customer support tickets and system errors to a dedicated Slack channel for immediate visibility and response by the support team.

## Features

### ✅ Implemented

- **Multi-Source Support Tickets**: Accepts tickets from various sources (user reports, system errors, integration failures)
- **Intelligent Routing**: Automatically categorizes and prioritizes tickets based on severity and event type
- **Rich Slack Formatting**: Sends formatted messages with color coding, emojis, and structured data
- **Database Storage**: Stores all tickets in PostgreSQL for tracking and analytics
- **Flexible Payload Types**: Supports direct tickets, error conversion, and user feedback
- **Security**: Implements proper validation, error handling, and database RLS policies

### 🎯 Supported Event Types

1. **user_error** - User-reported issues and problems
2. **system_error** - Automated system error notifications
3. **integration_failure** - Third-party integration failures (WhatsApp, Google Calendar, etc.)
4. **content_generation_failure** - AI content generation issues
5. **authentication_issue** - Login and auth problems
6. **billing_issue** - Payment and subscription problems
7. **feature_request** - User feature requests and suggestions
8. **bug_report** - Bug reports from users or automated systems
9. **general_support** - General support inquiries

### 🚨 Severity Levels

- **Critical** (🚨): System-wide issues affecting multiple users
- **High** (🔴): Significant issues affecting user experience
- **Medium** (🟡): Standard support requests and minor issues
- **Low** (🟢): Feature requests and non-urgent inquiries

## Architecture

### Components

1. **Edge Function**: `supabase/functions/customer-support-slack/index.ts`
2. **Database Table**: `customer_support_tickets`
3. **Slack Webhook**: Customer support channel integration
4. **Test Suite**: `test-customer-support-slack.js`

### Data Flow

```mermaid
graph TD
    A[Error/Support Event] --> B[Edge Function]
    B --> C{Validate Payload}
    C -->|Valid| D[Store in Database]
    C -->|Invalid| E[Return Error]
    D --> F[Format Slack Message]
    F --> G[Send to Slack]
    G --> H[Return Success]
    
    I[User Report] --> B
    J[System Error] --> B
    K[Integration Failure] --> B
```

## Database Schema

### customer_support_tickets Table

```sql
CREATE TABLE public.customer_support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- User identification
    user_id UUID REFERENCES auth.users(id),
    user_email TEXT,
    
    -- Classification
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    
    -- Content
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Status tracking
    status TEXT DEFAULT 'open',
    assigned_to TEXT,
    
    -- Structured data
    metadata JSONB DEFAULT '{}',
    error_details JSONB DEFAULT '{}',
    user_context JSONB DEFAULT '{}',
    
    -- Resolution
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes and Performance

- Primary key index on `id`
- Indexes on `user_id`, `event_type`, `severity`, `status`
- Composite index on `status` + `severity` for dashboard queries
- Time-based index on `created_at` for chronological queries

## API Usage

### Edge Function Endpoint

```
POST https://your-project.supabase.co/functions/v1/customer-support-slack
```

### Payload Types

#### 1. Direct Support Ticket

```json
{
  "event_type": "user_error",
  "severity": "high",
  "title": "User unable to generate content",
  "description": "User reports that content generation is failing with timeout errors",
  "user_id": "user-123",
  "user_email": "user@example.com",
  "metadata": {
    "feature": "content_generation",
    "platform": "linkedin"
  },
  "user_context": {
    "user_agent": "Mozilla/5.0...",
    "page_url": "https://app.pacelane.com/content-editor",
    "session_id": "session-456"
  }
}
```

#### 2. System Error (Auto-converted to ticket)

```json
{
  "error_message": "OpenAI API timeout in content generation",
  "error_details": {
    "function_name": "writer-agent",
    "request_id": "req-789",
    "stack_trace": "Error: OpenAI API timeout\n    at generateContent...",
    "timestamp": "2025-01-17T12:00:00Z"
  },
  "user_context": {
    "user_id": "user-456",
    "user_email": "user@example.com"
  }
}
```

#### 3. User Feedback

```json
{
  "title": "Feature Request: Dark Mode",
  "description": "Would love to have a dark mode option in the content editor",
  "event_type": "feature_request",
  "severity": "low",
  "user_id": "user-789",
  "user_email": "feedback@example.com",
  "metadata": {
    "source": "in_app_feedback"
  }
}
```

### Response Format

```json
{
  "success": true,
  "message": "Support ticket processed and sent to Slack successfully",
  "ticketId": "ticket-uuid-here"
}
```

## Slack Integration

### Webhook URL

```
https://hooks.slack.com/services/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
```

### Message Format

The function sends rich Slack messages with:

- **Color-coded attachments** based on severity
- **Emoji indicators** for event types and severity
- **Structured fields** showing all relevant information
- **Timestamps** and ticket IDs for tracking
- **Stack traces** for technical errors (in separate attachments)

#### Example Slack Message

```json
{
  "text": "🔴 New HIGH support ticket: User unable to generate content",
  "attachments": [
    {
      "color": "#ff4444",
      "fields": [
        {
          "title": "Description",
          "value": "User reports that content generation is failing with timeout errors",
          "short": false
        },
        {
          "title": "Event Type",
          "value": "👤 USER ERROR",
          "short": true
        },
        {
          "title": "Severity",
          "value": "🔴 HIGH",
          "short": true
        },
        {
          "title": "User Email",
          "value": "user@example.com",
          "short": true
        },
        {
          "title": "Ticket ID",
          "value": "ticket-uuid-here",
          "short": true
        }
      ],
      "footer": "Pacelane Customer Support",
      "ts": 1705492800
    }
  ]
}
```

## Security & Access Control

### Row Level Security (RLS)

The `customer_support_tickets` table implements RLS with these policies:

1. **Support team can view all tickets** - Users with admin/support roles
2. **Users can view their own tickets** - Based on `user_id` or `user_email`
3. **Support team can update all tickets** - For status changes and resolution
4. **System can insert tickets** - For webhook processing
5. **Support team can delete tickets** - For cleanup (admin only)

### Authentication

- Edge function uses **service role key** for database operations
- User identification via `user_id` or `user_email`
- No authentication required for webhook calls (validates payload instead)

## Error Handling

### Validation Errors

- **Invalid payload structure**: Missing required fields
- **Unsupported event types**: Not in the allowed list
- **Invalid severity levels**: Must be low/medium/high/critical

### System Errors

- **Database connection issues**: Graceful degradation
- **Slack API failures**: Continues processing even if Slack fails
- **Network timeouts**: Proper error responses

### Logging

All operations are logged with:
- Request details and payloads
- Processing steps and decisions
- Error messages and stack traces
- Performance metrics

## Testing

### Test Script

Run the comprehensive test suite:

```bash
node test-customer-support-slack.js
```

The test script validates:
- ✅ Direct support ticket processing
- ✅ System error conversion
- ✅ User feedback handling
- ✅ Invalid payload rejection
- ✅ Slack message formatting
- ✅ Error scenarios

### Manual Testing

1. **Test valid payloads** with different event types and severities
2. **Test invalid payloads** to ensure proper validation
3. **Test Slack webhook** by checking the customer-support channel
4. **Test database storage** by querying the tickets table

## Deployment

### Prerequisites

1. **Database migration applied**:
   ```bash
   supabase db push
   ```

2. **Environment variables configured**:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

### Local Development

```bash
# Start local Supabase
supabase start

# Serve functions locally
supabase functions serve customer-support-slack

# Test with curl
curl -X POST http://localhost:54321/functions/v1/customer-support-slack \
  -H "Content-Type: application/json" \
  -d '{"event_type":"user_error","severity":"high","title":"Test","description":"Test ticket"}'
```

### Production Deployment

```bash
# Deploy the function
supabase functions deploy customer-support-slack

# Test production endpoint
curl -X POST https://your-project.supabase.co/functions/v1/customer-support-slack \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"event_type":"user_error","severity":"high","title":"Test","description":"Test ticket"}'
```

## Integration Examples

### From Other Edge Functions

```typescript
// In any Edge Function, send support tickets
const supportTicket = {
  event_type: 'content_generation_failure',
  severity: 'high',
  title: 'OpenAI API Timeout',
  description: `Content generation failed for user ${userId}`,
  error_details: {
    function_name: 'writer-agent',
    error_message: error.message,
    request_id: requestId
  },
  user_context: {
    user_id: userId,
    user_email: userEmail
  }
};

const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/customer-support-slack`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
  },
  body: JSON.stringify(supportTicket)
});
```

### From Frontend Applications

```typescript
// In React components or error boundaries
const reportError = async (error: Error, userContext: any) => {
  try {
    await fetch('/api/support-ticket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event_type: 'user_error',
        severity: 'medium',
        title: `Frontend Error: ${error.name}`,
        description: error.message,
        error_details: {
          stack_trace: error.stack,
          timestamp: new Date().toISOString()
        },
        user_context: userContext
      })
    });
  } catch (err) {
    console.error('Failed to report error:', err);
  }
};
```

### From Monitoring Systems

```bash
# From monitoring scripts or cron jobs
curl -X POST https://your-project.supabase.co/functions/v1/customer-support-slack \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "system_error",
    "severity": "critical",
    "title": "High Memory Usage Alert",
    "description": "Server memory usage exceeded 90% threshold",
    "metadata": {
      "server": "web-server-01",
      "memory_usage": "94%",
      "alert_time": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
    }
  }'
```

## Monitoring & Analytics

### Support Dashboard Query

```sql
-- Get ticket summary by severity and status
SELECT 
  severity,
  status,
  COUNT(*) as count,
  AVG(
    CASE 
      WHEN resolved_at IS NOT NULL 
      THEN EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 
      ELSE NULL 
    END
  ) as avg_resolution_hours
FROM customer_support_tickets
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY severity, status
ORDER BY 
  CASE severity 
    WHEN 'critical' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'medium' THEN 3 
    WHEN 'low' THEN 4 
  END;
```

### Performance Metrics

- **Response time**: Function execution time
- **Success rate**: Successful vs failed webhook calls
- **Slack delivery rate**: Messages successfully sent to Slack
- **Database performance**: Insert/query performance

## Troubleshooting

### Common Issues

1. **Slack webhook not receiving messages**
   - Verify webhook URL is correct
   - Check Slack app permissions
   - Review function logs for errors

2. **Database connection errors**
   - Verify `SUPABASE_SERVICE_ROLE_KEY` is set
   - Check database migration status
   - Review RLS policies

3. **Payload validation failures**
   - Ensure required fields are present
   - Check event_type is in supported list
   - Verify severity is valid value

4. **Function timeout errors**
   - Review function complexity
   - Check external API response times
   - Consider async processing for heavy operations

### Debug Mode

Enable detailed logging by setting environment variable:

```bash
export DEBUG_CUSTOMER_SUPPORT=true
```

This will log:
- Full request payloads
- Processing steps
- Database queries
- Slack message content
- Response details

## Future Enhancements

### Planned Features

1. **Slack Interactive Components**
   - Buttons to assign tickets
   - Status update actions
   - Priority modification

2. **Escalation Rules**
   - Auto-escalate critical issues
   - SLA-based notifications
   - Team assignment logic

3. **Analytics Dashboard**
   - Real-time support metrics
   - Resolution time tracking
   - Team performance analytics

4. **Integration Expansion**
   - Email notifications
   - PagerDuty integration
   - Jira ticket creation

### Contributing

When adding new features:

1. Update the supported event types list
2. Add validation for new fields
3. Update Slack message formatting
4. Add test cases to the test script
5. Update this documentation

## Support

For questions about this integration:

1. Check the test script output
2. Review function logs in Supabase dashboard
3. Verify Slack webhook configuration
4. Check database table structure and policies

The customer support Slack integration is designed to be reliable, extensible, and easy to maintain while providing immediate visibility into support issues across the Pacelane platform.
