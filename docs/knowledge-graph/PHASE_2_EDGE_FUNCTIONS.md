# Knowledge Graph - Phase 2: Edge Functions

## ✅ Completed

Phase 2 of the Knowledge Graph implementation is complete! This document explains the edge functions created and how to use them.

## 📁 Files Created

### 1. Edge Function: `knowledge-graph`

**Location:** `supabase/functions/knowledge-graph/index.ts`

**Purpose:** Handles all CRUD operations for the knowledge graph system.

### 2. Database Function

**Location:** `supabase/migrations/20251029000002_add_search_function.sql`

**Purpose:** PostgreSQL function for full-text search with ranking.

## 🚀 Edge Function API

### Base URL
```
POST https://your-project.supabase.co/functions/v1/knowledge-graph
```

### Authentication
All requests require authentication via Authorization header:
```
Authorization: Bearer <user-jwt-token>
```

## 📚 API Actions

### 1. Create Page

**Action:** `create-page`

**Request:**
```json
{
  "action": "create-page",
  "title": "My New Page",
  "content": "Page content in markdown",
  "icon": "📄",
  "source": "manual",
  "source_metadata": {},
  "page_properties": {
    "tags": ["important"]
  }
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "title": "My New Page",
    "slug": "my-new-page",
    "content": "Page content in markdown",
    "icon": "📄",
    "source": "manual",
    "created_at": "2024-10-29T...",
    "updated_at": "2024-10-29T..."
  },
  "error": null
}
```

### 2. Update Page

**Action:** `update-page`

**Request:**
```json
{
  "action": "update-page",
  "pageId": "uuid",
  "title": "Updated Title",
  "content": "Updated content",
  "page_properties": {
    "tags": ["updated"]
  }
}
```

### 3. Delete Page

**Action:** `delete-page`

**Request:**
```json
{
  "action": "delete-page",
  "pageId": "uuid"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "deleted": true
  },
  "error": null
}
```

### 4. Get Page

**Action:** `get-page`

**Request:**
```json
{
  "action": "get-page",
  "pageId": "uuid"
}
```

**Response:**
```json
{
  "data": {
    "page": {
      "id": "uuid",
      "title": "Page Title",
      "content": "...",
      "outgoing_links_count": 5,
      "incoming_links_count": 3,
      "total_links_count": 8,
      "attachments_count": 2
    },
    "backlinks": [
      {
        "id": "link-uuid",
        "link_text": "Page Title",
        "link_context": "...context around the link...",
        "source_page": {
          "id": "source-uuid",
          "title": "Source Page",
          "slug": "source-page"
        }
      }
    ],
    "attachments": [...]
  },
  "error": null
}
```

### 5. List Pages

**Action:** `list-pages`

**Request:**
```json
{
  "action": "list-pages",
  "page": 1,
  "per_page": 50,
  "filters": {
    "source": "whatsapp",
    "is_archived": false,
    "tags": ["important"],
    "created_after": "2024-01-01T00:00:00Z"
  },
  "sort_by": "updated_at",
  "order": "desc"
}
```

**Response:**
```json
{
  "data": {
    "pages": [...],
    "total": 150,
    "page": 1,
    "per_page": 50,
    "total_pages": 3
  },
  "error": null
}
```

**Filters:**
- `source`: `'manual' | 'whatsapp' | 'upload'` or array
- `is_archived`: `boolean`
- `has_links`: `boolean`
- `tags`: `string[]`
- `created_after`: `ISO date string`
- `created_before`: `ISO date string`

**Sort options:**
- `sort_by`: `'created_at' | 'updated_at' | 'title' | 'last_opened_at'`
- `order`: `'asc' | 'desc'`

### 6. Search Pages

**Action:** `search-pages`

**Request:**
```json
{
  "action": "search-pages",
  "query": "project meeting",
  "limit": 20
}
```

**Response:**
```json
{
  "data": {
    "pages": [
      {
        "id": "uuid",
        "title": "Project Meeting Notes",
        "preview": "...",
        "rank": 0.85
      }
    ],
    "total": 5
  },
  "error": null
}
```

### 7. Parse Links

**Action:** `parse-links`

**Request:**
```json
{
  "action": "parse-links",
  "pageId": "uuid",
  "content": "This references [[Other Page]] and [[Another Page]]"
}
```

**Response:**
```json
{
  "data": {
    "links": [
      {
        "id": "link-uuid",
        "source_page_id": "uuid",
        "target_page_id": "target-uuid",
        "link_text": "Other Page"
      }
    ],
    "count": 2,
    "created_pages": [
      {
        "id": "new-uuid",
        "title": "Another Page",
        "slug": "another-page"
      }
    ]
  },
  "error": null
}
```

**Features:**
- Automatically finds all `[[page-name]]` patterns
- Creates target pages if they don't exist
- Creates bidirectional links
- Extracts context around each link

### 8. Get Backlinks

**Action:** `get-backlinks`

**Request:**
```json
{
  "action": "get-backlinks",
  "pageId": "uuid"
}
```

**Response:**
```json
{
  "data": {
    "backlinks": [
      {
        "id": "link-uuid",
        "link_text": "Page Title",
        "link_context": "...surrounding text...",
        "created_by": "manual",
        "source_page": {
          "id": "source-uuid",
          "title": "Source Page Title",
          "slug": "source-page-title",
          "icon": "📄",
          "preview": "..."
        }
      }
    ],
    "count": 5
  },
  "error": null
}
```

