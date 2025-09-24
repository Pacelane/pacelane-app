# WhatsApp Integration Implementation Guide

## Phase 1: Foundation Implementation

### Architecture Overview
```
Chatwoot → Webhook → Supabase Edge Function → GCS Storage + Database Tracking
```

### 1. Environment Configuration

#### Environment Setup for Different Platforms

**Local Development (.env.local):**
```bash
# Add to your .env.local file
GCS_PROJECT_ID=your_gcp_project_id
GCS_BUCKET_PREFIX=pacelane-whatsapp
GCS_CLIENT_EMAIL=pacelane-whatsapp-processor@your-project-id.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----"
GCS_PRIVATE_KEY_ID=your_private_key_id

# OpenAI Configuration (for audio transcription)
OPENAI_API_KEY=sk-your_openai_api_key_here

# Chatwoot Configuration (for downloading audio files and sending messages)
CHATWOOT_BASE_URL=https://your-chatwoot-instance.com
CHATWOOT_API_ACCESS_TOKEN=your_chatwoot_api_access_token
CHATWOOT_ACCOUNT_ID=your_chatwoot_account_id
```

**Supabase UI (Production Edge Functions):**
1. Go to Project Settings → API → Environment variables
2. Add each variable individually:
   - `GCS_PROJECT_ID`
   - `GCS_BUCKET_PREFIX`
   - `GCS_CLIENT_EMAIL`
   - `GCS_PRIVATE_KEY`
   - `GCS_PRIVATE_KEY_ID`
   - `OPENAI_API_KEY`
   - `CHATWOOT_BASE_URL`

**Vercel UI (if using Vercel for frontend):**
1. Go to Project Settings → Environment Variables
2. Add each variable for Production, Preview, and Development environments

#### Important Notes for Private Key Configuration

