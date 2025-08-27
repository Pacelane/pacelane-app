# WhatsApp Message Reprocessing Guide

This guide explains how to reprocess old WhatsApp messages that failed to process initially, using the new reprocessing endpoint in the `@chatwoot-webhook/` function.

## 🎯 **What This Guide Covers**

- How to identify failed messages that need reprocessing
- How to extract JSON payloads from old messages
- How to use the reprocessing endpoint
- Batch processing strategies for multiple messages
- Troubleshooting common issues

## 📋 **Prerequisites**

- Access to Supabase Edge Functions
- Old WhatsApp message JSON files or database records
- User IDs for the messages you want to reprocess
- Supabase invoke credentials

## 🔍 **Step 1: Identify Failed Messages**

### **Check These Sources for Failed Messages:**

1. **Supabase Logs** - Look for errors in the `@chatwoot-webhook/` function
2. **Database Tables** - Check `audio_files` and `knowledge_files` tables
3. **GCS Storage** - Verify files exist in the correct buckets
4. **Knowledge Base** - Check if content appears in the RAG system

### **Common Failure Indicators:**

- ❌ `"Failed to process file: Import operation failed or timed out"`
- ❌ `"File verification failed: File ... not found in corpus"`
- ❌ `"No bucket found for user"`
- ❌ `"Failed to trigger RAG processing"`
- ❌ Missing transcription in `audio_files` table
- ❌ Missing content in knowledge base

## 📁 **Step 2: Extract Message JSON Payloads**

### **From Database Records:**

If you have the message ID, you can reconstruct the payload:

```sql
-- Get message details from your database
SELECT 
  m.id,
  m.content,
  m.created_at,
  m.sender_id,
  m.conversation_id,
  a.file_type,
  a.data_url,
  a.file_size
FROM messages m
LEFT JOIN attachments a ON m.id = a.message_id
WHERE m.id = 'YOUR_MESSAGE_ID';
```

### **From Chatwoot Export:**

If you exported data from Chatwoot, the JSON structure should look like:

```json
{
  "webhook_payload": {
    "account": {
      "id": 1,
      "name": "Pacelane"
    },
    "content_attributes": {
      "external_created_at": 1756243591
    },
    "content_type": "text",
    "content": null,
    "conversation": {
      "channel": "Channel::Whatsapp",
      "contact_inbox": {
        "source_id": "5511994888988"
      },
      "id": 47,
      "messages": [
        {
          "id": 2490,
          "attachments": [
            {
              "id": 232,
              "file_type": "audio",
              "data_url": "http://.../audio_3A297C6DA7D4C828EBBA_20250826.mp3",
              "file_size": 2371962,
              "transcribed_text": ""
            }
          ]
        }
      ]
    },
    "sender": {
      "id": 24,
      "name": "Michel (Mitch) Zetun",
      "phone_number": "+5511994888988"
    },
    "event": "message_created"
  }
}
```

## 🚀 **Step 3: Use the Reprocessing Endpoint**

### **Endpoint Details:**

- **URL**: `https://YOUR_SUPABASE_PROJECT.supabase.co/functions/v1/chatwoot-webhook`
- **Method**: `POST`
- **Action**: `reprocess_audio`

### **Request Format:**

```json
{
  "action": "reprocess_audio",
  "payload": {
    // Your WhatsApp message JSON payload here
  },
  "userId": "USER_UUID_HERE"
}
```

### **cURL Example:**

```bash
curl -L -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/chatwoot-webhook' \
  -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
  -H 'apikey: YOUR_SUPABASE_ANON_KEY' \
  -H 'Content-Type: application/json' \
  --data '{
    "action": "reprocess_audio",
    "payload": YOUR_JSON_PAYLOAD_HERE,
    "userId": "USER_UUID_HERE"
  }'
```

## 📊 **Step 4: Batch Processing Strategy**

