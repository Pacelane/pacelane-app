# Service Layer Documentation

## 🏗️ Overview

The service layer is the business logic foundation of Pacelane, providing a clean separation between UI components and data operations. It handles all external API calls, data processing, state management, and business rules.

## 🏛️ Architecture Principles

### Layered Architecture
```
UI Components → Services → API Layer → External Services
     ↓              ↓         ↓           ↓
  React UI    Business Logic  Supabase   OpenAI/GCP/etc.
```

### Core Principles
- **Single Responsibility**: Each service handles one domain
- **Dependency Injection**: Services receive dependencies as parameters
- **Error Handling**: Comprehensive error management and reporting
- **Type Safety**: Full TypeScript implementation
- **Async Operations**: Proper handling of asynchronous operations
- **Caching**: Strategic caching for performance optimization

## 🔧 Available Services

### 1. Content Service
**File**: `src/services/contentService.ts`
**Purpose**: Manages all content-related operations including knowledge base, drafts, and AI content generation.

#### Key Operations
```typescript
import { ContentService } from '@/services/contentService';

// Knowledge Base Management
const knowledgeFiles = await ContentService.loadUserKnowledgeFiles(userId);
const uploadResult = await ContentService.uploadFile(fileData);
const deleteResult = await ContentService.deleteFile(fileId);

// Content Drafts
const drafts = await ContentService.loadUserDrafts(userId);
const newDraft = await ContentService.createDraft(draftData);
const updatedDraft = await ContentService.updateDraft(draftId, updateData);

// AI Content Generation
const suggestions = await ContentService.generateContentSuggestions(prompt, context);
const aiResponse = await ContentService.processAIRequest(messageData);
```

#### Service Methods
- `loadUserKnowledgeFiles(userId)` - Load user's knowledge base files
- `uploadFile(fileData)` - Upload file to GCS via edge function
- `deleteFile(fileId)` - Remove file from knowledge base
- `loadUserDrafts(userId)` - Load user's content drafts
- `createDraft(draftData)` - Create new content draft
- `updateDraft(draftId, updateData)` - Update existing draft
- `generateContentSuggestions(prompt, context)` - AI-powered content ideas
- `processAIRequest(messageData)` - Process AI chat requests

### 2. Authentication Service
**File**: `src/services/authService.ts`
**Purpose**: Handles user authentication, session management, and profile operations.

#### Key Operations
```typescript
import { AuthService } from '@/services/authService';

// Authentication
const signInResult = await AuthService.signIn(email, password);
const signUpResult = await AuthService.signUp(email, password, profileData);
const signOutResult = await AuthService.signOut();

// Profile Management
const profile = await AuthService.getUserProfile();
const updateResult = await AuthService.updateUserProfile(profileData);
const avatarResult = await AuthService.updateUserAvatar(avatarFile);
```

#### Service Methods
- `signIn(email, password)` - User sign in
- `signUp(email, password, profileData)` - User registration
- `signOut()` - User sign out
- `getUserProfile()` - Get current user profile
- `updateUserProfile(profileData)` - Update user profile
- `updateUserAvatar(avatarFile)` - Update user avatar
- `resetPassword(email)` - Password reset request
- `confirmPasswordReset(token, newPassword)` - Confirm password reset

### 3. Calendar Service
**File**: `src/services/calendarService.ts`
**Purpose**: Manages Google Calendar integration for content scheduling and reminders.

#### Key Operations
```typescript
import { CalendarService } from '@/services/calendarService';

// Calendar Operations
const calendars = await CalendarService.listCalendars();
const events = await CalendarService.listEvents(calendarId, timeRange);
const newEvent = await CalendarService.createEvent(calendarId, eventData);
const updatedEvent = await CalendarService.updateEvent(eventId, updateData);
```

#### Service Methods
- `listCalendars()` - List user's Google calendars
- `listEvents(calendarId, timeRange)` - List calendar events
- `createEvent(calendarId, eventData)` - Create new calendar event
- `updateEvent(eventId, updateData)` - Update existing event
- `deleteEvent(eventId)` - Delete calendar event
- `syncContentSchedule(contentData)` - Sync content with calendar

### 4. WhatsApp Notification Service
**File**: `src/services/whatsappNotificationService.ts`
**Purpose**: Manages WhatsApp notifications, message scheduling, and engagement tracking.

#### Key Operations
```typescript
import { WhatsAppNotificationService } from '@/services/whatsappNotificationService';

// Notification Management
const notifications = await WhatsAppNotificationService.getUserNotifications(userId);
const sendResult = await WhatsAppNotificationService.sendNotification(notificationData);
const scheduleResult = await WhatsAppNotificationService.scheduleNotification(scheduleData);
```

