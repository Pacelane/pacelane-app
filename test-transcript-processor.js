// Test script for the transcript processor edge function
// This simulates a Read.ai webhook payload to test the user matching and transcript processing

const testPayload = {
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
};

// Function to test the transcript processor
async function testTranscriptProcessor() {
  try {
    console.log('🧪 Testing Transcript Processor...');
    console.log('📧 Test email:', testPayload.owner.email);
    console.log('📝 Test meeting:', testPayload.title);
    
    // This would be the actual call to your edge function
    // For now, we'll just log what would be sent
    console.log('\n📤 Payload to send to transcript-processor:');
    console.log(JSON.stringify(testPayload, null, 2));
    
    console.log('\n✅ Test payload created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Deploy the transcript-processor edge function');
    console.log('2. Test with this payload using curl or Postman');
    console.log('3. Check the console logs for processing details');
    console.log('4. Verify the transcript appears in the knowledge base UI');
    
  } catch (error) {
    console.error('❌ Error in test:', error);
  }
}

// Run the test
testTranscriptProcessor();

// Export for use in other scripts
module.exports = { testPayload, testTranscriptProcessor };

