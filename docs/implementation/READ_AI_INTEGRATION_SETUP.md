# Read.ai Integration Setup Guide

This guide walks you through setting up Read.ai webhook integration with Pacelane for AI-powered meeting intelligence.

## Overview

The Read.ai integration captures meeting data via webhooks and processes it to provide:
- **Meeting summaries and transcripts**
- **Action item extraction and tracking**
- **Topic analysis and insights**
- **Participant analytics**
- **Content generation opportunities**

## Prerequisites

- Read.ai account with webhook access
- Supabase project configured
- Pacelane application deployed

## Step 1: Database Setup

The database schema has been created with the following tables:
- `read_ai_meetings` - Core meeting data
- `read_ai_participants` - Participant details and analytics
- `read_ai_action_items` - Extracted action items
- `read_ai_topics` - Meeting topics and discussions
- `read_ai_webhooks` - Webhook processing logs

Run the migration:
```bash
supabase db push
```

## Step 2: Deploy Edge Function

Deploy the Read.ai webhook handler:
```bash
supabase functions deploy read-ai-webhook
```

## Step 3: Configure Environment Variables

Set these environment variables in your Supabase project:

```bash
# Optional: Webhook signature verification
READ_AI_WEBHOOK_SECRET=your_webhook_secret_here
```

If you enable webhook signature verification, make sure to configure the same secret in Read.ai.

## Step 4: Configure Read.ai Webhooks

### 4.1 Webhook URL

Set your webhook URL in Read.ai dashboard:
```
https://your-project.supabase.co/functions/v1/read-ai-webhook
```

### 4.2 Event Types

Subscribe to these webhook events:
- `meeting.completed` - When meeting analysis is complete
- `meeting.processed` - When meeting data is fully processed
- `meeting.started` - (Optional) For real-time updates

### 4.3 Webhook Payload

The webhook should include:
```json
{
  "event_type": "meeting.completed",
  "meeting_id": "unique-meeting-id",
  "user_email": "user@example.com",
  "meeting": {
    "id": "meeting-id",
    "title": "Meeting Title",
    "start_time": "2025-08-11T10:00:00Z",
    "end_time": "2025-08-11T11:00:00Z",
    "duration_minutes": 60,
    "platform": "zoom",
    "host": {
      "email": "host@example.com",
      "name": "Host Name"
    },
    "participants": [...],
    "topics": [...],
    "action_items": [...],
    "transcript_text": "...",
    "summary_text": "...",
    "insights": {...},
    "analytics": {...}
  }
}
```

## Step 5: User Mapping

The integration uses email addresses to map meetings to Pacelane users. Ensure:

1. **User Profile Email**: Users' Pacelane profiles have the same email as Read.ai
2. **Host Email Mapping**: The meeting host email should match a Pacelane user
3. **Participant Email**: Optional but recommended for team features

### User Mapping Options:

**Option A: Email-based (Current)**
- Webhook includes `user_email` field
- System matches email to Pacelane user profile

**Option B: API Key-based**
- Each user has unique webhook URL with API key
- More secure but requires Read.ai customization

**Option C: Manual Mapping**
- Admin interface to map Read.ai users to Pacelane users
- Most flexible but requires additional setup

## Step 6: Testing the Integration

### 6.1 Test Webhook Endpoint

Test the webhook endpoint directly:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/read-ai-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "meeting.completed",
    "meeting_id": "test-meeting-123",
    "user_email": "test@example.com",
    "meeting": {
      "id": "test-meeting-123",
      "title": "Test Meeting",
      "start_time": "2025-08-11T10:00:00Z",
      "end_time": "2025-08-11T11:00:00Z",
      "duration_minutes": 60,
      "platform": "zoom",
      "host": {
        "email": "test@example.com",
        "name": "Test User"
      },
      "participants": [],
      "topics": [],
      "action_items": []
    }
  }'
