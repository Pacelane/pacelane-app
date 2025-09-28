# Recall.ai Calendar Integration Setup

This document explains how to set up and use the new Recall.ai Calendar V2 integration that replaces the Google Calendar sync.

## Overview

The Recall.ai integration provides:
- **Automatic meeting recording** with bots
- **Transcription capabilities** 
- **Webhook-driven updates**
- **Better OAuth management** with automatic token refresh
- **Meeting URL extraction** for better event tracking

## Setup Steps

### 1. Environment Variables

Add these environment variables to your Supabase project:

```bash
# Recall.ai API Key (get from https://api.recall.ai/dashboard/api-keys/)
RECALL_API_KEY=your_recall_api_key_here

# Google OAuth (reuse existing)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your_redirect_uri
```

### 2. Database Migration

Run the migration in Supabase UI:

```sql
-- File: supabase/migrations/20250127_add_recall_calendar_id.sql
-- This adds recall_calendar_id and meeting_url columns
```

### 3. Deploy Edge Function

Deploy the new `recall-calendar-integration` function:

```bash
supabase functions deploy recall-calendar-integration
```

## API Endpoints

### 1. Get OAuth URL
```bash
GET /functions/v1/recall-calendar-integration?action=auth-url
```

### 2. Handle OAuth Callback
```bash
POST /functions/v1/recall-calendar-integration?action=callback
{
  "code": "authorization_code",
  "state": "user_id"
}
```

### 3. Sync Events
```bash
POST /functions/v1/recall-calendar-integration?action=sync-events
Authorization: Bearer <jwt_token>
```

### 4. Get Events
```bash
GET /functions/v1/recall-calendar-integration?action=events&start=2024-01-01&end=2024-12-31
Authorization: Bearer <jwt_token>
```

### 5. Disconnect Calendar
```bash
POST /functions/v1/recall-calendar-integration?action=disconnect
Authorization: Bearer <jwt_token>
```

## Database Schema Changes

### user_calendars table
- Added `recall_calendar_id` (text) - Stores Recall.ai calendar ID
- Added index for better performance

### calendar_events table  
- Added `meeting_url` (text) - Stores meeting URL from Recall.ai
- Added index for better performance

## Testing

Use the test script to verify the integration:

```bash
# Test basic functionality
node scripts/test-recall-integration.js

# Test OAuth callback (after completing OAuth flow)
node scripts/test-recall-integration.js callback YOUR_AUTH_CODE
```

## Key Differences from Google Calendar Sync

| Feature | Google Calendar Sync | Recall.ai Integration |
|---------|---------------------|----------------------|
| **Meeting Recording** | ❌ No | ✅ Automatic bots |
| **Transcription** | ❌ No | ✅ Built-in |
| **Webhooks** | ❌ Manual sync | ✅ Real-time updates |
| **Token Refresh** | ⚠️ Manual | ✅ Automatic |
| **Meeting URLs** | ❌ No | ✅ Extracted |
| **Bot Scheduling** | ❌ No | ✅ Automatic |

## Migration from Google Calendar Sync

1. **Deploy new function** alongside existing `google-calendar-sync`
2. **Update frontend** to use new endpoints
3. **Test thoroughly** with existing users
4. **Deprecate old function** once migration is complete

## Next Steps

1. Set up webhook handlers for real-time updates
2. Update frontend components to use new integration
3. Add bot scheduling controls for meetings
4. Implement meeting recording status display
