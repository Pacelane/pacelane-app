#!/bin/bash

# Test script for the transcript processor edge function
# This script tests the edge function with the dummy payload

echo "🧪 Testing Transcript Processor Edge Function"
echo "=============================================="

# Configuration - Updated with actual Supabase project details
SUPABASE_URL="https://plbgeabtrkdhbrnjonje.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYmdlYWJ0cmtkaGJybmpvbmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMTgyOTgsImV4cCI6MjA2ODg5NDI5OH0.2FG5O_b30qwOxwS86c4S44IMueW-zE2AfuxJTB4J25M"

# Test payload file
PAYLOAD_FILE="test-transcript-processor.js"

echo "📧 Test email: baccarin@gotraktor.com"
echo "📝 Test meeting: Test Meeting - Content Strategy Discussion"
echo ""

# Extract the test payload from the JS file and format it for curl
echo "📤 Sending test payload to transcript-processor..."
echo ""

# Create a temporary JSON file with just the payload
cat > temp-payload.json << 'EOF'
{
  "owner": {
    "name": "João Angelo Baccarin",
    "email": "baccarin@gotraktor.com",
    "last_name": "Baccarin",
    "first_name": "João Angelo"
  },
  "title": "Test Meeting - Content Strategy Discussion",
  "topics": [
    {
      "text": "Content creation strategy for LinkedIn posts"
    },
    {
      "text": "AI-powered content generation improvements"
    },
    {
      "text": "User engagement and pacing optimization"
    }
  ],
  "summary": "This test meeting discussed the current state of content generation in Pacelane and identified key areas for improvement. The team discussed implementing better AI infrastructure, improving the pacing notification system, and fixing the webhook user matching issue. Key action items include creating a transcript processor, implementing RAG capabilities, and testing the complete pipeline.",
  "trigger": "meeting_end",
  "end_time": "2025-08-14T16:00:00-03:00",
  "platform": "meet",
  "report_url": "https://app.read.ai/analytics/meetings/test-session-123",
  "session_id": "test-session-123",
  "start_time": "2025-08-14T15:00:00-03:00",
  "transcript": {
    "speakers": [
      {
        "name": "João Angelo"
      },
      {
        "name": "AI Assistant"
      }
    ],
    "speaker_blocks": [
      {
        "words": "Welcome to our test meeting about content strategy.",
        "speaker": {
          "name": "João Angelo"
        },
        "end_time": 1754935260000,
        "start_time": 1754935250000
      },
      {
        "words": "Thank you for having me. I'm excited to discuss the content generation improvements.",
        "speaker": {
          "name": "AI Assistant"
        },
        "end_time": 1754935270000,
        "start_time": 1754935260000
      },
      {
        "words": "Let's start with the current issues. We have a webhook that receives meeting transcripts but the user matching isn't working properly.",
        "speaker": {
          "name": "João Angelo"
        },
        "end_time": 1754935280000,
        "start_time": 1754935270000
      },
      {
        "words": "I understand. The issue is that the webhook tries to match owner.email to profiles.email, but profiles table doesn't have an email field.",
        "speaker": {
          "name": "AI Assistant"
        },
        "end_time": 1754935290000,
        "start_time": 1754935280000
      },
      {
        "words": "Exactly! We need to fix this to use auth.users.email instead, which is safer and more reliable.",
        "speaker": {
          "name": "João Angelo"
        },
        "end_time": 1754935300000,
        "start_time": 1754935290000
      },
      {
        "words": "Perfect. I'll create a transcript processor that fixes the user matching and stores transcripts in the knowledge base for RAG usage.",
        "speaker": {
          "name": "AI Assistant"
        },
        "end_time": 1754935310000,
        "start_time": 1754935300000
      }
    ]
  },
  "action_items": [
    {
      "text": "Create transcript processor edge function to fix user matching"
    },
    {
      "text": "Implement transcript storage in user knowledge base"
    },
    {
      "text": "Test the complete pipeline with dummy payload"
    }
  ],
  "participants": [
    {
      "name": "João Angelo Baccarin",
      "email": "baccarin@gotraktor.com",
      "last_name": "Baccarin",
      "first_name": "João Angelo"
    },
    {
      "name": "AI Assistant",
      "email": null,
      "last_name": null,
      "first_name": "AI"
    }
  ],
  "key_questions": [
    {
      "text": "How can we improve the content generation quality?"
    },
    {
      "text": "What's the best approach for implementing RAG capabilities?"
    },
    {
      "text": "How should we organize transcripts in the knowledge base?"
    }
  ],
  "chapter_summaries": [
    {
      "title": "Current State Analysis",
      "topics": [],
      "description": "Discussed the current issues with webhook processing and user matching in the Pacelane system."
    },
    {
      "title": "Solution Design",
      "topics": [
        "Content creation strategy for LinkedIn posts"
      ],
      "description": "Designed a solution that fixes user matching using auth.users.email and processes transcripts for knowledge base storage."
    },
    {
      "title": "Implementation Plan",
      "topics": [
        "AI-powered content generation improvements"
      ],
      "description": "Created a plan to implement transcript processing, knowledge base storage, and RAG preparation."
    }
  ],
  "platform_meeting_id": "test-platform-123"
}
EOF

# Test the transcript processor edge function
echo "🚀 Testing transcript-processor edge function..."
echo ""

curl -X POST \
  "${SUPABASE_URL}/functions/v1/transcript-processor" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d @temp-payload.json

echo ""
echo ""
echo "🧹 Cleaning up temporary files..."
rm temp-payload.json

echo ""
echo "✅ Test completed!"
echo ""
echo "📋 Next steps:"
echo "1. Check the edge function console logs for processing details"
echo "2. Verify the transcript appears in the knowledge base UI"
echo "3. Check if the file is stored in GCS under the user's bucket"
echo "4. Verify the file metadata is stored in knowledge_files table"
echo ""
echo "🔍 To check the logs, go to your Supabase dashboard > Edge Functions > transcript-processor > Logs"
