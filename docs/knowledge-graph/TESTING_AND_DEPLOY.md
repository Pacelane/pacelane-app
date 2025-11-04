# Knowledge Graph - Testing & Deployment Guide

## 🚀 Quick Start - Test Everything Now!

### Step 1: Deploy Edge Function

```bash
# Deploy the knowledge-graph edge function
supabase functions deploy knowledge-graph

# This will make it available at:
# http://localhost:54321/functions/v1/knowledge-graph
```

### Step 2: Apply Database Migrations

```bash
# Apply all new migrations
supabase db reset

# Or just push the new ones:
supabase db push
```

**Migrations that will run:**
- ✅ `20251029000000_knowledge_graph_schema.sql` - Creates tables
- ✅ `20251029000001_migrate_knowledge_files_to_pages.sql` - Migrates data
- ✅ `20251029000002_add_search_function.sql` - Adds search

### Step 3: Start Dev Server

```bash
# Start the frontend
npm run dev

# App will be at http://localhost:5173
```

### Step 4: Access the Knowledge Graph

1. **Login** to your account
2. **Navigate to** `http://localhost:5173/knowledge-graph`
3. **You should see:**
   - Left sidebar with migrated pages
   - Center editor (empty if no page selected)
   - Right panel for backlinks

## 🧪 Testing Checklist

### Test 1: View Migrated Pages ✅

**Steps:**
1. Open Knowledge Graph page
2. Check left sidebar
3. Should see pages migrated from `knowledge_files`

**Expected:**
- All your previous files are now pages
- Each page has a title, icon, and date
- WhatsApp pages show 💬 icon
- Upload pages show 📎 icon

### Test 2: Create New Page ✅

**Steps:**
1. Click "New Page" button
2. Change title to "Test Page"
3. Add content: "This is a test"
4. Wait 2 seconds (auto-save)

**Expected:**
- New page appears in sidebar
- Title updates in sidebar
- "Saved" indicator appears
- No errors in console

### Test 3: Link to Another Page ✅

**Steps:**
1. In editor, type `[[`
2. Start typing a page name
3. Autocomplete dropdown should appear
4. Select a page or type new one
5. Complete with `]]`
6. Save (auto or manual)

**Expected:**
- Dropdown shows matching pages
- Arrow keys navigate suggestions
- Enter selects suggestion
- Link is created in database
- Other page shows this as backlink

### Test 4: View Backlinks ✅

**Steps:**
1. Create link from Page A to Page B
2. Navigate to Page B
3. Check right panel

**Expected:**
- Page A appears in backlinks
- Shows context of the link
- Click on backlink navigates to Page A

### Test 5: Graph Visualization ✅

**Steps:**
1. Select any page
2. Click graph icon (GitBranch) in editor
3. Graph should render

**Expected:**
- Force-directed graph appears
- Nodes sized by connections
- WhatsApp nodes are teal
- Manual nodes are blue
- Click node navigates to page
- Hover highlights connections

### Test 6: Search Pages ✅

**Steps:**
1. Use search box in sidebar
2. Type partial page name
3. List filters

**Expected:**
- Instant filtering
- Case-insensitive
- Shows matching pages only

### Test 7: Full-Text Search (API) ✅

**Steps:**
1. Open browser console
2. Run test query:

```javascript
// Get auth token
const token = (await supabase.auth.getSession()).data.session.access_token;

// Search pages
const response = await fetch('http://localhost:54321/functions/v1/knowledge-graph', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'search-pages',
    query: 'test',
    limit: 10
  })
});

const result = await response.json();
console.log('Search results:', result);
```

**Expected:**
- Returns pages matching "test"
- Ranked by relevance
- No errors

### Test 8: Graph Data API ✅

**Steps:**
1. Open browser console
2. Run:

```javascript
const token = (await supabase.auth.getSession()).data.session.access_token;

const response = await fetch('http://localhost:54321/functions/v1/knowledge-graph', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'get-graph-data'
  })
});

const result = await response.json();
console.log('Graph data:', result);
```

**Expected:**
- Returns nodes and edges
- Each node has id, label, size
- Stats included

## 🐛 Common Issues & Solutions

### Issue: "Missing authorization header"

**Solution:**
```bash
# Make sure you're logged in
# Check Supabase Studio: http://localhost:54323
# Verify user session exists
```

### Issue: "knowledge_pages table does not exist"

