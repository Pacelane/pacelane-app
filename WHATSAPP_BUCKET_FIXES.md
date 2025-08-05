# WhatsApp Edge Function Bucket Creation Fixes

## Problem Identified

The WhatsApp edge function was creating new GCS buckets for each message instead of reusing existing buckets for the same user. This happened because:

1. **No Bucket Mapping**: The system didn't track which bucket belonged to which user
2. **Inconsistent User Matching**: WhatsApp number matching wasn't robust enough
3. **Always Generate New Buckets**: The logic always generated new bucket names instead of checking for existing ones

## Fixes Implemented

### 1. Added User Bucket Mapping Table

Created a new table `user_bucket_mapping` to track which bucket belongs to which user:

```sql
CREATE TABLE public.user_bucket_mapping (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one bucket per user
  UNIQUE(user_id),
  -- Ensure bucket names are unique
  UNIQUE(bucket_name)
);
```

### 2. Enhanced User Identification Logic

Improved the `findUserByWhatsAppNumber` method to:

- **Generate Number Variations**: Creates all possible formats of a WhatsApp number for matching
- **Robust Matching**: Tries multiple number formats (with/without country code, with/without 0 prefix)
- **Consistent Normalization**: Ensures numbers are normalized consistently

### 3. Bucket Reuse Logic

Updated the bucket selection logic to:

1. **Check Existing Bucket**: First look for an existing bucket mapping for the user
2. **Reuse if Found**: Use the existing bucket if a mapping exists
3. **Create Only if Needed**: Only create a new bucket if no mapping exists
4. **Store Mapping**: Save the bucket mapping for future use

### 4. Improved Logging

Added comprehensive logging to help debug bucket creation:

- Log when checking for existing buckets
- Log when creating new buckets
- Log bucket names being used
- Log user identification process

## Key Changes Made

### In `chatwoot-webhook/index.ts`:

1. **New Methods Added**:
   - `getUserBucketName()`: Retrieves existing bucket for user
   - `storeUserBucketMapping()`: Stores bucket mapping in database
   - `generateNumberVariations()`: Creates all possible number formats

2. **Updated Methods**:
   - `findUserByWhatsAppNumber()`: Now uses number variations for better matching
   - `processWebhook()`: Now checks for existing buckets before creating new ones
   - `ensureUserBucket()`: Added better logging

3. **Database Integration**:
   - Uses `user_bucket_mapping` table to track bucket assignments
   - Ensures one bucket per user
   - Prevents duplicate bucket creation

## Migration Required

Run the new migration to create the bucket mapping table:

```bash
supabase db push
```

This will create the `user_bucket_mapping` table with proper RLS policies.

## Testing

The fixes ensure that:

1. **Same User = Same Bucket**: Multiple messages from the same user go to the same bucket
2. **Robust Number Matching**: Handles various WhatsApp number formats
3. **No Duplicate Buckets**: Each user gets exactly one bucket
4. **Backward Compatibility**: Existing functionality remains intact

## Expected Behavior After Fix

- First message from a user: Creates new bucket and stores mapping
- Subsequent messages from same user: Reuses existing bucket
- Different users: Get different buckets
- Contact-based fallback: Still works for unidentified users

## Monitoring

Check the logs for these key messages:
- `"Using existing bucket: {bucketName} for user: {userId}"`
- `"Generated new bucket: {bucketName} for user: {userId}"`
- `"Bucket already exists: {bucketName}"`
- `"Successfully created bucket: {bucketName}"` 