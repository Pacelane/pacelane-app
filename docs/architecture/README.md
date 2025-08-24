# Architecture Overview

## 🏗️ System Architecture

Pacelane is built as a modern, scalable web application following a layered architecture pattern with clear separation of concerns. The system is designed for high performance, maintainability, and extensibility.

## 🎯 Architecture Principles

### Core Design Principles
- **Separation of Concerns**: Clear boundaries between UI, business logic, and data layers
- **Single Responsibility**: Each component has one clear purpose
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Open/Closed Principle**: Open for extension, closed for modification
- **Interface Segregation**: Clients only depend on interfaces they use
- **DRY (Don't Repeat Yourself)**: Reusable components and utilities

### Technology Stack
```
Frontend Layer:
├── React 18 + TypeScript
├── Vite (Build Tool)
├── React Router DOM (Routing)
├── TanStack Query (State Management)
└── Custom Design System

Backend Layer:
├── Supabase (PostgreSQL + Auth)
├── Edge Functions (Serverless)
├── Google Cloud Storage
└── External AI APIs

Integration Layer:
├── OpenAI GPT Models
├── Vertex AI
├── Read AI
├── WhatsApp Business API
└── Google Calendar API
```

## 🏛️ System Layers

### 1. Presentation Layer (UI)
**Location**: `src/pages/`, `src/components/`, `src/design-system/`

#### Responsibilities
- User interface rendering
- User interaction handling
- Theme management (light/dark)
- Responsive design
- Accessibility compliance

#### Key Components
```typescript
// Page Components
src/pages/
├── ProductHome.tsx          // Main dashboard
├── KnowledgeBase.tsx        // File management
├── ContentEditor.tsx        // Content creation
├── Profile.tsx              // User settings
├── Posts.tsx                // Content history
├── PacingPage.tsx           // Content scheduling
├── NotificationsPage.tsx    // Notification center
└── PlanBillingPage.tsx      // Subscription management

// Design System Components
src/design-system/components/
├── Button.tsx               // Primary UI component
├── Bichaurinho.tsx          // Mascot illustrations
├── Logo.tsx                 // Brand assets
└── ...                      // Other reusable components
```

#### Design System Architecture
```
Design Tokens → Components → Pages → Application
     ↓             ↓          ↓         ↓
  Colors,      Button,    Profile,   Pacelane
  Typography,  Input,     Editor,    App
  Spacing,     Card,      etc.       etc.
  Shadows
```

### 2. Business Logic Layer (Services)
**Location**: `src/services/`

#### Responsibilities
- Business rule enforcement
- Data validation and transformation
- External API integration
- Error handling and reporting
- Performance optimization

#### Service Architecture
```typescript
// Service Layer Structure
src/services/
├── contentService.ts         // Content management
├── authService.ts            // Authentication
├── calendarService.ts        // Calendar integration
├── whatsappNotificationService.ts // Notifications
├── profileService.ts         // User profiles
├── pacingService.ts          // Content scheduling
├── readAiService.ts          // AI integration
├── transcriptService.ts      // Media processing
├── inspirationsService.ts    // Content inspiration
└── errorReportingService.ts  // Error tracking
```

#### Service Patterns
```typescript
// Standard Service Interface
interface BaseService<T> {
  create(data: CreateData): Promise<ApiResponse<T>>;
  getById(id: string): Promise<ApiResponse<T>>;
  getAll(filters?: FilterOptions): Promise<ApiResponse<T[]>>;
  update(id: string, data: UpdateData): Promise<ApiResponse<T>>;
  delete(id: string): Promise<ApiResponse<void>>;
}

// Service Implementation Example
export class ContentService {
  static async loadUserKnowledgeFiles(userId: string): Promise<ApiResponse<KnowledgeFile[]>> {
    try {
      // Business logic implementation
      const { data, error } = await supabase.functions.invoke('knowledge-base-storage', {
        body: { userId, action: 'list' }
      });
      
      if (error) throw error;
      return { data: data.data || [] };
    } catch (error: any) {
      return { error: error.message || 'Failed to load knowledge files' };
    }
  }
}
```

### 3. Data Access Layer
**Location**: `src/integrations/`, `src/hooks/`, `src/types/`

#### Responsibilities
- Database operations
- External API communication
- Data type definitions
- Query optimization
- Caching strategies

#### Integration Architecture
```typescript
// Supabase Integration
src/integrations/supabase/
├── client.ts                // Supabase client configuration
├── auth.ts                  // Authentication helpers
└── storage.ts               // Storage utilities

// API Hooks
src/hooks/api/
├── useAuth.ts               // Authentication state
├── useContent.ts            // Content operations
├── useProfile.ts            // Profile management
└── useNotifications.ts      // Notification handling

// Type Definitions
src/types/
├── api.ts                   // API response types
├── content.ts               // Content-related types
├── user.ts                  // User-related types
└── common.ts                // Shared types
```

### 4. Infrastructure Layer
**Location**: `supabase/`, `public/`, configuration files

#### Responsibilities
- Database management
- Edge function deployment
- Storage configuration
- Environment management
- Deployment automation

## 🔄 Data Flow Architecture

### User Authentication Flow
```
1. User Login → AuthService → Supabase Auth → JWT Token
2. JWT Token → Local Storage + Context → Protected Routes
3. API Calls → JWT Token → Edge Functions → Database
4. RLS Policies → User Data Isolation → Secure Access
```

### Content Management Flow
```
1. File Upload → ContentService → Edge Function → GCS
2. Content Processing → AI Services → Analysis → Database
3. Content Generation → AI Models → Drafts → User Review
4. Content Publishing → Scheduling → Notifications → Distribution
```

### AI Integration Flow
```
1. User Request → Service Layer → External AI API
2. AI Processing → Response Handling → Data Storage
3. Result Delivery → UI Update → User Feedback
4. Learning Loop → Model Improvement → Better Results
```

## 🗄️ Database Architecture

### Database Schema Overview
```sql
-- Core User Tables
users (id, email, full_name, avatar_url, created_at, updated_at)
user_profiles (user_id, bio, company, role, goals, preferences)
user_bucket_mapping (user_id, bucket_name, created_at)

-- Content Management
knowledge_files (id, user_id, file_name, file_size, file_type, gcs_path, content_extracted, extracted_content, created_at)
content_drafts (id, user_id, title, content, status, created_at, updated_at)
content_posts (id, user_id, title, content, published_at, engagement_metrics)

-- AI and Processing
ai_conversations (id, user_id, messages, context, created_at)
content_suggestions (id, user_id, prompt, suggestion, ai_model, created_at)
transcripts (id, user_id, media_file, transcript_text, analysis, created_at)

-- Notifications and Engagement
notifications (id, user_id, type, content, status, scheduled_at, sent_at)
engagement_tracking (id, user_id, content_id, platform, metrics, timestamp)
```

### Row Level Security (RLS)
```sql
-- Example RLS Policies
CREATE POLICY "Users can access own data" ON users
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own content" ON knowledge_files
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own drafts" ON content_drafts
  FOR SELECT USING (auth.uid() = user_id);
```

## 🔧 Edge Functions Architecture

### Function Categories and Responsibilities
```typescript
// Knowledge Base & Storage (GCS Integration)
knowledge-base-storage: File upload, download, listing, content extraction
user-bucket-service: User-specific bucket management
manual-transcript-processor: Transcript processing and analysis

// AI & Content Processing
unified-rag-writer-agent: AI content generation with RAG
context-analysis-agent: Content context analysis
writer-agent: Content writing and optimization
editor-agent: Content editing and refinement
generate-content-suggestions: AI-powered content ideas

// WhatsApp & Notifications
whatsapp-notifications: Automated notification system
chatwoot-webhook: Customer support integration
customer-support-slack: Slack integration for support

// AI Integration Services
read-ai-webhook: Read AI integration
vertex-ai-rag-processor: Google Vertex AI processing
retrieval-agent: Information retrieval and search

// Content Management
pacing-scheduler: Content scheduling and automation
ui-content-order: Content ordering and management
order-builder: Content order creation

// Data Processing
transcript-processor: Audio/video transcript processing
linkedin-post-scraper: LinkedIn content extraction
scrape-linkedin-profile: Profile data extraction

// System Services
job-runner: Background job processing
ai-assistant: General AI assistance
google-calendar-sync: Calendar integration
```

### Edge Function Patterns
```typescript
// Standard Edge Function Structure
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Business logic
    const result = await processRequest(req);
    
    return new Response(
      JSON.stringify({ data: result }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
```

## 🎨 Frontend Architecture

### Component Hierarchy
```
App.tsx
├── ThemeProvider
├── Router
│   ├── Public Routes
│   │   ├── SignIn
│   │   └── Onboarding
│   └── Protected Routes
│       └── MainAppChrome
│           ├── HomeSidebar
│           └── Page Content
│               ├── ProductHome
│               ├── KnowledgeBase
│               ├── ContentEditor
│               ├── Profile
│               ├── Posts
│               ├── PacingPage
│               ├── NotificationsPage
│               └── PlanBillingPage
```

### State Management Architecture
```typescript
// State Management Layers
1. Local Component State (useState, useReducer)
2. Shared Component State (Context API)
3. Server State (TanStack Query)
4. Global App State (Theme Context, Auth Context)

// TanStack Query Integration
const { data, isLoading, error } = useQuery({
  queryKey: ['knowledge-files', userId],
  queryFn: () => ContentService.loadUserKnowledgeFiles(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

### Routing Architecture
```typescript
// Route Structure
const protectedRoutes = [
  { path: '/product-home', element: <ProductHome /> },
  { path: '/knowledge', element: <KnowledgeBase /> },
  { path: '/content-editor', element: <ContentEditor /> },
  { path: '/profile', element: <Profile /> },
  { path: '/posts', element: <Posts /> },
  { path: '/pacing', element: <PacingPage /> },
  { path: '/notifications', element: <NotificationsPage /> },
  { path: '/plan-billing', element: <PlanBillingPage /> },
];

// Route Protection
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/signin" replace />;
  
  return <>{children}</>;
};
```

## 🔐 Security Architecture

### Authentication & Authorization
```typescript
// JWT Token Management
const { data: { session } } = await supabase.auth.getSession();
const accessToken = session?.access_token;

