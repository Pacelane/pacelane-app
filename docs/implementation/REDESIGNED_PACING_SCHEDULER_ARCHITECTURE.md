# Redesigned Pacing Scheduler Architecture

## Overview

This document outlines the complete redesign of the Pacelane pacing scheduler system, addressing the core issues with the previous implementation and introducing a modern, queue-based architecture that provides context-aware content generation.

## Previous System Issues

### 1. Duplication Problems
- **Issue**: Cron job created rows in `agent_job` table, edge function also created jobs
- **Result**: Potential duplicate jobs and race conditions
- **Impact**: Inconsistent job processing and resource waste

### 2. Generic Content Generation
- **Issue**: WriterAgent lacked real user context and input
- **Result**: Generic, fallback-heavy content that felt disconnected
- **Impact**: Poor user experience and low content relevance

### 3. Complex Job Management
- **Issue**: Overly complex `agent_job` table structure
- **Result**: Difficult to debug and maintain
- **Impact**: Development bottlenecks and system reliability issues

### 4. No Context Review
- **Issue**: No intelligent analysis of user's knowledge base and activities
- **Result**: Content generation without understanding user context
- **Impact**: Irrelevant or generic content suggestions

## New Architecture: Queue-Based Context-Aware System

### System Flow

```
Pacing Scheduler Cron → Queue Message → Context Analysis Agent → Unified RAG Writer Agent → High-Quality Content
```

### 1. Pacing Scheduler Cron
- **Location**: `supabase/migrations/20250120000000_redesign_pacing_scheduler_queues.sql`
- **Function**: `create_scheduled_pacing_jobs()`
- **Schedule**: Daily at 9:00 AM and 6:00 PM
- **Action**: Sends messages to `pacing_content_queue` instead of creating database rows

### 2. Supabase Queues
- **Primary Queue**: `pacing_content_queue` - for context analysis requests
- **Benefits**: 
  - No duplication
  - Automatic retry mechanisms
  - Better error handling
  - Scalable message processing

### 3. Context Analysis Agent
- **Location**: `supabase/functions/context-analysis-agent/index.ts`
- **Purpose**: Analyzes user context from knowledge base and meeting transcripts
- **Process**:
  1. Receives queue message
  2. Analyzes knowledge base files
  3. Analyzes meeting notes and audio transcripts
  4. Generates intelligent content suggestions
  5. Sends suggestions to content generation queue

### 4. Unified RAG Writer Agent Integration
- **Location**: `supabase/functions/unified-rag-writer-agent/index.ts` (existing)
- **Purpose**: Generates high-quality content using context analysis results
- **Process**:
  1. Receives direct calls from context analysis agent
  2. Uses existing RAG capabilities with enhanced prompts
  3. Generates content for each suggestion type
  4. Stores results in `pacing_content_generation` table

## Database Schema Changes

### New Tables

#### `pacing_context_analysis`
```sql
CREATE TABLE public.pacing_context_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  schedule_id UUID NOT NULL REFERENCES public.pacing_schedules(id),
  analysis_date DATE NOT NULL,
  
  -- Context data
  knowledge_context JSONB NOT NULL DEFAULT '{}',
  meeting_context JSONB NOT NULL DEFAULT '{}',
  content_suggestions JSONB NOT NULL DEFAULT '[]',
  
  -- Status tracking
  analysis_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(user_id, analysis_date)
);
```

#### `pacing_content_generation`
```sql
CREATE TABLE public.pacing_content_generation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  schedule_id UUID NOT NULL REFERENCES public.pacing_schedules(id),
  context_analysis_id UUID NOT NULL REFERENCES public.pacing_context_analysis(id),
  
  -- Content details
  content_type TEXT NOT NULL,
  content_title TEXT,
  content_body TEXT,
  content_metadata JSONB NOT NULL DEFAULT '{}',
  
  -- Generation status
  generation_status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### Queue Functions

#### `send_to_pacing_queue()`
- Sends context analysis requests to `pacing_content_queue`
- Prevents duplicate analyses for the same user/date
- Creates pending analysis record

#### Direct RAG Writer Integration
- Sends content suggestions directly to unified RAG writer agent
- Links suggestions to context analysis results
- Enables immediate content generation

## Edge Functions

### Context Analysis Agent (`/api/context-analysis-agent`)

#### GET Method: Process Queue
- Processes all pending messages in `pacing_content_queue`
- Analyzes user context from multiple sources
- Generates intelligent content suggestions
- Updates analysis status and results

#### POST Method: Manual Trigger
- Allows manual triggering of context analysis
- Useful for testing and debugging
- Accepts `user_id` and `schedule_id` parameters

#### Context Analysis Process

1. **Knowledge Base Analysis**
   - Examines recent file uploads
   - Analyzes file types and content patterns
   - Extracts key insights from documents

2. **Meeting Context Analysis**
   - Reviews recent meeting notes
   - Analyzes audio transcriptions
   - Identifies collaboration patterns

3. **Content Suggestion Generation**
   - Creates topic-specific suggestions
   - Assigns confidence scores
   - Links suggestions to relevant context

### Unified RAG Writer Agent Integration

#### Integration Method
- Receives direct calls from context analysis agent
- Uses existing RAG capabilities with enhanced prompts
- Generates content for each suggestion type
- Updates generation status and results

#### Enhanced Prompting
- Context-aware prompts based on user activity
- Platform-specific content optimization
- Confidence scoring and reasoning integration
- Related context area mapping

#### Content Generation Process

1. **Context Retrieval**
   - Fetches context analysis results
   - Builds comprehensive context summary
   - Links content to user activities

2. **Content Type Generation**
   - LinkedIn posts with professional insights
   - Blog posts with detailed analysis
   - Newsletters with comprehensive updates
   - Social media posts with engagement focus

3. **RAG Integration**
   - Uses context summary for content relevance
   - Incorporates user activity patterns
   - Generates personalized content angles

## Monitoring and Management

### PacingQueueMonitor Component
- **Location**: `src/design-system/components/PacingQueueMonitor.jsx`
- **Purpose**: Real-time monitoring of queue system
- **Features**:
  - Queue status overview
  - Context analysis progress
  - Content generation status
  - Manual trigger buttons
  - Real-time refresh

### Queue Status View
```sql
CREATE VIEW public.pacing_queue_status AS
SELECT 
  'pacing_content_queue' as queue_name,
  pgmq.size('pacing_content_queue') as pending_messages,
  'Context analysis queue for pacing scheduler' as description
