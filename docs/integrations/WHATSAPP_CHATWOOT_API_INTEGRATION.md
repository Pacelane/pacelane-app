# WhatsApp Chatwoot API Integration

## Overview

This document describes the implementation of PCL-26: WhatsApp notifications minimal policy, which adds outbound messaging capabilities to the existing WhatsApp integration using Chatwoot's REST API.

## Features

### ✅ Implemented
- **Outbound Integration**: Use Chatwoot API to send WA messages from server functions
- **Blocking Clarifications**: Interactive quick-reply messages for missing required fields
- **Error Notifications**: Brief error messages with suggestions for failed operations
- **Ready Notices**: Optional notifications when content is ready (user preference-based)
- **Minimal Policy**: Only send messages when absolutely necessary

### 🔄 Message Flow
1. **Incoming Message** → Intent Detection → Processing
2. **Missing Fields** → Blocking Clarification (with quick replies)
3. **User Response** → Field Completion → Order Creation
4. **Success/Failure** → Appropriate notification (or none for smooth flows)

## Environment Configuration

### Required Environment Variables
```bash
# Chatwoot API Configuration
CHATWOOT_BASE_URL=https://your-chatwoot-instance.com
CHATWOOT_API_ACCESS_TOKEN=your_chatwoot_api_access_token
CHATWOOT_ACCOUNT_ID=your_chatwoot_account_id

# Existing Configuration
GCS_PROJECT_ID=your_gcp_project_id
GCS_BUCKET_PREFIX=pacelane-whatsapp
GCS_CLIENT_EMAIL=pacelane-whatsapp-processor@your-project-id.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----"
GCS_PRIVATE_KEY_ID=your_private_key_id
OPENAI_API_KEY=sk-your_openai_api_key_here
```

### Getting Chatwoot API Credentials

1. **API Access Token**:
   - Go to Chatwoot Settings → Profile → API Access Tokens
   - Create a new token with appropriate permissions
   - Copy the token value

2. **Account ID**:
   - Go to Chatwoot Settings → Accounts
   - Note the Account ID from the URL or account list

3. **Base URL**:
   - Use your Chatwoot instance URL (e.g., `https://chatwoot.yourdomain.com`)

## Database Schema

### New Tables

#### `conversations`
Stores conversation context for handling multi-step clarifications.

