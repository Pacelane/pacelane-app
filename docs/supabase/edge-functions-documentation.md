# Pacelane Edge Functions Documentation

This document provides a comprehensive overview of all Supabase Edge Functions in the Pacelane application, detailing their purpose, database interactions, and relationships.

## Overview

Pacelane uses 20 Supabase Edge Functions to handle various aspects of the platform:
- **AI & Content Generation**: Functions that use AI to create, analyze, and process content
- **File & Knowledge Management**: Functions that handle file uploads, storage, and knowledge base operations
- **Integrations**: Functions that connect to external services (WhatsApp, Google Calendar, LinkedIn, etc.)
- **Notifications**: Functions that handle user communications and alerts
- **Utilities**: Core infrastructure functions for job scheduling and data processing

## Database Schema Overview

### Key Tables Used by Edge Functions:

#### `knowledge_files`
```sql
CREATE TABLE public.knowledge_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('file', 'image', 'audio', 'video', 'link')),
  size BIGINT,
  url TEXT,
  storage_path TEXT,
  gcs_bucket TEXT,                    -- GCS bucket name
  gcs_path TEXT,                      -- GCS file path
  file_hash TEXT,                     -- SHA-256 hash for deduplication
  content_extracted BOOLEAN DEFAULT false,
  extracted_content TEXT,             -- Extracted text content
  extraction_metadata JSONB,          -- Metadata about extraction process
  metadata JSONB,                     -- Additional file metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `user_bucket_mapping`
```sql
CREATE TABLE public.user_bucket_mapping (
  user_id UUID NOT NULL,
  bucket_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### `rag_corpora`
```sql
CREATE TABLE public.rag_corpora (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  corpus_id TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

---

## Edge Functions Documentation

### 1. 🗂️ knowledge-base-storage

**Purpose**: Handles file uploads, storage, and content extraction for the knowledge base system.

**Main Operations**:
- Upload files to Google Cloud Storage (GCS)
- Extract text content from various file formats (TXT, MD, PDF, DOCX, etc.)
- Store file metadata in database
- Trigger RAG processing for uploaded files
- Handle WhatsApp content integration

**Database Interactions**:
- **INSERTS** into `knowledge_files` table
- **READS** from `user_bucket_mapping` table
- **INSERTS** into `user_bucket_mapping` table (via user-bucket-service)

**Related Functions**:
- Calls `user-bucket-service` to ensure GCS buckets exist
- Calls `vertex-ai-rag-processor` to process uploaded files for AI analysis

**Key Features**:
- Automatic content extraction from text files
- GCS bucket management per user
- File deduplication using SHA-256 hashes
- Support for WhatsApp content integration

---

### 2. 🤖 ai-assistant

**Purpose**: Provides conversational AI assistance for content creation and editing using Claude AI.

**Main Operations**:
- Process user messages and generate AI responses
- Maintain conversation history
- Upload knowledge base files to Anthropic for context
- Handle both authenticated user calls and service role calls

**Database Interactions**:
- **INSERTS** into `conversations` table
- **INSERTS** into `messages` table
- **READS** from `knowledge_files` table (for file context)

**Related Functions**:
- Downloads files from GCS for Anthropic file uploads
- Can be called by other functions (job-runner) using service role

**Key Features**:
- Claude 3.5 Haiku integration
- File attachment support via Anthropic Files API
- Conversation persistence
- Context-aware responses using knowledge base

---

### 3. 🧠 vertex-ai-rag-processor

**Purpose**: Processes uploaded files using Google Vertex AI to create embeddings and build RAG (Retrieval-Augmented Generation) corpora.

**Main Operations**:
- Create user-specific RAG corpora in Vertex AI
- Process and embed files for semantic search
- Manage corpus lifecycle and file indexing

**Database Interactions**:
- **INSERTS** into `rag_corpora` table
- **READS** from `knowledge_files` table

**Related Functions**:
- Called by `knowledge-base-storage` after file uploads
- Used by `unified-rag-writer-agent` for content generation

**Key Features**:
- Vertex AI RAG API integration
- User-specific corpus management
- Automatic file embedding and indexing
- Support for various file formats

---

### 4. 📝 unified-rag-writer-agent

**Purpose**: Generates LinkedIn posts and content using RAG-enhanced AI, combining user prompts with knowledge base context.

**Main Operations**:
- Generate LinkedIn posts using RAG corpus
- Retrieve relevant content from user's knowledge base
- Create citations and context-aware content

**Database Interactions**:
- **READS** from `rag_corpora` table
- **READS** from `knowledge_files` table

**Related Functions**:
- Uses RAG corpora created by `vertex-ai-rag-processor`
- Integrates with Vertex AI for content generation

**Key Features**:
- RAG-enhanced content generation
- Citation tracking
- Platform-specific content optimization
- Context-aware writing

---

### 5. 📱 whatsapp-notifications

**Purpose**: Sends WhatsApp notifications to users via Chatwoot integration for content drafts and updates.

**Main Operations**:
- Send draft completion notifications via WhatsApp
- Manage Chatwoot conversations and contacts
- Handle enhanced notifications with context

**Database Interactions**:
- **READS** from user profiles and notification preferences
- **UPDATES** draft notification status
- **INSERTS** pacing suggestion records

**Related Functions**:
- Integrates with Chatwoot API for WhatsApp messaging
- Can be triggered by content generation functions

**Key Features**:
- Chatwoot API integration
- Enhanced notifications with meeting/knowledge context
- Conversation management
- Pacing suggestions tracking

---

### 6. 📅 google-calendar-sync

**Purpose**: Synchronizes user's Google Calendar events and provides calendar integration features.

**Main Operations**:
- Handle Google OAuth authentication
- Sync calendar events from Google Calendar
- Store calendar integration credentials

**Database Interactions**:
- **INSERTS** into `google_calendar_integration` table
- **READS** from `google_calendar_integration` table
- **UPDATES** user calendar sync status

**Related Functions**:
- Standalone integration function
- Used by other functions that need calendar context

**Key Features**:
- Google OAuth 2.0 flow
- Calendar event synchronization
- Secure credential storage
- Event data normalization

---

### 7. 🔄 job-runner

**Purpose**: Centralized job scheduling and execution system for background tasks and automation.

**Main Operations**:
- Execute scheduled jobs and background tasks
- Coordinate between different edge functions
- Handle job queuing and retry logic

**Database Interactions**:
- **READS** from job/task tables
- **UPDATES** job execution status
- **MANAGES** job queues and scheduling

**Related Functions**:
- Can call any other edge function using service role
- Central coordination point for automated workflows

**Key Features**:
- Job scheduling and queuing
- Inter-function coordination
- Error handling and retries
- Background task execution

---

### 8. 🗃️ user-bucket-service

**Purpose**: Manages Google Cloud Storage buckets for users, ensuring proper bucket creation and mapping.

**Main Operations**:
- Create user-specific GCS buckets
- Map users to their storage buckets
- Ensure bucket existence and proper configuration

**Database Interactions**:
- **INSERTS** into `user_bucket_mapping` table
- **READS** from `user_bucket_mapping` table

**Related Functions**:
- Called by `knowledge-base-storage` before file uploads
- Used by any function that needs user storage

**Key Features**:
- User-specific bucket creation
- Bucket lifecycle management
- Secure bucket configuration
- Storage quota management

---

### 9. 🎯 generate-content-suggestions

**Purpose**: Analyzes user content and generates intelligent suggestions for improvement and optimization.

**Main Operations**:
- Analyze existing content for patterns
- Generate content improvement suggestions
- Provide template and format recommendations

**Database Interactions**:
- **READS** from user content tables
- **INSERTS** into content suggestions tables
- **ANALYZES** content patterns and trends

**Related Functions**:
- Uses data from `knowledge-base-storage`
- May trigger `whatsapp-notifications` for suggestions

**Key Features**:
- Content analysis and optimization
- Intelligent suggestion generation
- Pattern recognition
- Personalized recommendations

---

### 10. 🔗 linkedin-post-scraper

**Purpose**: Scrapes and analyzes LinkedIn posts for competitive intelligence and content inspiration.

**Main Operations**:
- Scrape LinkedIn posts and profiles
- Extract content patterns and trends
- Store scraped data for analysis

**Database Interactions**:
- **INSERTS** into LinkedIn content tables
- **READS** from scraping configuration tables

**Related Functions**:
- Provides data for `generate-content-suggestions`
- Works with content analysis functions

**Key Features**:
- LinkedIn data extraction
- Content pattern analysis
- Competitive intelligence
- Trend identification

---

### 11. 👤 scrape-linkedin-profile

**Purpose**: Scrapes LinkedIn profile data for user analysis and content personalization.

**Main Operations**:
- Extract LinkedIn profile information
- Analyze profile content and patterns
- Store profile data for personalization

**Database Interactions**:
- **INSERTS** into profile data tables
- **UPDATES** user profile information

**Related Functions**:
- Provides data for content personalization
- Works with profile analysis functions

**Key Features**:
- Profile data extraction
- Content personalization
- Professional background analysis
- Industry trend tracking

---

### 12. ⏰ pacing-scheduler

**Purpose**: Manages content publishing schedules and pacing recommendations for users.

**Main Operations**:
- Schedule content publication
- Calculate optimal posting times
- Manage content calendar and pacing

**Database Interactions**:
- **READS** from pacing preferences tables
- **INSERTS** into scheduling tables
- **UPDATES** pacing configurations

**Related Functions**:
- May trigger `whatsapp-notifications` for pacing alerts
- Works with content generation functions

**Key Features**:
- Intelligent content scheduling
- Optimal timing calculations
- Pacing recommendations
- Calendar management

---

### 13. 🏗️ order-builder

**Purpose**: Manages content creation workflows and order processing for content generation.

**Main Operations**:
- Process content creation orders
- Manage workflow stages
- Coordinate content production pipeline

**Database Interactions**:
- **INSERTS** into order/workflow tables
- **UPDATES** order status and progress
- **MANAGES** content production queues

**Related Functions**:
- Coordinates with content generation functions
- May trigger notifications upon completion

**Key Features**:
- Workflow management
- Order processing
- Pipeline coordination
- Status tracking

---

### 14. 📝 ui-content-order

**Purpose**: Handles content orders from the UI and manages the content creation pipeline.

**Main Operations**:
- Process UI-initiated content orders
- Manage content creation requests
- Coordinate between UI and backend systems

**Database Interactions**:
- **INSERTS** into content order tables
- **UPDATES** order status and progress

**Related Functions**:
- Works with `order-builder` for workflow management
- Triggers content generation functions

**Key Features**:
- UI integration
- Order management
- Request processing
- Status updates

---

### 15. 📞 read-ai-webhook

**Purpose**: Handles webhooks from Read AI for meeting transcription and analysis integration.

**Main Operations**:
- Process Read AI webhook payloads
- Extract meeting transcriptions
- Store meeting data and insights

**Database Interactions**:
- **INSERTS** into meeting/transcript tables
- **UPDATES** integration status

**Related Functions**:
- May trigger content suggestions based on meetings
- Works with transcript processing functions

**Key Features**:
- Webhook processing
- Meeting data extraction
- Transcription storage
- Integration management

---

### 16. 🎤 transcript-processor

**Purpose**: Processes audio transcriptions and extracts actionable insights from meeting recordings.

**Main Operations**:
- Process audio transcription data
- Extract key insights and action items
- Generate meeting summaries

**Database Interactions**:
- **READS** from audio/transcript tables
- **INSERTS** processed insights
- **UPDATES** processing status

**Related Functions**:
- Works with `read-ai-webhook` for data input
- May trigger content generation based on insights

**Key Features**:
- Transcription processing
- Insight extraction
- Summary generation
- Action item identification

---

### 17. ✍️ manual-transcript-processor

**Purpose**: Handles manually uploaded transcript files and processes them for content generation.

**Main Operations**:
- Process manually uploaded transcripts
- Extract content and insights
- Generate content suggestions from transcripts

**Database Interactions**:
- **READS** from uploaded transcript files
- **INSERTS** processed content
- **UPDATES** processing status

**Related Functions**:
- Works with `knowledge-base-storage` for file handling
- May trigger content generation functions

**Key Features**:
- Manual transcript processing
- Content extraction
- Insight generation
- File management

---

### 18. 🎧 context-analysis-agent

**Purpose**: Analyzes various content contexts to provide intelligent insights and recommendations.

**Main Operations**:
- Analyze content context and patterns
- Generate contextual insights
- Provide recommendations based on analysis

**Database Interactions**:
- **READS** from various content tables
- **INSERTS** analysis results
- **UPDATES** analysis status

**Related Functions**:
- Uses data from multiple content sources
- Provides insights for other functions

**Key Features**:
- Context analysis
- Pattern recognition
- Insight generation
- Recommendation engine

---

### 19. 🎧 chatwoot-webhook

**Purpose**: Handles webhooks from Chatwoot for WhatsApp message processing and customer support integration.

**Main Operations**:
- Process incoming Chatwoot webhooks
- Handle WhatsApp message events
- Manage customer support workflows

**Database Interactions**:
- **INSERTS** into conversation tables
- **UPDATES** message status
- **MANAGES** support ticket data

**Related Functions**:
- Works with `whatsapp-notifications` for messaging
- Integrates with customer support workflows

**Key Features**:
- Webhook processing
- Message handling
- Support integration
- Workflow management

---

### 20. 💬 customer-support-slack

**Purpose**: Integrates customer support workflows with Slack for team notifications and coordination.

**Main Operations**:
- Send support notifications to Slack
- Coordinate support team workflows
- Manage support ticket routing

**Database Interactions**:
- **READS** from support ticket tables
- **UPDATES** notification status
- **MANAGES** team coordination data

**Related Functions**:
- Works with support and ticketing systems
- Integrates with notification functions

**Key Features**:
- Slack integration
- Team notifications
- Workflow coordination
- Ticket management

---

## Function Relationships & Data Flow

### Content Creation Pipeline:
1. **User uploads file** → `knowledge-base-storage`
2. **File stored in GCS** → `user-bucket-service`
3. **Content extracted** → `knowledge-base-storage`
4. **RAG processing** → `vertex-ai-rag-processor`
5. **Content generation** → `unified-rag-writer-agent`
6. **Notifications sent** → `whatsapp-notifications`

### AI-Powered Content Flow:
1. **User request** → `ai-assistant` or `unified-rag-writer-agent`
2. **Knowledge retrieval** → RAG corpus in Vertex AI
3. **Context enrichment** → Files from `knowledge_files` table
4. **Content generation** → Claude/Vertex AI APIs
5. **Result storage** → Various content tables

### Integration Data Flow:
1. **External webhooks** → `read-ai-webhook`, `chatwoot-webhook`
2. **Data processing** → Respective processor functions
3. **Storage** → Database tables
4. **Notifications** → `whatsapp-notifications`, `customer-support-slack`

### Background Job Flow:
1. **Job scheduling** → `job-runner`
2. **Function execution** → Any edge function
3. **Status updates** → Job tracking tables
4. **Notifications** → Various notification functions

---

## Security & Access Patterns

- **Service Role Functions**: `job-runner`, `vertex-ai-rag-processor`, `user-bucket-service`
- **User Authenticated**: `ai-assistant`, `knowledge-base-storage`, `google-calendar-sync`
- **Webhook Functions**: `read-ai-webhook`, `chatwoot-webhook`
- **Internal Functions**: Most content processing and analysis functions

## Performance Considerations

- **Heavy Processing**: `vertex-ai-rag-processor`, `transcript-processor`
- **File Operations**: `knowledge-base-storage`, `user-bucket-service`
- **Real-time**: `ai-assistant`, `whatsapp-notifications`
- **Background**: `job-runner`, `pacing-scheduler`

---

*This documentation was generated on $(date) and reflects the current state of the Pacelane edge functions architecture.*