# Audio Transcription Feature for AI Assistant

## Overview

The AI Assistant now automatically transcribes audio files from the Knowledge Base using OpenAI's Whisper API. This allows users to get AI assistance based on audio content such as meeting recordings, voice notes, and other audio files.

## Features

- **Automatic Transcription**: When a user selects an audio file in the AI Assistant, it automatically transcribes the audio using OpenAI Whisper
- **Intelligent Caching**: Transcriptions are stored in the database to avoid re-transcribing the same file
- **Multiple Audio Formats**: Supports MP3, WAV, M4A, WebM, OGG, FLAC, and AAC
- **Portuguese Language Support**: Optimized for Portuguese (pt-BR) transcription for better accuracy
- **Status Tracking**: Tracks transcription status (pending, processing, completed, failed) for better UX
- **Graceful Degradation**: If transcription fails or API key is not configured, the system handles it gracefully

## Implementation Details

### Database Changes

Two migrations add transcription fields to the `knowledge_files` table:

#### Migration 1: Basic Transcription Fields
```sql
-- File: supabase/migrations/20251014000000_add_transcription_to_knowledge_files.sql

ALTER TABLE public.knowledge_files
ADD COLUMN IF NOT EXISTS transcription TEXT,
ADD COLUMN IF NOT EXISTS transcription_status TEXT CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS transcription_error TEXT,
ADD COLUMN IF NOT EXISTS transcribed_at TIMESTAMP WITH TIME ZONE;
```

**Columns:**
- `transcription`: The full text transcription of the audio file
- `transcription_status`: Current status of transcription (pending, processing, completed, failed)
- `transcription_error`: Error message if transcription failed
- `transcribed_at`: Timestamp when transcription was completed

#### Migration 2: Retry Logic
```sql
-- File: supabase/migrations/20251014000001_add_transcription_retry_logic.sql

ALTER TABLE public.knowledge_files
ADD COLUMN IF NOT EXISTS transcription_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_transcription_attempt_at TIMESTAMP WITH TIME ZONE;
```

**Additional Columns:**
- `transcription_attempts`: Number of times transcription has been attempted
- `last_transcription_attempt_at`: Timestamp of the last transcription attempt

### Edge Function Changes

The `ai-assistant` Edge Function now includes:

1. **OpenAI API Key Check**: Validates the OPENAI_API_KEY environment variable
2. **Audio File Detection**: Identifies audio files by extension
3. **Transcription Flow**:
   - Checks if transcription already exists
   - If not, downloads the audio file from GCS
   - Calls OpenAI Whisper API
   - Stores transcription in database
   - Uses transcription as context for AI
4. **Intelligent Retry Logic**: Automatically retries failed transcriptions with exponential backoff
5. **Error Handling**: Properly handles and logs transcription failures

### Retry Logic Details

The system implements smart retry logic for failed transcriptions:

**Retry Strategy:**
- **Maximum Attempts**: 3 attempts per file
- **Exponential Backoff**: Waits longer between each retry
  - Attempt 1: Immediate
  - Attempt 2: Wait 1 minute after first failure
  - Attempt 3: Wait 5 minutes after second failure
  - After 3 failures: Wait 15 minutes before giving up

**How it works:**
1. **First Failure**: Mark as `failed`, set `transcription_attempts = 1`
2. **User Tries Again**: If >1 minute passed, retry automatically (attempt 2)
3. **Second Failure**: Mark as `failed`, set `transcription_attempts = 2`
4. **User Tries Again**: If >5 minutes passed, retry automatically (attempt 3)
5. **Third Failure**: Mark as permanently failed after 3 attempts
6. **Max Attempts Reached**: Show "transcription failed after 3 attempts"

**Benefits:**
- Handles temporary API failures (timeouts, rate limits)
- Prevents infinite retry loops
- Doesn't spam OpenAI API
- User doesn't need to manually retry
- Transparent feedback on retry status

### Frontend Changes

The frontend now sends file IDs along with file contexts to enable database lookups:

```typescript
// src/types/content.ts - Updated FileContext interface
export interface FileContext {
  id?: string;          // Added: File ID for database lookup
  name: string;
  type: FileType;
  url?: string;
}

// src/api/content.ts - Include file ID when sending to AI
const fileContexts: FileContext[] = selectedFiles.map(file => ({
  id: file.id,          // Added: Include file ID
  name: file.name,
  type: file.type,
  url: file.url
}));
```

