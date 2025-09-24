# Knowledge Base Content Integration Implementation Plan

## 🎯 **Objective**
Implement a simple, semantic knowledge base integration that matches user files with generated content to provide more authentic, work-based insights rather than generic business advice.

## 📋 **Requirements Summary**

### **Core Features**
- **Semantic file matching**: Use file content to suggest related topics for content generation
- **Basic text extraction**: Extract and store text content from all file types
- **Relevance-based selection**: Use most relevant files (not just recent) for WhatsApp suggestions
- **Content influence hierarchy**: LinkedIn (70%) + Content Pillars (20%) + Knowledge Base (10%)
- **Detailed user transparency**: Show users exactly which files influenced their content

### **MVP Scope**
- ✅ Basic text content extraction for common file types
- ✅ Semantic matching between file content and content topics
- ✅ Relevance scoring for file selection
- ✅ Enhanced content generation with file-based insights
- ✅ User transparency with detailed file usage reporting
- ❌ Advanced NLP/AI content analysis (future phase)
- ❌ Complex tagging system (future phase)

## 🏗️ **Implementation Plan**

### **Phase 1: Enhanced Content Extraction (Week 1)**

#### **1.1 Upgrade knowledge-base-storage Function**
**File**: `supabase/functions/knowledge-base-storage/index.ts`

**Current Issue**: Content extraction is placeholder (`'[Content extraction to be implemented]'`)

**Implementation**:
```typescript
async extractContent(fileId: string, fileType: string, gcsPath: string): Promise<boolean> {
  try {
    let extractedContent = '';
    
    switch (fileType.toLowerCase()) {
      case 'application/pdf':
        extractedContent = await this.extractPDFContent(gcsPath);
        break;
      case 'text/plain':
      case 'text/markdown':
        extractedContent = await this.extractTextContent(gcsPath);
        break;
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        extractedContent = await this.extractDocxContent(gcsPath);
        break;
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        extractedContent = await this.extractPptxContent(gcsPath);
        break;
      default:
        // For unsupported types, try text extraction
        extractedContent = await this.extractGenericContent(gcsPath);
    }

    // Update database with extracted content
    const { error } = await this.supabase
      .from('knowledge_files')
      .update({
        content_extracted: true,
        extracted_content: extractedContent,
        extraction_metadata: {
          extracted_at: new Date().toISOString(),
          method: 'text_extraction',
          content_length: extractedContent.length
        }
      })
      .eq('id', fileId);

    return !error;
  } catch (error) {
    console.error('Error extracting content:', error);
    return false;
  }
}
```

**Required Dependencies**:
- PDF extraction: `pdf-parse` or equivalent Deno module
- DOCX extraction: `mammoth` or equivalent
- PPTX extraction: `pptx-parser` or equivalent

#### **1.2 Automatic Content Extraction Trigger**
- Trigger content extraction automatically after file upload
- Add extraction status tracking
- Handle extraction failures gracefully

### **Phase 2: Semantic File Matching (Week 2)**

#### **2.1 Enhance retrieval-agent Function**
**File**: `supabase/functions/retrieval-agent/index.ts`

**Current Issue**: Basic `ilike` text matching is too simple

