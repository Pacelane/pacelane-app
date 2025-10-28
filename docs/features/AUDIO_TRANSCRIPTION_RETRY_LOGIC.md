# Audio Transcription Retry Logic

## Overview

The audio transcription feature now includes intelligent retry logic to handle temporary failures and improve reliability. Instead of giving up after the first failure, the system will automatically retry transcriptions with exponential backoff.

## Problem Solved

**Before**: If a transcription failed once (due to temporary API issues, timeouts, rate limits, etc.), it was marked as permanently failed and would never be retried.

**After**: Failed transcriptions are automatically retried up to 3 times with increasing wait times between attempts.

## How It Works

### Retry Strategy

The system uses exponential backoff to gradually increase the wait time between retries:

| Attempt | Timing | Backoff Time | Status |
|---------|--------|--------------|--------|
| 1 | Immediate | None | First attempt |
| 2 | After 1 minute | 1 minute | First retry |
| 3 | After 5 minutes | 5 minutes | Second retry |
| Failed | After 15 minutes | Permanent | All attempts exhausted |

### User Experience Flow

#### Scenario 1: First Failure
```
1. User selects audio file → Transcription starts (attempt 1)
2. Transcription fails → Status: "will retry in 1 minutes"
3. User selects same file after 1+ minute → Automatic retry (attempt 2)
4. Transcription succeeds → AI can now use content!
```

#### Scenario 2: Multiple Failures
```
1. User selects audio file → Transcription starts (attempt 1)
2. First failure → Status: "will retry in 1 minutes"
3. User tries after 1+ minute → Automatic retry (attempt 2)
4. Second failure → Status: "will retry in 5 minutes"
5. User tries after 5+ minutes → Final retry (attempt 3)
6. Third failure → Status: "failed after 3 attempts: [error]"
```

#### Scenario 3: Waiting for Backoff
```
1. Transcription failed on attempt 2 → Waiting 5 minutes
2. User tries immediately (before 5 min) → Status: "will retry in 3 minutes"
3. User waits and tries after 5 min → Automatic retry (attempt 3)
```

## Implementation Details

### Database Fields

Two new columns track retry state:

```sql
-- Number of attempts made (0-3)
transcription_attempts INTEGER DEFAULT 0

-- Timestamp of last attempt (for backoff calculation)
last_transcription_attempt_at TIMESTAMP WITH TIME ZONE
```

### Retry Logic Code

```typescript
// Check if retry is allowed
const MAX_ATTEMPTS = 3;
const attempts = existingFile.transcription_attempts || 0;
const lastAttempt = existingFile.last_transcription_attempt_at;

// Calculate backoff time (exponential)
const backoffMinutes = [1, 5, 15][Math.min(attempts, 2)];
const backoffMs = backoffMinutes * 60 * 1000;

// Check if enough time has passed
const canRetry = !lastAttempt || 
  (Date.now() - new Date(lastAttempt).getTime() > backoffMs);

// Retry if under max attempts and backoff period passed
if (attempts < MAX_ATTEMPTS && canRetry) {
  await attemptTranscription(/* ... */, attempts + 1);
}
```

### Status Updates

Every transcription attempt updates the database:

```typescript
// Before transcription
await supabase.from('knowledge_files').update({
  transcription_status: 'processing',
  last_transcription_attempt_at: new Date().toISOString()
});

// On success
await supabase.from('knowledge_files').update({
  transcription: transcription,
  transcription_status: 'completed',
  transcribed_at: new Date().toISOString(),
  transcription_error: null,
  transcription_attempts: attemptNumber
});

// On failure
await supabase.from('knowledge_files').update({
  transcription_status: 'failed',
  transcription_error: `Failed to transcribe audio (attempt ${attemptNumber})`,
  transcription_attempts: attemptNumber
});
```

## User Feedback Messages

The system provides clear, actionable feedback to users:

### During Backoff Period
```
[AUDIO_FILE] meeting_notes.mp3 (transcription failed, will retry in 3 minutes)
```

### After Max Attempts
```
[AUDIO_FILE] meeting_notes.mp3 (transcription failed after 3 attempts: [error message])
```

### Retry in Progress
```
[AUDIO_FILE] meeting_notes.mp3 (transcription in progress)
```

### Success After Retry
```
[AUDIO_FILE] meeting_notes.mp3

Transcription:
[full transcription text here]
```

## Benefits

1. **Handles Temporary Failures**: API timeouts, rate limits, network issues
2. **Improves Success Rate**: Many failures are temporary and succeed on retry
3. **User-Friendly**: Automatic retry without manual intervention
4. **Cost-Effective**: Exponential backoff prevents API spam
5. **Transparent**: Clear feedback on retry status and wait times
6. **Prevents Infinite Loops**: Max 3 attempts, then permanent failure

## Monitoring Retry Status

### Check Failed Files Eligible for Retry

```sql
SELECT 
  name,
  transcription_attempts,
  transcription_error,
  last_transcription_attempt_at,
  EXTRACT(EPOCH FROM (NOW() - last_transcription_attempt_at))/60 as minutes_since_last_attempt
FROM knowledge_files
WHERE type = 'audio' 
  AND transcription_status = 'failed'
  AND transcription_attempts < 3
ORDER BY last_transcription_attempt_at DESC;
```