#### Service Methods
- `getUserNotifications(userId)` - Get user's notification history
- `sendNotification(notificationData)` - Send immediate notification
- `scheduleNotification(scheduleData)` - Schedule future notification
- `trackEngagement(messageId, engagementData)` - Track message engagement
- `getNotificationAnalytics(userId, timeRange)` - Get notification performance

### 5. Profile Service
**File**: `src/services/profileService.ts`
**Purpose**: Manages user profile data, preferences, and settings.

#### Key Operations
```typescript
import { ProfileService } from '@/services/profileService';

// Profile Management
const profile = await ProfileService.getUserProfile(userId);
const updateResult = await ProfileService.updateProfile(userId, profileData);
const preferences = await ProfileService.getUserPreferences(userId);
const updatePrefs = await ProfileService.updatePreferences(userId, preferencesData);
```

#### Service Methods
- `getUserProfile(userId)` - Get user profile data
- `updateProfile(userId, profileData)` - Update user profile
- `getUserPreferences(userId)` - Get user preferences
- `updatePreferences(userId, preferencesData)` - Update user preferences
- `getUserStats(userId)` - Get user statistics and analytics

### 6. Pacing Service
**File**: `src/services/pacingService.ts`
**Purpose**: Manages content pacing, scheduling, and automation.

#### Key Operations
```typescript
import { PacingService } from '@/services/pacingService';

// Pacing Management
const pacingPlan = await PacingService.getUserPacingPlan(userId);
const createPlan = await PacingService.createPacingPlan(planData);
const updatePlan = await PacingService.updatePacingPlan(planId, updateData);
const executePlan = await PacingService.executePacingPlan(planId);
```

#### Service Methods
- `getUserPacingPlan(userId)` - Get user's content pacing plan
- `createPacingPlan(planData)` - Create new pacing plan
- `updatePacingPlan(planId, updateData)` - Update existing plan
- `executePacingPlan(planId)` - Execute pacing plan
- `getPacingAnalytics(userId, timeRange)` - Get pacing performance

### 7. Read AI Service
**File**: `src/services/readAiService.ts`
**Purpose**: Integrates with Read AI for content analysis and insights.

#### Key Operations
```typescript
import { ReadAiService } from '@/services/readAiService';

// Read AI Integration
const analysis = await ReadAiService.analyzeContent(contentData);
const insights = await ReadAiService.getContentInsights(contentId);
const recommendations = await ReadAiService.getRecommendations(userId);
```

#### Service Methods
- `analyzeContent(contentData)` - Analyze content with Read AI
- `getContentInsights(contentId)` - Get content insights
- `getRecommendations(userId)` - Get personalized recommendations
- `processWebhook(webhookData)` - Process Read AI webhooks

### 8. Transcript Service
**File**: `src/services/transcriptService.ts`
**Purpose**: Manages audio/video transcript processing and analysis.

#### Key Operations
```typescript
import { TranscriptService } from '@/services/transcriptService';

// Transcript Management
const transcripts = await TranscriptService.getUserTranscripts(userId);
const processResult = await TranscriptService.processTranscript(mediaFile);
const analysis = await TranscriptService.analyzeTranscript(transcriptId);
```

#### Service Methods
- `getUserTranscripts(userId)` - Get user's transcripts
- `processTranscript(mediaFile)` - Process audio/video file
- `analyzeTranscript(transcriptId)` - Analyze transcript content
- `extractInsights(transcriptId)` - Extract key insights from transcript

### 9. Inspirations Service
**File**: `src/services/inspirationsService.ts`
**Purpose**: Manages content inspiration sources and analysis.

#### Key Operations
```typescript
import { InspirationsService } from '@/services/inspirationsService';

// Inspiration Management
const inspirations = await InspirationsService.getUserInspirations(userId);
const addInspiration = await InspirationsService.addInspiration(inspirationData);
const analyzeInspiration = await InspirationsService.analyzeInspiration(inspirationId);
```

#### Service Methods
- `getUserInspirations(userId)` - Get user's saved inspirations
- `addInspiration(inspirationData)` - Add new inspiration
- `analyzeInspiration(inspirationId)` - Analyze inspiration content
- `getInspirationInsights(userId)` - Get inspiration-based insights

### 10. Error Reporting Service
**File**: `src/services/errorReportingService.ts`
**Purpose**: Comprehensive error tracking, reporting, and monitoring.

#### Key Operations
```typescript
import { ErrorReportingService } from '@/services/errorReportingService';

// Error Reporting
ErrorReportingService.captureError(error, context);
ErrorReportingService.captureMessage(message, level, context);
const errorReport = await ErrorReportingService.generateErrorReport(timeRange);
```

#### Service Methods
- `captureError(error, context)` - Capture and report errors
- `captureMessage(message, level, context)` - Capture informational messages
- `generateErrorReport(timeRange)` - Generate error analysis report
- `setUserContext(userId, userData)` - Set user context for error tracking