**For the `GCS_PRIVATE_KEY` variable:**
- Keep the exact format including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Include `\n` for newlines (don't use actual newlines in environment variables)
- Wrap in double quotes when setting via command line
- In UI environments (Supabase/Vercel), paste the entire key as one line with `\n` characters

**Example of correctly formatted private key:**
```
-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n
```

#### Required Environment Variables
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Cloud Storage Configuration
GCS_PROJECT_ID=your_gcp_project_id
GCS_BUCKET_PREFIX=pacelane-whatsapp

# Service Account Configuration (individual fields)
GCS_CLIENT_EMAIL=pacelane-whatsapp-processor@your-project-id.iam.gserviceaccount.com
GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----"
GCS_PRIVATE_KEY_ID=your_private_key_id

# Optional: Chatwoot Verification (Future Phase)
CHATWOOT_WEBHOOK_SECRET=your_webhook_secret_for_verification
```

### 2. Google Cloud Storage Setup

#### 2.1 Bucket Strategy: One Bucket Per User

**Dynamic Bucket Creation Approach:**
- Each user gets their own dedicated GCS bucket
- Bucket names follow the pattern: `pacelane-whatsapp-{user-hash}`
- Buckets are created automatically when the first message arrives
- Better data isolation and easier compliance management

**Benefits:**
- **Data Isolation**: Complete separation of user data
- **GDPR Compliance**: Easy to delete all user data by removing the bucket
- **Cost Tracking**: Individual bucket billing for cost allocation
- **Security**: Granular access control per user

#### 2.2 No Manual Bucket Creation Required
The edge function automatically:
1. Generates a unique bucket name for each user
2. Checks if the bucket exists
3. Creates the bucket if it doesn't exist
4. Applies lifecycle policies for cost optimization

**Bucket Naming Convention:**
```
pacelane-whatsapp-{hashed-user-id}
```
- Uses a hash of the user ID for privacy
- Ensures globally unique bucket names
- Follows GCS naming requirements

#### 2.3 Bucket Creation Flow
**Automatic Bucket Management:**

1. **Message Arrives**: Chatwoot sends webhook for new WhatsApp message
2. **User Identification**: System attempts to map Chatwoot contact to Pacelane user
3. **Fallback Strategy**: If no mapping exists, uses `account_{chatwoot_account_id}` as identifier
4. **Bucket Name Generation**: Creates unique bucket name using hash of user ID
5. **Bucket Check**: Verifies if bucket already exists
6. **Bucket Creation**: If not exists, creates bucket with lifecycle policies
7. **Message Storage**: Stores message in user-specific bucket

**User Mapping Strategy:**
- **Phase 1**: Uses Chatwoot account ID as fallback (allows immediate functionality)
- **Phase 2**: Implement proper contact-to-user mapping
- **Phase 3**: Admin interface for managing unmapped contacts

#### 2.4 Service Account Configuration
**Using Google Cloud Console UI:**

1. **Create Service Account**
   - Go to IAM & Admin → Service Accounts in Google Cloud Console
   - Click "Create Service Account"
   - Service account name: `pacelane-whatsapp-processor`
   - Service account ID: `pacelane-whatsapp-processor`
   - Description: `WhatsApp message processing service account`
   - Click "Create and Continue"

2. **Grant Storage Permissions**
   - In the "Grant this service account access to project" section
   - Add these roles:
     - `Storage Admin` (for bucket creation and management)
     - `Storage Object Admin` (for object operations)
   - Click "Continue" then "Done"

3. **Create and Download Key**
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Select "JSON" format and click "Create"
   - Download the JSON file (save as `whatsapp-processor-key.json`)

4. **Extract Values for Environment Variables**
   After downloading the JSON file, extract the following values:
   
```bash
# View the JSON file to extract values
cat whatsapp-processor-key.json | jq '.'
```

From the JSON file, extract these values for your environment variables:
- `client_email` → `GCS_CLIENT_EMAIL`
- `private_key` → `GCS_PRIVATE_KEY` (keep the newlines as \n)
- `private_key_id` → `GCS_PRIVATE_KEY_ID`

**Example JSON structure:**
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "pacelane-whatsapp-processor@your-project-id.iam.gserviceaccount.com",
  "client_id": "123456789...",
  ...
}
```

#### 2.4 Bucket Lifecycle Policy (Applied Automatically)
```json
{
  "lifecycle": {
    "rule": [
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "NEARLINE"
        },
        "condition": {
          "age": 30
        }
      },
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "COLDLINE"
        },
        "condition": {
          "age": 90
        }
      },
      {
        "action": {
          "type": "SetStorageClass",
          "storageClass": "ARCHIVE"
        },
        "condition": {
          "age": 365
        }
      }
    ]
  }
}
```

### 3. Database Migration

#### 3.1 Apply Schema Changes
```bash
# Apply the migration
supabase db reset
# or
supabase migration up
```

#### 3.2 Verify Migration
```sql
-- Check table structure
\d meeting_notes

-- Verify indexes
\di meeting_notes*

-- Test constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'meeting_notes';
```

### 4. Edge Function Deployment

#### 4.1 Deploy Function
```bash
# Deploy the edge function
supabase functions deploy chatwoot-webhook --env-file .env.local

# Verify deployment
supabase functions list
```

#### 4.2 Set Environment Variables
```bash
# Set secrets for the function
supabase secrets set GCS_PROJECT_ID=your_project_id
supabase secrets set GCS_BUCKET_PREFIX=pacelane-whatsapp
supabase secrets set GCS_CLIENT_EMAIL=pacelane-whatsapp-processor@your-project-id.iam.gserviceaccount.com
supabase secrets set GCS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----"
supabase secrets set GCS_PRIVATE_KEY_ID=your_private_key_id
```

### 5. Chatwoot Configuration

#### 5.1 Webhook URL
The webhook URL will be:
```
https://your-supabase-project.supabase.co/functions/v1/chatwoot-webhook
```

#### 5.2 Configure in Chatwoot
1. Go to Settings → Integrations → Webhooks
2. Click "Add new webhook"
3. Enter the webhook URL
4. Select events to subscribe to:
   - message_created
   - message_updated (optional for future phases)
5. Save configuration

### 6. Monitoring and Observability

#### 6.1 Database Monitoring Queries
```sql
-- Monitor message ingestion rate
SELECT 
  DATE(created_at) as date,
  COUNT(*) as messages_received,
  COUNT(CASE WHEN processing_status = 'stored' THEN 1 END) as successfully_stored,
  COUNT(CASE WHEN processing_status = 'error' THEN 1 END) as errors
FROM meeting_notes 
WHERE source_type = 'whatsapp'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Check for unprocessed messages
SELECT COUNT(*) as unprocessed_messages
FROM meeting_notes 
WHERE source_type = 'whatsapp' 
  AND processing_status = 'stored'
  AND user_id IS NULL;

-- Error analysis
SELECT 
  error_details,
  COUNT(*) as error_count
FROM meeting_notes 
WHERE source_type = 'whatsapp' 
  AND processing_status = 'error'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY error_details;
```

#### 6.2 GCS Storage Monitoring
```bash
# List all user buckets
gsutil ls | grep pacelane-whatsapp

# Check specific user bucket size
gsutil du -sh gs://pacelane-whatsapp-{user-hash}

# List recent objects in a user bucket
gsutil ls -l gs://pacelane-whatsapp-{user-hash}/whatsapp-messages/$(date +%Y-%m-%d)/

# Monitor total storage across all user buckets
gsutil ls | grep pacelane-whatsapp | xargs -I {} gsutil du -sh {}
```

### 7. Testing Procedures

#### 7.1 Unit Testing
```bash
# Test webhook endpoint
curl -X POST https://your-supabase-project.supabase.co/functions/v1/chatwoot-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "message_created",
    "id": "test-message-123",
    "content": "Test WhatsApp message",
    "message_type": "incoming",
    "created_at": "2025-01-30T10:00:00Z",
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
  }'
```

#### 7.2 Integration Testing
```sql
-- Verify test message was stored
SELECT * FROM meeting_notes 
WHERE chatwoot_message_id = 'test-message-123';

-- Check GCS path generation
SELECT gcs_storage_path FROM meeting_notes 
WHERE chatwoot_message_id = 'test-message-123';
```

### 8. Performance Considerations

#### 8.1 Database Optimization
- Partitioning by date for large volumes
- Regular VACUUM and ANALYZE operations
- Index monitoring and optimization

#### 8.2 Edge Function Scaling
- Monitor function execution time
- Implement retry mechanisms for GCS failures
- Consider batch processing for high volumes

#### 8.3 Storage Cost Optimization
- Lifecycle policies for long-term storage
- Compression for archived messages
- Regular cleanup of processed data

### 9. Minimal Notification Policy (PCL-26)

#### 9.1 Policy Overview
The WhatsApp integration follows a **minimal notification policy** to reduce noise and only send messages when absolutely necessary:

- **NOTES**: Processed silently, no WhatsApp messages sent
- **ORDER flows**: Only send messages for blocking clarifications or errors
- **Ready notices**: Only sent when user has opted in (`notify_on_ready`)

#### 9.2 Message Types

**Blocking Clarifications** (sent only when required fields are missing):
- Platform selection (LinkedIn, Instagram, Twitter, Blog)
- Content length (Short, Medium, Long)
- Tone preference (Professional, Casual, Friendly, Authoritative)
- Topic focus (Trends, News, Tips, Product)

**Error Notifications** (sent only on processing failures):
- Bucket setup failures
- Order creation errors
- Job enqueue failures

**Ready Notices** (sent only when opted-in):
- Content completion notifications
- App opening instructions
- Order ID references

#### 9.3 Quick Reply Integration
The system uses Chatwoot's quick reply feature to make clarifications interactive:

```typescript
// Example quick reply structure
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

#### 9.4 Conversation Context Management
To handle multi-step clarifications, the system stores conversation context:

```sql
-- conversations table structure
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  chatwoot_conversation_id INTEGER UNIQUE NOT NULL,
  context_json JSONB, -- Stores clarifying field, order params, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 9.5 Chatwoot API Integration
The system uses Chatwoot's REST API to send messages:

**Required Environment Variables:**
```bash
CHATWOOT_BASE_URL=https://your-chatwoot-instance.com
CHATWOOT_API_ACCESS_TOKEN=your_chatwoot_api_access_token
CHATWOOT_ACCOUNT_ID=your_chatwoot_account_id
```

**API Endpoint:**
```
POST /api/v1/accounts/{account_id}/conversations/{conversation_id}/messages
```

**Authentication:**
```
Headers: {
  'api_access_token': 'your_token_here',
  'Content-Type': 'application/json'
}
```

### 10. Security Implementation

#### 10.1 Webhook Verification (Future Phase)
```typescript
// Verify Chatwoot webhook signature
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const computedSignature = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
}
```

#### 10.2 Data Encryption
- All data encrypted in transit (HTTPS)
- GCS encryption at rest (default)
- Consider customer-managed encryption keys (CMEK) for sensitive data

### 11. Chatwoot API Integration (PCL-26)

#### 11.1 New Features Added
The WhatsApp integration now includes outbound messaging capabilities:

- **Blocking Clarifications**: Interactive quick-reply messages for missing order fields
- **Error Notifications**: Brief error messages with helpful suggestions
- **Ready Notices**: Optional notifications when content is ready (user preference-based)
- **Minimal Policy**: Only send messages when absolutely necessary

#### 11.2 Required Environment Variables
```bash
# Add these to your environment configuration
CHATWOOT_API_ACCESS_TOKEN=your_chatwoot_api_access_token
CHATWOOT_ACCOUNT_ID=your_chatwoot_account_id
```

#### 11.3 Database Changes
Run the new migration to add required tables:
```bash
# Apply the new migration
supabase db push
```

This creates:
- `conversations` table for managing clarification context
- `notify_on_ready` field in `user_bucket_mapping`

#### 11.4 Testing the Integration
Test the new features with the provided webhook payloads in the [WhatsApp Chatwoot API Integration](./WHATSAPP_CHATWOOT_API_INTEGRATION.md) guide.

### 12. Operational Procedures

#### 12.1 Deployment Checklist
- [ ] Environment variables configured
- [ ] GCS bucket created and configured
- [ ] Service account permissions verified
- [ ] Database migration applied
- [ ] Edge function deployed
- [ ] Chatwoot webhook configured
- [ ] Monitoring dashboards updated
- [ ] Testing completed

#### 12.2 Rollback Procedures
```bash
# Rollback edge function
supabase functions deploy chatwoot-webhook --env-file .env.local --previous-version

# Rollback database migration
supabase migration down

# Disable webhook in Chatwoot temporarily
# Manual process through Chatwoot UI
```

### 11. Phase 2 Preparation

#### 11.1 User Mapping Implementation
- Implement contact-to-user mapping logic
- Add user identification rules
- Create mapping management interface

#### 11.2 AI Processing Pipeline
- Design message analysis workflow
- Implement content extraction algorithms
- Add sentiment and intent analysis

#### 11.3 Real-time Notifications
- WebSocket implementation for live updates
- Push notification system
- Dashboard integration

## Success Metrics

### Technical Metrics
- Webhook processing latency < 500ms
- Message storage success rate > 99.9%
- Zero data loss incidents
- Function cold start time < 2s

### Business Metrics
- WhatsApp message ingestion volume
- User engagement with captured content
- Content generation efficiency improvement
- Customer satisfaction with response times

## Risk Mitigation

### High Priority Risks
1. **GCS Service Disruption**: Implement fallback storage in Supabase
2. **Edge Function Failures**: Add dead letter queue for failed webhooks
3. **Data Privacy Compliance**: Ensure GDPR/CCPA compliance in storage
4. **Cost Overrun**: Implement spending alerts and lifecycle policies

### Monitoring and Alerting
- Function error rate > 1%
- GCS storage costs > budget threshold
- Database connection pool exhaustion
- Webhook delivery failures 