### **Option 1: Sequential Processing (Recommended)**

Process messages one by one to avoid overwhelming the system:

```bash
#!/bin/bash

# List of message IDs to reprocess
MESSAGE_IDS=("2490" "2491" "2492" "2493")

for msg_id in "${MESSAGE_IDS[@]}"; do
  echo "🔄 Reprocessing message $msg_id..."
  
  # Your cURL command here
  curl -L -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/chatwoot-webhook' \
    -H 'Authorization: Bearer YOUR_KEY' \
    -H 'apikey: YOUR_KEY' \
    -H 'Content-Type: application/json' \
    --data "{
      \"action\": \"reprocess_audio\",
      \"payload\": $(cat "message_${msg_id}.json"),
      \"userId\": \"USER_UUID\"
    }"
  
  echo "✅ Message $msg_id processed"
  
  # Wait between requests to avoid rate limiting
  sleep 2
done
```

### **Option 2: Parallel Processing (Use with Caution)**

Process multiple messages simultaneously (may overwhelm the system):

```bash
#!/bin/bash

# Process messages in parallel (max 5 at once)
MAX_PARALLEL=5

for msg_id in "${MESSAGE_IDS[@]}"; do
  # Check if we're at max parallel processes
  while [ $(jobs -r | wc -l) -ge $MAX_PARALLEL ]; do
    sleep 1
  done
  
  # Process message in background
  (
    echo "🔄 Starting reprocessing for message $msg_id..."
    curl -L -X POST 'https://YOUR_PROJECT.supabase.co/functions/v1/chatwoot-webhook' \
      -H 'Authorization: Bearer YOUR_KEY' \
      -H 'apikey: YOUR_KEY' \
      -H 'Content-Type: application/json' \
      --data "{
        \"action\": \"reprocess_audio\",
        \"payload\": $(cat "message_${msg_id}.json"),
        \"userId\": \"USER_UUID\"
      }"
    echo "✅ Message $msg_id completed"
  ) &
done

# Wait for all background processes to complete
wait
echo "🎉 All messages processed!"
```

## 🔧 **Step 5: Monitoring and Verification**

### **Check Processing Status:**

1. **Monitor Supabase Logs** for the `@chatwoot-webhook/` function
2. **Verify Database Records** in `audio_files` and `knowledge_files` tables
3. **Check GCS Storage** for uploaded files
4. **Verify Knowledge Base** content appears in RAG system

### **Success Indicators:**

- ✅ `"🔄 Reprocessing audio message request received"`
- ✅ `"✅ Fresh transcription generated"`
- ✅ `"✅ Audio message reprocessed successfully"`
- ✅ Files appear in `audio_files` table
- ✅ Content appears in knowledge base

### **Common Issues and Solutions:**

| Issue | Solution |
|-------|----------|
| `"Message does not contain audio attachments"` | Verify the JSON payload has audio attachments |
| `"Failed to setup bucket"` | Check if the WhatsApp number exists in user mapping |
| `"Fresh transcription failed"` | Verify OpenAI API key and quota |
| `"RAG processing failed"` | Check knowledge base function logs |

## 📝 **Step 6: Create a Reprocessing Script**

### **Python Script Example:**