## 🔌 API Integration Patterns

### Supabase Integration
```typescript
import { supabase } from '@/integrations/supabase/client';

// Standard CRUD operations
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);

if (error) {
  throw new Error(`Database error: ${error.message}`);
}

return data;
```

### External API Integration
```typescript
// OpenAI API integration
const openaiResponse = await fetch('/api/openai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  },
  body: JSON.stringify(requestData),
});

if (!openaiResponse.ok) {
  throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
}

return await openaiResponse.json();
```

### Edge Function Calls
```typescript
// Call Supabase edge functions
const { data, error } = await supabase.functions.invoke('function-name', {
  body: requestData,
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});

if (error) {
  throw new Error(`Edge function error: ${error.message}`);
}

return data;
```

## 📊 Data Management

### CRUD Operations
```typescript
// Create
const createResult = await service.create(data);

// Read
const readResult = await service.getById(id);
const readAllResult = await service.getAll(filters);

// Update
const updateResult = await service.update(id, updateData);

// Delete
const deleteResult = await service.delete(id);
```

### Data Validation
```typescript
// Input validation
const validateInput = (data: any): ValidationResult => {
  const errors: string[] = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (data.title && data.title.length > 100) {
    errors.push('Title must be less than 100 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};
```

### Error Handling
```typescript
try {
  const result = await service.operation(data);
  return { data: result };
} catch (error: any) {
  // Log error for debugging
  console.error('Service operation failed:', error);
  
  // Return structured error response
  return { 
    error: error.message || 'Operation failed',
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  };
}
```

## 🚀 Performance Optimization

### Caching Strategies
```typescript
// In-memory caching
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getCachedData = async (key: string, fetcher: () => Promise<any>) => {
  const cached = cache.get(key);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
};
```

### Batch Operations
```typescript
// Batch multiple operations
const batchCreate = async (items: any[]) => {
  const batchSize = 100;
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResult = await Promise.all(
      batch.map(item => service.create(item))
    );
    results.push(...batchResult);
  }
  
  return results;
};
```

### Lazy Loading
```typescript
// Lazy load data as needed
const useLazyData = <T>(fetcher: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const load = async () => {
    if (data) return data; // Already loaded
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetcher();
      setData(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { data, loading, error, load };
};
```

## 🧪 Testing

### Service Testing
```typescript
// Mock external dependencies
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    functions: {
      invoke: jest.fn(),
    },
  },
}));

// Test service methods
describe('ContentService', () => {
  it('should load user knowledge files', async () => {
    const mockFiles = [{ id: '1', name: 'test.pdf' }];
    mockSupabase.functions.invoke.mockResolvedValue({ data: mockFiles });
    
    const result = await ContentService.loadUserKnowledgeFiles('user123');
    
    expect(result.data).toEqual(mockFiles);
    expect(mockSupabase.functions.invoke).toHaveBeenCalledWith(
      'knowledge-base-storage',
      expect.objectContaining({
        body: { userId: 'user123', action: 'list' },
      })
    );
  });
});
```

### Integration Testing
```typescript
// Test with real Supabase instance
describe('ContentService Integration', () => {
  it('should create and retrieve content draft', async () => {
    const draftData = {
      userId: 'test-user',
      title: 'Test Draft',
      content: 'Test content',
    };
    
    const created = await ContentService.createDraft(draftData);
    expect(created.data).toBeDefined();
    
    const retrieved = await ContentService.getDraftById(created.data.id);
    expect(retrieved.data.title).toBe(draftData.title);
  });
});
```

## 🔍 Monitoring & Debugging

### Service Logging
```typescript
// Structured logging
const logServiceOperation = (operation: string, data: any, result: any) => {
  console.log('Service Operation', {
    operation,
    timestamp: new Date().toISOString(),
    data: process.env.NODE_ENV === 'development' ? data : undefined,
    result: process.env.NODE_ENV === 'development' ? result : undefined,
  });
};
```

### Performance Monitoring
```typescript
// Measure operation performance
const measurePerformance = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const start = performance.now();
  
  try {
    const result = await operation();
    const duration = performance.now() - start;
    
    console.log(`Operation ${operationName} completed in ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`Operation ${operationName} failed after ${duration.toFixed(2)}ms:`, error);
    throw error;
  }
};
```

## 🔗 Related Documentation

- [Design System](./../design-system/README.md) - UI components and styling
- [Supabase & Backend](./../supabase/README.md) - Backend architecture and edge functions
- [Architecture Overview](./../architecture/README.md) - Overall system design

---

*Last updated: December 2024*
*Services: 10+ business logic services*
*API Integrations: 5+ external services*
*Error Handling: Comprehensive error management*