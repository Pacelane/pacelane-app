# Edge Functions Audit & Cleanup Analysis

## 🔍 Complete Edge Functions Analysis

This document provides a comprehensive audit of all 23 edge functions to identify which are active, obsolete, or potentially unused.

## 📊 Function Status Overview

### ✅ **ACTIVE & ESSENTIAL** (13 functions)

#### Core System Functions
1. **`job-runner`** ✅ **CRITICAL**
   - **Purpose**: Core orchestrator for all content creation flows
   - **Called by**: Cron jobs (pacing), frontend (manual jobs)
   - **Calls**: order-builder, unified-rag-writer-agent, whatsapp-notifications
   - **Status**: Essential - DO NOT DELETE

2. **`knowledge-base-storage`** ✅ **ACTIVE**
   - **Purpose**: GCS integration for file management
   - **Called by**: Frontend (ContentService), chatwoot-webhook
   - **Calls**: user-bucket-service, vertex-ai-rag-processor
   - **Status**: Essential for file operations

3. **`unified-rag-writer-agent`** ✅ **ACTIVE**
   - **Purpose**: Primary content generation with RAG
   - **Called by**: job-runner, context-analysis-agent
   - **Status**: Core content generation function

4. **`order-builder`** ✅ **ACTIVE**
   - **Purpose**: Creates content briefs from orders
   - **Called by**: job-runner (complex flow)
   - **Status**: Still used for complex content flow

5. **`user-bucket-service`** ✅ **ACTIVE**
   - **Purpose**: User-specific GCS bucket management
   - **Called by**: knowledge-base-storage, transcript-processor, chatwoot-webhook, frontend
   - **Status**: Essential for user data isolation

#### AI & Content Functions
6. **`ai-assistant`** ✅ **ACTIVE**
   - **Purpose**: General AI assistance and chat
   - **Called by**: Frontend (ContentService), chatwoot-webhook
   - **Status**: Active user-facing feature

7. **`context-analysis-agent`** ✅ **ACTIVE**
   - **Purpose**: Content context analysis
   - **Called by**: Frontend (implied), uses unified-rag-writer-agent
   - **Status**: Active analysis feature

8. **`generate-content-suggestions`** ✅ **ACTIVE**
   - **Purpose**: AI-powered content suggestions
   - **Called by**: Frontend (Onboarding/Ready.tsx)
   - **Status**: Active onboarding feature

#### Integration Functions
9. **`chatwoot-webhook`** ✅ **ACTIVE**
   - **Purpose**: WhatsApp integration via Chatwoot
   - **Called by**: External webhook (Chatwoot)
   - **Calls**: user-bucket-service, knowledge-base-storage, ai-assistant
   - **Status**: Core WhatsApp integration

10. **`whatsapp-notifications`** ✅ **ACTIVE**
    - **Purpose**: WhatsApp notification system
    - **Called by**: job-runner
    - **Status**: Active notification system

11. **`customer-support-slack`** ✅ **ACTIVE**
    - **Purpose**: Slack integration for support
    - **Called by**: Frontend (ErrorReportingService, help-context)
    - **Status**: Active support system

12. **`read-ai-webhook`** ✅ **ACTIVE**
    - **Purpose**: Read.ai meeting integration
    - **Called by**: External webhook (Read.ai)
    - **Calls**: transcript-processor
    - **Status**: Active meeting intelligence

13. **`google-calendar-sync`** ✅ **ACTIVE**
    - **Purpose**: Google Calendar integration
    - **Called by**: Frontend (CalendarService)
    - **Status**: Active calendar feature

### 🤔 **POTENTIALLY ACTIVE** (4 functions)

14. **`linkedin-post-scraper`** 🤔 **POTENTIALLY ACTIVE**
    - **Purpose**: LinkedIn content scraping
    - **Called by**: Frontend (ContentService) - 4 different methods
    - **Status**: Used by frontend but might be legacy

15. **`scrape-linkedin-profile`** 🤔 **POTENTIALLY ACTIVE**
    - **Purpose**: LinkedIn profile scraping
    - **Called by**: Frontend (ProfileService, InspirationsService)
    - **Status**: Used for profile data but might be legacy

16. **`transcript-processor`** 🤔 **POTENTIALLY ACTIVE**
    - **Purpose**: Audio/video transcript processing
    - **Called by**: read-ai-webhook, manual-transcript-processor
    - **Calls**: user-bucket-service
    - **Status**: Used by Read.ai integration

17. **`manual-transcript-processor`** 🤔 **POTENTIALLY ACTIVE**
    - **Purpose**: Manual transcript processing
    - **Called by**: Frontend (KnowledgeBase.tsx)
    - **Calls**: transcript-processor
    - **Status**: Used by frontend for manual uploads

### ❓ **QUESTIONABLE** (3 functions)

18. **`vertex-ai-rag-processor`** ❓ **QUESTIONABLE**
    - **Purpose**: Google Vertex AI RAG processing
    - **Called by**: knowledge-base-storage
    - **Status**: Might be replaced by unified-rag-writer-agent

19. **`pacing-scheduler`** ❓ **QUESTIONABLE**
    - **Purpose**: Pacing schedule management
    - **Called by**: No direct calls found
    - **Status**: Might be replaced by database cron jobs

