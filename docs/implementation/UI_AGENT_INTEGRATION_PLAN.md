# UI Agent Integration Plan

## Current UI Flow Analysis

### 1. Content Suggestions Generation
- **Trigger:** "Generate" button in ProductHome
- **Function:** `generate-enhanced-content-suggestions`
- **Flow:** Context analysis → Strategy → Writing → QA → Save to `content_suggestions`
- **Progress:** Shows multi-step progress indicator

### 2. Content Creation from Suggestions
- **Trigger:** "Post This" button on suggestion
- **Flow:** Navigate to `/content-editor` with suggestion data
- **Functions:** Likely uses `content-writer` + `quality-assurance`
- **Output:** Creates draft in `saved_drafts`

### 3. AI Assistant Chat
- **Trigger:** Chat interface in content editor
- **Function:** `ai-assistant`
- **Purpose:** Interactive content editing help
- **Status:** Keep as-is (different functionality)

## New Agent Flow (PCL-13)

### WhatsApp Orders
```
chatwoot-webhook → job-runner → order-builder → retrieval-agent → writer-agent → editor-agent → saved_drafts
```

### UI Orders (To Implement)
```
UI Button → content_order → agent_job → job-runner → [same agent pipeline] → saved_drafts
```

## Integration Plan

### Phase 1: Replace Enhanced Content Suggestions

**Current:** `generate-enhanced-content-suggestions` (multi-agent system)
**New:** Direct content order creation via UI

**Changes needed:**
1. **ProductHome.tsx:** Replace `generate-enhanced-content-suggestions` call
2. **New flow:** Create `content_order` directly from UI
3. **Progress tracking:** Show agent pipeline progress
4. **Result:** Save to `saved_drafts` instead of `content_suggestions`

### Phase 2: Replace Content Writing Pipeline

**Current:** `content-writer` + `quality-assurance` functions
**New:** Use new agent pipeline

**Changes needed:**
1. **ContentEditor.tsx:** Replace manual writing functions
2. **New flow:** Create `content_order` from editor
3. **Real-time updates:** Show agent progress in editor
4. **Result:** Same agent pipeline as WhatsApp

### Phase 3: Update Content Suggestions

**Current:** `generate-content-suggestions` (idea generation)
**New:** Keep as-is, but enhance with new agent insights

**Changes needed:**
1. **Keep function:** It's for idea generation, not full content
2. **Enhance:** Use new agent context retrieval
3. **Integration:** Link ideas to new agent pipeline

## Implementation Steps

### Step 1: Create UI Content Order Function
```typescript
// New function to create content orders from UI
async function createContentOrderFromUI(params: {
  platform: string;
  length: string;
  tone: string;
  angle: string;
  refs: string[];
  original_content?: string;
  context?: string;
}) {
  // Create content_order
  // Create agent_job
  // Trigger job-runner
}
```

### Step 2: Update ProductHome.tsx
- Replace `generate-enhanced-content-suggestions` call
- Use new content order creation
- Show agent pipeline progress
- Navigate to drafts when complete

### Step 3: Update ContentEditor.tsx
- Replace manual writing functions
- Use new agent pipeline
- Show real-time progress
- Save to `saved_drafts`

### Step 4: Update Progress Tracking
- Show agent steps: "Building brief" → "Retrieving context" → "Writing content" → "Editing"
- Use `agent_run.steps` for real-time updates
- Handle errors gracefully

## Functions to Delete After Integration

1. **`generate-enhanced-content-suggestions`** - Replaced by new agent pipeline
2. **`content-writer`** - Replaced by new agent pipeline  
3. **`quality-assurance`** - Replaced by new agent pipeline
4. **`content-strategist`** - Replaced by `order-builder`
5. **`analyze-user-context`** - Replaced by `retrieval-agent`

## Functions to Keep

1. **`ai-assistant`** - Chat interface (different functionality)
2. **`generate-content-suggestions`** - Idea generation (enhance, don't replace)
3. **`chatwoot-webhook`** - WhatsApp integration (already updated)
4. **`knowledge-base-storage`** - Knowledge base management
5. **`scrape-linkedin-profile`** - LinkedIn profile scraping
6. **`create-user-bucket`** - GCS bucket creation
7. **`user-bucket-service`** - GCS bucket management

## Benefits of New Integration

1. **Unified Pipeline:** Same agent system for WhatsApp and UI
2. **Better Context:** Uses knowledge base and meeting notes
3. **Real-time Progress:** Show agent steps in UI
4. **Consistent Quality:** Same editing and QA process
5. **Scalable:** Easy to add new agents or modify pipeline
6. **Auditable:** Full traceability via `agent_run` table

## Next Steps

1. **Implement UI content order creation**
2. **Update ProductHome.tsx** for new flow
3. **Update ContentEditor.tsx** for new flow
4. **Test complete UI → agent → draft flow**
5. **Delete obsolete functions**
6. **Update documentation**