```python
import json
import requests
import time
from pathlib import Path

class WhatsAppReprocessor:
    def __init__(self, supabase_url, api_key):
        self.supabase_url = supabase_url
        self.api_key = api_key
        self.headers = {
            'Authorization': f'Bearer {api_key}',
            'apikey': api_key,
            'Content-Type': 'application/json'
        }
    
    def reprocess_message(self, payload, user_id):
        """Reprocess a single WhatsApp message"""
        data = {
            "action": "reprocess_audio",
            "payload": payload,
            "userId": user_id
        }
        
        response = requests.post(
            f"{self.supabase_url}/functions/v1/chatwoot-webhook",
            headers=self.headers,
            json=data
        )
        
        return response.json()
    
    def batch_reprocess(self, messages_data, delay=2):
        """Reprocess multiple messages with delay"""
        results = []
        
        for i, message_data in enumerate(messages_data):
            print(f"🔄 Processing message {i+1}/{len(messages_data)}")
            
            try:
                result = self.reprocess_message(
                    message_data['payload'],
                    message_data['userId']
                )
                results.append({
                    'message_id': message_data.get('message_id', f'msg_{i}'),
                    'success': result.get('success', False),
                    'result': result
                })
                
                if result.get('success'):
                    print(f"✅ Message {i+1} processed successfully")
                else:
                    print(f"❌ Message {i+1} failed: {result.get('message', 'Unknown error')}")
                
            except Exception as e:
                print(f"❌ Error processing message {i+1}: {e}")
                results.append({
                    'message_id': message_data.get('message_id', f'msg_{i}'),
                    'success': False,
                    'error': str(e)
                })
            
            # Wait between requests
            if i < len(messages_data) - 1:
                time.sleep(delay)
        
        return results

# Usage example
if __name__ == "__main__":
    # Configuration
    SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"
    API_KEY = "YOUR_SUPABASE_ANON_KEY"
    
    # Initialize reprocessor
    reprocessor = WhatsAppReprocessor(SUPABASE_URL, API_KEY)
    
    # Load messages from JSON files
    messages_dir = Path("./old_messages")
    messages_data = []
    
    for json_file in messages_dir.glob("*.json"):
        with open(json_file, 'r') as f:
            payload = json.load(f)
            messages_data.append({
                'message_id': json_file.stem,
                'payload': payload,
                'userId': 'USER_UUID_HERE'  # Replace with actual user ID
            })
    
    # Process all messages
    results = reprocessor.batch_reprocess(messages_data, delay=3)
    
    # Print summary
    successful = sum(1 for r in results if r['success'])
    print(f"\n🎉 Processing complete: {successful}/{len(results)} messages successful")
```

## 🚨 **Important Notes**

### **Rate Limiting:**
- **Supabase Edge Functions** have rate limits
- **OpenAI API** has rate limits for transcription
- **GCS Operations** may have quotas
- **Recommended delay**: 2-5 seconds between requests

### **Resource Considerations:**
- **Memory**: Each reprocessing request loads audio into memory
- **Storage**: Files are stored in GCS (check bucket quotas)
- **API Costs**: OpenAI transcription costs per audio file
- **Processing Time**: Each message takes 10-30 seconds

### **Error Handling:**
- **Always check response status** from the reprocessing endpoint
- **Log all failures** for manual review
- **Implement retry logic** for transient failures
- **Monitor system resources** during batch processing

## 📊 **Success Metrics**

Track these metrics to measure reprocessing success:

- **Total Messages**: Number of messages attempted
- **Successful Processing**: Messages that completed successfully
- **Transcription Success Rate**: Percentage of audio files transcribed
- **Knowledge Base Integration**: Percentage of content appearing in RAG
- **Processing Time**: Average time per message
- **Error Types**: Categorization of failures

## 🔄 **Maintenance and Updates**

### **Regular Tasks:**
- **Monitor reprocessing success rates**
- **Update user ID mappings** as needed
- **Clean up old JSON files** after successful processing
- **Review and optimize** batch processing strategies

### **Future Improvements:**
- **Automated failure detection** and reprocessing
- **Scheduled batch processing** during off-peak hours
- **Progress tracking** and resume capabilities
- **Integration with monitoring systems**

---

## 📞 **Support and Troubleshooting**

If you encounter issues:

1. **Check Supabase Logs** for detailed error messages
2. **Verify JSON payload structure** matches expected format
3. **Confirm user IDs** exist in the system
4. **Check API quotas** and rate limits
5. **Review this guide** for common solutions

For additional support, refer to the main project documentation or create an issue in the project repository.
