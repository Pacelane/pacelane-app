# WhatsApp Notification System for Pacing Schedules

## Overview

This document describes the complete WhatsApp notification system that automatically sends messages to users when their pacing schedule content is ready. The system integrates with the existing Chatwoot API to send WhatsApp messages proactively.

## System Architecture

```
User Onboarding → Pacing Preferences → Cron Jobs → Content Generation → WhatsApp Notifications
     ↓                    ↓              ↓            ↓                    ↓
  Pacing.tsx      pacing_schedules   pg_cron    job-runner        whatsapp-notifications
     ↓                    ↓              ↓            ↓                    ↓
  Profile Save    Schedule Table    Daily Jobs   AI Agents         Chatwoot API
     ↓                    ↓              ↓            ↓                    ↓
  WhatsApp #      Active Schedules  agent_job   saved_drafts      WhatsApp Message
```

## Components

### 1. Database Schema

#### `pacing_schedules` Table
- Stores user pacing preferences from onboarding
- Tracks active schedules and last triggered dates
- Used by cron jobs to determine when to generate content

#### `saved_drafts` Table (Updated)
- Added `whatsapp_notification_sent` boolean field
- Added `whatsapp_notification_sent_at` timestamp field
- Tracks which drafts have had notifications sent

#### `conversations` Table
- Maps users to Chatwoot conversation IDs
- Enables proactive WhatsApp messaging

### 2. Edge Functions

#### `whatsapp-notifications` Function
- **Purpose**: Send WhatsApp notifications for completed drafts
- **Endpoints**:
  - `GET /`: Process all pending notifications
  - `POST /`: Send notification for specific draft
- **Features**:
  - Finds existing conversations for users
  - Sends messages via Chatwoot API
  - Tracks notification status in database

#### `job-runner` Function (Updated)
- **New Feature**: Automatically calls WhatsApp notifications when content generation completes
- **Integration**: Calls `whatsapp-notifications` function after saving draft
- **Status Update**: Changes draft status from 'draft' to 'ready'

### 3. Cron Jobs

#### `create_scheduled_pacing_jobs()`
- **Schedule**: Runs daily at 9 AM and 6 PM
- **Function**: Creates `pacing_content_generation` jobs for active schedules
- **Logic**: Matches today's day with user's selected days

## How It Works

### 1. User Onboarding
```typescript
// In Pacing.tsx - User selects pacing preferences
const handleContinue = async () => {
  // Save pacing preferences to profiles table
  await supabase
    .from('profiles')
    .update({ pacing_preferences: pacingData })
    .eq('user_id', user.id);

  // Create pacing schedule for automation
  const scheduleData = PacingService.convertOnboardingToSchedule(user.id, pacingData);
  await PacingService.createPacingSchedule(user.id, scheduleData);
};
```

### 2. Automated Content Generation
```sql
-- Cron job creates agent_job entries
INSERT INTO agent_job (
  type,
  payload_json,
  user_id,
  status,
  schedule_type,
  schedule_config,
  run_at
) VALUES (
  'pacing_content_generation',
  jsonb_build_object('schedule_id', schedule_record.id, ...),
  schedule_record.user_id,
  'pending',
  'pacing',
  schedule_config,
  NOW()
);
```

### 3. Content Pipeline
```typescript
// job-runner processes pacing_content_generation jobs
async function processPacingContentGeneration(supabaseClient, job, steps) {
  // 1. Order Builder - Create content brief
  const brief = await callOrderBuilder(supabaseClient, contentOrder.id, steps);
  
  // 2. Retrieval Agent - Get relevant context
  const citations = await callRetrievalAgent(supabaseClient, job.user_id, brief.topic, brief.platform, steps);
  
  // 3. Writer Agent - Generate initial draft
  const draft = await callWriterAgent(supabaseClient, brief, citations, job.user_id, steps);
  
  // 4. Editor Agent - Refine and finalize
  const finalDraft = await callEditorAgent(supabaseClient, draft, brief, job.user_id, steps);
  
  // 5. Save to saved_drafts with 'ready' status
  const savedDraft = await saveDraft(finalDraft, 'ready');
  
  // 6. Send WhatsApp notification
  await sendWhatsAppNotification(savedDraft.id);
}
```