UNION ALL
SELECT 
  'content_suggestions_queue' as queue_name,
  pgmq.size('content_suggestions_queue') as pending_messages,
  'Content generation queue for RAG writer' as description;
```

## Benefits of New Architecture

### 1. Eliminates Duplication
- Single source of truth for job creation
- Queue-based message handling
- Automatic deduplication at database level

### 2. Context-Aware Content
- Real analysis of user knowledge base
- Meeting transcript insights
- Personalized content suggestions
- Higher relevance and engagement

### 3. Improved Reliability
- Queue-based retry mechanisms
- Better error handling and recovery
- Scalable message processing
- Reduced system complexity

### 4. Enhanced Monitoring
- Real-time queue status
- Progress tracking at each stage
- Detailed error reporting
- Manual intervention capabilities

### 5. Better User Experience
- Content based on actual user activity
- Relevant topic suggestions
- Professional, contextual content
- Consistent content quality

## Implementation Steps

### 1. Database Migration
```bash
# Apply the new migration
supabase db push
```

### 2. Deploy Edge Functions
```bash
# Deploy context analysis agent
supabase functions deploy context-analysis-agent

# Deploy RAG writer agent
supabase functions deploy rag-writer-agent
```

### 3. Update Cron Jobs
- Existing cron jobs will automatically use new queue system
- No changes needed to scheduling logic

### 4. Add Monitoring Component
- Import `PacingQueueMonitor` in relevant pages
- Configure API endpoints for monitoring

## Testing and Validation

### 1. Queue System Test
```bash
# Test queue creation
curl -X GET "https://your-project.supabase.co/functions/v1/context-analysis-agent"

# Test content generation
curl -X GET "https://your-project.supabase.co/functions/v1/rag-writer-agent"
```

### 2. Manual Trigger Test
```bash
# Test context analysis for specific user
curl -X POST "https://your-project.supabase.co/functions/v1/context-analysis-agent" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-uuid", "schedule_id": "schedule-uuid"}'
```

### 3. Monitor Results
- Check `pacing_context_analysis` table
- Verify `pacing_content_generation` records
- Monitor queue status via dashboard

## Future Enhancements

### 1. LLM Integration
- Replace template-based content with actual LLM generation
- Integrate with Vertex AI or similar services
- Implement advanced RAG techniques

### 2. Content Quality Scoring
- Add content relevance scoring
- Implement user feedback collection
- Continuous improvement algorithms

### 3. Advanced Scheduling
- Dynamic scheduling based on user activity
- Content type optimization
- Engagement prediction

### 4. Analytics Dashboard
- Content performance metrics
- User engagement tracking
- ROI analysis for content generation

## Troubleshooting

### Common Issues

#### Queue Not Processing
- Check edge function logs
- Verify queue permissions
- Ensure RLS policies are correct

#### Context Analysis Failing
- Check knowledge base table access
- Verify meeting notes permissions
- Review error messages in database

#### Content Generation Errors
- Validate context analysis completion
- Check content generation table structure
- Review RAG writer agent logs

### Debug Commands
```sql
-- Check queue status
SELECT * FROM public.pacing_queue_status;

-- View recent analyses
SELECT * FROM public.pacing_context_analysis ORDER BY created_at DESC LIMIT 10;

-- Check content generations
SELECT * FROM public.pacing_content_generation ORDER BY created_at DESC LIMIT 10;

-- Monitor queue sizes
SELECT pgmq.size('pacing_content_queue') as pacing_queue_size;
SELECT pgmq.size('content_suggestions_queue') as suggestions_queue_size;
```

## Conclusion

The redesigned pacing scheduler architecture represents a significant improvement over the previous system, addressing all major issues while introducing modern queue-based processing and context-aware content generation. This new system provides:

- **Reliability**: Queue-based processing eliminates duplication and race conditions
- **Relevance**: Context analysis ensures content is based on actual user activity
- **Scalability**: Queue system can handle increased load efficiently
- **Maintainability**: Cleaner architecture with better separation of concerns
- **User Experience**: Higher quality, more relevant content suggestions

The system is now ready for production use and provides a solid foundation for future enhancements and LLM integration.
