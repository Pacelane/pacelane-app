// Test script to simulate a Read.ai webhook and test the complete flow
// This will trigger read-ai-webhook, which should then call transcript-processor

const testPayload = {
  session_id: "test-session-flow-456",
  trigger: "meeting_end",
  title: "Test Meeting Flow - Integration Test",
  start_time: "2025-08-14T10:00:00Z",
  end_time: "2025-08-14T11:00:00Z",
  participants: [
    {
      name: "João Baccarin",
      email: "baccarin@gotrakor.com"
    },
    {
      name: "Test Participant",
      email: "test@example.com"
    }
  ],
  owner: {
    name: "João Baccarin",
    email: "baccarin@gotraktor.com"
  },
  summary: "This is a test meeting to verify the complete webhook flow from Read.ai to transcript storage.",
  action_items: [
    {
      text: "Test action item 1"
    },
    {
      text: "Test action item 2"
    }
  ],
  key_questions: [
    {
      text: "How does the integration work?"
    },
    {
      text: "Is the transcript being stored correctly?"
    }
  ],
  topics: [
    {
      text: "Integration Testing"
    },
    {
      text: "Webhook Flow"
    }
  ],
  report_url: "https://read.ai/reports/test-session-flow-456",
  chapter_summaries: [
    {
      title: "Introduction",
      description: "Meeting setup and agenda",
      topics: [
        {
          text: "Agenda Review"
        }
      ]
    },
    {
      title: "Main Discussion",
      description: "Core meeting content",
      topics: [
        {
          text: "Integration Testing"
        }
      ]
    }
  ],
  transcript: {
    speakers: [
      {
        name: "João Baccarin"
      },
      {
        name: "Test Participant"
      }
    ],
    speaker_blocks: [
      {
        start_time: "00:00:00",
        end_time: "00:00:30",
        speaker: {
          name: "João Baccarin"
        },
        words: "Welcome everyone to this test meeting. Today we're going to test the complete webhook flow."
      },
      {
        start_time: "00:00:30",
        end_time: "00:01:00",
        speaker: {
          name: "Test Participant"
        },
        words: "Thank you for having me. I'm excited to see how this integration works."
      },
      {
        start_time: "00:01:00",
        end_time: "00:01:30",
        speaker: {
          name: "João Baccarin"
        },
        words: "Perfect! Let's dive into the details of our webhook integration and transcript processing."
      }
    ]
  }
};

console.log('🧪 Testing Complete Read.ai Webhook Flow');
console.log('=====================================');
console.log('📤 Sending webhook to read-ai-webhook function...');
console.log('📋 Payload details:');
console.log(`   - Session ID: ${testPayload.session_id}`);
console.log(`   - Owner Email: ${testPayload.owner.email}`);
console.log(`   - Meeting Title: ${testPayload.title}`);
console.log(`   - Transcript Blocks: ${testPayload.transcript.speaker_blocks.length}`);
console.log('');

console.log('🔄 Expected Flow:');
console.log('   1. read-ai-webhook receives payload');
console.log('   2. Stores meeting data in database');
console.log('   3. Calls transcript-processor');
console.log('   4. transcript-processor stores transcript in GCS');
console.log('   5. Updates knowledge_files table');
console.log('');

console.log('📝 Test Payload:');
console.log(JSON.stringify(testPayload, null, 2));
console.log('');

console.log('🚀 To test this flow:');
console.log('   1. Copy the payload above');
console.log('   2. Send POST request to your read-ai-webhook function');
console.log('   3. Check Supabase logs for both functions');
console.log('   4. Verify transcript appears in knowledge base UI');
console.log('   5. Check GCS for the new transcript file');
console.log('');

console.log('🔗 You can use curl or Postman to send this payload to:');
console.log('   https://plbgeabtrkdhbrnjonje.supabase.co/functions/v1/read-ai-webhook');
console.log('');
console.log('📊 Check these places for results:');
console.log('   - Supabase Dashboard > Functions > Logs');
console.log('   - Knowledge Base UI in your app');
console.log('   - GCS bucket: pacelane-whatsapp-user-eeinl');
console.log('   - Database tables: read_ai_webhooks, read_ai_meetings, knowledge_files');