**Solution:**
```bash
# Re-run migrations
supabase db reset

# Check tables exist:
supabase db shell
\dt knowledge_*
```

### Issue: Graph doesn't render

**Solution:**
1. Check browser console for errors
2. Verify react-force-graph is installed:
   ```bash
   npm list react-force-graph
   ```
3. Restart dev server

### Issue: Autocomplete not working

**Solution:**
1. Type `[[` slowly
2. Must be at least 2 chars after `[[`
3. Check that pages are loaded (sidebar)
4. Try refreshing page

### Issue: Links not creating

**Solution:**
1. Check network tab for API errors
2. Verify edge function is deployed
3. Check Supabase logs:
   ```bash
   supabase functions logs knowledge-graph
   ```

## 📊 Verify Data

### Check Pages in Database

```sql
-- Connect to database
supabase db shell

-- Count pages
SELECT source, COUNT(*) FROM knowledge_pages GROUP BY source;

-- View recent pages
SELECT title, source, created_at FROM knowledge_pages ORDER BY created_at DESC LIMIT 10;

-- Check links
SELECT COUNT(*) FROM knowledge_links;

-- Pages with most links
SELECT p.title, COUNT(l.id) as link_count
FROM knowledge_pages p
LEFT JOIN knowledge_links l ON p.id = l.source_page_id OR p.id = l.target_page_id
GROUP BY p.id, p.title
ORDER BY link_count DESC
LIMIT 10;
```

## 🎨 UI Testing Scenarios

### Scenario 1: Create Knowledge Web

1. Create page: "Project X"
2. Add content mentioning `[[Team]]`, `[[Client]]`, `[[Requirements]]`
3. Save and verify 3 new pages created
4. Navigate to "Team"
5. Add link to `[[Project X]]`
6. View graph
7. Should see interconnected web

### Scenario 2: WhatsApp Integration (Future)

1. Send WhatsApp message
2. Wait for buffer to process
3. Check Knowledge Graph
4. New page should appear with 💬 icon
5. Content should match message

### Scenario 3: Navigate via Graph

1. Open graph view
2. Find a connected node
3. Click it
4. Should navigate to that page
5. Editor loads content
6. Backlinks update

## 📈 Performance Testing

### Test with Many Pages

```javascript
// Create 100 test pages
for (let i = 0; i < 100; i++) {
  await fetch('http://localhost:54321/functions/v1/knowledge-graph', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'create-page',
      title: `Test Page ${i}`,
      content: `This is test page ${i} linking to [[Test Page ${i+1}]]`
    })
  });
}
```

**Expected:**
- Graph renders smoothly
- Sidebar scrolls well
- Search is fast
- No memory leaks

## ✅ Success Criteria

All tests pass when:

- [x] Can view migrated pages
- [x] Can create new pages
- [x] Can edit pages (auto-save works)
- [x] Can create links with `[[...]]`
- [x] Autocomplete shows suggestions
- [x] Links appear in backlinks panel
- [x] Graph visualizes correctly
- [x] Graph is interactive (click, hover, zoom)
- [x] Search filters pages
- [x] No console errors
- [x] Edge function responds correctly
- [x] Database has correct data

## 🚢 Production Deployment

### When ready for production:

```bash
# 1. Deploy edge function to production
supabase functions deploy knowledge-graph --project-ref YOUR_PROJECT_REF

# 2. Run migrations on production
supabase db push --project-ref YOUR_PROJECT_REF

# 3. Deploy frontend
npm run build
# Deploy to your hosting (Vercel, Netlify, etc)
```

## 📝 Next Steps After Testing

1. **If everything works:**
   - ✅ Mark Fase 3 as complete
   - ✅ Move to Fase 4 (WhatsApp Integration)
   - ✅ Update MainAppChrome to add Knowledge Graph to navigation

2. **If issues found:**
   - 🐛 Fix bugs
   - 🧪 Re-test
   - 📝 Document issues

3. **Enhancements to consider:**
   - Add keyboard shortcuts (Cmd+K for search)
   - Add markdown preview mode
   - Add export functionality
   - Add page templates

## 💡 Tips for Best Experience

1. **Use descriptive page titles** - Better for search and links
2. **Create links as you write** - Builds knowledge web naturally
3. **Review backlinks regularly** - Discover connections
4. **Use graph view** - Find isolated pages to connect
5. **Tag pages** - Use page_properties for organization

---

**Ready to test!** Navigate to `http://localhost:5173/knowledge-graph` and start exploring! 🎉