### 9. Get Graph Data

**Action:** `get-graph-data`

**Request:**
```json
{
  "action": "get-graph-data",
  "filters": {
    "connected_to": "page-uuid",
    "source": ["manual", "whatsapp"],
    "limit": 100
  }
}
```

**Response:**
```json
{
  "data": {
    "nodes": [
      {
        "id": "uuid",
        "label": "Page Title",
        "slug": "page-title",
        "icon": "📄",
        "size": 10,
        "source": "manual",
        "created_at": "..."
      }
    ],
    "edges": [
      {
        "id": "link-uuid",
        "source": "source-page-uuid",
        "target": "target-page-uuid",
        "label": "link text"
      }
    ],
    "stats": {
      "total_pages": 50,
      "total_links": 75,
      "avg_connections": 3.0
    }
  },
  "error": null
}
```

**Graph Features:**
- Nodes sized by number of connections
- Can filter to show only pages connected to a specific page
- Ready for `react-force-graph-2d` visualization

## 🧪 Testing the Edge Function

### Deploy Locally

```bash
# Deploy edge function
supabase functions deploy knowledge-graph

# Or serve locally for testing
supabase functions serve knowledge-graph
```

### Test with cURL

```bash
# Get your JWT token (from Supabase Studio or browser)
TOKEN="your-jwt-token"

# Create a page
curl -X POST http://localhost:54321/functions/v1/knowledge-graph \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create-page",
    "title": "Test Page",
    "content": "This is a test page with a link to [[Another Page]]"
  }'

# List pages
curl -X POST http://localhost:54321/functions/v1/knowledge-graph \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "list-pages",
    "page": 1,
    "per_page": 10
  }'

# Parse links
curl -X POST http://localhost:54321/functions/v1/knowledge-graph \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "parse-links",
    "pageId": "page-uuid",
    "content": "Reference to [[Another Page]] here"
  }'

# Get graph data
curl -X POST http://localhost:54321/functions/v1/knowledge-graph \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type": application/json" \
  -d '{
    "action": "get-graph-data"
  }'
```

## 🔍 Full-Text Search Function

**SQL Function:** `search_knowledge_pages(user_id, query, limit)`

**Features:**
- Uses PostgreSQL's `to_tsvector` and `to_tsquery`
- Searches both title and content
- Returns ranked results (most relevant first)
- English language stemming

**Usage in SQL:**
```sql
SELECT * FROM search_knowledge_pages(
  'user-uuid',
  'project & meeting',
  20
);
```

**Search Query Syntax:**
- `&` - AND operator: `project & meeting`
- `|` - OR operator: `project | idea`
- `!` - NOT operator: `project & !draft`
- `<->` - FOLLOWED BY: `project <-> management`

## 🎯 Integration Examples

### Frontend API Layer

```typescript
// src/api/knowledgeGraph.ts
import { supabase } from '@/integrations/supabase/client';

export const knowledgeGraphApi = {
  async createPage(title: string, content?: string) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/knowledge-graph`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-page',
          title,
          content,
        }),
      }
    );
    
    return response.json();
  },
  
  async listPages(page = 1, filters = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/knowledge-graph`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'list-pages',
          page,
          filters,
        }),
      }
    );
    
    return response.json();
  },
  
  async parseLinks(pageId: string, content: string) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/knowledge-graph`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'parse-links',
          pageId,
          content,
        }),
      }
    );
    
    return response.json();
  },
  
  async getGraphData(filters = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/knowledge-graph`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get-graph-data',
          filters,
        }),
      }
    );
    
    return response.json();
  },
};
```

## 🔐 Security

- **RLS Policies**: All database operations respect Row Level Security
- **Authentication**: All requests require valid JWT token
- **Ownership Verification**: Users can only access their own pages
- **Cascade Deletes**: Deleting a page automatically removes links and attachments

## 📊 Performance Considerations

- **Full-text search** uses GIN indexes for fast queries
- **Pagination** prevents loading too many pages at once
- **Stats view** pre-computes link counts for performance
- **Slug generation** handles conflicts automatically
- **Link parsing** is idempotent (can be called multiple times safely)

## 🐛 Error Handling

All errors return HTTP 500 with JSON:
```json
{
  "error": "Error message here"
}
```

Common errors:
- `Missing authorization header` (401)
- `Unauthorized` (401)
- `Page not found or access denied` (500)
- `Unknown action: ...` (400)

## 🎯 Next Steps

Now that Phase 2 is complete, you can:

### Phase 3: Frontend Components
- [ ] Create React components for UI
- [ ] Implement PageEditor with link autocomplete
- [ ] Build GraphVisualization with react-force-graph-2d
- [ ] Create BacklinksPanel

### Phase 4: WhatsApp Integration
- [ ] Update buffer-processor to create pages
- [ ] Test WhatsApp → Knowledge Graph flow

### Phase 5: Content Editor Integration
- [ ] Update Content Editor to use pages
- [ ] Update AI Assistant to query pages

---

**Phase 2 Status:** ✅ **COMPLETE**

Ready to proceed to Phase 3: Frontend Components