// Token Validation in Edge Functions
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: {
      headers: { Authorization: `Bearer ${userToken}` },
    },
  }
);
```

### Data Security
- **Row Level Security (RLS)**: Database-level access control
- **JWT Tokens**: Secure authentication with expiration
- **CORS Policies**: Controlled cross-origin access
- **Input Validation**: Server-side data validation
- **SQL Injection Prevention**: Parameterized queries

## 🚀 Performance Architecture

### Frontend Optimization
```typescript
// Code Splitting
const ContentEditor = lazy(() => import('./pages/ContentEditor'));

// Memoization
const MemoizedComponent = memo(ExpensiveComponent);

// Virtual Scrolling
const VirtualList = ({ items, itemHeight, containerHeight }) => {
  // Virtual scrolling implementation
};
```

### Backend Optimization
```typescript
// Database Optimization
- Strategic indexing on frequently queried columns
- Connection pooling for efficient database connections
- Query optimization with proper joins and filters

// Edge Function Optimization
- Cold start reduction with efficient imports
- Memory management and resource cleanup
- Proper error handling and logging
```

### Caching Strategies
```typescript
// Multi-level Caching
1. Browser Cache (HTTP headers)
2. CDN Cache (Vercel Edge Network)
3. Application Cache (TanStack Query)
4. Database Cache (PostgreSQL query cache)
```

## 📱 Responsive Design Architecture

### Breakpoint System
```typescript
// Responsive Breakpoints
const breakpoints = {
  sm: '640px',   // Small devices
  md: '768px',   // Medium devices
  lg: '1024px',  // Large devices
  xl: '1280px',  // Extra large devices
  '2xl': '1536px' // 2X large devices
};