### 4. WhatsApp Notification
```typescript
// whatsapp-notifications function sends message
async function sendNotificationForDraft(draftId: string) {
  // Get draft and user info
  const draft = await getDraft(draftId);
  const userInfo = await getUserWhatsAppInfo(draft.user_id);
  
  // Find or create Chatwoot conversation
  const conversationId = await findOrCreateConversation(userInfo);
  
  // Send message via Chatwoot API
  const message = createDraftNotificationMessage(draft);
  await sendChatwootMessage(conversationId, message);
  
  // Mark notification as sent
  await markNotificationSent(draftId);
}
```

## Message Format

### WhatsApp Notification Message
```
🎉 Your content is ready!

📝 **[Draft Title]**

📱 Open the Pacelane app to view and edit your draft.

🆔 Draft ID: [draft-id]

💡 Tip: You can customize the tone, length, and platform before posting.
```

## Configuration

### Environment Variables
```bash
# Chatwoot API Configuration
CHATWOOT_BASE_URL=https://your-chatwoot-instance.com
CHATWOOT_API_ACCESS_TOKEN=your_chatwoot_api_access_token
CHATWOOT_ACCOUNT_ID=your_chatwoot_account_id

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Database Migrations
```bash
# Apply the new migration
supabase db push

# This adds WhatsApp notification tracking to saved_drafts
```

## Testing

### Local Testing
```bash
# 1. Start Supabase locally
supabase start

# 2. Deploy Edge Functions
supabase functions deploy whatsapp-notifications

# 3. Run test script
node test-whatsapp-notifications.js
```

### Production Testing
```bash
# 1. Deploy to production
supabase functions deploy whatsapp-notifications --project-ref your-project-ref

# 2. Test with real user data
# Create pacing schedule → Wait for cron job → Check WhatsApp message
```

## Monitoring and Debugging

### Logs to Watch
- `📱 Sending WhatsApp notification for draft [id]`
- `✅ WhatsApp notification sent successfully`
- `⚠️ User [id] has no WhatsApp number configured`
- `❌ Could not find or create conversation`

### Common Issues

#### 1. No WhatsApp Number
- **Problem**: User profile missing `whatsapp_number`
- **Solution**: Ensure onboarding collects WhatsApp number
- **Check**: `profiles.whatsapp_number` field

#### 2. No Chatwoot Conversation
- **Problem**: User hasn't initiated WhatsApp conversation
- **Solution**: User must send first message to establish conversation
- **Workaround**: Manual conversation creation via Chatwoot API

#### 3. Chatwoot API Errors
- **Problem**: Invalid credentials or API limits
- **Solution**: Verify environment variables and API permissions
- **Check**: `CHATWOOT_*` environment variables

## Security Considerations

### Data Privacy
- Only send notifications to users who have provided WhatsApp numbers
- Track notification status to prevent duplicate messages
- Log all notification attempts for audit purposes

### API Security
- Use service role key for internal function calls
- Validate all input parameters
- Rate limit notification sending if needed

## Future Enhancements

### Planned Features
1. **Message Templates**: Customizable notification messages
2. **Delivery Status**: Track message delivery and read receipts
3. **User Preferences**: Allow users to opt-out of notifications
4. **Multi-language**: Support for different languages
5. **Rich Media**: Include draft previews or thumbnails

### Integration Points
1. **Content Analytics**: Track which notifications lead to content engagement
2. **A/B Testing**: Test different message formats and timing
3. **User Feedback**: Collect feedback on notification usefulness
4. **Smart Timing**: Send notifications at user's preferred times

## Support and Troubleshooting

### Getting Help
1. Check Edge Function logs in Supabase dashboard
2. Verify environment variables are set correctly
3. Test Chatwoot API connectivity manually
4. Check database for missing user data

### Debugging Steps
1. **Verify User Setup**: Check profile has WhatsApp number
2. **Check Cron Jobs**: Verify `create_scheduled_pacing_jobs()` is running
3. **Monitor Job Runner**: Check `agent_job` table for pacing jobs
4. **Test Notifications**: Use test script to verify functionality
5. **Check Chatwoot**: Verify conversation exists and API works

## Conclusion

The WhatsApp notification system provides a seamless way for users to receive updates about their pacing schedule content. By integrating with the existing Chatwoot infrastructure and automating the entire process from content generation to notification delivery, users stay engaged with their content creation workflow without manual intervention.

The system is designed to be robust, with proper error handling, status tracking, and fallback mechanisms to ensure reliable delivery of notifications while maintaining a smooth user experience.