**Implementation**:
```typescript
async function searchKnowledgeFilesSemanticaly(
  supabaseClient: any, 
  userId: string, 
  contentTopic: string,
  contentAngle: string,
  limit: number
): Promise<Citation[]> {
  // Get all user files with extracted content
  const { data: files, error } = await supabaseClient
    .from('knowledge_files')
    .select('id, name, extracted_content, created_at, url, metadata')
    .eq('user_id', userId)
    .not('extracted_content', 'is', null)
    .order('created_at', { ascending: false });

  if (error || !files) {
    console.error('Error fetching knowledge files:', error);
    return [];
  }

  // Calculate semantic relevance for each file
  const scoredFiles = files.map(file => ({
    ...file,
    relevance_score: calculateSemanticRelevance(
      file.extracted_content, 
      file.name,
      contentTopic, 
      contentAngle
    )
  }));

  // Sort by relevance and take top results
  const topFiles = scoredFiles
    .filter(file => file.relevance_score > 0.3) // Minimum relevance threshold
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, limit);

  // Convert to citations format
  return topFiles.map(file => ({
    type: 'knowledge_file',
    id: file.id,
    title: file.name,
    content: extractRelevantSnippet(file.extracted_content, [contentTopic, contentAngle]),
    created_at: file.created_at,
    relevance_score: file.relevance_score,
    source_url: file.url,
    metadata: {
      extraction_date: file.metadata?.extraction_metadata?.extracted_at,
      content_length: file.extracted_content.length
    }
  }));
}

function calculateSemanticRelevance(
  fileContent: string, 
  fileName: string, 
  contentTopic: string, 
  contentAngle: string
): number {
  const content = (fileContent + ' ' + fileName).toLowerCase();
  const topic = contentTopic.toLowerCase();
  const angle = contentAngle.toLowerCase();
  
  let score = 0;
  
  // Topic keyword matching (40% weight)
  const topicWords = topic.split(' ').filter(word => word.length > 3);
  const topicMatches = topicWords.filter(word => content.includes(word)).length;
  score += (topicMatches / topicWords.length) * 0.4;
  
  // Angle keyword matching (30% weight)
  const angleWords = angle.split(' ').filter(word => word.length > 3);
  const angleMatches = angleWords.filter(word => content.includes(word)).length;
  score += (angleMatches / angleWords.length) * 0.3;
  
  // File name relevance (20% weight)
  const nameMatches = fileName.toLowerCase().includes(topic) ? 1 : 0;
  score += nameMatches * 0.2;
  
  // Recency bonus (10% weight) - newer files get slight boost
  const fileAge = Date.now() - new Date(fileName).getTime();
  const recencyBonus = Math.max(0, 1 - (fileAge / (30 * 24 * 60 * 60 * 1000))); // 30 day decay
  score += recencyBonus * 0.1;
  
  return Math.min(score, 1.0); // Cap at 1.0
}
```

#### **2.2 Update job-runner Integration**
**File**: `supabase/functions/job-runner/index.ts`

**Enhance** `generatePersonalizedTopic` to use semantic file matching:

```typescript
// Replace current file usage logic
if (recentFiles && recentFiles.length > 0) {
  // NEW: Use semantic matching instead of just recent files
  const relevantFiles = await searchKnowledgeFilesSemanticaly(
    supabaseClient, 
    userId, 
    'business insights', // Initial topic seed
    'professional perspective', // Initial angle seed
    3 // Top 3 most relevant files
  );
  
  if (relevantFiles.length > 0) {
    const fileInsights = relevantFiles.map(f => f.title).join(', ');
    console.log(`✅ Using relevant files: ${fileInsights}`);
    return `Professional insights inspired by recent work: ${fileInsights}`;
  }
}
```

### **Phase 3: Enhanced Content Generation (Week 3)**

#### **3.1 Upgrade writer-agent Context Integration**
**File**: `supabase/functions/writer-agent/index.ts`

**Enhancement**: Better utilize knowledge base citations in content generation

```typescript
async function generatePlatformSpecificContent(
  brief: any, 
  contextText: string, 
  userContext: any, 
  anthropicApiKey: string
): Promise<string> {
  
  // Separate knowledge base citations from other context
  const knowledgeBaseCitations = contextText
    .split('\n\n')
    .filter(citation => citation.startsWith('[KNOWLEDGE_FILE]'))
    .map(citation => citation.replace('[KNOWLEDGE_FILE] ', ''));
  
  const otherContext = contextText
    .split('\n\n')
    .filter(citation => !citation.startsWith('[KNOWLEDGE_FILE]'))
    .join('\n\n');

  // Enhanced prompt with knowledge base context
  const knowledgeBaseContext = knowledgeBaseCitations.length > 0 
    ? `\n\nRECENT WORK CONTEXT:\nThe user has been working on these projects recently:\n${knowledgeBaseCitations.join('\n')}\n\nUse these as inspiration for authentic, experience-based insights rather than generic advice.`
    : '';

  const prompt = `You are a professional content creator helping someone create authentic LinkedIn content.

USER PROFILE:
- Role: ${userContext.role || 'Professional'}
- Company: ${userContext.company || 'Current company'}
- Industry: ${userContext.industry || 'Business'}
- Goals: ${userContext.goals?.join(', ') || 'Professional growth'}

CONTENT BRIEF:
- Platform: ${brief.platform}
- Topic: ${brief.topic}
- Angle: ${brief.angle}
- Tone: ${brief.tone}
- Length: ${brief.length}

${knowledgeBaseContext}

OTHER CONTEXT:
${otherContext}

WRITING STYLE:
${userContext.writingProfile?.tone_analysis || 'Professional and engaging'}

Create authentic content that reflects their actual work experience and expertise. Use specific examples from their recent work when available.`;

  // Rest of Anthropic API call...
}
```