// Responsive Utilities
const getResponsiveValue = (mobile: any, tablet: any, desktop: any) => {
  // Responsive value logic
};
```

### Mobile-First Approach
```typescript
// Mobile-first CSS-in-JS
const containerStyles = {
  padding: spacing.spacing[16],           // Mobile: 16px
  '@media (min-width: 768px)': {         // Tablet: 24px
    padding: spacing.spacing[24],
  },
  '@media (min-width: 1024px)': {        // Desktop: 32px
    padding: spacing.spacing[32],
  },
};
```

## 🔍 Monitoring & Observability

### Error Tracking
```typescript
// Comprehensive Error Reporting
ErrorReportingService.captureError(error, {
  context: 'ContentService.loadUserKnowledgeFiles',
  userId: userId,
  timestamp: new Date().toISOString(),
  userAgent: navigator.userAgent,
  url: window.location.href,
});
```

### Performance Monitoring
```typescript
// Performance Metrics
const measurePerformance = async <T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> => {
  const start = performance.now();
  const result = await operation();
  const duration = performance.now() - start;
  
  // Log performance metrics
  console.log(`Operation ${operationName}: ${duration.toFixed(2)}ms`);
  return result;
};
```

### Health Checks
```typescript
// System Health Monitoring
const healthCheck = async () => {
  const checks = {
    database: await checkDatabaseConnection(),
    storage: await checkStorageAccess(),
    aiServices: await checkAIServices(),
    edgeFunctions: await checkEdgeFunctions(),
  };
  
  return {
    status: Object.values(checks).every(check => check.healthy) ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString(),
  };
};
```

## 🔄 Deployment Architecture

### CI/CD Pipeline
```yaml
# GitHub Actions Workflow
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - uses: amondnet/vercel-action@v20
      - run: supabase functions deploy
