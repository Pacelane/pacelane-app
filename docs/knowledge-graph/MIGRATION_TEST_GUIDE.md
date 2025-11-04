# Knowledge Graph - Migration Test Guide

## Setup Local Test

### 1. Reset Database with Migration

```bash
cd /Users/joaoangelobaccarin/Documents/pacelane/pacelane-app

# Reset database and run all migrations
npx supabase db reset

# ✅ Verify no errors
```

### 2. Verify Migration Results

**Open Supabase Studio:**
```bash
http://localhost:54323
```

**Run verification queries in SQL Editor:**

```sql
-- Check pages created
SELECT 
  id,
  title,
  slug,
  source,
  LENGTH(content) as content_length,
  page_properties->>'original_file_type' as original_type,
  created_at
FROM knowledge_pages
ORDER BY created_at DESC;

-- Check attachments created
SELECT 
  ka.id,
  ka.filename,
  ka.file_type,
  ka.file_size,
  kp.title as page_title
FROM knowledge_attachments ka
JOIN knowledge_pages kp ON kp.id = ka.page_id
ORDER BY ka.created_at DESC;

-- Verify counts match
SELECT 
  (SELECT COUNT(*) FROM knowledge_files) as original_files,
  (SELECT COUNT(*) FROM knowledge_pages) as migrated_pages,
  (SELECT COUNT(*) FROM knowledge_attachments) as attachments;
```

### 3. Test Frontend Integration

**Start dev server:**
```bash
yarn dev
```

**Navigate to:**
```
http://localhost:8080/knowledge-graph
```

**Expected Results:**
- ✅ See 2 pages in left sidebar
- ✅ Click on each page to view content
- ✅ Content shows extracted text
- ✅ Page titles match original filenames

### 4. Test Page Editing

1. Click on a page
2. Edit the title or content
3. Wait 2 seconds (auto-save)
4. Check console for: `Page saved!`
5. Refresh page - changes should persist

### 5. Test Link Creation

1. Open a page
2. Type: `This is related to [[` 
3. See autocomplete dropdown
4. Type the other page name
5. Complete: `[[Other Page Name]]`
6. Wait 2 seconds (auto-save)
7. Check other page's backlinks panel - should show link

### 6. Test Graph Visualization

1. Click the Network icon (top right of editor)
2. See graph with 2 nodes
3. If you created a link, see connection between nodes
4. Click a node to navigate to that page
5. Use zoom and pan
6. Click X to close graph

## Expected Migration Output

```
=== STARTING MIGRATION ===
NOTICE:  Total files: 2
NOTICE:  Files with extracted content: 2

=== PAGES CREATED ===
NOTICE:  Total pages: 2

=== ATTACHMENTS CREATED ===
NOTICE:  Total attachments: 2

=== MIGRATION COMPLETE ===
NOTICE:  Original files: 2
NOTICE:  Pages created: 2
NOTICE:  Attachments created: 2
NOTICE:  ✅ SUCCESS: All files migrated to pages
```

## Common Issues & Fixes

### Issue: Pages not showing in UI

**Check:**
```sql
-- Verify RLS policies
SELECT * FROM knowledge_pages WHERE user_id = 'YOUR_USER_ID';

-- Check edge function logs
npx supabase functions logs knowledge-graph --local
```

### Issue: Attachments not created

**Check:**
```sql
-- Verify original files had GCS paths
SELECT 
  id, 
  name, 
  type, 
  gcs_path 
FROM knowledge_files 
WHERE type IN ('image', 'audio', 'video', 'file');
```

### Issue: Content not showing

**Check:**
```sql
-- Verify extracted content exists
SELECT 
  id,
  name,
  LENGTH(extracted_content) as content_length,
  LENGTH(transcription) as transcription_length
FROM knowledge_files;
```

## Rollback (if needed)

If migration fails, rollback:

```bash
# Delete migrated data
npx supabase db reset

# Or manually
psql postgresql://postgres:postgres@localhost:54322/postgres << EOF
DELETE FROM knowledge_attachments;
DELETE FROM knowledge_pages;
EOF
```

## Next Steps After Successful Test

1. ✅ Verify all 2 pages migrated correctly
2. ✅ Test creating new page manually
3. ✅ Test editing existing page
4. ✅ Test creating links between pages
5. ✅ Test backlinks panel updates
6. ✅ Test graph visualization
7. ✅ Deploy to production when confident

## Production Deployment

When ready to deploy:

```bash
# 1. Deploy edge function
npx supabase functions deploy knowledge-graph

# 2. Run migration on production
npx supabase db push

# 3. Deploy frontend
# (your deployment process)

# 4. Monitor
npx supabase functions logs knowledge-graph
```



