# Pacing Content Quality Improvements

## Current Issues
1. **Generic prompts** - Writer-agent uses basic templates
2. **Underutilized context** - Rich user data not fully leveraged in content generation
3. **Weak personalization** - Content doesn't reflect user's specific industry/role/recent activities

## Improvement Strategies

### 1. Enhanced Writer-Agent Prompts

**Current LinkedIn Prompt (Generic):**
```javascript
systemPrompt = `You are sharing authentic personal insights from your professional experience. Write in a conversational, genuine voice...`
```

**Improved LinkedIn Prompt (Personalized):**
```javascript
systemPrompt = `You are ${userContext.name}, a ${userContext.headline} at ${userContext.company}. 

Your Professional Context:
- Industry: ${userContext.industry}
- Role: ${userContext.headline}
- Company: ${userContext.company}
- Key Skills: ${userContext.topSkills}
- Content Pillars: ${userContext.contentPillars}
- Professional Goals: ${userContext.goals}

Your Writing Style Guidelines:
${userContext.guides?.map(guide => `- ${guide}`).join('\n')}

Recent Professional Context:
${meetingContext?.recent_meetings?.length > 0 ? 
  `- Recent meeting insights: ${meetingContext.recent_meetings[0].summary}
   - Key action items: ${meetingContext.recent_meetings[0].action_items}` 
  : ''}
${knowledgeContext?.recent_files?.length > 0 ? 
  `- Recent knowledge work: ${knowledgeContext.recent_files[0].name}` 
  : ''}

Write authentic, personal insights that reflect YOUR specific professional experience and perspective. Reference your actual work context naturally.`
```

### 2. Smarter Topic Generation

**Current:** Random content pillars or generic topics

**Improved:** Context-aware topic selection:
```javascript
// Priority order for topic generation:
1. Recent meeting insights + content pillars
2. Recent knowledge base files + user expertise  
3. User's LinkedIn activity patterns + goals
4. Industry trends + user's role
5. Seasonal/timely content + user context
```

### 3. Dynamic Content Angles

**Current:** Basic angles (insight, experience, etc.)

**Improved:** Context-driven angles:
```javascript
// Based on recent activity:
- "Meeting Insights": Recent meeting → strategic takeaways
- "Lessons Learned": Project files → practical experience
- "Industry Analysis": Research docs → thought leadership
- "Team Leadership": Management content → leadership insights
- "Process Innovation": Technical docs → efficiency improvements
```

### 4. Knowledge Base Integration

**Current:** Basic file references

**Improved:** Smart content extraction:
```javascript
// For each relevant knowledge file:
- Extract key insights (not just file names)
- Identify actionable takeaways
- Connect to user's professional context
- Reference specific examples/data points
```

## Implementation Plan

### Phase 1: Enhanced Prompts (Quick Win)
- Update writer-agent system prompts with user context
- Add dynamic template selection based on content type
- Include recent activity context in prompts

### Phase 2: Smarter Context Selection
- Improve topic generation algorithm
- Better knowledge base content extraction
- Meeting insights integration

### Phase 3: AI-Powered Personalization  
- Use AI to analyze user's LinkedIn posts for style
- Generate topics based on user's content performance
- Seasonal/trending topic suggestions

## Specific Code Changes Needed

### 1. Writer-Agent Prompt Enhancement
Location: `supabase/functions/writer-agent/index.ts`
- Enhance `buildLinkedInPrompt()` function
- Add dynamic user context injection
- Include recent activity context

### 2. Topic Generation Improvement
Location: `supabase/functions/job-runner/index.ts`  
- Enhance `generatePersonalizedTopic()` function
- Add meeting insights analysis
- Improve knowledge base context extraction

### 3. Context Analysis Enhancement
Location: `supabase/functions/order-builder/index.ts`
- Improve `analyzeOrderContext()` function
- Add meeting content analysis
- Extract actionable insights from knowledge files
