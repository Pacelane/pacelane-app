# Supabase & Backend Documentation

## 🏗️ Architecture Overview

Pacelane's backend is built on Supabase, providing a scalable, serverless architecture with:

- **PostgreSQL Database**: User data, content, and application state
- **Edge Functions**: Serverless backend logic (25+ functions)
- **Authentication**: JWT-based user management with RLS
- **Storage**: File management with Google Cloud Storage integration
- **Real-time**: Live updates and notifications

## 🗄️ Database Schema

### Core Tables

#### Users & Authentication
```sql
-- User profiles and preferences
users (
  id: uuid (primary key)
  email: text
  full_name: text
  avatar_url: text
  created_at: timestamp
  updated_at: timestamp
)

-- User bucket mappings for GCS
user_bucket_mapping (
  user_id: uuid (foreign key to users.id)
  bucket_name: text
  created_at: timestamp
)
```

#### Content Management
```sql
-- Knowledge base files
knowledge_files (
  id: uuid (primary key)
  user_id: uuid (foreign key to users.id)
  file_name: text
  file_size: bigint
  file_type: text
  gcs_path: text
  content_extracted: boolean
  extracted_content: text
  created_at: timestamp
)

-- Content drafts and posts
content_drafts (
  id: uuid (primary key)
  user_id: uuid (foreign key to users.id)
  title: text
  content: text
  status: text
  created_at: timestamp
  updated_at: timestamp
)
```

### Row Level Security (RLS)

All tables implement RLS policies for data isolation:

```sql
-- Example: Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);
```

## 🔧 Edge Functions

### Function Categories

#### 1. Knowledge Base & Storage
- **`knowledge-base-storage`**: GCS integration for file management
- **`user-bucket-service`**: User-specific bucket management
- **`manual-transcript-processor`**: Transcript processing and analysis

#### 2. AI & Content Processing
- **`unified-rag-writer-agent`**: AI content generation with RAG
- **`context-analysis-agent`**: Content context analysis
- **`writer-agent`**: Content writing and optimization
- **`editor-agent`**: Content editing and refinement
- **`generate-content-suggestions`**: AI-powered content ideas

#### 3. WhatsApp & Notifications
- **`whatsapp-notifications`**: Automated notification system
- **`chatwoot-webhook`**: Customer support integration
- **`customer-support-slack`**: Slack integration for support

#### 4. AI Integration Services
- **`read-ai-webhook`**: Read AI integration
- **`vertex-ai-rag-processor`**: Google Vertex AI processing
- **`retrieval-agent`**: Information retrieval and search

#### 5. Content Management
- **`pacing-scheduler`**: Content scheduling and automation
- **`ui-content-order`**: Content ordering and management
- **`order-builder`**: Content order creation

#### 6. Data Processing
- **`transcript-processor`**: Audio/video transcript processing
- **`linkedin-post-scraper`**: LinkedIn content extraction
- **`scrape-linkedin-profile`**: Profile data extraction

#### 7. System Services
- **`job-runner`**: Background job processing
- **`ai-assistant`**: General AI assistance
- **`google-calendar-sync`**: Calendar integration

### Function Development

#### Local Development
```bash
# Start local Supabase
supabase start

# Create new function
supabase functions new function-name

# Test locally
supabase functions serve function-name

# Deploy to production
supabase functions deploy function-name
```

#### Function Structure
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Function logic here
    const { data, error } = await processRequest(req);
    
    if (error) throw error;
    
    return new Response(
      JSON.stringify({ data }),
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

## 🔐 Authentication & Security

### JWT Token Management
```typescript
// Get user session in edge functions
const { data: { session } } = await supabase.auth.getSession();
if (!session?.access_token) {
  throw new Error('User not authenticated');
}

// Use token for authenticated requests
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  {
    global: {
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  }
);
```

### RLS Policies
All database operations are protected by RLS policies:

```sql
-- Example: Knowledge files policy
CREATE POLICY "Users can access own knowledge files" ON knowledge_files
  FOR ALL USING (auth.uid() = user_id);

-- Example: Content drafts policy  
CREATE POLICY "Users can manage own drafts" ON content_drafts
  FOR ALL USING (auth.uid() = user_id);
```

## ☁️ Google Cloud Storage Integration

### Bucket Management
```typescript
class GCSKnowledgeBaseStorage {
  private generateUserBucketName(userId: string): string {
    const userHash = this.hashUserId(userId);
    return `${this.gcsConfig.bucketPrefix}-user-${userHash}`.toLowerCase();
  }

  private async createUserBucket(bucketName: string): Promise<void> {
    // Create GCS bucket with proper permissions
    // Set up lifecycle policies and access controls
  }
}
```

### File Operations
- **Upload**: Base64 encoding, metadata extraction, content processing
- **Download**: Secure file access with user authentication
- **List**: Paginated file listing with metadata
- **Delete**: Secure file removal with cleanup

## 📊 Performance & Optimization

### Database Optimization
- **Indexes**: Strategic indexing on frequently queried columns
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Optimized SQL queries with proper joins

### Edge Function Optimization
- **Cold Start Reduction**: Efficient imports and minimal dependencies
- **Memory Management**: Proper resource cleanup and memory usage
- **Error Handling**: Comprehensive error handling with logging

## 🚀 Deployment & CI/CD

### Production Deployment
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy function-name

# Deploy database changes
supabase db push
```

### Environment Management
```bash
# Set production environment variables
supabase secrets set GCS_PROJECT_ID=your-project-id
supabase secrets set GCS_CLIENT_EMAIL=your-service-account
supabase secrets set GCS_PRIVATE_KEY=your-private-key
```

## 🔍 Monitoring & Debugging

### Logging
```typescript
// Structured logging in edge functions
console.log('Function: Processing request', {
  userId: userId,
  action: action,
  timestamp: new Date().toISOString()
});
```

### Error Tracking
- **Error Reporting**: Comprehensive error capture and reporting
- **Performance Monitoring**: Function execution time and resource usage
- **User Analytics**: Usage patterns and performance metrics

## 📚 Function-Specific Documentation

### Knowledge Base Storage
- **Purpose**: GCS integration for user file management
- **Key Features**: File upload, download, listing, and content extraction
- **Dependencies**: Google Cloud Storage API, Supabase client

### WhatsApp Notifications
- **Purpose**: Automated content delivery and engagement tracking
- **Key Features**: Message scheduling, delivery tracking, engagement analytics
- **Dependencies**: WhatsApp Business API, Supabase database

### AI Processing Functions
- **Purpose**: Content generation and analysis using AI models
- **Key Features**: RAG processing, content optimization, context analysis
- **Dependencies**: OpenAI API, Vertex AI, custom AI models

## 🛠️ Development Workflow

### 1. Function Development
```bash
# Create new function
supabase functions new my-function

# Local testing
supabase functions serve my-function

# Test with curl
curl -X POST http://localhost:54321/functions/v1/my-function \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

### 2. Database Changes
```bash
# Create migration
supabase migration new add_new_table

# Apply locally
supabase db reset

# Push to production
supabase db push
```

### 3. Testing
```bash
# Run tests
npm test

# Test specific function
npm run test:functions

# Integration tests
npm run test:integration
```

## 🔗 Related Documentation

- [Design System](./../design-system/README.md) - Frontend components and styling
- [Service Layer](./../services/README.md) - Business logic and API integration
- [Architecture Overview](./../architecture/README.md) - Overall system design

---

*Last updated: December 2024*
*Supabase version: 2.x*
*Edge Functions: 25+ deployed*