```

### 6.2 Check Database

Verify data is stored correctly:
```sql
SELECT * FROM read_ai_meetings ORDER BY created_at DESC LIMIT 5;
SELECT * FROM read_ai_webhooks ORDER BY created_at DESC LIMIT 5;
```

### 6.3 Frontend Testing

1. Navigate to the dashboard
2. Look for "Read.ai Meeting Intelligence" section
3. Verify meeting data displays correctly
4. Test action item management
5. Test content generation from meetings

## Step 7: Production Considerations

### 7.1 Webhook Security

- **Enable signature verification** in production
- **Use HTTPS** for all webhook URLs
- **Validate payload structure** before processing
- **Rate limiting** on webhook endpoint

### 7.2 Data Privacy

- **Encrypt sensitive meeting data** at rest
- **Implement data retention policies**
- **Respect user privacy preferences**
- **Comply with GDPR/CCPA requirements**

### 7.3 Error Handling

- **Retry failed webhook processing**
- **Monitor webhook logs** for errors
- **Alert on processing failures**
- **Graceful degradation** when Read.ai is unavailable

### 7.4 Performance

- **Async processing** for large payloads
- **Database indexing** for fast queries
- **Caching** for frequently accessed data
- **Batch processing** for bulk updates

## Step 8: Content Generation Integration

### 8.1 Meeting-based Content

Use meeting data for content generation:
- **Executive summaries** from meeting insights
- **Industry trends** from discussion topics
- **Leadership lessons** from action items
- **Team updates** from participant analytics

### 8.2 Content Templates

Example content templates:
- "5 Key Takeaways from Our Strategy Meeting"
- "How We're Solving [Topic] - Industry Insights"
- "Leadership Lessons from Today's Challenges"
- "Team Collaboration Insights from Q3 Planning"

### 8.3 AI Enhancement

Combine Read.ai data with Pacelane's AI:
- **Sentiment analysis** for content tone
- **Keyword extraction** for SEO optimization
- **Audience targeting** based on participants
- **Follow-up suggestions** from action items

## Troubleshooting

### Common Issues

1. **Webhook not receiving data**
   - Check webhook URL configuration
   - Verify network connectivity
   - Check Supabase Edge Function logs

2. **User mapping failures**
   - Verify email addresses match
   - Check user profile data
   - Review webhook payload structure

3. **Database insertion errors**
   - Check data types and constraints
   - Verify foreign key relationships
   - Review RLS policies

4. **Frontend not displaying data**
   - Check authentication and permissions
   - Verify API calls and responses
   - Review browser console for errors

### Debug Commands

```bash
# Check Edge Function logs
supabase functions logs read-ai-webhook

# Test database connection
supabase db psql -c "SELECT COUNT(*) FROM read_ai_meetings;"

# Verify webhook processing
supabase db psql -c "SELECT * FROM read_ai_webhooks WHERE processing_status = 'failed';"
```

## API Reference

### ReadAIService Methods

```typescript
// Get recent meetings
ReadAIService.getMeetings({ limit: 10 })

// Get specific meeting
ReadAIService.getMeeting(meetingId)

// Get action items
ReadAIService.getActionItems({ status: 'open' })

// Update action item
ReadAIService.updateActionItem(id, { status: 'completed' })

// Get insights
ReadAIService.getMeetingInsights()

// Search meetings
ReadAIService.searchMeetings('strategy planning')

// Get content generation data
ReadAIService.getMeetingForContentGeneration(meetingId)
```

## Support

For issues with:
- **Read.ai webhook configuration**: Contact Read.ai support
- **Pacelane integration**: Check Edge Function logs and database
- **Data processing**: Review webhook processing status
- **Content generation**: Verify meeting data completeness

## Future Enhancements

- **Real-time meeting transcription**
- **Multi-language support**
- **Advanced sentiment analysis**
- **Team collaboration insights**
- **Calendar integration sync**
- **Custom webhook events**