```

### Environment Management
```bash
# Environment Configuration
# Development
.env.local: Local development settings

# Staging
.env.staging: Staging environment settings

# Production
.env.production: Production environment settings

# Supabase Secrets
supabase secrets set GCS_PROJECT_ID=your-project-id
supabase secrets set GCS_CLIENT_EMAIL=your-service-account
supabase secrets set GCS_PRIVATE_KEY=your-private-key
```

### Infrastructure as Code
```toml
# Supabase Configuration
[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15
```

## 🔗 Integration Architecture

### External Service Integration
```typescript
// OpenAI Integration
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Google Cloud Storage Integration
const storage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  credentials: {
    client_email: process.env.GCS_CLIENT_EMAIL,
    private_key: process.env.GCS_PRIVATE_KEY,
  },
});

// WhatsApp Business API Integration
const whatsappClient = new WhatsAppAPI({
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
});
```

### Webhook Architecture
```typescript
// Webhook Endpoints
app.post('/webhooks/read-ai', async (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'content.analyzed':
      await ReadAiService.processAnalysis(data);
      break;
    case 'insights.generated':
      await ReadAiService.processInsights(data);
      break;
    default:
      console.log('Unknown webhook event:', event);
  }
  
  res.status(200).json({ received: true });
});
```

## 🔮 Future Architecture Considerations

### Scalability Planning
- **Horizontal Scaling**: Edge function auto-scaling
- **Database Sharding**: User-based data partitioning
- **CDN Expansion**: Global content delivery
- **Microservices**: Service decomposition for complex features

### Technology Evolution
- **AI Model Updates**: Integration with newer AI models
- **Real-time Features**: WebSocket integration for live updates
- **Mobile Apps**: React Native or native mobile applications
- **API Versioning**: Backward-compatible API evolution

### Performance Improvements
- **GraphQL**: Efficient data fetching for complex queries
- **Service Workers**: Offline functionality and caching
- **WebAssembly**: Performance-critical operations
- **Edge Computing**: Distributed processing closer to users

## 🔗 Related Documentation

- [Design System](./../design-system/README.md) - UI components and styling
- [Service Layer](./../services/README.md) - Business logic and API integration
- [Supabase & Backend](./../supabase/README.md) - Backend architecture and edge functions

---

*Last updated: December 2024*
*Architecture version: 2.0*
*System layers: 4 main layers*
*Edge functions: 25+ deployed*
*Database tables: 15+ core tables*
