# Knowledge Graph - Phase 1: Database Setup

## ✅ Completed

Phase 1 of the Knowledge Graph implementation is complete! This document explains what was created and how to deploy it.

## 📁 Files Created

### 1. Database Migrations

#### `supabase/migrations/20251029000000_knowledge_graph_schema.sql`
**Purpose:** Creates the complete database schema for the knowledge graph system.

**What it creates:**
- ✅ **3 main tables:**
  - `knowledge_pages` - Individual pages/documents in the graph
  - `knowledge_links` - Bidirectional links between pages
  - `knowledge_attachments` - Files attached to pages

- ✅ **15+ indexes** for performance:
  - User ID indexes for RLS
  - Full-text search indexes (title + content)
  - JSONB indexes for properties and metadata
  - Composite indexes for graph traversal

- ✅ **12 RLS policies** for security:
  - Users can only access their own pages/links/attachments
  - Full CRUD permissions per user

- ✅ **Helper functions:**
  - `generate_slug(title)` - Convert title to URL-friendly slug
  - `update_updated_at_column()` - Auto-update timestamps
  - `auto_generate_slug()` - Auto-generate slug on insert
  - `auto_generate_preview()` - Auto-generate preview from content

- ✅ **Triggers:**
  - Auto-update `updated_at` on page changes
  - Auto-generate `slug` from `title`
  - Auto-generate `preview` from `content`

- ✅ **Utility views:**
  - `knowledge_pages_with_stats` - Pages with link/attachment counts

#### `supabase/migrations/20251029000001_migrate_knowledge_files_to_pages.sql`
**Purpose:** Migrates existing `knowledge_files` data to the new `knowledge_pages` structure.

**What it does:**
- ✅ Converts all existing files to pages
- ✅ Preserves all metadata and timestamps
- ✅ Creates attachment records for binary files (images, audio, PDFs)
- ✅ Maps WhatsApp source correctly
- ✅ Handles slug conflicts
- ✅ Enriches page properties with tags
- ✅ Provides migration verification

### 2. TypeScript Types

#### `src/types/knowledgeGraph.ts`
**Purpose:** Type definitions for the knowledge graph system.

**Exports:**
- `KnowledgePage`, `KnowledgeLink`, `KnowledgeAttachment` interfaces
- `PageSourceMetadata`, `PageProperties` interfaces
- `GraphNode`, `GraphEdge` for visualization
- API response types
- Filter and sorting types

## 🚀 How to Deploy

### Step 1: Review the Migrations

```bash
# Review the schema
cat supabase/migrations/20251029000000_knowledge_graph_schema.sql

# Review the data migration
cat supabase/migrations/20251029000001_migrate_knowledge_files_to_pages.sql
```

### Step 2: Test Locally (Recommended)

```bash
# Reset local database
supabase db reset

# Migrations will run automatically
# Check the output for any errors
```

### Step 3: Deploy to Staging/Production

```bash
# Push migrations to remote database
supabase db push

# Or use the Supabase dashboard:
# 1. Go to Database > Migrations
# 2. Upload the SQL files
# 3. Run them in order
```

## 🧪 Verification

After running the migrations, verify everything is working:

### Check Tables

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'knowledge_%';

-- Expected output:
-- knowledge_pages
-- knowledge_links
-- knowledge_attachments
```

### Check Migration Results

```sql
-- Check how many pages were created
SELECT COUNT(*) as total_pages FROM knowledge_pages;

-- Check pages by source
SELECT source, COUNT(*) as count 
FROM knowledge_pages 
GROUP BY source;

-- Check attachments
SELECT COUNT(*) as total_attachments FROM knowledge_attachments;

-- Check pages with stats
SELECT title, total_links_count, attachments_count
FROM knowledge_pages_with_stats
ORDER BY total_links_count DESC
LIMIT 10;
```

### Test RLS Policies

```sql
-- Should only show current user's pages
SELECT COUNT(*) FROM knowledge_pages;

-- Try to access as different user (should fail)
SET request.jwt.claims = '{"sub": "different-user-id"}';
SELECT COUNT(*) FROM knowledge_pages;
```

### Test Helper Functions

```sql
-- Test slug generation
SELECT generate_slug('My Test Page With Spaces & Special!');
-- Expected: 'my-test-page-with-spaces-special'

-- Test automatic slug on insert
INSERT INTO knowledge_pages (user_id, title, content)
VALUES (auth.uid(), 'Test Page', 'Some content');

