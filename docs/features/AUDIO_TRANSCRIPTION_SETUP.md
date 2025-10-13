# Quick Setup Guide: Audio Transcription Feature

## Prerequisites

- Supabase CLI installed and configured
- OpenAI API account and API key
- Access to Supabase project

## Step-by-Step Setup (5 minutes)

### Step 1: Apply Database Migration

```bash
# Navigate to project root
cd /Users/joaoangelobaccarin/Documents/pacelane/pacelane-app

# Apply the migration to add transcription columns
supabase db push
```

**Expected output**: Migration `20251014000000_add_transcription_to_knowledge_files.sql` applied successfully

### Step 2: Get OpenAI API Key

If you don't have an OpenAI API key yet:

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Give it a name (e.g., "Pacelane Audio Transcription")
5. Copy the key (starts with `sk-...`)
6. **IMPORTANT**: Save it somewhere safe - you won't be able to see it again!

### Step 3: Set Environment Variable in Supabase

#### Option A: Using Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/functions
2. Scroll to "Function Secrets"
3. Click "Add Secret"
4. Enter:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (paste the `sk-...` key)
5. Click "Save"

#### Option B: Using Supabase CLI

```bash
# Set the secret using CLI (replace with your actual key)
supabase secrets set OPENAI_API_KEY=sk-your-actual-openai-api-key-here

# Verify it was set
supabase secrets list
```

**Expected output**: You should see `OPENAI_API_KEY` in the list of secrets

### Step 4: Deploy Updated Edge Function

```bash
# Deploy the ai-assistant function with transcription support
supabase functions deploy ai-assistant

# Check deployment status
supabase functions list
```

**Expected output**: `ai-assistant` function deployed successfully

### Step 5: Verify Setup

Test the transcription feature:

1. Open your Pacelane app
2. Go to Knowledge Base
3. Upload an audio file (MP3, WAV, M4A, etc.)
4. Go to Content Editor
5. Open AI Assistant
6. Select the audio file
7. Send a message asking about the audio content
8. Wait for transcription (10-30 seconds for first time)
9. AI should respond based on the audio content!

### Step 6: Monitor Logs (Optional)

Check if everything is working:

```bash
# View Edge Function logs in real-time
supabase functions logs ai-assistant --follow
```

Look for log messages like:
- `"Detected audio file: [filename]"`
- `"Creating transcription for [filename]"`
- `"Successfully saved transcription for [filename]"`

## Troubleshooting

### Error: "OPENAI_API_KEY is not set"

**Solution**: Make sure you completed Step 3. The API key must be set as a Supabase secret.

### Error: "Invalid API key"

**Solution**: 
1. Verify your OpenAI API key is correct (starts with `sk-`)
2. Check if you have credits in your OpenAI account
3. Make sure the key hasn't been revoked

### Error: "Failed to download audio from GCS"

**Solution**: 
1. Verify GCS credentials are properly configured
2. Check if the audio file exists in GCS
3. Verify the file URL is correct

### Audio file is not being transcribed

**Check**:
1. Is the file type supported? (MP3, WAV, M4A, WebM, OGG, FLAC, AAC)
2. Is the file size under 25 MB?
3. Check Edge Function logs for error messages

## Verification Checklist

Before considering setup complete, verify:

- [ ] Database migration applied (check Supabase Dashboard → Database → Migrations)
- [ ] OPENAI_API_KEY secret is set (check Dashboard → Settings → Edge Functions)
- [ ] ai-assistant function is deployed (check Dashboard → Edge Functions)
- [ ] Can upload audio files to Knowledge Base
- [ ] Can select audio files in AI Assistant
- [ ] Audio files are being transcribed (check logs)
- [ ] AI can answer questions about audio content

## Cost Management

To keep costs under control:

1. **Monitor usage**: Check OpenAI usage at https://platform.openai.com/usage
2. **Set limits**: Set monthly spending limits in OpenAI account
3. **Cache transcriptions**: System automatically caches transcriptions to avoid re-transcribing
4. **Review regularly**: Review audio file uploads and transcription usage monthly

**Estimated costs**:
- Small meeting (5 min): $0.03
- Medium meeting (30 min): $0.18
- Long interview (1 hour): $0.36
- Very active user (100 hours/month): $36

## Next Steps

After setup:

1. **Test thoroughly**: Upload various audio files and test transcription
2. **Monitor performance**: Watch Edge Function logs for issues
3. **User training**: Inform users about the new audio transcription feature
4. **Cost tracking**: Monitor OpenAI API usage and costs
5. **Feedback**: Collect user feedback on transcription quality

## Support

If you encounter issues:

1. Check Edge Function logs: `supabase functions logs ai-assistant`
2. Review full documentation: `docs/features/AUDIO_TRANSCRIPTION_FEATURE.md`
3. Check OpenAI status: https://status.openai.com
4. Verify Supabase project health: Supabase Dashboard

## Quick Commands Reference

```bash
# Apply database migration
supabase db push

# Set OpenAI API key
supabase secrets set OPENAI_API_KEY=sk-your-key

# Deploy function
supabase functions deploy ai-assistant

# View logs
supabase functions logs ai-assistant --follow

# Check secrets
supabase secrets list

# Check functions
supabase functions list
```

## Rollback (If Needed)

If you need to rollback the changes:

```bash
# Revert database migration
supabase db reset

# Remove secret
supabase secrets unset OPENAI_API_KEY

# Redeploy old version of function (if you have a backup)
# Note: You should have a backup before making changes
```

**Warning**: Rolling back will remove all transcriptions from the database.

---

**Setup Time**: ~5 minutes  
**Difficulty**: Easy  
**Prerequisites**: OpenAI API key, Supabase CLI access

Ready to transcribe! 🎙️ → 📝

