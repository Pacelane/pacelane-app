#!/bin/bash

# Test script for the complete Read.ai webhook flow
# This tests read-ai-webhook -> transcript-processor integration

echo "🧪 Testing Complete Read.ai Webhook Flow"
echo "====================================="
echo ""

# Supabase configuration
SUPABASE_URL="https://plbgeabtrkdhbrnjonje.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYmdlYWJ0cmtkYnJubmpvbmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQxNzI4MDAsImV4cCI6MjA0OTc0ODgwMH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8"

# Test payload for the complete flow
PAYLOAD='{
  "session_id": "test-session-flow-456",
  "trigger": "meeting_end",
  "title": "Test Meeting Flow - Integration Test",
  "start_time": "2025-08-14T10:00:00Z",
  "end_time": "2025-08-14T11:00:00Z",
  "participants": [
    {
      "name": "João Baccarin",
      "email": "baccarin@gotraktor.com"
    },
    {
      "name": "Test Participant",
      "email": "test@example.com"
    }
  ],
  "owner": {
    "name": "João Baccarin",
    "email": "baccarin@gotraktor.com"
  },
  "summary": "This is a test meeting to verify the complete webhook flow from Read.ai to transcript storage.",
  "action_items": [
    {
      "text": "Test action item 1"
    },
    {
      "text": "Test action item 2"
    }
  ],
  "key_questions": [
    {
      "text": "How does the integration work?"
    },
    {
      "text": "Is the transcript being stored correctly?"
    }
  ],
  "topics": [
    {
      "text": "Integration Testing"
    },
    {
      "text": "Webhook Flow"
    }
  ],
  "report_url": "https://read.ai/reports/test-session-flow-456",
  "chapter_summaries": [
    {
      "title": "Introduction",
      "description": "Meeting setup and agenda",
      "topics": [
        {
          "text": "Agenda Review"
        }
      ]
    },
    {
      "title": "Main Discussion",
      "description": "Core meeting content",
      "topics": [
        {
          "text": "Integration Testing"
        }
      ]
    }
  ],
  "transcript": {
    "speakers": [
      {
        "name": "João Baccarin"
      },
      {
        "name": "Test Participant"
      }
    ],
    "speaker_blocks": [
      {
        "start_time": "00:00:00",
        "end_time": "00:00:30",
        "speaker": {
          "name": "João Baccarin"
        },
        "words": "Welcome everyone to this test meeting. Today we are going to test the complete webhook flow."
      },
      {
        "start_time": "00:00:30",
        "end_time": "00:01:00",
        "speaker": {
          "name": "Test Participant"
        },
        "words": "Thank you for having me. I am excited to see how this integration works."
      },
      {
        "start_time": "00:01:00",
        "end_time": "00:01:30",
        "speaker": {
          "name": "João Baccarin"
        },
        "words": "Perfect! Let us dive into the details of our webhook integration and transcript processing."
      }
    ]
  }
}'

echo "📤 Sending webhook to read-ai-webhook function..."
echo "🔗 URL: ${SUPABASE_URL}/functions/v1/read-ai-webhook"
echo "📋 Payload details:"
echo "   - Session ID: test-session-flow-456"
echo "   - Owner Email: baccarin@gotrakor.com"
echo "   - Meeting Title: Test Meeting Flow - Integration Test"
echo "   - Transcript Blocks: 3"
echo ""

echo "🔄 Expected Flow:"
echo "   1. read-ai-webhook receives payload"
echo "   2. Stores meeting data in database"
echo "   3. Calls transcript-processor"
echo "   4. transcript-processor stores transcript in GCS"
echo "   5. Updates knowledge_files table"
echo ""

echo "🚀 Sending POST request..."
echo ""

# Send the webhook
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d "$PAYLOAD" \
  "${SUPABASE_URL}/functions/v1/read-ai-webhook")

# Extract HTTP status and response body
HTTP_STATUS=$(echo "$RESPONSE" | tail -n1 | sed 's/HTTP_STATUS://')
RESPONSE_BODY=$(echo "$RESPONSE" | head -n -1)

echo "📊 Response:"
echo "   HTTP Status: $HTTP_STATUS"
echo "   Response Body: $RESPONSE_BODY"
echo ""

if [ "$HTTP_STATUS" = "200" ]; then
  echo "✅ Webhook sent successfully!"
  echo ""
  echo "📋 Next steps to verify:"
  echo "   1. Check Supabase Dashboard > Functions > Logs for both functions"
  echo "   2. Look for logs from read-ai-webhook and transcript-processor"
  echo "   3. Check your knowledge base UI for the new transcript"
  echo "   4. Verify the file appears in GCS bucket: pacelane-whatsapp-user-eeinl"
  echo "   5. Check database tables: read_ai_webhooks, read_ai_meetings, knowledge_files"
  echo ""
  echo "🔍 To check logs:"
  echo "   - Supabase Dashboard > Functions > read-ai-webhook > Logs"
  echo "   - Supabase Dashboard > Functions > transcript-processor > Logs"
  echo ""
  echo "📁 To check knowledge base:"
  echo "   - Open your app and go to Knowledge Base"
  echo "   - Look for: transcript_test-session-flow-456_2025-08-14.txt"
else
  echo "❌ Webhook failed with status: $HTTP_STATUS"
  echo "Response: $RESPONSE_BODY"
  echo ""
  echo "🔍 Check the error message above and verify:"
  echo "   1. Supabase URL is correct"
  echo "   2. Anon key is valid"
  echo "   3. Functions are deployed and running"
fi