SELECT slug FROM knowledge_pages WHERE title = 'Test Page';
-- Expected: 'test-page'
```

## 📊 Database Schema Overview

```
┌─────────────────────┐
│  knowledge_pages    │
│  ─────────────────  │
│  id (PK)           │
│  user_id (FK)      │
│  title             │
│  slug              │◄────┐
│  content           │     │
│  preview           │     │
│  source            │     │
│  source_metadata   │     │
│  page_properties   │     │
│  created_at        │     │
│  updated_at        │     │
│  is_archived       │     │
└─────────────────────┘     │
         │                  │
         │                  │
    ┌────┼──────────────────┼─────────────┐
    │    │                  │             │
    │    ▼                  │             ▼
    │ ┌─────────────────────┴──┐   ┌──────────────────────┐
    │ │  knowledge_links       │   │ knowledge_attachments│
    │ │  ───────────────────── │   │ ──────────────────── │
    │ │  id (PK)              │   │  id (PK)            │
    │ │  user_id (FK)         │   │  page_id (FK)       │
    │ │  source_page_id (FK)  │   │  user_id (FK)       │
    │ │  target_page_id (FK)  │   │  filename           │
    └─►  link_text            │   │  file_type          │
       │  link_context         │   │  gcs_path           │
       │  created_by           │   │  mime_type          │
       │  created_at           │   │  file_size          │
       └───────────────────────┘   └──────────────────────┘
```

## 🔑 Key Features

### 1. Full-Text Search
```sql
-- Search pages by title or content
SELECT * FROM knowledge_pages
WHERE to_tsvector('english', title || ' ' || COALESCE(content, '')) 
      @@ to_tsquery('english', 'project & meeting');
```

### 2. Graph Queries
```sql
-- Get all backlinks for a page
SELECT p.title, l.link_context
FROM knowledge_links l
JOIN knowledge_pages p ON l.source_page_id = p.id
WHERE l.target_page_id = 'page-uuid-here';

-- Get pages with most connections
SELECT p.title, COUNT(l.id) as connections
FROM knowledge_pages p
LEFT JOIN knowledge_links l ON p.id = l.source_page_id OR p.id = l.target_page_id
GROUP BY p.id, p.title
ORDER BY connections DESC;
```

### 3. JSONB Queries
```sql
-- Find pages with specific tags
SELECT * FROM knowledge_pages
WHERE page_properties @> '{"tags": ["whatsapp"]}';

-- Find WhatsApp pages
SELECT * FROM knowledge_pages
WHERE source = 'whatsapp';
```

## 🎯 Next Steps

Now that Phase 1 is complete, you can proceed to:

### Phase 2: Backend Edge Functions
- [ ] Create `knowledge-graph` edge function with CRUD operations
- [ ] Implement link parser service (`[[page-name]]` detection)
- [ ] Create graph data service (nodes/edges computation)
- [ ] Integrate with buffer-processor for WhatsApp

### Phase 3: Frontend Components
- [ ] Create `KnowledgeGraph.tsx` page
- [ ] Build `PageListSidebar` component
- [ ] Build `PageEditor` component
- [ ] Build `BacklinksPanel` component
- [ ] Build `GraphVisualization` component (react-force-graph-2d)

### Phase 4: Content Editor Integration
- [ ] Create API adapter layer
- [ ] Update Content Editor to use pages
- [ ] Update AI Assistant to use pages

## 📝 Migration Notes

### What Happens to Old Data?

- ✅ `knowledge_files` table remains unchanged
- ✅ All data is copied to `knowledge_pages`
- ✅ Original file IDs are preserved in `source_metadata`
- ✅ You can rollback by dropping the new tables
- ✅ No data loss occurs

### Handling Slug Conflicts

If two files have names that generate the same slug, the migration:
1. Tries the normal slug first
2. If conflict, appends `-{random8chars}`
3. Example: `my-page` → `my-page-a3b5c9d2`

### Source Mapping

The migration maps file sources to page sources:
- `whatsapp`, `whatsapp_text`, `whatsapp_audio` → `'whatsapp'`
- Everything else → `'upload'`
- Pages created manually in UI → `'manual'` (future)

## 🐛 Troubleshooting

### Migration Fails

```bash
# Check for errors
supabase db reset

# Check logs
tail -f supabase/logs/postgres.log
```

### RLS Blocks Queries

```sql
-- Temporarily disable RLS for testing
ALTER TABLE knowledge_pages DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE knowledge_pages ENABLE ROW LEVEL SECURITY;
```

### Duplicate Slugs

```sql
-- Find duplicate slugs
SELECT slug, COUNT(*) 
FROM knowledge_pages 
GROUP BY slug 
HAVING COUNT(*) > 1;

-- Fix manually
UPDATE knowledge_pages 
SET slug = slug || '-' || id::text 
WHERE id = 'problematic-id';
```

## 📚 Resources

- [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [JSONB in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html)

---

**Phase 1 Status:** ✅ **COMPLETE**

Ready to proceed to Phase 2: Backend Edge Functions