```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  chatwoot_conversation_id INTEGER UNIQUE NOT NULL,
  context_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**context_json Structure:**
```json
{
  "clarifyingField": "platform",
  "orderParams": {
    "platform": "linkedin",
    "length": null,
    "tone": null,
    "topic": null
  },
  "senderId": 123,
  "accountId": 456,
  "createdAt": "2025-01-08T10:00:00Z"
}
```

#### Updated `user_bucket_mapping`
Added `notify_on_ready` field for user preferences.

```sql
ALTER TABLE user_bucket_mapping 
ADD COLUMN notify_on_ready BOOLEAN DEFAULT false;
```

## API Integration

### Chatwoot API Endpoints

#### Send Message
```http
POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages
```

**Headers:**
```
Content-Type: application/json
api_access_token: your_token_here
```

**Body:**
```json
{
  "content": "Your message content",
  "message_type": "outgoing",
  "content_type": "text",
  "content_attributes": {
    "quick_reply": {
      "type": "quick_reply",
      "values": [
        { "title": "Option 1", "value": "value1" },
        { "title": "Option 2", "value": "value2" }
      ]
    }
  }
}
```

### Message Templates

#### Blocking Clarification
```typescript
{
  content: "📱 Which platform would you like content for?",
  content_attributes: {
    quick_reply: {
      type: "quick_reply",
      values: [
        { title: "LinkedIn", value: "linkedin" },
        { title: "Instagram", value: "instagram" },
        { title: "Twitter", value: "twitter" },
        { title: "Blog", value: "blog" }
      ]
    }
  }
}
```

#### Error Notification
```typescript
{
  content: "❌ Sorry, I couldn't process your message: {error}\n\n💡 Try sending it again or contact support if the issue persists.",
  message_type: "outgoing",
  content_type: "text"
}
```

#### Ready Notice
```typescript
{
  content: "✅ Your content is ready!\n\n📱 Open the Pacelane app to view and edit your draft.\n\n🆔 Order ID: {orderId}",
  message_type: "outgoing",
  content_type: "text"
}
```

## Implementation Details

### Minimal Notification Policy

The system follows a strict minimal policy to reduce WhatsApp noise:

1. **NOTES**: Processed silently, no messages sent
2. **ORDER flows**: Only send messages for:
   - Blocking clarifications (missing required fields)
   - Error notifications (processing failures)
3. **Ready notices**: Only when user has opted in (`notify_on_ready = true`)

### Quick Reply Flow

1. **User sends ORDER intent** with missing fields
2. **System detects missing fields** and sends blocking clarification
3. **User selects quick reply option**
4. **System processes response** and updates order parameters
5. **If more fields needed**: Send next clarification
6. **If all fields complete**: Create order and confirm

### Conversation Context Management

- Each clarification stores context in `conversations` table
- Context includes current clarifying field and accumulated order parameters
- System can resume clarification flow after user responses
- Context is cleared after order completion

## Testing

### Test Webhook Payload
```json
{
  "event": "message_created",
  "id": "test-message-123",
  "content": "Create a LinkedIn post about AI trends",
  "message_type": "incoming",
  "created_at": "2025-01-08T10:00:00Z",
  "sender": {
    "id": 123,
    "name": "Test User",
    "type": "contact"
  },
  "conversation": {
    "id": 456,
    "channel": "Channel::Whatsapp",
    "status": "open"
  },
  "account": {
    "id": 789,
    "name": "Test Account"
  }
}
```

### Test Quick Reply Response
```json
{
  "event": "message_created",
  "id": "test-reply-124",
  "content": "linkedin",
  "message_type": "incoming",
  "content_attributes": {
    "quick_reply": {
      "type": "quick_reply",
      "value": "linkedin"
    }
  },
  "sender": {
    "id": 123,
    "name": "Test User",
    "type": "contact"
  },
  "conversation": {
    "id": 456,
    "channel": "Channel::Whatsapp",
    "status": "open"
  },
  "account": {
    "id": 789,
    "name": "Test Account"
  }
}
```

## Monitoring and Debugging

### Log Messages
The system provides detailed logging for debugging:

- `📤 Sending blocking clarification for {field}: {message}`
- `📱 Processing quick reply response: {value}`
- `💾 Stored conversation context for clarification: {field}`
- `✅ Chatwoot message sent successfully: {messageId}`
- `❌ Error sending Chatwoot message: {error}`

### Common Issues

1. **Missing API credentials**: Check environment variables
2. **Invalid conversation ID**: Verify Chatwoot conversation exists
3. **API rate limits**: Monitor Chatwoot API usage
4. **Quick reply parsing**: Check content_attributes structure

## Future Enhancements

### Planned Features
- **Webhook signature verification** for security
- **Message templates** for consistent branding
- **Multi-language support** for international users
- **Advanced analytics** for message effectiveness

### Integration Points
- **Content completion webhooks** for automatic ready notices
- **User preference management** in Pacelane app
- **A/B testing** for message optimization
- **Delivery status tracking** for message reliability

## Security Considerations

### API Security
- Use HTTPS for all API communications
- Rotate API access tokens regularly
- Monitor API usage for anomalies
- Implement rate limiting if needed

### Data Privacy
- Store minimal conversation context
- Clear context after order completion
- Respect user notification preferences
- Log message content for audit purposes

## Support

For issues or questions about the WhatsApp Chatwoot API integration:

1. Check the logs for error messages
2. Verify environment variable configuration
3. Test with the provided webhook payloads
4. Review Chatwoot API documentation
5. Contact the development team with specific error details