#### **3.2 Enhanced Brief Building**
**File**: `supabase/functions/order-builder/index.ts`

**Add knowledge base file tracking to brief**:

```typescript
const brief: ContentBrief = {
  // ... existing fields
  
  // Enhanced knowledge base context
  knowledge_base_context: enhancedSuggestion ? {
    recent_transcripts: knowledgeBaseContext.recent_transcripts || [],
    available_files: knowledgeBaseContext.available_files || [],
    content_extraction_status: knowledgeBaseContext.content_extraction_status || [],
    // NEW: Track which files influenced this content
    influencing_files: [], // Will be populated by retrieval agent
    semantic_relevance_scores: [] // Track relevance scores for transparency
  } : null,
}
```

### **Phase 4: User Transparency & Feedback (Week 4)**

#### **4.1 Content Generation Metadata**
**Track file usage in generated content**:

```typescript
// In writer-agent response
return {
  title: brief.topic || 'Generated Content',
  content,
  metadata: {
    // ... existing metadata
    knowledge_base_usage: {
      files_consulted: citations.filter(c => c.type === 'knowledge_file').length,
      files_used: citations.filter(c => c.type === 'knowledge_file').map(c => ({
        name: c.title,
        relevance_score: c.relevance_score,
        content_snippet: c.content.slice(0, 100) + '...'
      })),
      influence_level: 'medium' // low/medium/high based on how much KB content influenced result
    }
  }
}
```

#### **4.2 Frontend Transparency**
**Show users which files influenced their content**:

- Add file usage section to content editor
- Show relevance scores for each file used
- Allow users to see content snippets that influenced the generation
- Add feedback mechanism for file relevance

#### **4.3 Analytics & Optimization**
**Track knowledge base effectiveness**:

```sql
-- Add tracking table
CREATE TABLE knowledge_base_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  content_order_id UUID REFERENCES content_order(id),
  file_id UUID REFERENCES knowledge_files(id),
  relevance_score DECIMAL,
  was_helpful BOOLEAN, -- User feedback
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 **Testing Strategy**

### **Phase 1 Testing**
- Upload various file types (PDF, DOCX, TXT, PPTX)
- Verify content extraction accuracy
- Test extraction failure handling

### **Phase 2 Testing**
- Create test files with known content
- Generate content on related topics
- Verify semantic matching accuracy
- Test relevance scoring algorithm

### **Phase 3 Testing**
- Generate content with and without knowledge base context
- Compare authenticity and specificity
- User feedback on content quality improvement

### **Phase 4 Testing**
- User testing of transparency features
- Feedback collection on file relevance
- A/B testing of content with/without KB integration

## 📊 **Success Metrics**

### **Technical Metrics**
- Content extraction success rate: >95%
- Semantic matching accuracy: >80% user satisfaction
- File relevance scoring precision: >75%

### **User Experience Metrics**
- Content authenticity rating: >4/5
- User engagement with KB-influenced content: +20% vs generic
- User satisfaction with file transparency: >85%

### **Business Metrics**
- User retention improvement: +15%
- Content posting frequency: +25%
- User feedback on content relevance: +30%

## 🔄 **Future Enhancements**

### **Advanced Features (Phase 5+)**
- AI-powered content summarization
- Automatic tagging and categorization
- Cross-file insight synthesis
- Meeting transcript integration with knowledge base
- Trend analysis across user's knowledge base
- Smart file recommendation for content topics

### **Integration Opportunities**
- Calendar integration for project-based file grouping
- CRM integration for client-specific content
- Team knowledge base sharing
- Industry benchmark comparisons

## 🚀 **Implementation Timeline**

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| Phase 1 | Week 1 | Content extraction for all file types |
| Phase 2 | Week 2 | Semantic file matching & relevance scoring |
| Phase 3 | Week 3 | Enhanced content generation with KB context |
| Phase 4 | Week 4 | User transparency & feedback systems |

**Total Duration**: 4 weeks for MVP implementation

## 🎯 **Next Steps**

1. **Week 1**: Implement content extraction in `knowledge-base-storage`
2. **Week 2**: Build semantic matching in `retrieval-agent`
3. **Week 3**: Enhance content generation in `writer-agent`
4. **Week 4**: Add user transparency features
5. **Testing**: Continuous user testing throughout implementation

This plan delivers a **simple but powerful** knowledge base integration that transforms generic business advice into authentic, work-based insights while maintaining transparency about how user files influence their content generation.