20. **`ui-content-order`** ❓ **QUESTIONABLE**
    - **Purpose**: UI content ordering
    - **Called by**: Frontend (ContentService)
    - **Status**: Single frontend call, might be legacy

### ❌ **CONFIRMED OBSOLETE** (3 functions)

21. **`retrieval-agent`** ❌ **OBSOLETE**
    - **Purpose**: Content retrieval (replaced by unified agent)
    - **Called by**: NONE (dead code in job-runner)
    - **Status**: Confirmed obsolete - SAFE TO DELETE

22. **`writer-agent`** ❌ **OBSOLETE**
    - **Purpose**: Content writing (replaced by unified agent)
    - **Called by**: NONE (dead code in job-runner)
    - **Status**: Confirmed obsolete - SAFE TO DELETE

23. **`editor-agent`** ❌ **OBSOLETE**
    - **Purpose**: Content editing (replaced by unified agent)
    - **Called by**: NONE (dead code in job-runner)
    - **Status**: Confirmed obsolete - SAFE TO DELETE

## 🔍 Detailed Analysis

### Functions with Missing References

#### `generate-enhanced-content-suggestions` ❌ **MISSING FUNCTION**
- **Called by**: Frontend (FirstTimeUserHome.jsx)
- **Status**: Function doesn't exist but is called by frontend
- **Action**: Either create function or fix frontend call

### Functions Called Only Once

#### `ui-content-order` - Single Usage
```typescript
// Only called once in ContentService.ts
const { data, error } = await supabase.functions.invoke('ui-content-order', {
  body: { userId, message, platform: 'linkedin' }
});
```

#### `manual-transcript-processor` - Single Usage
```typescript
// Only called once in KnowledgeBase.tsx
const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manual-transcript-processor`, {
```

### Functions with External Dependencies

#### Webhook Functions (Keep - External Calls)
- `chatwoot-webhook` - Called by Chatwoot
- `read-ai-webhook` - Called by Read.ai
- `customer-support-slack` - Called by frontend for support

#### Cron Job Functions
- `job-runner` - Called by database cron jobs
- Database function `create_scheduled_pacing_jobs()` creates agent_job records

## 🧹 Cleanup Recommendations

### 1. **SAFE TO DELETE IMMEDIATELY** ❌
```bash
# These are confirmed obsolete with no references:
rm -rf supabase/functions/retrieval-agent/
rm -rf supabase/functions/writer-agent/
rm -rf supabase/functions/editor-agent/
```

### 2. **INVESTIGATE BEFORE DELETING** ❓
- `vertex-ai-rag-processor` - Check if still needed for RAG
- `pacing-scheduler` - Verify if replaced by cron jobs
- `ui-content-order` - Check if single usage is important

### 3. **FRONTEND FIXES NEEDED** 🔧
- Fix `generate-enhanced-content-suggestions` call in FirstTimeUserHome.jsx
- Either create the function or update the frontend call

### 4. **LEGACY SCRAPING FUNCTIONS** 🤔
- `linkedin-post-scraper` - Multiple frontend calls, verify if still needed
- `scrape-linkedin-profile` - Used for profile data, verify if still needed

## 📈 Impact Analysis

### Current Function Call Graph
```
Frontend → [13 functions]
Cron Jobs → job-runner → [order-builder, unified-rag-writer-agent, whatsapp-notifications]
Webhooks → [chatwoot-webhook, read-ai-webhook]
Internal → [knowledge-base-storage → user-bucket-service, vertex-ai-rag-processor]
```

### After Cleanup (Minimum)
```
Frontend → [10-13 functions] (after investigation)
Cron Jobs → job-runner → [order-builder, unified-rag-writer-agent, whatsapp-notifications]
Webhooks → [chatwoot-webhook, read-ai-webhook]
Internal → [knowledge-base-storage → user-bucket-service, ?vertex-ai-rag-processor]
```

## 🎯 Action Plan

### Phase 1: Immediate Cleanup
1. ✅ Delete confirmed obsolete functions (3 functions)
2. 🔧 Fix missing function reference in frontend
3. 🧹 Remove dead code from job-runner

### Phase 2: Investigation
1. 🔍 Test vertex-ai-rag-processor usage
2. 🔍 Verify pacing-scheduler necessity
3. 🔍 Check ui-content-order importance
4. 🔍 Validate scraping functions usage

### Phase 3: Final Cleanup
1. 🗑️ Delete confirmed unnecessary functions
2. 📚 Update documentation
3. 🧪 Test remaining functions

## 🔗 Dependencies Map

### High-Impact Functions (Don't Delete)
- `job-runner` - Core orchestrator
- `knowledge-base-storage` - File management
- `unified-rag-writer-agent` - Content generation
- `user-bucket-service` - User data management

### Webhook Functions (External Dependencies)
- `chatwoot-webhook` - WhatsApp integration
- `read-ai-webhook` - Meeting intelligence
- `customer-support-slack` - Support system

### Frontend-Only Functions (Verify Usage)
- `ai-assistant` - Chat functionality
- `generate-content-suggestions` - Onboarding
- `google-calendar-sync` - Calendar integration
- `linkedin-post-scraper` - Content scraping
- `scrape-linkedin-profile` - Profile data

---

*Analysis completed: December 2024*
*Total functions: 23*
*Confirmed obsolete: 3*
*Questionable: 3-6*
*Safe to keep: 13-17*