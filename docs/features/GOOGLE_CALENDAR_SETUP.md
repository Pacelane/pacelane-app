# Google Calendar Integration Setup

This guide walks you through setting up Google Calendar integration for Pacelane.

## Prerequisites

- Google Cloud Project with billing enabled
- Supabase project configured
- Access to your application's environment variables

## Step 1: Google Cloud Project Setup

### 1.1 Create/Select Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Make sure billing is enabled for the project

### 1.2 Enable Google Calendar API

1. Navigate to **APIs & Services** > **Library**
2. Search for "Google Calendar API"
3. Click on "Google Calendar API" and click **Enable**

### 1.3 Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** (or Internal if using Google Workspace)
3. Fill in the required information:
   - **App name**: Pacelane
   - **User support email**: Your support email
   - **Developer contact information**: Your email
4. Add your domain to **Authorized domains** (e.g., `pacelane.com`)
5. Click **Save and Continue**
6. Add the following scopes:
   - `../auth/calendar.readonly`
   - `../auth/calendar.events.readonly`
7. Continue through the remaining steps

### 1.4 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth client ID**
3. Choose **Web application**
4. Set the name: "Pacelane Calendar Integration"
5. Add **Authorized redirect URIs**:
   - For development: `http://localhost:5173/auth/google-calendar/callback`
   - For staging: `https://staging.pacelane.com/auth/google-calendar/callback`
   - For production: `https://app.pacelane.com/auth/google-calendar/callback`
6. Click **Create**
7. **Copy the Client ID and Client Secret** - you'll need these for environment variables

## Step 2: Environment Variables Setup

### 2.1 Supabase Edge Function Environment Variables

You need to set these environment variables in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** > **Manage**
3. Go to **Settings** tab and add these secrets:

```bash
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google-calendar/callback
```

### 2.2 Set Environment Variables via Supabase CLI

If you're using the Supabase CLI, you can set these secrets:

```bash
# Set Google OAuth credentials
supabase secrets set GOOGLE_CLIENT_ID=your_google_client_id_here
supabase secrets set GOOGLE_CLIENT_SECRET=your_google_client_secret_here
supabase secrets set GOOGLE_REDIRECT_URI=https://your-domain.com/auth/google-calendar/callback
```

### 2.3 Local Development

For local development, create a `.env.local` file in your Supabase functions directory:

```bash
# supabase/functions/.env.local
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5173/auth/google-calendar/callback
```

## Step 3: Database Migration

Run the Google Calendar database migration:

```bash
supabase db push
```

This will create the necessary tables:
- `user_calendars` - Stores connected Google Calendar accounts
- `calendar_events` - Stores synced calendar events

## Step 4: Deploy Edge Function

Deploy the Google Calendar sync Edge Function:

```bash
supabase functions deploy google-calendar-sync
```

## Step 5: Testing the Integration

### 5.1 Local Testing

1. Start your local development server:
   ```bash
   npm run dev
   ```

2. Navigate to your app and try connecting a Google Calendar
3. Check the browser console and Supabase logs for any errors

### 5.2 Production Testing

1. Deploy your application to your production environment
2. Update the OAuth redirect URI in Google Cloud Console if needed
3. Test the complete OAuth flow

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" error**
   - Ensure the redirect URI in your Google Cloud Console matches exactly the one in your environment variables
   - Check for trailing slashes and http vs https

2. **"invalid_client" error**
   - Verify your Client ID and Client Secret are correct
   - Make sure the OAuth consent screen is properly configured

3. **"access_denied" error**
   - User denied permission during OAuth flow
   - Check if your OAuth consent screen is in testing mode and user is not added as a test user

4. **Token refresh issues**
   - Ensure your application properly handles token refresh
   - Check the `refresh_token` is being stored and used correctly

### Useful Commands

```bash
# Check Supabase secrets
supabase secrets list

# View Edge Function logs
supabase functions logs google-calendar-sync

# Test Edge Function locally
supabase functions serve --no-verify-jwt
```

## Security Considerations

1. **Never expose secrets**: Don't commit Client Secret to version control
2. **Use HTTPS**: Always use HTTPS in production for OAuth callbacks
3. **Validate tokens**: Always validate and refresh tokens before use
4. **Scope limitation**: Only request necessary calendar scopes
5. **User consent**: Clearly explain what calendar data you're accessing

## Next Steps

After completing setup:

1. Test the integration thoroughly
2. Monitor Edge Function logs for errors
3. Set up proper error handling and user notifications
4. Consider implementing calendar event filtering based on your use case
5. Add calendar sync scheduling for regular updates

## Support

If you encounter issues:

1. Check Supabase Edge Function logs
2. Verify all environment variables are set correctly
3. Test OAuth flow step by step
4. Review Google Calendar API quotas and limits