### View Retry Statistics

```sql
SELECT 
  transcription_status,
  transcription_attempts,
  COUNT(*) as count,
  ROUND(AVG(transcription_attempts), 2) as avg_attempts
FROM knowledge_files
WHERE type = 'audio'
GROUP BY transcription_status, transcription_attempts
ORDER BY transcription_status, transcription_attempts;
```

**Example output**:
```
transcription_status | transcription_attempts | count | avg_attempts
---------------------|------------------------|-------|-------------
completed            | 1                      | 45    | 1.00
completed            | 2                      | 12    | 2.00
completed            | 3                      | 3     | 3.00
failed               | 1                      | 2     | 1.00
failed               | 2                      | 1     | 2.00
failed               | 3                      | 1     | 3.00
```

### Find Files Needing Manual Intervention

```sql
-- Files that failed all 3 attempts
SELECT 
  name,
  transcription_error,
  last_transcription_attempt_at
FROM knowledge_files
WHERE type = 'audio'
  AND transcription_status = 'failed'
  AND transcription_attempts >= 3
ORDER BY last_transcription_attempt_at DESC;
```

## Edge Function Logs

Look for these log messages to track retry behavior:

```
✅ "Creating transcription for [filename]"
   → First attempt

✅ "Retrying transcription for [filename] (attempt 2/3)"
   → First retry after 1-minute wait

✅ "Retrying transcription for [filename] (attempt 3/3)"
   → Final retry after 5-minute wait

✅ "Successfully saved transcription for [filename] on attempt 2"
   → Success after retry!

⚠️ "Max transcription attempts reached for [filename] (3/3)"
   → All retries exhausted

ℹ️ "Waiting 3min before retrying [filename]"
   → Still in backoff period
```

## Common Scenarios

### Scenario: Temporary Rate Limit

1. **Attempt 1**: Fails due to OpenAI rate limit
2. **Wait 1 minute**: Rate limit resets
3. **Attempt 2**: Succeeds!
4. **Result**: User gets transcription without knowing about the failure

### Scenario: Network Timeout

1. **Attempt 1**: Fails due to network timeout (slow connection)
2. **Wait 1 minute**: Network stabilizes
3. **Attempt 2**: Succeeds!
4. **Result**: Seamless experience for user

### Scenario: Corrupted Audio File

1. **Attempt 1**: Fails - OpenAI can't decode audio
2. **Wait 1 minute**: File is still corrupted
3. **Attempt 2**: Fails - Same error
4. **Wait 5 minutes**: File is still corrupted
5. **Attempt 3**: Fails - Same error
6. **Result**: Marked as permanently failed after 3 attempts

### Scenario: API Key Invalid

1. **Attempt 1**: Fails - Invalid API key
2. **Admin fixes API key**: Updates OPENAI_API_KEY
3. **Wait 1 minute**: New key is active
4. **Attempt 2**: Succeeds with new API key!
5. **Result**: Issue resolved without user intervention

## Troubleshooting

### Many Files Stuck at Attempt 1

**Symptom**: Most failures are on attempt 1, not progressing to retries

**Possible causes**:
- OpenAI API key is invalid or expired
- OpenAI account has no credits
- Network connectivity issues

**Solution**: Check API key, billing, and connectivity

### Many Files Reaching Max Attempts

**Symptom**: Most failures reach attempt 3

**Possible causes**:
- Audio files are corrupted or unsupported format
- Persistent API issues
- File size too large (>25MB)

**Solution**: 
- Verify audio file quality
- Check OpenAI API status
- Review file sizes

### Retries Not Happening

**Symptom**: Files stay at "will retry in X minutes" forever

**Possible causes**:
- Users not re-selecting the file after backoff period
- Edge function not deployed with retry logic

**Solution**:
- Instruct users to try again after wait time
- Redeploy edge function

## Best Practices

### For Administrators

1. **Monitor retry statistics** regularly to identify patterns
2. **Check OpenAI API status** if many retries are failing
3. **Review failed files** that reached max attempts
4. **Set up alerts** for high retry rates
5. **Keep API key valid** and account funded

### For Users

1. **Wait for backoff period** before trying again
2. **Check audio file quality** if it fails multiple times
3. **Ensure file size is under 25MB**
4. **Use supported formats**: MP3, WAV, M4A, WebM, OGG, FLAC, AAC

## Future Improvements

Potential enhancements to the retry system:

1. **Configurable retry limits**: Admin-adjustable max attempts
2. **Custom backoff times**: Different backoff strategies
3. **Priority retry queue**: Background job for automatic retries
4. **Notification system**: Alert users when retry succeeds
5. **Manual retry button**: UI button to force immediate retry
6. **Retry analytics dashboard**: Visual insights into retry patterns
7. **File validation**: Pre-check audio files before transcription
8. **Partial success handling**: Save partial transcriptions

## Related Documentation

- Main feature docs: `AUDIO_TRANSCRIPTION_FEATURE.md`
- Setup guide: `AUDIO_TRANSCRIPTION_SETUP.md`
- Changes summary: `AUDIO_TRANSCRIPTION_CHANGES_SUMMARY.md`

---

**Version**: 1.0.0  
**Date**: October 14, 2025  
**Status**: ✅ Implemented and Tested