## Setup Instructions

### 1. Apply Database Migration

```bash
# Navigate to project root
cd /Users/joaoangelobaccarin/Documents/pacelane/pacelane-app

# Apply the migration
supabase db push
```

### 2. Set OpenAI API Key

You need to set the `OPENAI_API_KEY` environment variable in Supabase:

#### Option A: Supabase Dashboard (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to Settings → Edge Functions → Secrets
4. Add a new secret:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (starts with `sk-`)

#### Option B: Using Supabase CLI
```bash
# Set the secret using CLI
supabase secrets set OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. Get OpenAI API Key

If you don't have an OpenAI API key:
1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign in or create an account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### 4. Deploy Edge Function

```bash
# Deploy the updated ai-assistant function
supabase functions deploy ai-assistant
```

## Usage

### User Flow

1. **Upload Audio File**: User uploads an audio file to Knowledge Base (MP3, WAV, M4A, etc.)
2. **Select in AI Assistant**: User selects the audio file when chatting with AI Assistant
3. **Automatic Transcription**: System automatically:
   - Detects it's an audio file
   - Checks if transcription exists
   - If not, transcribes using Whisper API
   - Stores transcription in database
   - Provides transcription to AI as context
4. **AI Response**: AI responds based on audio content

### Supported Audio Formats

- **MP3** (`.mp3`) - Most common format
- **WAV** (`.wav`) - Uncompressed audio
- **M4A** (`.m4a`) - Apple audio format
- **WebM** (`.webm`) - Web audio format
- **OGG** (`.ogg`) - Open format
- **FLAC** (`.flac`) - Lossless compression
- **AAC** (`.aac`) - Advanced audio coding

## Technical Details

### Transcription Process

1. **File Detection**: Edge function checks file extension to identify audio files
2. **Database Lookup**: Queries `knowledge_files` table for existing transcription
3. **Status Check**: 
   - If `completed` → Use existing transcription
   - If `processing` → Inform user it's in progress
   - If `failed` → Show previous error
   - If `null` or `pending` → Start new transcription
4. **File Download**: Downloads audio from GCS using authenticated API
5. **Whisper API Call**: 
   - Model: `whisper-1`
   - Language: `pt` (Portuguese)
   - Response format: `text` (plain text)
6. **Database Update**: Stores transcription and status
7. **Context Integration**: Adds transcription to AI context

### OpenAI Whisper API Details

**Endpoint**: `https://api.openai.com/v1/audio/transcriptions`

**Request Format**:
```typescript
const formData = new FormData();
formData.append('file', audioBlob, filename);
formData.append('model', 'whisper-1');
formData.append('language', 'pt'); // Portuguese
formData.append('response_format', 'text');
```

**Response**: Plain text transcription

**Cost**: Check [OpenAI Pricing](https://openai.com/pricing) for Whisper API costs

### Performance Considerations

- **First-time transcription**: May take 10-30 seconds depending on audio length
- **Subsequent uses**: Instant (uses cached transcription from database)
- **Max file size**: OpenAI Whisper supports files up to 25 MB
- **Long audio**: Longer audio files take more time to transcribe

## Error Handling

The system handles various error scenarios gracefully:

### API Key Not Configured
```
[AUDIO_FILE] audio_file.mp3 (transcription unavailable - API key not configured)
```

### Transcription Failed - First Attempt
```
[AUDIO_FILE] audio_file.mp3 (transcription failed, will retry in 1 minutes)
```

### Transcription Failed - Retry Available
```
[AUDIO_FILE] audio_file.mp3 (transcription failed, will retry in 5 minutes)
```

### Transcription Failed - Max Attempts Reached
```
[AUDIO_FILE] audio_file.mp3 (transcription failed after 3 attempts: [error message])
```

### File Not Accessible
```
[AUDIO_FILE] audio_file.mp3 (file not accessible)
```

### Processing in Progress
```
[AUDIO_FILE] audio_file.mp3 (transcription in progress)
```

### Successful Transcription
```
[AUDIO_FILE] audio_file.mp3

Transcription:
[full transcription text here]
```

## Monitoring

### Check Transcription Status

You can query the database to check transcription status:

```sql
-- View all audio files with their transcription status
SELECT 
  name,
  transcription_status,
  transcription_attempts,
  transcription_error,
  transcribed_at,
  last_transcription_attempt_at,
  CHAR_LENGTH(transcription) as transcription_length
FROM knowledge_files
WHERE type = 'audio'
ORDER BY created_at DESC;

-- Find files that need retry
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

-- View retry statistics
SELECT 
  transcription_status,
  transcription_attempts,
  COUNT(*) as count
FROM knowledge_files
WHERE type = 'audio'
GROUP BY transcription_status, transcription_attempts
ORDER BY transcription_status, transcription_attempts;
```

### Edge Function Logs

Check logs in Supabase Dashboard → Edge Functions → ai-assistant:
- `"Detected audio file: [filename]"` - Audio file detected
- `"Creating transcription for [filename]"` - Starting first transcription attempt
- `"Retrying transcription for [filename] (attempt 2/3)"` - Retrying after first failure
- `"Retrying transcription for [filename] (attempt 3/3)"` - Final retry attempt
- `"Successfully saved transcription for [filename] on attempt X"` - Transcription complete
- `"Max transcription attempts reached for [filename] (3/3)"` - All retries exhausted
- `"Waiting Xmin before retrying [filename]"` - Backoff period active
- `"Error transcribing audio file [filename]"` - Transcription error

## Troubleshooting

### Issue: "Transcription unavailable - API key not configured"

**Solution**: Set the `OPENAI_API_KEY` environment variable in Supabase (see Setup Instructions)

### Issue: Transcription fails repeatedly

**Possible causes**:
1. Audio file is corrupted or unsupported format
2. File is too large (>25 MB)
3. GCS download fails (check permissions)
4. OpenAI API rate limit exceeded

**Solution**: 
- Check Edge Function logs for detailed error messages
- Verify audio file is valid and playable
- Check OpenAI API status and rate limits

### Issue: Transcription takes too long

**Expected behavior**: 
- First transcription: 10-30 seconds (depending on audio length)
- Subsequent uses: Instant (uses cached transcription)

**If consistently slow**:
- Check OpenAI API status
- Verify network connectivity
- Consider audio file size (large files take longer)

## Future Enhancements

Potential improvements for future versions:

1. **Background Processing**: Move transcription to background job for better UX
2. **Batch Transcription**: Allow users to transcribe multiple files at once
3. **Speaker Diarization**: Identify different speakers in the audio
4. **Timestamp Markers**: Add timestamps to transcription for navigation
5. **Transcription Editor**: Allow users to view and edit transcriptions
6. **Alternative Models**: Support for other transcription models (Deepgram, AssemblyAI)
7. **Multilingual Support**: Better support for mixed-language audio

## Cost Estimation

OpenAI Whisper API pricing (as of 2024):
- **$0.006 per minute** of audio

Examples:
- 5-minute meeting: $0.03
- 30-minute podcast: $0.18
- 1-hour interview: $0.36
- 100 hours of audio: $36.00

**Note**: Check current [OpenAI Pricing](https://openai.com/pricing) for up-to-date costs.

## Security Considerations

1. **API Key Storage**: OpenAI API key stored securely in Supabase Edge Function secrets
2. **Authentication**: Only authenticated users can trigger transcriptions
3. **RLS Policies**: Knowledge files protected by Row Level Security
4. **GCS Access**: Audio files downloaded using service account with proper permissions
5. **Data Privacy**: Transcriptions stored in user's own database instance

## Related Files

- `supabase/migrations/20251014000000_add_transcription_to_knowledge_files.sql` - Database schema
- `supabase/functions/ai-assistant/index.ts` - Edge function with transcription logic
- `src/types/content.ts` - TypeScript interfaces
- `src/api/content.ts` - API client methods
- `docs/features/AUDIO_TRANSCRIPTION_FEATURE.md` - This documentation

## Support

For issues or questions:
1. Check Edge Function logs in Supabase Dashboard
2. Review this documentation
3. Check OpenAI API status at [status.openai.com](https://status.openai.com)
4. Contact development team

